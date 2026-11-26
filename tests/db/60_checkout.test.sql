-- Sacola, pedido único e Mercado Pago (respostas da API simuladas). Usa membros de 10_ e prints de 50_.
set session_replication_role = replica;
insert into public.works(id,slug,artist_id,title,year,cat,medium,h,w,price,status,description) values
 ('00000000-0000-0000-0000-00000000ee01','loja-1','00000000-0000-0000-0000-0000000000a1','Loja Um',2026,'painting','Óleo',50,40,3000,'published','{"D."}'),
 ('00000000-0000-0000-0000-00000000ee02','loja-2','00000000-0000-0000-0000-0000000000a1','Loja Dois',2026,'painting','Óleo',50,40,4000,'published','{"D."}'),
 ('00000000-0000-0000-0000-00000000ee03','loja-3','00000000-0000-0000-0000-0000000000a1','Loja Três',2026,'painting','Óleo',50,40,5000,'published','{"D."}');
set session_replication_role = origin;
select set_config('t.pap', (select id::text from public.print_products where name = 'Papel Teste 300g'), false);
select set_config('t.a4', (select id::text from public.print_sizes where label = 'A4'), false);
update public.print_offers set status = 'active', paused_reason = null where work_id = '00000000-0000-0000-0000-00000000cc04';

-- ===== sacola =====
select pg_temp.como('00000000-0000-0000-0000-0000000000a1','artista@demo.ponci.art');
set role authenticated;
select pg_temp.espera_erro($$select public.cart_add('original', '00000000-0000-0000-0000-00000000ee01')$$, 'colecionadores', 'artista não usa sacola');
reset role;
select pg_temp.como('00000000-0000-0000-0000-0000000000b1','colecionadora@demo.ponci.art');
set role authenticated;
select pg_temp.confere(public.cart_add('original', '00000000-0000-0000-0000-00000000ee01') = 1, 'original entra na sacola');
select pg_temp.confere(public.cart_add('original', '00000000-0000-0000-0000-00000000ee01') = 1, 'repetir não duplica');
select pg_temp.confere(public.cart_add('print', '00000000-0000-0000-0000-00000000cc04', current_setting('t.pap')::uuid, current_setting('t.a4')::uuid) = 2, 'print entra na sacola');
select pg_temp.espera_erro($$select public.cart_add('print', '00000000-0000-0000-0000-00000000cc04', current_setting('t.pap')::uuid, gen_random_uuid())$$, 'não está disponível', 'tamanho inexistente não entra');
select pg_temp.confere((select count(*) = 2 and bool_and(available) and sum(price_cents) = 300000 + (select price_cents from public.work_print_options('00000000-0000-0000-0000-00000000cc04') limit 1)
  from public.cart_view()), 'sacola mostra 2 itens com preço atual');
reset role;
select pg_temp.como('00000000-0000-0000-0000-0000000000c1','artista.real@demo.ponci.art');
set role authenticated;
select pg_temp.confere((select count(*) = 0 from public.cart_view()), 'ninguém vê a sacola dos outros');
reset role;

-- ===== pedido sem Mercado Pago conectado =====
select pg_temp.como('00000000-0000-0000-0000-0000000000b1','colecionadora@demo.ponci.art');
set role authenticated;
select set_config('t.c1', (public.checkout_create('https://ponci.art', '127.0.0.1', 'teste'))->>'id', false);
select pg_temp.confere((select c.ref like 'PED-%' and c.status = 'awaiting_payment' and jsonb_array_length(c.items) = 2 and c.mp_req_id is null from public.checkouts c where c.id = current_setting('t.c1')::uuid), 'pedido PED- com 2 itens, sem Mercado Pago');
select pg_temp.confere((select count(*) = 0 from public.cart_view()), 'sacola esvazia');
reset role;
select pg_temp.confere((select w.status = 'reserved' and o.checkout_id = current_setting('t.c1')::uuid and o.pay_until = c.pay_until
  from public.orders o join public.works w on w.id = o.work_id join public.checkouts c on c.id = o.checkout_id where w.id = '00000000-0000-0000-0000-00000000ee01'), 'original reservado dentro do pedido, mesmo prazo');
