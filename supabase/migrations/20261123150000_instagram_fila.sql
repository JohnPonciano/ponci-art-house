-- Fila de publicações do Instagram (@ponci.art), tudo dentro do Supabase:
-- o token fica no Vault (criptografado), o pg_cron roda a cada minuto e o pg_net conversa com a Graph API.
-- Fluxo de cada publicação: cria o(s) container(s) → (carrossel: container pai) → publica → busca o link.

create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;

-- ============ tabelas ============
create table if not exists public.ig_settings(
  id int primary key default 1 check (id = 1),
  ig_user_id text not null default '17841438995605886',
  ig_username text,
  token_set_at timestamptz,
  token_expires_at timestamptz,
  last_tick_at timestamptz,
  last_message text
);
insert into public.ig_settings(id) values (1) on conflict (id) do nothing;

create table if not exists public.ig_posts(
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('image','carousel')),
  media text[] not null check (array_length(media, 1) between 1 and 10),
  caption text not null default '' check (length(caption) <= 2200),
  publish_at timestamptz not null,
  status text not null default 'scheduled' check (status in ('scheduled','publishing','published','failed','cancelled')),
  step text,
  step_at timestamptz,
  req_ids bigint[] not null default '{}',
  child_ids text[],
  container_id text,
  ig_media_id text,
  permalink text,
  published_at timestamptz,
  attempts int not null default 0,
  error text,
  label text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ig_posts_due_idx on public.ig_posts(status, publish_at);

alter table public.ig_settings enable row level security;
alter table public.ig_posts enable row level security;
drop policy if exists "instagram: admin lê" on public.ig_settings;
create policy "instagram: admin lê" on public.ig_settings for select to authenticated using ((select public.is_admin()));
drop policy if exists "instagram: admin lê a fila" on public.ig_posts;
create policy "instagram: admin lê a fila" on public.ig_posts for select to authenticated using ((select public.is_admin()));

-- ============ admin ============
-- guarda (ou troca) o token no Vault; o servidor já validou com a Meta antes de chamar
create or replace function public.admin_ig_set_token(p_token text, p_expires_at timestamptz, p_username text) returns void
language plpgsql security definer set search_path='' as $$
declare v uuid;
begin
  perform public._require_admin();
  if length(coalesce(p_token, '')) < 20 then raise exception 'Token inválido.' using errcode='P0001'; end if;
  select id into v from vault.secrets where name = 'ig_access_token';
  if v is null then perform vault.create_secret(p_token, 'ig_access_token', 'Graph API · Instagram @ponci.art');
  else perform vault.update_secret(v, p_token); end if;
  update public.ig_settings set token_set_at = now(), token_expires_at = p_expires_at, ig_username = nullif(btrim(p_username), ''), last_message = null where id = 1;
end $$;

-- cria ou edita uma publicação (só enquanto não saiu)
create or replace function public.admin_ig_save(p_id uuid, p_media text[], p_caption text, p_publish_at timestamptz, p_label text default '')
returns uuid language plpgsql security definer set search_path='' as $$
declare v uuid := p_id; n int := coalesce(array_length(p_media, 1), 0); u text;
begin
  perform public._require_admin();
  if n < 1 or n > 10 then raise exception 'De 1 a 10 imagens.' using errcode='P0001'; end if;
  foreach u in array p_media loop
    if u !~ '^https://[^ ]+\.(jpe?g)(\?[^ ]*)?$' then raise exception 'Use links https de imagens JPEG (o Instagram só aceita JPEG): %', u using errcode='P0001'; end if;
  end loop;
  if length(coalesce(p_caption, '')) > 2200 then raise exception 'Legenda com mais de 2.200 caracteres.' using errcode='P0001'; end if;
  if (select count(*) from regexp_matches(coalesce(p_caption, ''), '#[[:alnum:]_]+', 'g')) > 30 then
    raise exception 'O Instagram aceita até 30 hashtags.' using errcode='P0001'; end if;
  if p_publish_at is null then raise exception 'Escolha data e hora.' using errcode='P0001'; end if;
  if v is null then
    insert into public.ig_posts(kind, media, caption, publish_at, label)
    values (case when n > 1 then 'carousel' else 'image' end, p_media, coalesce(p_caption, ''), p_publish_at, coalesce(p_label, ''))
    returning id into v;
  else
    update public.ig_posts set kind = case when n > 1 then 'carousel' else 'image' end, media = p_media, caption = coalesce(p_caption, ''),
      publish_at = p_publish_at, label = coalesce(nullif(p_label, ''), label), updated_at = now(),
      status = case when status = 'failed' then 'scheduled' else status end, error = case when status = 'failed' then null else error end
    where id = v and status in ('scheduled','failed','cancelled');
    if not found then raise exception 'Esta publicação já saiu ou está saindo agora.' using errcode='P0001'; end if;
  end if;
  return v;
