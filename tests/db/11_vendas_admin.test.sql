-- Os arquivos rodam em ordem no mesmo banco: os dados criados em 10_ servem aos seguintes.
\set ON_ERROR_STOP 0
create or replace function pg_temp.como(uid text, email text, aal text default 'aal1') returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', uid, false);
  perform set_config('request.jwt.claims', json_build_object('sub',uid,'email',email,'aal',aal)::text, false); end $$;
create or replace function pg_temp.espera_erro(sql text, trecho text, nome text) returns void language plpgsql as $$
begin execute sql; raise notice 'FALHOU %: deveria dar erro', nome;
exception when others then
  if position(trecho in sqlerrm) > 0 then raise notice 'OK %', nome; else raise notice 'FALHOU %: erro inesperado: %', nome, sqlerrm; end if; end $$;
create or replace function pg_temp.confere(cond boolean, nome text) returns void language plpgsql as $$
begin if cond then raise notice 'OK %', nome; else raise notice 'FALHOU %', nome; end if; end $$;
-- obra nova publicada da artista demo
insert into public.works(id,slug,artist_id,title,year,cat,medium,h,w,price,status,description) values
 ('00000000-0000-0000-0000-00000000bb01','cancelar','00000000-0000-0000-0000-0000000000a1','Obra para cancelar',2026,'painting','Óleo',50,40,7000,'published','{"x"}');
