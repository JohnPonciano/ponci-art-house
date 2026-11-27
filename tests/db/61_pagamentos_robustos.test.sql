-- Pagamentos robustos: estorno depois de pago, erro ao liberar não trava a fila, teto do aviso público.
-- Roda depois do 60_checkout (mesmo banco): o pedido pago com o pagamento 777 já existe.
select set_config('t.paid', (select id::text from public.checkouts where mp_payment_id = '777'), false);
select pg_temp.confere(current_setting('t.paid') <> '', 'existe um pedido pago para testar');

-- estorno: o Mercado Pago avisa de novo o mesmo pagamento
update public.mp_events set asked_at = now() - interval '1 minute' where payment_id = '777';
set role anon;
select public.mp_notify('777');
reset role;
select pg_temp.confere((select req_id is not null from public.mp_events where payment_id = '777'), 'pagamento aprovado continua consultável (pode ser estornado)');
insert into net._http_response(id, status_code, content) values ((select req_id from public.mp_events where payment_id = '777'), 200,
  json_build_object('status','refunded','external_reference',(select ref from public.checkouts where id = current_setting('t.paid')::uuid),'transaction_amount',4000,'currency_id','BRL')::text);
select public._mp_collect();
select pg_temp.confere((select status = 'problem' and mp_error like '%estornado%' from public.checkouts where id = current_setting('t.paid')::uuid), 'estorno de pedido pago vira problema para o admin');
select pg_temp.confere((select status = 'refunded' from public.mp_events where payment_id = '777'), 'evento fica como estornado');
set role anon;
select public.mp_notify('777');
reset role;
select pg_temp.confere((select req_id is null from public.mp_events where payment_id = '777'), 'estornado não é consultado de novo');

-- erro ao liberar não trava os outros avisos
insert into public.checkouts(buyer_id, total_cents, items, ref) select buyer_id, 1000, '[]', 'PED-T61' from public.checkouts where id = current_setting('t.paid')::uuid;
create or replace function pg_temp.quebra() returns trigger language plpgsql as $$ begin raise exception 'falha simulada'; end $$;
create trigger t61_quebra before update on public.checkouts for each row when (new.status = 'paid' and new.ref = 'PED-T61') execute function pg_temp.quebra();
insert into public.mp_events(payment_id, req_id) values ('9001', 990001), ('9002', 990002);
insert into net._http_response(id, status_code, content) values
  (990001, 200, json_build_object('status','approved','external_reference','PED-T61','transaction_amount',10,'currency_id','BRL')::text),
  (990002, 200, json_build_object('status','pending','external_reference','PED-X','transaction_amount',10,'currency_id','BRL')::text);
select pg_temp.confere(public._mp_collect() >= 0, 'a fila roda mesmo com um pedido que falha');
select pg_temp.confere((select status = 'problem' and mp_error like '%falha simulada%' from public.checkouts where ref = 'PED-T61'), 'pedido que falhou ao liberar vai para problema com o motivo');
select pg_temp.confere((select status = 'pending' from public.mp_events where payment_id = '9002'), 'o aviso seguinte foi processado');
drop trigger t61_quebra on public.checkouts;

-- teto do aviso público
insert into public.mp_events(payment_id, asked_at) select (100000 + g)::text, now() from generate_series(1, 60) g;
set role anon;
select public.mp_notify('424242');
reset role;
select pg_temp.confere((select count(*) = 0 from public.mp_events where payment_id = '424242'), 'acima de 60 consultas por minuto o aviso é ignorado');
select pg_temp.confere(not has_function_privilege('anon', 'public._buy_print_guard()', 'execute'), 'função de gatilho fora da API');
