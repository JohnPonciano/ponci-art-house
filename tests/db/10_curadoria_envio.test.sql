-- Cenário mínimo + testes das funções de envio e curadoria. Cada bloco imprime OK ou FALHOU.
\set ON_ERROR_STOP 0
set session_replication_role = replica;  -- fixtures sem os gatilhos de cadastro
insert into auth.users(id,email) values
 ('00000000-0000-0000-0000-0000000000a1','artista@demo.ponci.art'),
 ('00000000-0000-0000-0000-0000000000b1','colecionadora@demo.ponci.art'),
 ('00000000-0000-0000-0000-0000000000c1','artista.real@exemplo.com');
insert into public.profiles(id,role,member_code,display_name,status,accepts_offers) values
 ('00000000-0000-0000-0000-0000000000a1','artist','ART-9001','Ana Teste','active',true),
 ('00000000-0000-0000-0000-0000000000b1','buyer','COL-9001','Bia Teste','active',false),
 ('00000000-0000-0000-0000-0000000000c1','artist','ART-9002','Real Teste','active',true);
insert into public.kyc(user_id,person_type,legal_name,doc_number,phone,city,uf,completed_at) values
 ('00000000-0000-0000-0000-0000000000a1','pf','Ana Teste','52998224725','+5511999999999','Salvador','BA',now()),
 ('00000000-0000-0000-0000-0000000000b1','pf','Bia Teste','11144477735','+5511988888888','São Paulo','SP',now()),
 ('00000000-0000-0000-0000-0000000000c1','pf','Real Teste','39053344705','+5511977777777','Recife','PE',now());
insert into public.admins(email) values ('admin@ponci.art');
insert into public.works(id,slug,artist_id,title,year,cat,medium,h,w,price,status,description) values
 ('00000000-0000-0000-0000-00000000aa01','ajustar','00000000-0000-0000-0000-0000000000a1','Obra para ajustar',2026,'painting','Óleo',50,40,8000,'review','{"Descrição."}'),
 ('00000000-0000-0000-0000-00000000aa02','recusar','00000000-0000-0000-0000-0000000000a1','Obra para recusar',2026,'painting','Óleo',50,40,8000,'review','{"Descrição."}'),
 ('00000000-0000-0000-0000-00000000aa03','real','00000000-0000-0000-0000-0000000000c1','Obra de artista real',2026,'painting','Óleo',50,40,8000,'review','{"Descrição."}');
set session_replication_role = origin;

create or replace function pg_temp.como(uid text, email text, aal text default 'aal1') returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', uid, false);
  perform set_config('request.jwt.claims', json_build_object('sub',uid,'email',email,'aal',aal)::text, false); end $$;
create or replace function pg_temp.espera_erro(sql text, trecho text, nome text) returns void language plpgsql as $$
begin execute sql; raise notice 'FALHOU %: deveria dar erro', nome;
exception when others then
  if position(trecho in sqlerrm) > 0 then raise notice 'OK %', nome; else raise notice 'FALHOU %: erro inesperado: %', nome, sqlerrm; end if; end $$;
create or replace function pg_temp.confere(cond boolean, nome text) returns void language plpgsql as $$
begin if cond then raise notice 'OK %', nome; else raise notice 'FALHOU %', nome; end if; end $$;

-- ===== CURADORIA =====
select pg_temp.como('00000000-0000-0000-0000-0000000000a1','artista@demo.ponci.art');
set role authenticated;
select pg_temp.espera_erro($$select public.admin_curate('00000000-0000-0000-0000-00000000aa01','aprovada','')$$, 'restrito', 'artista não pode curar');
reset role;
select pg_temp.como('00000000-0000-0000-0000-0000000000f1','admin@ponci.art','aal1');
set role authenticated;
select pg_temp.espera_erro($$select public.admin_curate('00000000-0000-0000-0000-00000000aa01','aprovada','')$$, 'restrito', 'admin sem 2FA não pode curar');
reset role;
select pg_temp.como('00000000-0000-0000-0000-0000000000f1','admin@ponci.art','aal2');
set role authenticated;
select pg_temp.espera_erro($$select public.admin_curate('00000000-0000-0000-0000-00000000aa01','ajustes','curto')$$, 'mínimo 10', 'pedir ajustes exige recado');
select public.admin_curate('00000000-0000-0000-0000-00000000aa01','ajustes','Envie uma foto com luz natural, sem reflexo.');
reset role;
select pg_temp.confere((select changes_requested_at is not null and curation_note like 'Envie%' and status='review' from public.works where slug='ajustar'), 'ajustes: obra continua em curadoria com recado');
-- artista vê o histórico e reenvia
select pg_temp.como('00000000-0000-0000-0000-0000000000a1','artista@demo.ponci.art');
set role authenticated;
select pg_temp.confere((select count(*) = 1 from public.curation_log where decision='ajustes'), 'artista lê o próprio histórico');
select public.update_work_review('00000000-0000-0000-0000-00000000aa01', '{"title":"Obra ajustada","price":"9000","description":"Linha um.\nLinha dois.","reproduction":"true"}');
reset role;
select pg_temp.confere((select title='Obra ajustada' and price=9000 and reproduction and changes_requested_at is null and array_length(description,1)=2 from public.works where slug='ajustar'), 'artista edita e reenvia');
select pg_temp.confere((select count(*)=1 from public.curation_log where decision='reenviada'), 'reenvio registrado no histórico');
-- outra artista não vê nem edita
select pg_temp.como('00000000-0000-0000-0000-0000000000c1','artista.real@exemplo.com');
set role authenticated;
select pg_temp.confere((select count(*) = 0 from public.curation_log where artist_id='00000000-0000-0000-0000-0000000000a1'), 'histórico é privado de cada artista');
select pg_temp.espera_erro($$select public.update_work_review('00000000-0000-0000-0000-00000000aa01','{"title":"invasão"}')$$, 'Só dá', 'outra artista não edita');
-- artista real não usa a aprovação simulada
select pg_temp.espera_erro($$select public.demo_approve_work('00000000-0000-0000-0000-00000000aa03')$$, 'demonstração', 'aprovação simulada só em conta demo');
reset role;
-- admin aprova e recusa
select pg_temp.como('00000000-0000-0000-0000-0000000000f1','admin@ponci.art','aal2');
set role authenticated;
select public.admin_curate('00000000-0000-0000-0000-00000000aa01','aprovada','');
select pg_temp.espera_erro($$select public.admin_curate('00000000-0000-0000-0000-00000000aa02','recusada','')$$, 'mínimo 10', 'recusar exige motivo');
select public.admin_curate('00000000-0000-0000-0000-00000000aa02','recusada','A obra não segue a linha da curadoria deste ciclo.');
reset role;
select pg_temp.confere((select status='published' from public.works where slug='ajustar'), 'aprovar publica a obra');
select pg_temp.confere(not exists(select 1 from public.works where slug='recusar') and exists(select 1 from public.curation_log where decision='recusada' and title='Obra para recusar' and work_id is null), 'recusar apaga a obra e guarda o motivo');

