\set ON_ERROR_STOP 0
create or replace function pg_temp.como(uid text, email text, aal text default 'aal1') returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', uid, false); perform set_config('request.jwt.claims', json_build_object('sub',uid,'email',email,'aal',aal)::text, false); end $$;
create or replace function pg_temp.espera_erro(sql text, trecho text, nome text) returns void language plpgsql as $$
begin execute sql; raise notice 'FALHOU %: deveria dar erro', nome;
exception when others then if position(trecho in sqlerrm) > 0 then raise notice 'OK %', nome; else raise notice 'FALHOU %: erro inesperado: %', nome, sqlerrm; end if; end $$;
create or replace function pg_temp.confere(cond boolean, nome text) returns void language plpgsql as $$
begin if cond then raise notice 'OK %', nome; else raise notice 'FALHOU %', nome; end if; end $$;
-- responde a última requisição (simula a Meta) e "envelhece" o passo para o próximo ciclo
create or replace function pg_temp.resp(p_req bigint, p_code int, p_body text) returns void language sql as $$
  insert into net._http_response(id,status_code,content) values (p_req,p_code,p_body) on conflict (id) do update set status_code=excluded.status_code, content=excluded.content $$;
create or replace function pg_temp.envelhece() returns void language sql as $$ update public.ig_posts set step_at = step_at - interval '1 minute' where status='publishing' $$;

-- sem token: o ciclo só avisa
select public.ig_tick();
select pg_temp.confere((select last_message like 'Sem token%' from public.ig_settings), 'sem token, o disparador avisa e não publica');
select pg_temp.confere((select count(*)=0 from net.reqs), 'sem token, nenhuma chamada à Meta');

-- membro não vê a fila nem mexe
select pg_temp.como('00000000-0000-0000-0000-0000000000b1','colecionadora@demo.ponci.art');
set role authenticated;
select pg_temp.confere((select count(*)=0 from public.ig_posts), 'membro não vê a fila');
select pg_temp.espera_erro($$select public.admin_ig_set_token('x'||repeat('y',30), null, 'a')$$,'restrito','membro não troca o token');
select pg_temp.espera_erro($$select public.ig_tick()$$,'permission','membro não roda o disparador');
reset role;

-- admin conecta
select set_config('t.fila', (select count(*)::text from public.ig_posts), false);
select pg_temp.como('00000000-0000-0000-0000-0000000000f1','admin@ponci.art','aal2');
set role authenticated;
select public.admin_ig_set_token('EAATESTE'||repeat('x',40), now() + interval '60 days', 'ponci.art');
select pg_temp.confere((select count(*) = current_setting('t.fila')::int from public.ig_posts), 'admin vê a fila inteira');
select pg_temp.espera_erro($$select public.admin_ig_save(null, array['https://ponci.art/kit/x.png'], 'oi', now())$$,'JPEG','recusa imagem que não é JPEG');
select pg_temp.espera_erro($$select public.admin_ig_save(null, array['https://ponci.art/kit/x.jpg'], (select string_agg('#tag'||g, ' ') from generate_series(1,31) g), now())$$,'30 hashtags','recusa mais de 30 hashtags');
reset role;
select pg_temp.confere((select count(*)=1 from vault.secrets where name='ig_access_token'), 'token guardado no cofre');

-- ===== post simples: do container ao link =====
update public.ig_posts set publish_at = now() - interval '1 minute' where label = 'Conhece alguém que pinta demais?';
select public.ig_tick();
select pg_temp.confere((select status='publishing' and step='container' from public.ig_posts where label='Conhece alguém que pinta demais?'), 'na hora certa, começa a publicar');
select pg_temp.confere((select url like '%/17841438995605886/media' and body->>'image_url' like 'https://ponci.art/kit/post-06%' and body->>'caption' like 'Todo mundo tem%' and headers->>'Authorization' like 'Bearer EAATESTE%' from net.reqs order by id desc limit 1), 'chamada certa: conta, imagem, legenda e token no cabeçalho');
select pg_temp.resp((select max(id) from net.reqs), 200, '{"id":"C1"}'); select pg_temp.envelhece(); select public.ig_tick();
select pg_temp.confere((select url like '%/media_publish' and body->>'creation_id'='C1' from net.reqs order by id desc limit 1), 'container pronto, manda publicar');
select pg_temp.resp((select max(id) from net.reqs), 200, '{"id":"M1"}'); select pg_temp.envelhece(); select public.ig_tick();
select pg_temp.resp((select max(id) from net.reqs), 200, '{"permalink":"https://www.instagram.com/p/ABC/","id":"M1"}'); select pg_temp.envelhece(); select public.ig_tick();
select pg_temp.confere((select status='published' and ig_media_id='M1' and permalink='https://www.instagram.com/p/ABC/' from public.ig_posts where label='Conhece alguém que pinta demais?'), 'publicado, com id e link guardados');

