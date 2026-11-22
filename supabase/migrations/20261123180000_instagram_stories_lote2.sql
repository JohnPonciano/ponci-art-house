-- Fila do Instagram: stories (imagem 9:16, sem legenda e sem figurinha) + lote 2 (8 posts de feed e 17 stories).
alter table public.ig_posts drop constraint if exists ig_posts_kind_check;
alter table public.ig_posts add constraint ig_posts_kind_check check (kind in ('image','carousel','story'));

-- salvar ganha a opção "é story"
drop function if exists public.admin_ig_save(uuid, text[], text, timestamptz, text);
create or replace function public.admin_ig_save(p_id uuid, p_media text[], p_caption text, p_publish_at timestamptz, p_label text default '', p_story boolean default false)
returns uuid language plpgsql security definer set search_path='' as $$
declare v uuid := p_id; n int := coalesce(array_length(p_media, 1), 0); u text;
  k text := case when coalesce(p_story, false) then 'story' when coalesce(array_length(p_media, 1), 0) > 1 then 'carousel' else 'image' end;
begin
  perform public._require_admin();
  if n < 1 or n > 10 then raise exception 'De 1 a 10 imagens.' using errcode='P0001'; end if;
  if k = 'story' and n > 1 then raise exception 'Story é uma imagem só.' using errcode='P0001'; end if;
  foreach u in array p_media loop
    if u !~ '^https://[^ ]+\.(jpe?g)(\?[^ ]*)?$' then raise exception 'Use links https de imagens JPEG (o Instagram só aceita JPEG): %', u using errcode='P0001'; end if;
  end loop;
  if length(coalesce(p_caption, '')) > 2200 then raise exception 'Legenda com mais de 2.200 caracteres.' using errcode='P0001'; end if;
  if (select count(*) from regexp_matches(coalesce(p_caption, ''), '#[[:alnum:]_]+', 'g')) > 30 then
    raise exception 'O Instagram aceita até 30 hashtags.' using errcode='P0001'; end if;
  if p_publish_at is null then raise exception 'Escolha data e hora.' using errcode='P0001'; end if;
  if v is null then
    insert into public.ig_posts(kind, media, caption, publish_at, label)
    values (k, p_media, case when k = 'story' then '' else coalesce(p_caption, '') end, p_publish_at, coalesce(p_label, ''))
    returning id into v;
  else
    update public.ig_posts set kind = k, media = p_media, caption = case when k = 'story' then '' else coalesce(p_caption, '') end,
      publish_at = p_publish_at, label = coalesce(nullif(p_label, ''), label), updated_at = now(),
      status = case when status = 'failed' then 'scheduled' else status end, error = case when status = 'failed' then null else error end
    where id = v and status in ('scheduled','failed','cancelled');
    if not found then raise exception 'Esta publicação já saiu ou está saindo agora.' using errcode='P0001'; end if;
  end if;
  return v;
end $$;
revoke execute on function public.admin_ig_save(uuid, text[], text, timestamptz, text, boolean) from public, anon;
grant execute on function public.admin_ig_save(uuid, text[], text, timestamptz, text, boolean) to authenticated;

-- disparador: story vai como media_type STORIES
create or replace function public.ig_tick() returns void language plpgsql security definer set search_path='' as $$
declare
  s public.ig_settings; tok text; r public.ig_posts; base text := 'https://graph.facebook.com/v21.0/'; hdr jsonb;
  bad record; ids bigint[]; kids text[]; i int; v text; body jsonb;