end $$;

-- cancelar, tentar de novo ou publicar agora
create or replace function public.admin_ig_action(p_id uuid, p_action text) returns void
language plpgsql security definer set search_path='' as $$
begin
  perform public._require_admin();
  if p_action = 'cancel' then
    update public.ig_posts set status = 'cancelled', updated_at = now() where id = p_id and status in ('scheduled','failed');
  elsif p_action = 'retry' then
    update public.ig_posts set status = 'scheduled', step = null, req_ids = '{}', error = null, publish_at = greatest(publish_at, now()), updated_at = now()
    where id = p_id and status in ('failed','cancelled');
  elsif p_action = 'now' then
    update public.ig_posts set publish_at = now(), updated_at = now() where id = p_id and status = 'scheduled';
  else raise exception 'Ação inválida.' using errcode='P0001'; end if;
  if not found then raise exception 'Não dá para fazer isso com esta publicação agora.' using errcode='P0001'; end if;
end $$;

revoke execute on function public.admin_ig_set_token(text, timestamptz, text), public.admin_ig_save(uuid, text[], text, timestamptz, text),
  public.admin_ig_action(uuid, text) from public, anon;
grant execute on function public.admin_ig_set_token(text, timestamptz, text), public.admin_ig_save(uuid, text[], text, timestamptz, text),
  public.admin_ig_action(uuid, text) to authenticated;

-- ============ o disparador (pg_cron, a cada minuto) ============
create or replace function public._ig_fail(p_id uuid, p_msg text) returns void language sql security definer set search_path='' as $$
  update public.ig_posts set status = 'failed', step = null, error = left(coalesce(p_msg, 'Erro desconhecido.'), 500), updated_at = now() where id = p_id;
$$;

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
    if r.kind = 'carousel' then
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
revoke execute on function public.ig_tick(), public._ig_fail(uuid, text) from public, anon, authenticated;

select cron.schedule('ponci-instagram', '* * * * *', 'select public.ig_tick()');

-- ============ as 9 publicações do calendário (posts sem música) ============
insert into public.ig_posts(kind, media, caption, publish_at, label)
select 'image', array['https://ponci.art/kit/post-06-conhece-alguem.jpg'], 'Todo mundo tem aquele primo, aquela amiga, aquele vizinho que manda muito bem e quase ninguém viu.
Marca aqui embaixo! 👇 A gente vai olhar um por um, com carinho.

#arteBrasileira #artistaBrasileiro #feitoNoBrasil #pinturaContemporanea', '2026-11-23 12:20:00-03'::timestamptz, 'Conhece alguém que pinta demais?'
where not exists(select 1 from public.ig_posts where label = 'Conhece alguém que pinta demais?');
insert into public.ig_posts(kind, media, caption, publish_at, label)
select 'image', array['https://ponci.art/kit/post-05-arte-pra-morar-junto.jpg'], 'Arte é pra morar junto, não pra ficar guardada no fundo do armário.
É pra estar na sala, no corredor, do lado do cafezinho da manhã. ☕
Na PONCI, cada obra é escolhida uma a uma, direto de quem fez.

#arteNaParede #colecionadorDeArte #arteOriginal #arteBrasileira', '2026-11-25 19:30:00-03'::timestamptz, 'Arte pra morar junto'
where not exists(select 1 from public.ig_posts where label = 'Arte pra morar junto');
insert into public.ig_posts(kind, media, caption, publish_at, label)
select 'carousel', array['https://ponci.art/kit/carrossel-03-coisas-que-so-quem-pinta-entende-01.jpg','https://ponci.art/kit/carrossel-03-coisas-que-so-quem-pinta-entende-02.jpg','https://ponci.art/kit/carrossel-03-coisas-que-so-quem-pinta-entende-03.jpg','https://ponci.art/kit/carrossel-03-coisas-que-so-quem-pinta-entende-04.jpg','https://ponci.art/kit/carrossel-03-coisas-que-so-quem-pinta-entende-05.jpg','https://ponci.art/kit/carrossel-03-coisas-que-so-quem-pinta-entende-06.jpg'], 'Se você pinta, já passou por pelo menos três dessas. Confessa! 😂
Qual faltou? Conta aqui embaixo e marca aquele artista que vive isso todo dia.

#artistaBrasileiro #processoCriativo #ateliedeartista #vidaDeArtista', '2026-11-27 19:30:00-03'::timestamptz, 'Coisas que só quem pinta entende'
where not exists(select 1 from public.ig_posts where label = 'Coisas que só quem pinta entende');
insert into public.ig_posts(kind, media, caption, publish_at, label)
select 'image', array['https://ponci.art/kit/post-04-olhe-de-perto.jpg'], 'Cada pincelada é uma escolha. Às vezes a obra inteira mora num detalhe de dois centímetros.
Dá um zoom aí 🔍 e conta: qual foi a última obra que te fez chegar mais perto?