-- ===== carrossel: 6 filhos, pai, "ainda processando", publica =====
update public.ig_posts set publish_at = now() - interval '1 minute' where label = 'Coisas que só quem pinta entende';
select public.ig_tick();
select pg_temp.confere((select count(*)=6 from net.reqs where body->>'is_carousel_item'='true'), 'carrossel: um envio por imagem');
do $$ declare r record; k int := 0; begin for r in select id from net.reqs where body->>'is_carousel_item'='true' order by id loop k := k+1; perform pg_temp.resp(r.id, 200, '{"id":"K'||k||'"}'); end loop; end $$;
select pg_temp.envelhece(); select public.ig_tick();
select pg_temp.confere((select body->>'media_type'='CAROUSEL' and body->>'children'='K1,K2,K3,K4,K5,K6' and body->>'caption' like 'Se você pinta%' from net.reqs order by id desc limit 1), 'carrossel: pai com os 6 na ordem e a legenda');
select pg_temp.resp((select max(id) from net.reqs), 200, '{"id":"P1"}'); select pg_temp.envelhece(); select public.ig_tick();
select pg_temp.resp((select max(id) from net.reqs), 400, '{"error":{"message":"Media ID is not available","code":9007}}'); select pg_temp.envelhece(); select public.ig_tick();
select pg_temp.confere((select status='publishing' and step='publish' from public.ig_posts where label='Coisas que só quem pinta entende') and (select url like '%/media_publish' from net.reqs order by id desc limit 1), 'mídia ainda processando: tenta publicar de novo');
select pg_temp.resp((select max(id) from net.reqs), 200, '{"id":"M2"}'); select pg_temp.envelhece(); select public.ig_tick();
select pg_temp.resp((select max(id) from net.reqs), 500, 'erro'); select pg_temp.envelhece(); select public.ig_tick();
select pg_temp.confere((select status='published' and ig_media_id='M2' from public.ig_posts where label='Coisas que só quem pinta entende'), 'link falhou mas o post saiu: fica como publicado');

-- ===== erro da Meta =====
update public.ig_posts set publish_at = now() - interval '1 minute' where label = 'Olhe de perto';
select public.ig_tick();
select pg_temp.resp((select max(id) from net.reqs), 400, '{"error":{"message":"Invalid parameter","error_user_msg":"A imagem não pôde ser baixada."}}'); select pg_temp.envelhece(); select public.ig_tick();
select pg_temp.confere((select status='failed' and error='A imagem não pôde ser baixada.' from public.ig_posts where label='Olhe de perto'), 'erro da Meta vira falha com a mensagem dela');
-- ===== atrasada demais =====
update public.ig_posts set publish_at = now() - interval '2 days' where label = 'O que a gente procura';
select public.ig_tick();
select pg_temp.confere((select status='failed' and error like 'O horário passou%' from public.ig_posts where label='O que a gente procura'), 'atrasada mais de 24 h não sai no escuro');
-- ===== ações do admin =====
-- (independe da data do dia: garante que este post ainda está na fila)
update public.ig_posts set status = 'scheduled', publish_at = now() + interval '2 days', error = null where label = 'Arte pra morar junto';
select pg_temp.como('00000000-0000-0000-0000-0000000000f1','admin@ponci.art','aal2');
set role authenticated;
select public.admin_ig_action((select id from public.ig_posts where label='Olhe de perto'), 'retry');
select pg_temp.confere((select status='scheduled' and error is null from public.ig_posts where label='Olhe de perto'), 'tentar de novo volta pra fila');
select public.admin_ig_action((select id from public.ig_posts where label='Estamos conhecendo artistas'), 'cancel');
select pg_temp.confere((select status='cancelled' from public.ig_posts where label='Estamos conhecendo artistas'), 'cancelar');
select pg_temp.espera_erro($$select public.admin_ig_save((select id from public.ig_posts where label='Conhece alguém que pinta demais?'), array['https://ponci.art/kit/a.jpg'], 'x', now())$$,'já saiu','não edita o que já saiu');
select set_config('t.quando', to_char(date_trunc('minute', now() + interval '3 days'), 'YYYY-MM-DD HH24:MI:SSOF'), false);
select public.admin_ig_save((select id from public.ig_posts where label='Arte pra morar junto'), array['https://ponci.art/kit/post-05-arte-pra-morar-junto.jpg'], 'Legenda nova', current_setting('t.quando')::timestamptz);
select pg_temp.confere((select caption='Legenda nova' and publish_at = current_setting('t.quando')::timestamptz from public.ig_posts where label='Arte pra morar junto'), 'edita legenda e horário');
select public.admin_ig_action((select id from public.ig_posts where label='Arte pra morar junto'), 'now');
select pg_temp.confere((select publish_at <= now() from public.ig_posts where label='Arte pra morar junto'), 'publicar agora');
reset role;
