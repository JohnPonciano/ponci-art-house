-- Perfil oficial da PONCI na Comunidade (@ponci.art): tutoriais, avisos e novidades.
-- A conta não tem senha (ninguém entra com ela); o admin publica por ela com admin_post_as_ponci.
-- Não conta como membro nas estatísticas, e nomes/@ "ponci" ficam reservados.

-- 1) conta e perfil
do $$
declare v uuid;
begin
  select id into v from auth.users where email = 'comunidade@ponci.art';
  if v is null then
    v := gen_random_uuid();
    -- o gatilho de cadastro pula convite/CPF para e-mails da tabela de admins; a linha sai logo em seguida
    insert into public.admins(email) values ('comunidade@ponci.art') on conflict do nothing;
    insert into auth.users(instance_id, id, aud, role, email, encrypted_password, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
    values ('00000000-0000-0000-0000-000000000000', v, 'authenticated', 'authenticated', 'comunidade@ponci.art', '',
      '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '');
    delete from public.admins where email = 'comunidade@ponci.art';
  end if;
  insert into public.profiles(id, role, member_code, display_name, city, practice, bio, status, show_name, handle, accepts_offers)
  values (v, 'buyer', 'PONCI', 'PONCI', 'Brasil', 'Curadoria e equipe',
    'Perfil oficial da PONCI. Aqui ficam os tutoriais, os avisos e as novidades da rede.', 'active', true, 'ponci.art', false)
  on conflict (id) do update set member_code = 'PONCI', display_name = 'PONCI', show_name = true, status = 'active', handle = 'ponci.art';
end $$;

create or replace function public.official_id() returns uuid language sql stable security definer set search_path='' as
$$ select id from public.profiles where member_code = 'PONCI' $$;
revoke execute on function public.official_id() from public, anon;
grant execute on function public.official_id() to authenticated;

-- 2) números da rede não contam a conta oficial
create or replace function public.network_stats() returns json language sql stable security definer set search_path='' as $$
  select json_build_object(
    'artists', (select count(*) from public.profiles where role='artist' and member_code <> 'PONCI'),
    'buyers', (select count(*) from public.profiles where role='buyer' and member_code <> 'PONCI'),
    'published', (select count(*) from public.works where status='published'))
$$;

-- 3) ninguém se passa pela PONCI: @ começando com "ponci" e o nome "PONCI" são da conta oficial
-- (quem já tinha um @ assim continua com ele)
create or replace function public._reserve_ponci() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.member_code = 'PONCI' then return new; end if;
  if new.handle is distinct from old.handle and new.handle like 'ponci%' then
    raise exception 'Este @ é reservado para a PONCI.' using errcode='P0001'; end if;
  if new.display_name is distinct from old.display_name and lower(btrim(new.display_name)) in ('ponci', 'ponci oficial', 'equipe ponci', 'ponci art') then
    raise exception 'Este nome é reservado para a PONCI.' using errcode='P0001'; end if;
  return new;
end $$;
revoke execute on function public._reserve_ponci() from public, anon, authenticated;
drop trigger if exists profiles_reserve_ponci on public.profiles;
create trigger profiles_reserve_ponci before update on public.profiles for each row execute function public._reserve_ponci();

-- 4) admin publica como PONCI (texto e até 9 fotos da pasta oficial)
create or replace function public.admin_post_as_ponci(p_title text, p_body text, p_topic text default 'geral', p_media jsonb default '[]')
returns uuid language plpgsql security definer set search_path='' as $$
declare v uuid := public.official_id(); pid uuid; m jsonb; i int := 0;
begin
  perform public._require_admin();
  if v is null then raise exception 'Perfil oficial não encontrado.' using errcode='P0001'; end if;
  if coalesce(btrim(p_body), '') = '' and coalesce(btrim(p_title), '') = '' and jsonb_array_length(coalesce(p_media, '[]')) = 0 then
    raise exception 'Escreva algo ou adicione uma imagem.' using errcode='P0001'; end if;
  if jsonb_array_length(coalesce(p_media, '[]')) > 9 then raise exception 'Até 9 imagens por publicação.' using errcode='P0001'; end if;
  insert into public.posts(artist_id, kind, topic, body, title)
  values (v, 'post', case when p_topic in ('geral','processo','exposicoes','colecao','mercado') then p_topic else 'geral' end,
    left(coalesce(btrim(p_body), ''), 2200), left(coalesce(btrim(p_title), ''), 90))
  returning id into pid;
  for m in select * from jsonb_array_elements(coalesce(p_media, '[]')) loop
    if not ((m->>'path') like v::text || '/diario/%' or (m->>'path') like '/comunidade/oficial/%') then
      raise exception 'Imagem inválida.' using errcode='P0001'; end if;
    insert into public.post_media(post_id, position, path, w, h) values (pid, i, m->>'path', (m->>'w')::int, (m->>'h')::int);
    i := i + 1;
  end loop;
  return pid;
end $$;
revoke execute on function public.admin_post_as_ponci(text, text, text, jsonb) from public, anon;
grant execute on function public.admin_post_as_ponci(text, text, text, jsonb) to authenticated;