-- ===== ENVIO =====
select pg_temp.como('00000000-0000-0000-0000-0000000000b1','colecionadora@demo.ponci.art');
set role authenticated;
select public.reserve_work('00000000-0000-0000-0000-00000000aa01');
reset role;
select pg_temp.confere((select stage=0 from public.orders where work_id='00000000-0000-0000-0000-00000000aa01'), 'reserva cria pedido');
-- artista assina
select pg_temp.como('00000000-0000-0000-0000-0000000000a1','artista@demo.ponci.art');
set role authenticated;
select public.sign_contract((select c.id from public.contracts c join public.orders o on o.id=c.order_id where o.work_id='00000000-0000-0000-0000-00000000aa01'), '127.0.0.1', 'teste');
select pg_temp.espera_erro($$select public.ship_order((select id from public.orders where work_id='00000000-0000-0000-0000-00000000aa01'),'Correios','AB123456789BR')$$, 'depois do pagamento', 'artista não despacha antes do pagamento');
reset role;
select pg_temp.como('00000000-0000-0000-0000-0000000000b1','colecionadora@demo.ponci.art');
set role authenticated;
select pg_temp.confere(public.advance_order((select id from public.orders where work_id='00000000-0000-0000-0000-00000000aa01')) = 1, 'colecionadora paga em custódia');
select pg_temp.espera_erro($$select public.advance_order((select id from public.orders where work_id='00000000-0000-0000-0000-00000000aa01'))$$, 'ainda não despachou', 'colecionadora não confirma envio');
select pg_temp.espera_erro($$select public.ship_order((select id from public.orders where work_id='00000000-0000-0000-0000-00000000aa01'),'Correios','AB123456789BR')$$, 'não encontrado', 'colecionadora não despacha');
reset role;
select pg_temp.como('00000000-0000-0000-0000-0000000000a1','artista@demo.ponci.art');
set role authenticated;
select pg_temp.espera_erro($$select public.ship_order((select id from public.orders where work_id='00000000-0000-0000-0000-00000000aa01'),'Pombo','X')$$, 'forma de envio', 'transportadora inválida');
select pg_temp.espera_erro($$select public.ship_order((select id from public.orders where work_id='00000000-0000-0000-0000-00000000aa01'),'Correios','')$$, 'rastreio', 'Correios exige rastreio');
select public.ship_order((select id from public.orders where work_id='00000000-0000-0000-0000-00000000aa01'),'Correios',' ab123456789br ');
reset role;
select pg_temp.confere((select stage=2 and carrier='Correios' and tracking_code='AB123456789BR' and shipped_at is not null and paid_at is not null from public.orders where work_id='00000000-0000-0000-0000-00000000aa01'), 'artista despacha com rastreio');
select pg_temp.como('00000000-0000-0000-0000-0000000000b1','colecionadora@demo.ponci.art');
set role authenticated;
select pg_temp.confere((select tracking_code='AB123456789BR' from public.orders where work_id='00000000-0000-0000-0000-00000000aa01'), 'colecionadora vê o rastreio');
select pg_temp.confere(public.advance_order((select id from public.orders where work_id='00000000-0000-0000-0000-00000000aa01')) = 3, 'colecionadora confirma recebimento');
reset role;
select pg_temp.confere((select status='sold' from public.works where id='00000000-0000-0000-0000-00000000aa01'), 'obra vendida');
select pg_temp.confere((select body like '%REPRODUÇÃO (não é a obra original)%' and body like '%O objeto é uma REPRODUÇÃO%' from public.contracts c join public.orders o on o.id=c.order_id where o.work_id='00000000-0000-0000-0000-00000000aa01'), 'contrato de reprodução com texto certo');