begin
  select * into s from public.ig_settings where id = 1;
  select decrypted_secret into tok from vault.decrypted_secrets where name = 'ig_access_token' limit 1;
  update public.ig_settings set last_tick_at = now(),
    last_message = case when tok is null then 'Sem token: conecte a conta na tela Instagram do admin.' else last_message end where id = 1;
  if tok is null or s.ig_user_id is null then return; end if;
  hdr := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || tok);

  -- passou muito da hora: não publica no escuro
  update public.ig_posts set status = 'failed', error = 'O horário passou há mais de 24 h. Ajuste a data e mande de novo.', updated_at = now()
  where status = 'scheduled' and publish_at < now() - interval '24 hours';

  -- começa as que chegaram na hora (até 3 por minuto)
  for r in select * from public.ig_posts where status = 'scheduled' and publish_at <= now() order by publish_at limit 3 for update skip locked loop
    if r.kind = 'story' then
      update public.ig_posts set status = 'publishing', step = 'container', attempts = attempts + 1, step_at = now(), error = null, updated_at = now(),
        req_ids = array[net.http_post(base || s.ig_user_id || '/media', jsonb_build_object('image_url', r.media[1], 'media_type', 'STORIES'), '{}'::jsonb, hdr, 30000)]
      where id = r.id;
    elsif r.kind = 'carousel' then
      ids := '{}';
      for i in 1..array_length(r.media, 1) loop
        ids := ids || net.http_post(base || s.ig_user_id || '/media', jsonb_build_object('image_url', r.media[i], 'is_carousel_item', true), '{}'::jsonb, hdr, 30000);
      end loop;
      update public.ig_posts set status = 'publishing', step = 'children', req_ids = ids, attempts = attempts + 1, step_at = now(), error = null, updated_at = now() where id = r.id;
    else
      update public.ig_posts set status = 'publishing', step = 'container', attempts = attempts + 1, step_at = now(), error = null, updated_at = now(),
        req_ids = array[net.http_post(base || s.ig_user_id || '/media', jsonb_build_object('image_url', r.media[1], 'caption', r.caption), '{}'::jsonb, hdr, 30000)]
      where id = r.id;
    end if;
  end loop;

  -- avança as que estão no meio do caminho
  for r in select * from public.ig_posts where status = 'publishing' and step_at < now() - interval '2 seconds' for update skip locked loop
    -- ainda esperando resposta?
    if exists(select 1 from unnest(r.req_ids) q(id) where not exists(select 1 from net._http_response h where h.id = q.id)) then
      if r.step_at < now() - interval '15 minutes' then
        perform public._ig_fail(r.id, 'O Instagram não respondeu a tempo.' || case when r.step in ('publish','permalink') then ' Confira no perfil se o post saiu antes de tentar de novo.' else '' end);
      end if;
      continue;
    end if;
    -- alguma resposta com erro?
    select h.status_code, h.content, h.timed_out, h.error_msg into bad from net._http_response h
      where h.id = any(r.req_ids) and (h.timed_out or h.status_code is null or h.status_code >= 300) limit 1;
    if found then
      begin body := bad.content::jsonb; exception when others then body := null; end;
      v := coalesce(body->'error'->>'error_user_msg', body->'error'->>'message', bad.error_msg, 'Erro ' || coalesce(bad.status_code::text, 'de rede'));
      if r.step = 'permalink' then  -- o post já saiu; só não veio o link
        update public.ig_posts set status = 'published', step = null, published_at = now(), req_ids = '{}', updated_at = now() where id = r.id;
      elsif r.step = 'publish' and (position('9007' in coalesce(bad.content, '')) > 0 or lower(v) like '%not ready%' or lower(v) like '%not available%')
            and r.step_at > now() - interval '10 minutes' then
        -- mídia ainda processando: tenta publicar de novo no próximo minuto
        update public.ig_posts set req_ids = array[net.http_post(base || s.ig_user_id || '/media_publish', jsonb_build_object('creation_id', r.container_id), '{}'::jsonb, hdr, 30000)], updated_at = now()
        where id = r.id;
      else
        perform public._ig_fail(r.id, v || case when r.step = 'publish' and bad.timed_out then ' Confira no perfil se o post saiu antes de tentar de novo.' else '' end);
      end if;
      continue;
    end if;
    -- tudo certo: próximo passo
    if r.step = 'children' then
      select array_agg((h.content::jsonb)->>'id' order by array_position(r.req_ids, h.id)) into kids from net._http_response h where h.id = any(r.req_ids);
      update public.ig_posts set child_ids = kids, step = 'container', step_at = now(), updated_at = now(),
        req_ids = array[net.http_post(base || s.ig_user_id || '/media', jsonb_build_object('media_type', 'CAROUSEL', 'children', array_to_string(kids, ','), 'caption', r.caption), '{}'::jsonb, hdr, 30000)]
      where id = r.id;
    elsif r.step = 'container' then
      select (h.content::jsonb)->>'id' into v from net._http_response h where h.id = r.req_ids[1];
      update public.ig_posts set container_id = v, step = 'publish', step_at = now(), updated_at = now(),
        req_ids = array[net.http_post(base || s.ig_user_id || '/media_publish', jsonb_build_object('creation_id', v), '{}'::jsonb, hdr, 30000)]
      where id = r.id;
    elsif r.step = 'publish' then
      select (h.content::jsonb)->>'id' into v from net._http_response h where h.id = r.req_ids[1];
      update public.ig_posts set ig_media_id = v, step = 'permalink', step_at = now(), updated_at = now(),
        req_ids = array[net.http_get(base || v, jsonb_build_object('fields', 'permalink'), hdr, 30000)]
      where id = r.id;
    elsif r.step = 'permalink' then
      select (h.content::jsonb)->>'permalink' into v from net._http_response h where h.id = r.req_ids[1];
      update public.ig_posts set permalink = v, status = 'published', step = null, published_at = now(), req_ids = '{}', updated_at = now() where id = r.id;
    end if;
  end loop;
