-- Regras comerciais versionadas e comissão gravada em cada venda. Usa os membros criados em 10_.
select pg_temp.confere((select original_commission_pct = 15 and print_commission_pct is null and payment_fee_pct is null and tax_pct is null from public.commerce_current()),
  'regra inicial: 15% no original e o resto vazio (sem valores inventados)');
select pg_temp.confere((select bool_and(commission_pct = 15) from public.orders), 'vendas antigas ficam com 15%');
select pg_temp.confere(public._pct(15) = '15' and public._pct(12.5) = '12,5' and public._pct(7.25) = '7,25', 'percentual escrito à brasileira');

-- permissões
select pg_temp.como('00000000-0000-0000-0000-0000000000a1','artista@demo.ponci.art');
set role authenticated;
select pg_temp.confere((select original_commission_pct = 15 from public.commerce_current()), 'membro lê a regra vigente');
select pg_temp.espera_erro($$select public.admin_set_commerce(10, 20, 4, 6, 'x')$$, 'restrito', 'artista não muda a regra');
select pg_temp.espera_erro($$insert into public.commerce_settings(original_commission_pct) values (1)$$, 'policy', 'artista não grava direto na tabela');
reset role;
set role anon;
select pg_temp.confere(public.original_commission_pct() = 15, 'visitante vê só a comissão do original');
select pg_temp.espera_erro($$select public.commerce_current()$$, 'permission', 'visitante não lê a regra completa');
reset role;
select pg_temp.como('00000000-0000-0000-0000-0000000000f1','admin@ponci.art','aal1');
set role authenticated;
select pg_temp.espera_erro($$select public.admin_set_commerce(10, 20, 4, 6, 'x')$$, 'restrito', 'admin sem 2FA não muda a regra');
reset role;

-- admin publica nova versão
select pg_temp.como('00000000-0000-0000-0000-0000000000f1','admin@ponci.art','aal2');
set role authenticated;
select pg_temp.espera_erro($$select public.admin_set_commerce(null, 20, 4, 6, 'x')$$, 'comissão do original', 'comissão do original é obrigatória');
select pg_temp.espera_erro($$select public.admin_set_commerce(15, 60, 20, 10, 'x')$$, '90%', 'soma de percentuais absurda é recusada');
select pg_temp.espera_erro($$select public.admin_set_commerce(15, 61, 0, 0, 'x')$$, 'check', 'comissão de print acima do limite');
select public.admin_set_commerce(12.5, null, null, null, 'Teste de nova comissão');
reset role;
select pg_temp.confere((select original_commission_pct = 12.5 and created_by = 'admin@ponci.art' from public.commerce_current()), 'nova versão vira a vigente, com autor');
select pg_temp.confere((select count(*) = 2 from public.commerce_settings), 'versão anterior fica no histórico');
select pg_temp.espera_erro($$update public.commerce_settings set original_commission_pct = 1$$, 'imut', 'histórico não pode ser alterado');
select pg_temp.espera_erro($$delete from public.commerce_settings$$, 'imut', 'histórico não pode ser apagado');
select pg_temp.confere(exists(select 1 from public.audit_log where table_name = 'commerce_settings'), 'mudança fica na auditoria');

-- venda nova leva a comissão nova; contrato mostra o valor certo
set session_replication_role = replica;
insert into public.works(id,slug,artist_id,title,year,cat,medium,h,w,price,status,description) values
 ('00000000-0000-0000-0000-00000000aa20','regra-nova','00000000-0000-0000-0000-0000000000a1','Obra da regra nova',2026,'painting','Óleo',50,40,10000,'published','{"Descrição."}');
set session_replication_role = origin;
select pg_temp.como('00000000-0000-0000-0000-0000000000b1','colecionadora@demo.ponci.art');
set role authenticated;
select public.reserve_work('00000000-0000-0000-0000-00000000aa20');
reset role;
select pg_temp.confere((select commission_pct = 12.5 from public.orders where work_id = '00000000-0000-0000-0000-00000000aa20'), 'venda nova grava 12,5%');
select pg_temp.confere((select body like '%Comissão de intermediação de 12,5%%' and body like '%R$ 1.250%' and body like '%R$ 8.750%'
  from public.contracts c join public.orders o on o.id = c.order_id where o.work_id = '00000000-0000-0000-0000-00000000aa20'), 'contrato novo: 12,5% = R$ 1.250, líquido R$ 8.750');
select pg_temp.confere((select bool_and(body like '%Comissão de intermediação de 15%%') from public.contracts c join public.orders o on o.id = c.order_id where o.work_id <> '00000000-0000-0000-0000-00000000aa20'),
  'contratos antigos continuam dizendo 15%');
