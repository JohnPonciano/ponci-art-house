-- Prints sob demanda: conta do preço, catálogo, oferta, autorização e o que o comprador vê. Usa os membros de 10_.
-- Os valores em centavos abaixo são só de teste (o banco de produção nasce sem nenhum custo).
set session_replication_role = replica;
insert into public.works(id,slug,artist_id,title,year,cat,medium,h,w,price,status,description,reproduction) values
 ('00000000-0000-0000-0000-00000000cc01','print-ok','00000000-0000-0000-0000-0000000000a1','Obra para print',2026,'painting','Acrílica',100,80,9000,'published','{"D."}',false),
 ('00000000-0000-0000-0000-00000000cc02','print-review','00000000-0000-0000-0000-0000000000a1','Em curadoria',2026,'painting','Acrílica',100,80,9000,'review','{"D."}',false),
 ('00000000-0000-0000-0000-00000000cc03','print-repro','00000000-0000-0000-0000-0000000000a1','Já é reprodução',2026,'edition','Fine art',50,40,900,'published','{"D."}',true),
 ('00000000-0000-0000-0000-00000000cc04','print-vendida','00000000-0000-0000-0000-0000000000a1','Original vendido',2025,'painting','Óleo',60,50,7000,'sold','{"D."}',false);
set session_replication_role = origin;

-- ===== conta pura =====
select pg_temp.confere((select (j->>'final')::int = 19153 and (j->>'fixed')::int = 5300 and (j->>'payment_fee')::int = 958 and (j->>'tax')::int = 1149
    and (j->>'commission')::int = 5746 and (j->>'fixed')::int + (j->>'artist_fee')::int + (j->>'payment_fee')::int + (j->>'tax')::int + (j->>'commission')::int = (j->>'final')::int
  from (select public._print_price(row(gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),4000,500,800,0,1500,current_date,null,null,'',now(),null)::public.print_costs,
    false, 6000, row(1,15,30,5,6,'',now(),null)::public.commerce_settings) j) x), 'fórmula: (fixos + artista) / (1 − 41%), parcelas somam o preço');
select pg_temp.confere((select (j->>'signed_extra')::int = 1500 and (j->>'fixed')::int = 6800
  from (select public._print_price(row(gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),4000,500,800,0,1500,current_date,null,null,'',now(),null)::public.print_costs,
    true, 6000, row(1,15,30,5,6,'',now(),null)::public.commerce_settings) j) x), 'custo de assinatura só entra quando assinado');
select pg_temp.confere((select (j->>'commission')::int >= round((j->>'final')::int * 0.30) - 1
  from (select public._print_price(row(gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),3333,0,0,0,0,current_date,null,null,'',now(),null)::public.print_costs,
    false, 7777, row(1,15,30,5,6,'',now(),null)::public.commerce_settings) j) x), 'arredondamento fica com a comissão, sem perder centavo');
select pg_temp.espera_erro($$select public._print_price(row(gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),1,0,0,0,0,current_date,null,null,'',now(),null)::public.print_costs,
    false, 6000, row(1,15,null,5,6,'',now(),null)::public.commerce_settings)$$, 'regras de print', 'sem comissão de print definida, não calcula');

-- ===== catálogo: só admin =====
select pg_temp.como('00000000-0000-0000-0000-0000000000a1','artista@demo.ponci.art');
set role authenticated;
select pg_temp.espera_erro($$select public.admin_print_supplier_save(null,'Gráfica X','','','',true)$$, 'restrito', 'artista não cadastra fornecedor');
reset role;
select pg_temp.como('00000000-0000-0000-0000-0000000000f1','admin@ponci.art','aal2');
set role authenticated;
select set_config('t.sup', public.admin_print_supplier_save(null,'Gráfica Teste','São Paulo','contato','',true)::text, false);
select set_config('t.sup2', public.admin_print_supplier_save(null,'Gráfica Cara','Recife','','',true)::text, false);
select set_config('t.pap', public.admin_print_product_save(null,'Papel Teste 300g','algodão','fosco','',300,true)::text, false);
select set_config('t.a4', public.admin_print_size_save(null,'A4',21,29.7,true)::text, false);
select set_config('t.a2', public.admin_print_size_save(null,'A2',42,59.4,true)::text, false);
select set_config('t.c1', public.admin_print_cost_add(current_setting('t.sup')::uuid, current_setting('t.pap')::uuid, current_setting('t.a4')::uuid, 4000,500,800,0,1500,null,'')::text, false);
select public.admin_print_cost_add(current_setting('t.sup2')::uuid, current_setting('t.pap')::uuid, current_setting('t.a4')::uuid, 9000,500,800,0,1500,null,'');
select public.admin_print_cost_add(current_setting('t.sup')::uuid, current_setting('t.pap')::uuid, current_setting('t.a2')::uuid, 12000,500,1500,0,2500,null,'');
reset role;
select pg_temp.espera_erro($$update public.print_costs set print_cents = 1 where id = current_setting('t.c1')::uuid$$, 'não mudam', 'valor de custo não muda');
select pg_temp.espera_erro($$delete from public.print_costs where id = current_setting('t.c1')::uuid$$, 'não são apagados', 'custo não é apagado');
select pg_temp.confere((public._print_best_cost(current_setting('t.pap')::uuid, current_setting('t.a4')::uuid)).id = current_setting('t.c1')::uuid, 'usa o custo vigente mais barato');