end $$;
revoke execute on function public.ig_tick() from public, anon, authenticated;

-- ============ lote 2: 8 posts de feed ============
insert into public.ig_posts(kind, media, caption, publish_at, label)
select 'carousel', array['https://ponci.art/kit/novos/cuidar-da-pintura-1.jpg','https://ponci.art/kit/novos/cuidar-da-pintura-2.jpg','https://ponci.art/kit/novos/cuidar-da-pintura-3.jpg','https://ponci.art/kit/novos/cuidar-da-pintura-4.jpg','https://ponci.art/kit/novos/cuidar-da-pintura-5.jpg','https://ponci.art/kit/novos/cuidar-da-pintura-6.jpg'], 'Sol, umidade, limpeza e prego: o básico pra tua obra durar a vida toda. 🖼️
Salva pra consultar depois e manda pra quem acabou de comprar o primeiro quadro.

#arteNaParede #colecionadorDeArte #conservacao #arteBrasileira', '2026-11-30 12:20:00-03'::timestamptz, 'Como cuidar de uma pintura em casa'
where not exists(select 1 from public.ig_posts where label = 'Como cuidar de uma pintura em casa');
insert into public.ig_posts(kind, media, caption, publish_at, label)
select 'carousel', array['https://ponci.art/kit/novos/glossario-1.jpg','https://ponci.art/kit/novos/glossario-2.jpg','https://ponci.art/kit/novos/glossario-3.jpg','https://ponci.art/kit/novos/glossario-4.jpg'], 'Técnica mista, tiragem, P.A., fine art, procedência e certificado: o mini-dicionário pra não boiar na conversa de arte. 📚
Salva, que um dia você vai precisar. E conta aqui embaixo qual palavra faltou!

#arteContemporanea #colecionadorDeArte #gravura #arteBrasileira', '2026-12-09 19:30:00-03'::timestamptz, 'Glossário da arte'
where not exists(select 1 from public.ig_posts where label = 'Glossário da arte');
insert into public.ig_posts(kind, media, caption, publish_at, label)
select 'image', array['https://ponci.art/kit/novos/qual-vai-pra-parede-1.jpg'], 'Responde aqui embaixo: 1 ou 2? 👇
E se não fosse pra sala, pra onde iria?

(Pinturas: Steve Johnson e Geordanna Cordero, via Unsplash)

#arteNaParede #pinturaAbstrata #arteContemporanea #decoracaoComArte', '2026-12-11 19:30:00-03'::timestamptz, 'Qual vai pra sua parede?'
where not exists(select 1 from public.ig_posts where label = 'Qual vai pra sua parede?');
insert into public.ig_posts(kind, media, caption, publish_at, label)
select 'carousel', array['https://ponci.art/kit/novos/escolher-obra-1.jpg','https://ponci.art/kit/novos/escolher-obra-2.jpg','https://ponci.art/kit/novos/escolher-obra-3.jpg','https://ponci.art/kit/novos/escolher-obra-4.jpg','https://ponci.art/kit/novos/escolher-obra-5.jpg','https://ponci.art/kit/novos/escolher-obra-6.jpg'], 'Tamanho, altura, luz e coração: 4 dicas de galeria pra acertar na escolha. 🏠
Salva pra quando for escolher a sua e manda pra quem tá montando a casa nova.