-- admin pode enviar fotos para a pasta da conta oficial
drop policy if exists "admin envia fotos da PONCI" on storage.objects;
create policy "admin envia fotos da PONCI" on storage.objects for insert to authenticated
  with check (bucket_id = 'works' and (select public.is_admin()) and (storage.foldername(name))[1] = (select public.official_id())::text);

-- 5) primeiros posts: boas-vindas e tutoriais (imagens servidas pelo próprio site)
do $$
declare v uuid := public.official_id(); pid uuid; r record; k int;
begin
  for r in select * from (values
    (8, 'boas-vindas', 'geral', 4, 'Boas-vindas à Comunidade PONCI',
     E'Que bom ter você aqui! 🎨\n\nA Comunidade é o lugar da rede pra conversar sobre arte: artistas mostram o ateliê e o processo, colecionadores contam como vivem com as obras, e todo mundo troca ideia, dúvida e indicação.\n\nArrasta pro lado pra ver o básico. E se apresenta aqui embaixo: quem é você e o que te trouxe pra PONCI?'),
    (7, 'primeira-nota', 'geral', 4, 'Como publicar sua primeira nota',
     E'Publicar é rapidinho: toca no +, escolhe até 9 fotos (a primeira vira a capa), dá um título e conta a história.\n\nSem foto também vale: a nota vira um cartão de texto.\n\nNo fim, escolhe o espaço certo pra ela. Artista pode ligar a nota a uma obra publicada, e aí quem lê chega na obra com um toque.'),
    (6, 'espacos', 'geral', 3, 'Os espaços da Comunidade',
     E'Cada nota mora num espaço, pra conversa não virar bagunça:\n\n#Conversa: apresentações, recados, assunto da rede\n#Processo: ateliê, técnica, obra em andamento\n#Obras novas: o que acabou de passar pela curadoria\n#Agenda: exposições, aberturas, feiras e visitas\n#Coleção: como cada um vive com as obras em casa\n#Dúvidas: conservação, moldura, transporte e mercado\n\nNa busca dá pra explorar por espaço.'),
    (5, 'artistas', 'processo', 4, 'Pra artistas: da obra cadastrada à vitrine',
     E'O caminho de uma obra na PONCI:\n\n1. Você cadastra com foto, técnica, medidas, preço e uma boa descrição.\n2. A curadoria olha com calma. Pode aprovar, pedir algum ajuste (você vê o recado, ajusta e reenvia) ou explicar por que não é a hora.\n3. Aprovada, ela entra na vitrine fechada da rede.\n\nSe for impressão ou fine art de uma obra sua, marca como reprodução: ela ganha a etiqueta REPROD e ninguém se confunde.\n\nNo Ateliê você escolhe se aceita propostas ou se o preço é fixo.'),
    (4, 'colecionadores', 'colecao', 4, 'Pra colecionadores: como comprar com segurança',
     E'Comprar na PONCI é assim:\n\n1. Reserva pelo preço ou manda uma proposta (quando a artista aceita negociar).\n2. Contrato assinado pelas duas partes, direto na plataforma.\n3. Você paga e o dinheiro fica guardado com a PONCI, não vai direto pra artista.\n4. A artista despacha e você acompanha pelo código de rastreio.\n5. Chegou bem? Confirma o recebimento e sai o certificado da obra.\n\nE você ainda tem 7 dias depois de receber pra desistir, se precisar.'),
    (3, 'perfil', 'geral', 3, 'Seu perfil: nome, @, foto e bio',
     E'Dá pra deixar o perfil com a sua cara em Editar perfil: nome, @, foto e uma bio curtinha.\n\nColecionador escolhe se aparece pelo nome ou pelo código de membro (tipo COL-0105). Os dois jeitos funcionam bem; é questão de gosto e de privacidade.'),
    (2, 'privacidade', 'mercado', 3, 'O que os outros veem de você',
     E'Aqui na rede ninguém vê seu e-mail, telefone, CPF ou endereço. Isso fica guardado com a PONCI.\n\nNuma negociação, a artista vê o seu código de membro e a sua cidade. O nome das duas partes só aparece quando a venda é fechada, no contrato.\n\nQualquer dúvida sobre seus dados, é só pedir em Minha conta.'),
    (1, 'combinados', 'geral', 3, 'Os combinados da Comunidade',
     E'Pra rede continuar boa pra todo mundo:\n\n• Respeito sempre, mesmo quando a opinião é diferente.\n• Só publique foto que é sua ou que você tem permissão pra usar, e dê o crédito.\n• Negocie pela PONCI: é o que garante contrato, pagamento guardado, rastreio e certificado.\n• Viu algo estranho? Toca em Denunciar na nota. A curadoria olha tudo.\n\nValeu por fazer parte! 🙌')
  ) as t(ord, slug, topic, n, title, body) loop
    if v is null then exit; end if;
    if exists(select 1 from public.posts where artist_id = v and title = r.title) then continue; end if;
    insert into public.posts(artist_id, kind, topic, body, title, created_at)
    values (v, 'post', r.topic, r.body, r.title, now() - make_interval(mins => (9 - r.ord) * 7))
    returning id into pid;
    for k in 1..r.n loop
      insert into public.post_media(post_id, position, path, w, h) values (pid, k - 1, '/comunidade/oficial/' || r.slug || '-' || k || '.jpg', 1080, 1350);
    end loop;
  end loop;
end $$;
