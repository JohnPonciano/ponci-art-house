-- Compra de prints. Usa membros de 10_ e catálogo/ofertas de 50_.
select set_config('t.pap', (select id::text from public.print_products where name = 'Papel Teste 300g'), false);
select set_config('t.a4', (select id::text from public.print_sizes where label = 'A4'), false);
-- comprador precisa de endereço completo
update public.kyc set cep = '01310100', street = 'Av. Paulista', number = '1000', district = 'Bela Vista' where user_id = '00000000-0000-0000-0000-0000000000b1';
update public.kyc set cep = '40000000', street = 'Rua do Ateliê', number = '10', district = 'Centro' where user_id = '00000000-0000-0000-0000-0000000000a1';
-- edição limitada de 2, assinada e numerada
set session_replication_role = replica;
insert into public.works(id,slug,artist_id,title,year,cat,medium,h,w,price,status,description) values
 ('00000000-0000-0000-0000-00000000cc05','print-lim','00000000-0000-0000-0000-0000000000a1','Edição curta',2026,'painting','Óleo',50,40,9000,'published','{"D."}');
set session_replication_role = origin;
select pg_temp.como('00000000-0000-0000-0000-0000000000a1','artista@demo.ponci.art');
set role authenticated;
select set_config('t.lim', public.save_print_offer('00000000-0000-0000-0000-00000000cc05','limited',2,true,true,
  format('[{"product":"%s","size":"%s","fee_cents":6000}]', current_setting('t.pap'), current_setting('t.a4'))::jsonb, '00000000-0000-0000-0000-0000000000a1/lim.tif', 4000, 5000)::text, false);
select public.publish_print_offer(current_setting('t.lim')::uuid, public.print_authorization_preview(current_setting('t.lim')::uuid)->>'sha256');
select pg_temp.espera_erro($$select public.buy_print(current_setting('t.lim')::uuid, current_setting('t.pap')::uuid, current_setting('t.a4')::uuid)$$, 'própria obra', 'artista não compra o próprio print');
reset role;

-- comprador compra
select pg_temp.como('00000000-0000-0000-0000-0000000000b1','colecionadora@demo.ponci.art');
set role authenticated;
select pg_temp.espera_erro($$select public.buy_print(current_setting('t.lim')::uuid, current_setting('t.pap')::uuid, gen_random_uuid())$$, 'indisponível', 'tamanho fora da oferta');
select set_config('t.r1', public.buy_print(current_setting('t.lim')::uuid, current_setting('t.pap')::uuid, current_setting('t.a4')::uuid), false);
select pg_temp.confere(current_setting('t.r1') like 'PRT-%', 'compra gera pedido PRT-');
select pg_temp.confere((select status = 'awaiting_payment' and edition_no is null and price_cents > 0 and ship_to->>'street' = 'Av. Paulista' and expires_at > now() + interval '47 hours'
  from public.print_orders where ref = current_setting('t.r1')), 'aguardando pagamento, preço e endereço copiados, vaga por 48 h');
select pg_temp.espera_erro($$select public.buy_print(current_setting('t.lim')::uuid, current_setting('t.pap')::uuid, current_setting('t.a4')::uuid)$$, 'aguardando pagamento', 'não duplica pedido em aberto');
select pg_temp.confere((select remaining = 1 from public.work_print_options('00000000-0000-0000-0000-00000000cc05')), 'vaga guardada some do "restam"');
reset role;
-- outro comprador (a artista real de 10_ faz papel de comprador) ocupa a última vaga
select pg_temp.como('00000000-0000-0000-0000-0000000000c1','artista.real@exemplo.com');
update public.kyc set cep = '50000000', street = 'Rua B', number = '2', district = 'Boa Vista' where user_id = '00000000-0000-0000-0000-0000000000c1';
set role authenticated;
select pg_temp.espera_erro($$select public.buy_print(current_setting('t.lim')::uuid, current_setting('t.pap')::uuid, current_setting('t.a4')::uuid)$$, 'demonstração', 'conta real não compra print de obra demo');
reset role;
update auth.users set email = 'artista.real@demo.ponci.art' where id = '00000000-0000-0000-0000-0000000000c1';
set role authenticated;
select set_config('t.r2', public.buy_print(current_setting('t.lim')::uuid, current_setting('t.pap')::uuid, current_setting('t.a4')::uuid), false);
reset role;
select pg_temp.como('00000000-0000-0000-0000-0000000000b1','colecionadora@demo.ponci.art');
set role authenticated;
select pg_temp.confere((select count(*) = 0 from public.work_print_options('00000000-0000-0000-0000-00000000cc05')), 'com as 2 vagas guardadas, some da vitrine');
select pg_temp.confere((select count(*) = 1 from public.print_orders), 'comprador só vê os próprios pedidos');
reset role;
-- vaga expirada volta
update public.print_orders set expires_at = now() - interval '1 minute' where ref = current_setting('t.r2');
select pg_temp.como('00000000-0000-0000-0000-0000000000b1','colecionadora@demo.ponci.art');
set role authenticated;
select pg_temp.confere((select remaining = 1 from public.work_print_options('00000000-0000-0000-0000-00000000cc05')), 'pedido vencido sem pagamento devolve a vaga');
reset role;