select pg_temp.confere((select count(*) = 2 from public.contract_signatures s join public.contracts k on k.id = s.contract_id join public.orders o on o.id = k.order_id
  where o.checkout_id = current_setting('t.c1')::uuid and s.party in ('comprador','artista')), 'contrato assinado pelo comprador e pela artista');
select pg_temp.confere((select total_cents = 300000 + (select price_cents from public.print_orders where checkout_id = current_setting('t.c1')::uuid) from public.checkouts where id = current_setting('t.c1')::uuid), 'total soma original e print');
select pg_temp.confere((select expires_at = (select pay_until from public.checkouts where id = current_setting('t.c1')::uuid) from public.print_orders where checkout_id = current_setting('t.c1')::uuid), 'print guardado pelo mesmo prazo do pedido');

-- admin confirma pagamento feito por fora
select pg_temp.como('00000000-0000-0000-0000-0000000000b1','colecionadora@demo.ponci.art');
set role authenticated;
select pg_temp.espera_erro($$select public.admin_checkout_mark_paid(current_setting('t.c1')::uuid, 'pix')$$, 'restrito', 'comprador não marca como pago');
reset role;
select pg_temp.como('00000000-0000-0000-0000-0000000000f1','admin@ponci.art','aal2');
set role authenticated;
select public.admin_checkout_mark_paid(current_setting('t.c1')::uuid, 'Pix direto');
reset role;
select pg_temp.confere((select c.status = 'paid' and (select stage from public.orders where checkout_id = c.id) = 1 and (select status from public.print_orders where checkout_id = c.id) = 'in_production'
  from public.checkouts c where c.id = current_setting('t.c1')::uuid), 'pago: original para despachar, print em produção');

-- ===== com Mercado Pago =====
select vault.create_secret('TEST-123456789012345678901234567890', 'mp_access_token', 'teste');
select pg_temp.como('00000000-0000-0000-0000-0000000000b1','colecionadora@demo.ponci.art');
set role authenticated;
select public.cart_add('original', '00000000-0000-0000-0000-00000000ee02');
select set_config('t.c2', (public.checkout_create('https://evil.example', null, null))->>'id', false);
reset role;
select pg_temp.confere((select method = 'POST' and url like '%/checkout/preferences' and body->>'external_reference' like 'PED-%' and body->>'notification_url' like 'https://ponci.art/api/mp/webhook%'
  and (body->'items'->0->>'unit_price')::numeric = 4000 and headers->>'Authorization' like 'Bearer TEST-%' from net.reqs where id = (select mp_req_id from public.checkouts where id = current_setting('t.c2')::uuid)),
  'pede o link ao Mercado Pago, com retorno só para ponci.art');
insert into net._http_response(id, status_code, content) values ((select mp_req_id from public.checkouts where id = current_setting('t.c2')::uuid), 201, '{"id":"PREF-1","init_point":"https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=PREF-1"}');
select pg_temp.como('00000000-0000-0000-0000-0000000000b1','colecionadora@demo.ponci.art');
set role authenticated;
select pg_temp.confere((public.checkout_status(current_setting('t.c2')::uuid))->>'pay_link' like 'https://www.mercadopago.com.br/%', 'comprador recebe o link de pagamento');
reset role;
-- aviso falso/valor errado não paga
set role anon;
select public.mp_notify('abc; drop table x');
select public.mp_notify('555');
reset role;
select pg_temp.confere((select count(*) = 0 from public.mp_events where payment_id = 'abc; drop table x'), 'aviso com id inválido é ignorado');
select pg_temp.confere((select url like '%/v1/payments/555' from net.reqs where id = (select req_id from public.mp_events where payment_id = '555')), 'aviso faz o banco consultar a API');
insert into net._http_response(id, status_code, content) values ((select req_id from public.mp_events where payment_id = '555'), 200,
  json_build_object('status','approved','external_reference',(select ref from public.checkouts where id = current_setting('t.c2')::uuid),'transaction_amount',10,'currency_id','BRL')::text);