-- ===== artista monta a oferta =====
select pg_temp.como('00000000-0000-0000-0000-0000000000a1','artista@demo.ponci.art');
set role authenticated;
select pg_temp.espera_erro(format($$select public.print_quote(%L,%L,false,6000)$$, current_setting('t.pap'), current_setting('t.a4')), 'regras de print', 'sem regra de print, artista não tem prévia');
reset role;
select pg_temp.como('00000000-0000-0000-0000-0000000000f1','admin@ponci.art','aal2');
set role authenticated;
select public.admin_set_commerce(12.5, 30, 5, 6, 'teste de prints');
reset role;
select pg_temp.como('00000000-0000-0000-0000-0000000000a1','artista@demo.ponci.art');
set role authenticated;
select pg_temp.confere((select (j->>'final')::int = 19153 and not (j ? 'supplier_id') and not (j ? 'cost_id')
  from (select public.print_quote(current_setting('t.pap')::uuid, current_setting('t.a4')::uuid, false, 6000) j) x), 'prévia do artista: preço e parcelas, sem revelar a gráfica');
select pg_temp.confere(not exists(select 1 from public.print_costs), 'artista não lê a tabela de custos');
select pg_temp.espera_erro(format($$select public.save_print_offer('00000000-0000-0000-0000-00000000cc02','open',null,false,false,'[{"product":"%s","size":"%s","fee_cents":6000}]',null,null,null)$$, current_setting('t.pap'), current_setting('t.a4')),
  'aprovada pela curadoria', 'obra em curadoria não tem print');
select pg_temp.espera_erro(format($$select public.save_print_offer('00000000-0000-0000-0000-00000000cc03','open',null,false,false,'[{"product":"%s","size":"%s","fee_cents":6000}]',null,null,null)$$, current_setting('t.pap'), current_setting('t.a4')),
  'REPROD', 'peça REPROD não vira print');
select pg_temp.espera_erro(format($$select public.save_print_offer('00000000-0000-0000-0000-00000000cc01','open',null,false,true,'[{"product":"%s","size":"%s","fee_cents":6000}]',null,null,null)$$, current_setting('t.pap'), current_setting('t.a4')),
  'Só edição limitada', 'edição aberta não é numerada');
select pg_temp.espera_erro(format($$select public.save_print_offer('00000000-0000-0000-0000-00000000cc01','limited',null,true,true,'[{"product":"%s","size":"%s","fee_cents":6000}]',null,null,null)$$, current_setting('t.pap'), current_setting('t.a4')),
  'tiragem máxima', 'edição limitada exige tiragem');
select pg_temp.espera_erro(format($$select public.save_print_offer('00000000-0000-0000-0000-00000000cc01','open',null,false,false,'[{"product":"%s","size":"%s","fee_cents":6000}]','outra-pessoa/x.tif',5000,7000)$$, current_setting('t.pap'), current_setting('t.a4')),
  'Arquivo inválido', 'arquivo-mestre fora da pasta da artista');
-- A2 a 300 dpi pede 7016 × 4961 px; arquivo de 6000 × 4500 serve para A4, não para A2
select set_config('t.of', public.save_print_offer('00000000-0000-0000-0000-00000000cc01','limited',30,true,true,
  format('[{"product":"%s","size":"%s","fee_cents":6000},{"product":"%s","size":"%s","fee_cents":15000}]', current_setting('t.pap'), current_setting('t.a4'), current_setting('t.pap'), current_setting('t.a2'))::jsonb,
  '00000000-0000-0000-0000-0000000000a1/mestre.tif', 4500, 6000)::text, false);
select pg_temp.confere((select status = 'draft' from public.print_offers where id = current_setting('t.of')::uuid), 'oferta nasce rascunho');
select pg_temp.espera_erro($$select public.print_authorization_preview(current_setting('t.of')::uuid)$$, 'pequeno para A2', 'resolução insuficiente para o A2 é barrada');
select public.save_print_offer('00000000-0000-0000-0000-00000000cc01','limited',30,true,true,
  format('[{"product":"%s","size":"%s","fee_cents":6000},{"product":"%s","size":"%s","fee_cents":15000}]', current_setting('t.pap'), current_setting('t.a4'), current_setting('t.pap'), current_setting('t.a2'))::jsonb,
  '00000000-0000-0000-0000-0000000000a1/mestre2.tif', 7100, 5000);