-- admin confirma pagamento: numeração automática
select pg_temp.como('00000000-0000-0000-0000-0000000000a1','artista@demo.ponci.art');
set role authenticated;
select pg_temp.espera_erro($$select public.admin_confirm_print_payment((select id from public.print_orders limit 1))$$, 'restrito', 'artista não confirma pagamento');
select pg_temp.confere((select count(*) = 1 and bool_and(ship_to is null and buyer_city = 'São Paulo/SP') from public.artist_print_orders() where ref = current_setting('t.r1')), 'antes do pagamento a artista vê só a cidade');
reset role;
select pg_temp.como('00000000-0000-0000-0000-0000000000f1','admin@ponci.art','aal2');
set role authenticated;
select pg_temp.confere(public.admin_confirm_print_payment((select id from public.print_orders where ref = current_setting('t.r1'))) = 1, 'pagamento confirmado: exemplar 1/2');
select pg_temp.confere(public.admin_confirm_print_payment((select id from public.print_orders where ref = current_setting('t.r2'))) = 2, 'pedido vencido ainda pode ser confirmado pelo admin: 2/2');
select pg_temp.espera_erro($$select public.admin_print_order_action((select id from public.print_orders where ref = current_setting('t.r1')), 'shipped', 'Correios', 'AB123BR')$$, 'artista', 'assinado: quem despacha é a artista');
select public.admin_print_order_action((select id from public.print_orders where ref = current_setting('t.r1')), 'supplier', null, null, 'WP-5521');
reset role;
select pg_temp.confere((select sold_count = 2 from public.print_offers where id = current_setting('t.lim')::uuid), 'tiragem contada');
select pg_temp.confere((select status = 'in_production' and sent_to_supplier_at is not null and supplier_ref = 'WP-5521' from public.print_orders where ref = current_setting('t.r1')), 'ordem enviada à gráfica registrada');
select pg_temp.como('00000000-0000-0000-0000-0000000000b1','colecionadora@demo.ponci.art');
set role authenticated;
select pg_temp.espera_erro($$select public.buy_print(current_setting('t.lim')::uuid, current_setting('t.pap')::uuid, current_setting('t.a4')::uuid)$$, 'esgotou', 'esgotada: nova compra recusada');
select pg_temp.espera_erro($$select public.cancel_print_order((select id from public.print_orders where ref = current_setting('t.r1')))$$, 'antes do pagamento', 'depois de pago, comprador não cancela sozinho');
select pg_temp.espera_erro($$select public.confirm_print_received((select id from public.print_orders where ref = current_setting('t.r1')))$$, 'despachado', 'não confirma recebimento antes do envio');
reset role;

-- artista assina e despacha
select pg_temp.como('00000000-0000-0000-0000-0000000000a1','artista@demo.ponci.art');
set role authenticated;
select pg_temp.confere((select ship_to->>'street' = 'Av. Paulista' and edition_no = 1 from public.artist_print_orders() where ref = current_setting('t.r1')), 'pago e assinado: artista recebe o endereço e o número');
select pg_temp.espera_erro($$select public.artist_ship_print((select id from public.artist_print_orders() where ref = current_setting('t.r1')), 'Pombo', 'X')$$, 'forma de envio', 'transportadora inválida');
select public.artist_ship_print((select id from public.artist_print_orders() where ref = current_setting('t.r1')), 'Correios', ' aa123456789br ');
select pg_temp.confere((select status = 'shipped' and ship_to is null from public.artist_print_orders() where ref = current_setting('t.r1')), 'despachado: endereço some da artista');
reset role;
select pg_temp.como('00000000-0000-0000-0000-0000000000b1','colecionadora@demo.ponci.art');
set role authenticated;
select pg_temp.confere((select tracking_code = 'AA123456789BR' from public.print_orders where ref = current_setting('t.r1')), 'comprador vê o rastreio');
select public.confirm_print_received((select id from public.print_orders where ref = current_setting('t.r1')));
select pg_temp.confere((select status = 'delivered' from public.print_orders where ref = current_setting('t.r1')), 'comprador confirma o recebimento');
reset role;
select pg_temp.como('00000000-0000-0000-0000-0000000000f1','admin@ponci.art','aal2');
set role authenticated;
select public.admin_print_order_action((select id from public.print_orders where ref = current_setting('t.r1')), 'payout', null, null, 'PIX 25/11');
select pg_temp.espera_erro($$select public.admin_print_order_action((select id from public.print_orders where ref = current_setting('t.r1')), 'payout')$$, 'uma vez', 'repasse uma vez só');
select pg_temp.espera_erro($$select public.admin_print_order_action((select id from public.print_orders where ref = current_setting('t.r2')), 'cancel', null, null, '')$$, 'motivo', 'cancelar exige motivo');
select public.admin_print_order_action((select id from public.print_orders where ref = current_setting('t.r2')), 'cancel', null, null, 'Arquivo com defeito');
reset role;
select pg_temp.confere((select payout_at is not null from public.print_orders where ref = current_setting('t.r1')), 'repasse registrado');
select pg_temp.confere((select sold_count = 2 from public.print_offers where id = current_setting('t.lim')::uuid), 'número de edição cancelado não é reaproveitado');

-- edição aberta: cancelar antes do pagamento e comprar de novo
select pg_temp.como('00000000-0000-0000-0000-0000000000b1','colecionadora@demo.ponci.art');
set role authenticated;
select set_config('t.r3', public.buy_print((select id from public.print_offers where work_id = '00000000-0000-0000-0000-00000000cc04'),
  (select product_id from public.work_print_options('00000000-0000-0000-0000-00000000cc04') limit 1), (select size_id from public.work_print_options('00000000-0000-0000-0000-00000000cc04') limit 1)), false);
select public.cancel_print_order((select id from public.print_orders where ref = current_setting('t.r3')));
select pg_temp.confere((select status = 'cancelled' from public.print_orders where ref = current_setting('t.r3')), 'comprador cancela antes de pagar');
reset role;
set role anon;
select pg_temp.espera_erro($$select public.buy_print(gen_random_uuid(), gen_random_uuid(), gen_random_uuid())$$, 'permission', 'visitante não compra');
reset role;