#arteNaParede #decoracaoComArte #colecionadorDeArte #arteOriginal', '2026-12-14 12:20:00-03'::timestamptz, 'Como escolher a obra certa pra sua parede'
where not exists(select 1 from public.ig_posts where label = 'Como escolher a obra certa pra sua parede');
insert into public.ig_posts(kind, media, caption, publish_at, label)
select 'carousel', array['https://ponci.art/kit/novos/comunidade-ponci-1.jpg','https://ponci.art/kit/novos/comunidade-ponci-2.jpg','https://ponci.art/kit/novos/comunidade-ponci-3.jpg','https://ponci.art/kit/novos/comunidade-ponci-4.jpg'], 'A PONCI agora tem uma comunidade: o lugar da rede pra conversar sobre arte. 🎨
Artistas mostram o ateliê e o processo, colecionadores contam como vivem com as obras, e a curadoria compartilha guias e novidades.
É fechada, como a rede. Quer entrar? Pede seu convite pelo link na bio.

#arteBrasileira #artistaBrasileiro #comunidadeDeArte #colecionadorDeArte', '2026-12-16 19:30:00-03'::timestamptz, 'Chegou a Comunidade PONCI'
where not exists(select 1 from public.ig_posts where label = 'Chegou a Comunidade PONCI');
insert into public.ig_posts(kind, media, caption, publish_at, label)
select 'carousel', array['https://ponci.art/kit/novos/por-tras-da-curadoria-1.jpg','https://ponci.art/kit/novos/por-tras-da-curadoria-2.jpg','https://ponci.art/kit/novos/por-tras-da-curadoria-3.jpg','https://ponci.art/kit/novos/por-tras-da-curadoria-4.jpg'], 'O que a gente olha quando uma obra chega pra curadoria? Voz própria, consistência, acabamento, foto honesta, história e preço coerente.
Currículo não entra na conta. 😉 Se isso é você, o link tá na bio.

#curadoria #artistaBrasileiro #arteContemporanea #feitoNoBrasil', '2026-12-18 12:20:00-03'::timestamptz, 'Por trás da curadoria'
where not exists(select 1 from public.ig_posts where label = 'Por trás da curadoria');
insert into public.ig_posts(kind, media, caption, publish_at, label)
select 'carousel', array['https://ponci.art/kit/novos/preco-da-arte-1.jpg','https://ponci.art/kit/novos/preco-da-arte-2.jpg','https://ponci.art/kit/novos/preco-da-arte-3.jpg','https://ponci.art/kit/novos/preco-da-arte-4.jpg','https://ponci.art/kit/novos/preco-da-arte-5.jpg','https://ponci.art/kit/novos/preco-da-arte-6.jpg'], 'Custo, horas, mercado e consistência: o jeito de precificar sem chutar. 💸
Salva e manda pra aquele amigo artista que sempre cobra barato demais.

#artistaBrasileiro #dicasParaArtistas #mercadoDeArte #ateliedeartista', '2026-12-21 12:20:00-03'::timestamptz, 'Como dar preço pra sua arte'
where not exists(select 1 from public.ig_posts where label = 'Como dar preço pra sua arte');
insert into public.ig_posts(kind, media, caption, publish_at, label)
select 'carousel', array['https://ponci.art/kit/novos/arte-de-presente-1.jpg','https://ponci.art/kit/novos/arte-de-presente-2.jpg','https://ponci.art/kit/novos/arte-de-presente-3.jpg','https://ponci.art/kit/novos/arte-de-presente-4.jpg'], 'Presente que não vai pro fundo do armário: arte. 🎁
Pensa na pessoa, começa pequeno, leva o certificado e conta a história no cartão.
Feliz Natal, de quem faz e de quem coleciona arte! ✨

#arteDePresente #natal #arteBrasileira #colecionadorDeArte', '2026-12-23 19:30:00-03'::timestamptz, 'Arte de presente'
where not exists(select 1 from public.ig_posts where label = 'Arte de presente');