select public._mp_collect();
select pg_temp.confere((select c.status = 'awaiting_payment' and e.status = 'approved_mismatch' from public.checkouts c, public.mp_events e where c.id = current_setting('t.c2')::uuid and e.payment_id = '555'), 'valor errado não confirma');
-- pagamento certo
set role anon;
select public.mp_notify('777');
reset role;
insert into net._http_response(id, status_code, content) values ((select req_id from public.mp_events where payment_id = '777'), 200,
  json_build_object('status','approved','external_reference',(select ref from public.checkouts where id = current_setting('t.c2')::uuid),'transaction_amount',4000,'currency_id','BRL')::text);
select pg_temp.como('00000000-0000-0000-0000-0000000000b1','colecionadora@demo.ponci.art');
set role authenticated;
select pg_temp.confere((public.checkout_status(current_setting('t.c2')::uuid))->>'status' = 'paid', 'pagamento aprovado na API: pedido pago');
reset role;
select pg_temp.confere((select stage = 1 and paid_at is not null from public.orders where checkout_id = current_setting('t.c2')::uuid), 'original liberado para a artista despachar');
select pg_temp.confere((select mp_payment_id = '777' from public.checkouts where id = current_setting('t.c2')::uuid), 'guarda o id do pagamento');

-- ===== vencimento e pagamento atrasado =====
select pg_temp.como('00000000-0000-0000-0000-0000000000b1','colecionadora@demo.ponci.art');
set role authenticated;
select public.cart_add('original', '00000000-0000-0000-0000-00000000ee03');
select set_config('t.c3', (public.checkout_create(null, null, null))->>'id', false);
reset role;
update public.checkouts set pay_until = now() - interval '1 minute' where id = current_setting('t.c3')::uuid;
update public.orders set pay_until = now() - interval '1 minute' where checkout_id = current_setting('t.c3')::uuid;
select public.pay_tick();
select pg_temp.confere((select c.status = 'expired' and w.status = 'published' and o.cancelled_at is not null
  from public.checkouts c join public.orders o on o.checkout_id = c.id join public.works w on w.id = o.work_id where c.id = current_setting('t.c3')::uuid), 'sem pagamento em 3 dias: pedido vence e a obra volta para a galeria');
set role anon;
select public.mp_notify('888');
reset role;
insert into net._http_response(id, status_code, content) values ((select req_id from public.mp_events where payment_id = '888'), 200,
  json_build_object('status','approved','external_reference',(select ref from public.checkouts where id = current_setting('t.c3')::uuid),'transaction_amount',5000,'currency_id','BRL')::text);
select public._mp_collect();
select pg_temp.confere((select status = 'problem' and mp_error like '%depois que o pedido caiu%' from public.checkouts where id = current_setting('t.c3')::uuid), 'pagamento depois do prazo vira problema para o admin resolver');
select pg_temp.confere((select stage = 0 from public.orders where checkout_id = current_setting('t.c3')::uuid), 'e não libera a obra sozinho');

select pg_temp.como('00000000-0000-0000-0000-0000000000b1','colecionadora@demo.ponci.art');
set role authenticated;
select pg_temp.espera_erro($$select public.checkout_create(null, null, null)$$, 'vazia', 'sacola vazia não vira pedido');
select pg_temp.espera_erro($$select public.checkout_status(gen_random_uuid())$$, 'não encontrado', 'não vê pedido de outra pessoa');
reset role;
select pg_temp.confere((select ship_included from public.works where slug = 'loja-1') is not null and (select column_default like 'true%' from information_schema.columns where table_name = 'works' and column_name = 'ship_included'), 'frete incluso é o padrão das obras novas');