select set_config('t.sha', public.print_authorization_preview(current_setting('t.of')::uuid)->>'sha256', false);
select pg_temp.confere((select b like '%Autorização de reprodução%' and b like '%tiragem máxima de 30%' and b like '%assinado e numerado%' and b like '%R$ 60,00 por exemplar%' and b like '%não transfere direitos autorais%'
  from (select public.print_authorization_preview(current_setting('t.of')::uuid)->>'body' b) x), 'texto da autorização traz as condições e valores');
select pg_temp.espera_erro($$select public.publish_print_offer(current_setting('t.of')::uuid, 'hash-errado')$$, 'condições mudaram', 'publicar exige aceitar exatamente o texto mostrado');
select public.publish_print_offer(current_setting('t.of')::uuid, current_setting('t.sha'), '127.0.0.1', 'teste');
select pg_temp.confere((select status = 'active' and authorization_id is not null from public.print_offers where id = current_setting('t.of')::uuid), 'publicada com autorização');
select pg_temp.confere((select count(*) = 2 and bool_and(price_cents is not null and breakdown is not null) from public.print_offer_sizes where offer_id = current_setting('t.of')::uuid), 'preço e detalhamento congelados');
select pg_temp.confere((select price_cents = 21695 from public.print_offer_sizes where offer_id = current_setting('t.of')::uuid and size_id = current_setting('t.a4')::uuid),
  'A4 assinado: (5300 + 1500 + 6000) / 0,59 = R$ 216,95');
reset role;
select pg_temp.espera_erro($$update public.print_authorizations set body = 'x'$$, 'imut', 'autorização não pode ser alterada (nem pelo dono do banco)');

-- ===== comprador =====
select pg_temp.como('00000000-0000-0000-0000-0000000000b1','colecionadora@demo.ponci.art');
set role authenticated;
select pg_temp.confere((select count(*) = 2 and bool_and(remaining = 30 and signed and numbered) from public.work_print_options('00000000-0000-0000-0000-00000000cc01')), 'colecionadora vê os 2 tamanhos, edição e tiragem');
select pg_temp.confere((select count(*) = 0 from public.print_offer_sizes), 'colecionadora não vê custos nem remuneração');
select pg_temp.confere((select count(*) = 0 from public.print_authorizations), 'colecionadora não vê a autorização');
select pg_temp.espera_erro($$select public.print_quote(current_setting('t.pap')::uuid, current_setting('t.a4')::uuid, false, 6000)$$, 'restrito', 'colecionadora não usa a prévia de preço');
reset role;
set role anon;
select pg_temp.espera_erro($$select * from public.work_print_options('00000000-0000-0000-0000-00000000cc01')$$, 'permission', 'visitante não vê prints');
reset role;

-- custo novo não muda o preço publicado
select pg_temp.como('00000000-0000-0000-0000-0000000000f1','admin@ponci.art','aal2');
set role authenticated;
select public.admin_print_cost_add(current_setting('t.sup')::uuid, current_setting('t.pap')::uuid, current_setting('t.a4')::uuid, 8000,500,800,0,1500,null,'reajuste');
reset role;
select pg_temp.confere((select ended_at is not null from public.print_costs where id = current_setting('t.c1')::uuid), 'custo novo encerra o anterior');
select pg_temp.confere((select price_cents = 21695 from public.print_offer_sizes where offer_id = current_setting('t.of')::uuid and size_id = current_setting('t.a4')::uuid), 'preço publicado não muda com reajuste');

-- mudar condição volta a rascunho e some da vitrine; publicar de novo pede nova autorização
select pg_temp.como('00000000-0000-0000-0000-0000000000a1','artista@demo.ponci.art');
set role authenticated;
select public.save_print_offer('00000000-0000-0000-0000-00000000cc01','limited',30,true,true,
  format('[{"product":"%s","size":"%s","fee_cents":7000}]', current_setting('t.pap'), current_setting('t.a4'))::jsonb, null, null, null);
