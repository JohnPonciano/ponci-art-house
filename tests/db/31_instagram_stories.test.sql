-- Os arquivos rodam em ordem no mesmo banco: os dados criados em 10_ servem aos seguintes.
\set ON_ERROR_STOP 0
create or replace function pg_temp.como(uid text, email text, aal text default 'aal1') returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', uid, false); perform set_config('request.jwt.claims', json_build_object('sub',uid,'email',email,'aal',aal)::text, false); end $$;
create or replace function pg_temp.espera_erro(sql text, trecho text, nome text) returns void language plpgsql as $$
begin execute sql; raise notice 'FALHOU %: deveria dar erro', nome;
exception when others then if position(trecho in sqlerrm) > 0 then raise notice 'OK %', nome; else raise notice 'FALHOU %: erro inesperado: %', nome, sqlerrm; end if; end $$;
create or replace function pg_temp.confere(cond boolean, nome text) returns void language plpgsql as $$
begin if cond then raise notice 'OK %', nome; else raise notice 'FALHOU %', nome; end if; end $$;
create or replace function pg_temp.resp(p_req bigint, p_code int, p_body text) returns void language sql as $$
  insert into net._http_response(id,status_code,content) values (p_req,p_code,p_body) on conflict (id) do update set status_code=excluded.status_code, content=excluded.content $$;
create or replace function pg_temp.envelhece() returns void language sql as $$ update public.ig_posts set step_at = step_at - interval '1 minute' where status='publishing' $$;
-- só este story vencido na fila: o resto fica para depois
update public.ig_posts set publish_at = now() + interval '30 days' where status = 'scheduled';
update public.ig_posts set publish_at = now() - interval '1 minute' where label = 'Story · Você sabia? Tiragem';
select public.ig_tick();
select pg_temp.confere((select body->>'media_type'='STORIES' and body->>'image_url' like '%story-tiragem.jpg' and body->>'caption' is null from net.reqs order by id desc limit 1), 'story vai como STORIES, sem legenda');
select pg_temp.resp((select max(id) from net.reqs), 200, '{"id":"S1"}'); select pg_temp.envelhece(); select public.ig_tick();
select pg_temp.confere((select url like '%/media_publish' and body->>'creation_id'='S1' from net.reqs order by id desc limit 1), 'story: publica o container');
select pg_temp.resp((select max(id) from net.reqs), 200, '{"id":"SM1"}'); select pg_temp.envelhece(); select public.ig_tick();
select pg_temp.resp((select max(id) from net.reqs), 400, '{"error":{"message":"no permalink"}}'); select pg_temp.envelhece(); select public.ig_tick();
select pg_temp.confere((select status='published' and ig_media_id='SM1' from public.ig_posts where label='Story · Você sabia? Tiragem'), 'story publicado (mesmo sem link)');
select pg_temp.como('00000000-0000-0000-0000-0000000000f1','admin@ponci.art','aal2');
set role authenticated;
select pg_temp.espera_erro($$select public.admin_ig_save(null, array['https://ponci.art/a.jpg','https://ponci.art/b.jpg'], '', now() + interval '1 day', 'x', true)$$,'arquivo só','story com 2 imagens é recusado');
select set_config('t.id', public.admin_ig_save(null, array['https://ponci.art/a.jpg'], 'legenda ignorada', now() + interval '1 day', 'Story teste', true)::text, false);
select pg_temp.confere((select kind='story' and caption='' from public.ig_posts where id = current_setting('t.id')::uuid), 'admin cria story pela tela (legenda ignorada)');
select set_config('t.id', public.admin_ig_save(null, array['https://ponci.art/a.jpg'], 'oi', now() + interval '1 day', 'Post teste')::text, false);
select pg_temp.confere((select kind='image' from public.ig_posts where id = current_setting('t.id')::uuid), 'salvar sem marcar story continua criando post');
reset role;
