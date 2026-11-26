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

-- ===== compra simples: assinatura automática da artista e prazo de 3 dias =====
set session_replication_role = replica;
insert into public.works(id,slug,artist_id,title,year,cat,medium,h,w,price,status,description) values
 ('00000000-0000-0000-0000-00000000dd01','compra-simples','00000000-0000-0000-0000-0000000000a1','Compra simples',2026,'painting','Óleo',50,40,7000,'published','{"D."}');
set session_replication_role = origin;
select pg_temp.como('00000000-0000-0000-0000-0000000000b1','colecionadora@demo.ponci.art');
set role authenticated;
select public.reserve_work('00000000-0000-0000-0000-00000000dd01');
reset role;
select pg_temp.confere((select count(*) = 3 and bool_or(party = 'artista' and method = 'automatica') from public.contract_signatures s join public.contracts c on c.id = s.contract_id join public.orders o on o.id = c.order_id where o.work_id = '00000000-0000-0000-0000-00000000dd01'),
  'compra pelo preço: artista assina automaticamente');
select pg_temp.confere((select pay_until between now() + interval '71 hours' and now() + interval '73 hours' from public.orders where work_id = '00000000-0000-0000-0000-00000000dd01'), 'prazo de pagamento de 3 dias');
select pg_temp.como('00000000-0000-0000-0000-0000000000b1','colecionadora@demo.ponci.art');
set role authenticated;
select pg_temp.confere(public.advance_order((select id from public.orders where work_id = '00000000-0000-0000-0000-00000000dd01')) = 1, 'comprador já pode pagar sem esperar a artista');
reset role;
-- outra compra não paga vence e a obra volta para a galeria
set session_replication_role = replica;
insert into public.works(id,slug,artist_id,title,year,cat,medium,h,w,price,status,description) values
 ('00000000-0000-0000-0000-00000000dd02','vence','00000000-0000-0000-0000-0000000000a1','Vence',2026,'painting','Óleo',50,40,7000,'published','{"D."}');
set session_replication_role = origin;
select pg_temp.como('00000000-0000-0000-0000-0000000000b1','colecionadora@demo.ponci.art');
set role authenticated;
select public.reserve_work('00000000-0000-0000-0000-00000000dd02');
reset role;
select pg_temp.confere((select status = 'reserved' from public.works where id = '00000000-0000-0000-0000-00000000dd02'), 'comprada: sai da galeria');
select pg_temp.confere(public.expire_unpaid_orders() = 0, 'dentro do prazo nada vence');
update public.orders set pay_until = now() - interval '1 minute' where work_id = '00000000-0000-0000-0000-00000000dd02';
select pg_temp.confere(public.expire_unpaid_orders() = 1, 'depois de 3 dias sem pagamento, vence');
select pg_temp.confere((select w.status = 'published' and o.cancelled_at is not null and o.cancel_reason like 'Pagamento não feito em 3 dias%'
  from public.works w join public.orders o on o.work_id = w.id where w.id = '00000000-0000-0000-0000-00000000dd02'), 'obra volta para a galeria e pedido fica cancelado com motivo');
select pg_temp.confere((select status = 'reserved' from public.works where id = '00000000-0000-0000-0000-00000000dd01'), 'compra paga não é afetada');
-- arquivo de impressão do cadastro precisa estar na pasta da artista
select pg_temp.espera_erro($$update public.works set print_master_path = 'outra/pasta/x.jpg' where id = '00000000-0000-0000-0000-00000000dd01'$$, 'works_print_master_owner_ck', 'arquivo de impressão só na pasta da artista');