select pg_temp.confere((select status = 'draft' and authorization_id is null and master_w = 7100 from public.print_offers where id = current_setting('t.of')::uuid), 'mudança volta a rascunho e mantém o arquivo');
reset role;
select pg_temp.como('00000000-0000-0000-0000-0000000000b1','colecionadora@demo.ponci.art');
set role authenticated;
select pg_temp.confere((select count(*) = 0 from public.work_print_options('00000000-0000-0000-0000-00000000cc01')), 'rascunho não aparece para quem compra');
reset role;
select pg_temp.como('00000000-0000-0000-0000-0000000000a1','artista@demo.ponci.art');
set role authenticated;
select public.publish_print_offer(current_setting('t.of')::uuid, public.print_authorization_preview(current_setting('t.of')::uuid)->>'sha256');
select pg_temp.confere((select count(*) = 2 from public.print_authorizations where offer_id = current_setting('t.of')::uuid), 'cada publicação guarda sua autorização');
select pg_temp.confere((select price_cents > 21695 from public.print_offer_sizes where offer_id = current_setting('t.of')::uuid), 'republicar usa o custo e a remuneração novos');
reset role;

-- ===== pausa do admin =====
select pg_temp.como('00000000-0000-0000-0000-0000000000f1','admin@ponci.art','aal2');
set role authenticated;
select pg_temp.espera_erro($$select public.admin_pause_print_offer(current_setting('t.of')::uuid, '')$$, 'motivo', 'pausa do admin exige motivo');
select public.admin_pause_print_offer(current_setting('t.of')::uuid, 'Arquivo com marca d''água');
reset role;
select pg_temp.como('00000000-0000-0000-0000-0000000000a1','artista@demo.ponci.art');
set role authenticated;
select pg_temp.espera_erro($$select public.publish_print_offer(current_setting('t.of')::uuid, public.print_authorization_preview(current_setting('t.of')::uuid)->>'sha256')$$, 'pausou', 'artista não republica o que a PONCI pausou');
reset role;
select pg_temp.como('00000000-0000-0000-0000-0000000000f1','admin@ponci.art','aal2');
set role authenticated;
select public.admin_release_print_offer(current_setting('t.of')::uuid);
reset role;
select pg_temp.como('00000000-0000-0000-0000-0000000000a1','artista@demo.ponci.art');
set role authenticated;
select public.publish_print_offer(current_setting('t.of')::uuid, public.print_authorization_preview(current_setting('t.of')::uuid)->>'sha256');
select pg_temp.confere((select status = 'active' from public.print_offers where id = current_setting('t.of')::uuid), 'liberada pela PONCI, artista publica de novo');
select public.pause_print_offer(current_setting('t.of')::uuid);
select pg_temp.confere((select status = 'paused' and paused_reason is null from public.print_offers where id = current_setting('t.of')::uuid), 'artista pausa a qualquer momento');

-- ===== original vendido continua rendendo prints =====
select public.save_print_offer('00000000-0000-0000-0000-00000000cc04','open',null,false,false,
  format('[{"product":"%s","size":"%s","fee_cents":5000}]', current_setting('t.pap'), current_setting('t.a4'))::jsonb, '00000000-0000-0000-0000-0000000000a1/vendida.tif', 4000, 5000);
select public.publish_print_offer((select id from public.print_offers where work_id = '00000000-0000-0000-0000-00000000cc04'),
  public.print_authorization_preview((select id from public.print_offers where work_id = '00000000-0000-0000-0000-00000000cc04'))->>'sha256');
reset role;
select pg_temp.como('00000000-0000-0000-0000-0000000000b1','colecionadora@demo.ponci.art');
set role authenticated;
select pg_temp.confere((select count(*) = 1 and bool_and(edition = 'open' and remaining is null) from public.work_print_options('00000000-0000-0000-0000-00000000cc04')), 'original vendido segue com print à venda');
reset role;

-- edição com venda: condições travadas
update public.print_offers set sold_count = 3 where id = current_setting('t.of')::uuid;
select pg_temp.como('00000000-0000-0000-0000-0000000000a1','artista@demo.ponci.art');
set role authenticated;
select pg_temp.espera_erro(format($$select public.save_print_offer('00000000-0000-0000-0000-00000000cc01','limited',50,true,true,'[{"product":"%s","size":"%s","fee_cents":7000}]',null,null,null)$$, current_setting('t.pap'), current_setting('t.a4')),
  'tiragem da edição limitada não muda', 'depois de vender, não aumenta a tiragem');
select pg_temp.espera_erro(format($$select public.save_print_offer('00000000-0000-0000-0000-00000000cc01','open',null,false,false,'[{"product":"%s","size":"%s","fee_cents":7000}]',null,null,null)$$, current_setting('t.pap'), current_setting('t.a4')),
  'não mudam', 'depois de vender, edição limitada não vira aberta');
reset role;
select pg_temp.espera_erro($$update public.print_offers set sold_count = 31 where id = current_setting('t.of')::uuid$$, 'print_offers_sold_ck', 'nunca vende além da tiragem');