#pinturaContemporanea #arteContemporanea #arteOriginal #texturas', '2026-11-30 12:20:00-03'::timestamptz, 'Olhe de perto'
where not exists(select 1 from public.ig_posts where label = 'Olhe de perto');
insert into public.ig_posts(kind, media, caption, publish_at, label)
select 'carousel', array['https://ponci.art/kit/carrossel-02-fotografa-tua-obra-01.jpg','https://ponci.art/kit/carrossel-02-fotografa-tua-obra-02.jpg','https://ponci.art/kit/carrossel-02-fotografa-tua-obra-03.jpg','https://ponci.art/kit/carrossel-02-fotografa-tua-obra-04.jpg','https://ponci.art/kit/carrossel-02-fotografa-tua-obra-05.jpg','https://ponci.art/kit/carrossel-02-fotografa-tua-obra-06.jpg'], 'Portfólio bom não precisa de câmera cara. Precisa de luz de janela e um pouquinho de paciência. 📱
4 dicas pra sua obra aparecer do jeito que ela é de verdade.
Fotografou? Manda o portfólio pelo link na bio.

#artistaBrasileiro #portfolioDeArte #dicasParaArtistas #ateliedeartista', '2026-12-02 19:30:00-03'::timestamptz, 'Fotografa tua obra com o celular'
where not exists(select 1 from public.ig_posts where label = 'Fotografa tua obra com o celular');
insert into public.ig_posts(kind, media, caption, publish_at, label)
select 'image', array['https://ponci.art/kit/post-03-o-que-a-gente-procura.jpg'], 'Não é currículo, nem número de seguidores.
É voz própria, ralação (faça chuva ou faça sol) e aquele papo bom sobre o que você faz.
Se isso é você, chega mais: o link tá na bio.

#artistasBrasileiros #arteContemporanea #feitoNoBrasil #curadoria', '2026-12-04 12:20:00-03'::timestamptz, 'O que a gente procura'
where not exists(select 1 from public.ig_posts where label = 'O que a gente procura');
insert into public.ig_posts(kind, media, caption, publish_at, label)
select 'image', array['https://ponci.art/kit/post-02-estamos-conhecendo-artistas.jpg'], 'Do Oiapoque ao Chuí: se você pinta, desenha, grava, fotografa ou esculpe, mostra aí! 👀
Manda seu portfólio pelo link na bio. A gente olha cada um com calma, sem pressa e sem fórmula.

#artistaBrasileiro #arteBrasileira #chamadaAberta #portfolioDeArte', '2026-12-07 12:20:00-03'::timestamptz, 'Estamos conhecendo artistas'
where not exists(select 1 from public.ig_posts where label = 'Estamos conhecendo artistas');
insert into public.ig_posts(kind, media, caption, publish_at, label)
select 'carousel', array['https://ponci.art/kit/carrossel-01-como-comecar-a-colecionar-01.jpg','https://ponci.art/kit/carrossel-01-como-comecar-a-colecionar-02.jpg','https://ponci.art/kit/carrossel-01-como-comecar-a-colecionar-03.jpg','https://ponci.art/kit/carrossel-01-como-comecar-a-colecionar-04.jpg','https://ponci.art/kit/carrossel-01-como-comecar-a-colecionar-05.jpg','https://ponci.art/kit/carrossel-01-como-comecar-a-colecionar-06.jpg','https://ponci.art/kit/carrossel-01-como-comecar-a-colecionar-07.jpg'], 'Todo mundo acha que colecionar arte é coisa de milionário. Não é, não! 🖼️
Dá pra começar pequeno, com uma peça que cabe no bolso e na parede.
Salva pra lembrar depois e manda pra aquele amigo que vive dizendo "um dia eu compro um quadro". 👇

#colecionadorDeArte #arteNaParede #arteOriginal #comecarAColecionar', '2026-12-09 19:30:00-03'::timestamptz, 'Como começar a colecionar arte'
where not exists(select 1 from public.ig_posts where label = 'Como começar a colecionar arte');
insert into public.ig_posts(kind, media, caption, publish_at, label)
select 'image', array['https://ponci.art/kit/post-01-toda-obra-comeca-num-atelie.jpg'], 'Antes de chegar na parede, toda obra passou por mesa, pincel, café frio, erro e recomeço. 🎨
Às vezes o ateliê é um quarto, às vezes a varanda, às vezes a mesa da cozinha depois do jantar.
A PONCI nasce pra aproximar quem faz de quem coleciona, sem vitrine lotada no meio.
E aí, como é o seu cantinho de criar?

#ateliedeartista #arteBrasileira #processoCriativo #feitoNoBrasil', '2026-12-11 19:30:00-03'::timestamptz, 'Toda obra começa num ateliê'
where not exists(select 1 from public.ig_posts where label = 'Toda obra começa num ateliê');