-- ============ lote 2: 17 stories (sem figurinha) ============
insert into public.ig_posts(kind, media, caption, publish_at, label)
select 'story', array['https://ponci.art/kit/novos/story-arte-pra-morar-junto.jpg'], '', '2026-11-25 20:10:00-03'::timestamptz, 'Story · Arte pra morar junto'
where not exists(select 1 from public.ig_posts where label = 'Story · Arte pra morar junto');
insert into public.ig_posts(kind, media, caption, publish_at, label)
select 'story', array['https://ponci.art/kit/novos/story-coisas-que-so-quem-pinta.jpg'], '', '2026-11-27 20:10:00-03'::timestamptz, 'Story · Coisas que só quem pinta entende'
where not exists(select 1 from public.ig_posts where label = 'Story · Coisas que só quem pinta entende');
insert into public.ig_posts(kind, media, caption, publish_at, label)
select 'story', array['https://ponci.art/kit/novos/story-cuidar-da-pintura.jpg'], '', '2026-11-30 13:00:00-03'::timestamptz, 'Story · Como cuidar de uma pintura'
where not exists(select 1 from public.ig_posts where label = 'Story · Como cuidar de uma pintura');
insert into public.ig_posts(kind, media, caption, publish_at, label)
select 'story', array['https://ponci.art/kit/novos/story-tiragem.jpg'], '', '2026-12-01 12:40:00-03'::timestamptz, 'Story · Você sabia? Tiragem'
where not exists(select 1 from public.ig_posts where label = 'Story · Você sabia? Tiragem');
insert into public.ig_posts(kind, media, caption, publish_at, label)
select 'story', array['https://ponci.art/kit/novos/story-fotografa-tua-obra.jpg'], '', '2026-12-02 20:10:00-03'::timestamptz, 'Story · Fotografa tua obra'
where not exists(select 1 from public.ig_posts where label = 'Story · Fotografa tua obra');
insert into public.ig_posts(kind, media, caption, publish_at, label)
select 'story', array['https://ponci.art/kit/novos/story-sol.jpg'], '', '2026-12-03 12:40:00-03'::timestamptz, 'Story · Você sabia? Sol'
where not exists(select 1 from public.ig_posts where label = 'Story · Você sabia? Sol');
insert into public.ig_posts(kind, media, caption, publish_at, label)
select 'story', array['https://ponci.art/kit/novos/story-o-que-a-gente-procura.jpg'], '', '2026-12-04 13:00:00-03'::timestamptz, 'Story · O que a gente procura'
where not exists(select 1 from public.ig_posts where label = 'Story · O que a gente procura');
insert into public.ig_posts(kind, media, caption, publish_at, label)
select 'story', array['https://ponci.art/kit/novos/story-conhecendo-artistas.jpg'], '', '2026-12-07 13:00:00-03'::timestamptz, 'Story · Estamos conhecendo artistas'
where not exists(select 1 from public.ig_posts where label = 'Story · Estamos conhecendo artistas');
insert into public.ig_posts(kind, media, caption, publish_at, label)
select 'story', array['https://ponci.art/kit/novos/story-fine-art.jpg'], '', '2026-12-08 12:40:00-03'::timestamptz, 'Story · Você sabia? Fine art'
where not exists(select 1 from public.ig_posts where label = 'Story · Você sabia? Fine art');
insert into public.ig_posts(kind, media, caption, publish_at, label)
select 'story', array['https://ponci.art/kit/novos/story-glossario.jpg'], '', '2026-12-09 20:10:00-03'::timestamptz, 'Story · Glossário da arte'
where not exists(select 1 from public.ig_posts where label = 'Story · Glossário da arte');
insert into public.ig_posts(kind, media, caption, publish_at, label)
select 'story', array['https://ponci.art/kit/novos/story-altura.jpg'], '', '2026-12-10 12:40:00-03'::timestamptz, 'Story · Você sabia? Altura'
where not exists(select 1 from public.ig_posts where label = 'Story · Você sabia? Altura');
insert into public.ig_posts(kind, media, caption, publish_at, label)
select 'story', array['https://ponci.art/kit/novos/story-qual-vai-pra-parede.jpg'], '', '2026-12-11 20:10:00-03'::timestamptz, 'Story · Qual vai pra sua parede?'
where not exists(select 1 from public.ig_posts where label = 'Story · Qual vai pra sua parede?');
insert into public.ig_posts(kind, media, caption, publish_at, label)
select 'story', array['https://ponci.art/kit/novos/story-escolher-obra.jpg'], '', '2026-12-14 13:00:00-03'::timestamptz, 'Story · Como escolher a obra'
where not exists(select 1 from public.ig_posts where label = 'Story · Como escolher a obra');
insert into public.ig_posts(kind, media, caption, publish_at, label)
select 'story', array['https://ponci.art/kit/novos/story-comunidade-ponci.jpg'], '', '2026-12-16 20:10:00-03'::timestamptz, 'Story · Comunidade PONCI'
where not exists(select 1 from public.ig_posts where label = 'Story · Comunidade PONCI');
insert into public.ig_posts(kind, media, caption, publish_at, label)
select 'story', array['https://ponci.art/kit/novos/story-por-tras-da-curadoria.jpg'], '', '2026-12-18 13:00:00-03'::timestamptz, 'Story · Por trás da curadoria'
where not exists(select 1 from public.ig_posts where label = 'Story · Por trás da curadoria');
insert into public.ig_posts(kind, media, caption, publish_at, label)
select 'story', array['https://ponci.art/kit/novos/story-preco-da-arte.jpg'], '', '2026-12-21 13:00:00-03'::timestamptz, 'Story · Como dar preço'
where not exists(select 1 from public.ig_posts where label = 'Story · Como dar preço');
insert into public.ig_posts(kind, media, caption, publish_at, label)
select 'story', array['https://ponci.art/kit/novos/story-arte-de-presente.jpg'], '', '2026-12-23 20:10:00-03'::timestamptz, 'Story · Arte de presente'
where not exists(select 1 from public.ig_posts where label = 'Story · Arte de presente');