select pg_temp.como('00000000-0000-0000-0000-0000000000b1','colecionadora@demo.ponci.art');
set role authenticated; select public.reserve_work('00000000-0000-0000-0000-00000000bb01'); reset role;
select pg_temp.confere((select status='reserved' from public.works where slug='cancelar'), 'reserva tira a obra da vitrine');
-- colecionadora não cancela
set role authenticated;
select pg_temp.espera_erro($$select public.admin_cancel_order((select id from public.orders where work_id='00000000-0000-0000-0000-00000000bb01'),'quero cancelar agora')$$,'restrito','colecionadora não usa o cancelamento do admin');
reset role;
select pg_temp.como('00000000-0000-0000-0000-0000000000f1','admin@ponci.art','aal2');
set role authenticated;
select pg_temp.espera_erro($$select public.admin_cancel_order((select id from public.orders where work_id='00000000-0000-0000-0000-00000000bb01'),'curto')$$,'mínimo 10','cancelar exige motivo');
select public.admin_cancel_order((select id from public.orders where work_id='00000000-0000-0000-0000-00000000bb01'),'Pagamento não feito em 48 horas.');
select pg_temp.espera_erro($$select public.admin_cancel_order((select id from public.orders where work_id='00000000-0000-0000-0000-00000000bb01'),'de novo, cancelando')$$,'já foi cancelada','não cancela duas vezes');
reset role;
select pg_temp.confere((select status='published' from public.works where slug='cancelar'), 'cancelar devolve a obra à vitrine');
select pg_temp.como('00000000-0000-0000-0000-0000000000b1','colecionadora@demo.ponci.art');
set role authenticated;
select pg_temp.espera_erro($$select public.advance_order((select id from public.orders where work_id='00000000-0000-0000-0000-00000000bb01'))$$,'cancelada','pedido cancelado não anda');
-- a obra pode ser reservada de novo
select public.reserve_work('00000000-0000-0000-0000-00000000bb01');
reset role;
select pg_temp.confere((select count(*)=2 from public.orders where work_id='00000000-0000-0000-0000-00000000bb01'), 'obra cancelada pode ser vendida de novo');
-- repasse: venda entregue (a da rodada anterior, obra 'ajustar')
select pg_temp.como('00000000-0000-0000-0000-0000000000f1','admin@ponci.art','aal2');
set role authenticated;
select pg_temp.espera_erro($$select public.admin_mark_payout((select id from public.orders where work_id='00000000-0000-0000-0000-00000000aa01'))$$,'arrependimento','repasse espera os 7 dias');
select pg_temp.espera_erro($$select public.admin_cancel_order((select id from public.orders where work_id='00000000-0000-0000-0000-00000000aa01'),'motivo bem comprido')$$,'Depois do envio','não cancela depois do envio');
reset role;
update public.orders set delivered_at = now() - interval '8 days' where work_id='00000000-0000-0000-0000-00000000aa01';
insert into public.member_requests(user_id, order_id, kind, details) values ('00000000-0000-0000-0000-0000000000b1',(select id from public.orders where work_id='00000000-0000-0000-0000-00000000aa01'),'arrependimento','desisto');
set role authenticated;
select pg_temp.espera_erro($$select public.admin_mark_payout((select id from public.orders where work_id='00000000-0000-0000-0000-00000000aa01'))$$,'em aberto','repasse bloqueado com desistência aberta');
reset role;
update public.member_requests set status='negada' where kind='arrependimento';
set role authenticated;
select public.admin_mark_payout((select id from public.orders where work_id='00000000-0000-0000-0000-00000000aa01'),'PIX 22/11');
select pg_temp.espera_erro($$select public.admin_mark_payout((select id from public.orders where work_id='00000000-0000-0000-0000-00000000aa01'))$$,'já foi registrado','repasse não duplica');
reset role;
select pg_temp.confere((select payout_at is not null and payout_note='PIX 22/11' from public.orders where work_id='00000000-0000-0000-0000-00000000aa01'), 'repasse registrado');
\set ON_ERROR_STOP 0
create or replace function pg_temp.como(uid text, email text, aal text default 'aal1') returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', uid, false); perform set_config('request.jwt.claims', json_build_object('sub',uid,'email',email,'aal',aal)::text, false); end $$;
create or replace function pg_temp.espera_erro(sql text, trecho text, nome text) returns void language plpgsql as $$
begin execute sql; raise notice 'FALHOU %: deveria dar erro', nome;
exception when others then if position(trecho in sqlerrm) > 0 then raise notice 'OK %', nome; else raise notice 'FALHOU %: erro inesperado: %', nome, sqlerrm; end if; end $$;
create or replace function pg_temp.confere(cond boolean, nome text) returns void language plpgsql as $$
begin if cond then raise notice 'OK %', nome; else raise notice 'FALHOU %', nome; end if; end $$;
insert into public.posts(artist_id, kind, title, body) values (public.official_id(), 'post', 'Fixo', 'Post oficial de teste.');
select set_config('t.oficiais', (select count(*)::text from public.posts where artist_id=public.official_id()), false);
select pg_temp.como('00000000-0000-0000-0000-0000000000a1','artista@demo.ponci.art');
set role authenticated;
select pg_temp.espera_erro($$update public.profiles set handle='ponci.oficial' where id='00000000-0000-0000-0000-0000000000a1'$$,'reservado','membro não pega @ponci…');
select pg_temp.espera_erro($$update public.profiles set display_name='PONCI' where id='00000000-0000-0000-0000-0000000000a1'$$,'reservado','membro não se chama PONCI');
update public.profiles set display_name='Ana Teste Nova', handle='ana.teste' where id='00000000-0000-0000-0000-0000000000a1';
select pg_temp.espera_erro($$select public.admin_post_as_ponci('x','y')$$,'restrito','membro não publica como PONCI');
select pg_temp.confere((select count(*) >= 1 and count(*) = current_setting('t.oficiais')::int from public.posts where artist_id=public.official_id()), 'membro lê os posts oficiais');
reset role;
select pg_temp.confere((select display_name='Ana Teste Nova' and handle='ana.teste' from public.profiles where id='00000000-0000-0000-0000-0000000000a1'), 'nome e @ comuns continuam livres');
select pg_temp.como('00000000-0000-0000-0000-0000000000f1','admin@ponci.art','aal2');
set role authenticated;
select pg_temp.espera_erro($$select public.admin_post_as_ponci('t','b','geral','[{"path":"outra/pasta/x.jpg","w":10,"h":10}]')$$,'inválida','foto fora da pasta oficial é recusada');
select pg_temp.confere(public.admin_post_as_ponci('Aviso','Texto do aviso.','agenda_invalida','[{"path":"/comunidade/oficial/boas-vindas-1.jpg","w":1080,"h":1350}]') is not null, 'admin publica como PONCI');
reset role;
select pg_temp.confere((select topic='geral' from public.posts where title='Aviso'), 'espaço inválido vira Conversa');