-- ============ por que a PONCI é fechada (proteção contra coleta por IA) ============
insert into public.ig_posts(kind, media, caption, publish_at, label)
select 'carousel', array['https://ponci.art/kit/novos/fechada-1.jpg','https://ponci.art/kit/novos/fechada-2.jpg','https://ponci.art/kit/novos/fechada-3.jpg','https://ponci.art/kit/novos/fechada-4.jpg','https://ponci.art/kit/novos/fechada-5.jpg'], 'Por que a PONCI é fechada? Spoiler: não é frescura. 🔒
Robôs de inteligência artificial varrem a internet copiando obras pra treinar máquinas que depois imitam o estilo de quem fez. Sem pedir, sem pagar, sem crédito.
Aqui as obras ficam atrás da porta: acervo só pra membros, robôs de IA barrados e nada de vender obra pra treino.
IA é ferramenta pra facilitar a vida, não pra passar por cima do trabalho de ninguém. É proteção, não elitismo.
Explicamos tudo em ponci.art/protecao. Quer entrar? O convite tá no link da bio.

#artistaBrasileiro #arteBrasileira #direitoAutoral #arteFeitaPorGente', '2026-11-26 19:30:00-03'::timestamptz, 'Por que a PONCI é fechada?'
where not exists(select 1 from public.ig_posts where label = 'Por que a PONCI é fechada?');
insert into public.ig_posts(kind, media, caption, publish_at, label)
select 'story', array['https://ponci.art/kit/novos/story-fechada.jpg'], '', '2026-11-26 20:10:00-03'::timestamptz, 'Story · Por que a PONCI é fechada?'
where not exists(select 1 from public.ig_posts where label = 'Story · Por que a PONCI é fechada?');

-- também na Comunidade, pelo perfil oficial
do $$
declare v uuid := public.official_id(); pid uuid; k int;
begin
  if v is null or exists(select 1 from public.posts where artist_id = v and title = 'Por que a PONCI é fechada?') then return; end if;
  insert into public.posts(artist_id, kind, topic, title, body)
  values (v, 'post', 'geral', 'Por que a PONCI é fechada?',
    E'Não é frescura, é proteção. 🔒\n\nRobôs de inteligência artificial varrem a internet copiando obras pra treinar máquinas que depois imitam o estilo de quem fez, sem pedir, sem pagar e sem crédito. Por isso, aqui as obras ficam atrás da porta: o acervo completo só abre pra membros, o site barra os robôs de IA e a PONCI não vende nem licencia obras pra treino.\n\nIA é ferramenta pra facilitar a vida, não pra passar por cima do trabalho de ninguém.\n\nA explicação completa está em ponci.art/protecao.')
  returning id into pid;
  for k in 1..5 loop
    insert into public.post_media(post_id, position, path, w, h) values (pid, k - 1, '/kit/novos/fechada-' || k || '.jpg', 1080, 1350);
  end loop;
end $$;
