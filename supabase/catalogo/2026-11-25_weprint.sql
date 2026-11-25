-- Catálogo inicial de prints com a WePrint! Fine Art (Itu-SP).
-- Custos = preço público da calculadora da WePrint em 25/11/2026 (área × preço por m²), embalagem em tubo sem custo.
-- Frete NÃO incluso (shipping_cents = 0): é cobrado à parte. Extra de assinatura (envio gráfica → artista) = 0 até a WePrint informar.
-- Resolução mínima: 300 dpi, a recomendação usual para fine art; CONFIRME com a WePrint e ajuste em Admin → Prints se for outra.
-- Pode rodar de novo sem duplicar.

do $$
declare sup uuid; pid uuid; sid uuid;
begin
  select id into sup from public.print_suppliers where name = 'WePrint! Fine Art';
  if sup is null then
    insert into public.print_suppliers(name, city, contact, notes) values ('WePrint! Fine Art', 'Itu-SP', 'weprint.com.br · WhatsApp (11) 4025-2904',
      'Estúdio certificado Canson. Custos iniciais = preço público da calculadora (25/11/2026); trocar pela tabela de parceiro quando vier.') returning id into sup;
  end if;
  select id into pid from public.print_products where name = 'Photo Matte 200';
  if pid is null then insert into public.print_products(name, paper, finish, description, min_dpi) values ('Photo Matte 200', 'Photo Matte 200 g/m²', 'Fosco', '', 300) returning id into pid; end if;
  select id into sid from public.print_sizes where w_cm = 21 and h_cm = 29.7;
  if sid is null then insert into public.print_sizes(label, w_cm, h_cm) values ('A4', 21, 29.7) returning id into sid; end if;
  if not exists(select 1 from public.print_costs where supplier_id = sup and product_id = pid and size_id = sid and ended_at is null) then
    insert into public.print_costs(supplier_id, product_id, size_id, print_cents, prep_cents, packaging_cents, shipping_cents, signed_extra_cents, note, created_by)
    values (sup, pid, sid, 2079, 0, 0, 0, 0, 'Calculadora pública WePrint 25/11/2026: R$ 333.19/m²', 'catálogo inicial');
  end if;
  select id into sid from public.print_sizes where w_cm = 20 and h_cm = 30;
  if sid is null then insert into public.print_sizes(label, w_cm, h_cm) values ('20 × 30', 20, 30) returning id into sid; end if;
  if not exists(select 1 from public.print_costs where supplier_id = sup and product_id = pid and size_id = sid and ended_at is null) then
    insert into public.print_costs(supplier_id, product_id, size_id, print_cents, prep_cents, packaging_cents, shipping_cents, signed_extra_cents, note, created_by)
    values (sup, pid, sid, 2000, 0, 0, 0, 0, 'Calculadora pública WePrint 25/11/2026: R$ 333.19/m²', 'catálogo inicial');
  end if;
  select id into sid from public.print_sizes where w_cm = 29.7 and h_cm = 42;
  if sid is null then insert into public.print_sizes(label, w_cm, h_cm) values ('A3', 29.7, 42) returning id into sid; end if;
  if not exists(select 1 from public.print_costs where supplier_id = sup and product_id = pid and size_id = sid and ended_at is null) then
    insert into public.print_costs(supplier_id, product_id, size_id, print_cents, prep_cents, packaging_cents, shipping_cents, signed_extra_cents, note, created_by)
    values (sup, pid, sid, 4157, 0, 0, 0, 0, 'Calculadora pública WePrint 25/11/2026: R$ 333.19/m²', 'catálogo inicial');
  end if;
  select id into sid from public.print_sizes where w_cm = 30 and h_cm = 40;
  if sid is null then insert into public.print_sizes(label, w_cm, h_cm) values ('30 × 40', 30, 40) returning id into sid; end if;
  if not exists(select 1 from public.print_costs where supplier_id = sup and product_id = pid and size_id = sid and ended_at is null) then
    insert into public.print_costs(supplier_id, product_id, size_id, print_cents, prep_cents, packaging_cents, shipping_cents, signed_extra_cents, note, created_by)
    values (sup, pid, sid, 3999, 0, 0, 0, 0, 'Calculadora pública WePrint 25/11/2026: R$ 333.19/m²', 'catálogo inicial');
  end if;
  select id into sid from public.print_sizes where w_cm = 30 and h_cm = 45;
  if sid is null then insert into public.print_sizes(label, w_cm, h_cm) values ('30 × 45', 30, 45) returning id into sid; end if;
  if not exists(select 1 from public.print_costs where supplier_id = sup and product_id = pid and size_id = sid and ended_at is null) then
    insert into public.print_costs(supplier_id, product_id, size_id, print_cents, prep_cents, packaging_cents, shipping_cents, signed_extra_cents, note, created_by)
    values (sup, pid, sid, 4499, 0, 0, 0, 0, 'Calculadora pública WePrint 25/11/2026: R$ 333.19/m²', 'catálogo inicial');
  end if;
  select id into sid from public.print_sizes where w_cm = 40 and h_cm = 50;
  if sid is null then insert into public.print_sizes(label, w_cm, h_cm) values ('40 × 50', 40, 50) returning id into sid; end if;
  if not exists(select 1 from public.print_costs where supplier_id = sup and product_id = pid and size_id = sid and ended_at is null) then
    insert into public.print_costs(supplier_id, product_id, size_id, print_cents, prep_cents, packaging_cents, shipping_cents, signed_extra_cents, note, created_by)
    values (sup, pid, sid, 6664, 0, 0, 0, 0, 'Calculadora pública WePrint 25/11/2026: R$ 333.19/m²', 'catálogo inicial');
  end if;
  select id into sid from public.print_sizes where w_cm = 42 and h_cm = 59.4;
  if sid is null then insert into public.print_sizes(label, w_cm, h_cm) values ('A2', 42, 59.4) returning id into sid; end if;
  if not exists(select 1 from public.print_costs where supplier_id = sup and product_id = pid and size_id = sid and ended_at is null) then
    insert into public.print_costs(supplier_id, product_id, size_id, print_cents, prep_cents, packaging_cents, shipping_cents, signed_extra_cents, note, created_by)
    values (sup, pid, sid, 8313, 0, 0, 0, 0, 'Calculadora pública WePrint 25/11/2026: R$ 333.19/m²', 'catálogo inicial');
  end if;
  select id into sid from public.print_sizes where w_cm = 40 and h_cm = 60;
  if sid is null then insert into public.print_sizes(label, w_cm, h_cm) values ('40 × 60', 40, 60) returning id into sid; end if;
  if not exists(select 1 from public.print_costs where supplier_id = sup and product_id = pid and size_id = sid and ended_at is null) then
    insert into public.print_costs(supplier_id, product_id, size_id, print_cents, prep_cents, packaging_cents, shipping_cents, signed_extra_cents, note, created_by)
    values (sup, pid, sid, 7997, 0, 0, 0, 0, 'Calculadora pública WePrint 25/11/2026: R$ 333.19/m²', 'catálogo inicial');
  end if;
  select id into sid from public.print_sizes where w_cm = 50 and h_cm = 70;
  if sid is null then insert into public.print_sizes(label, w_cm, h_cm) values ('50 × 70', 50, 70) returning id into sid; end if;
  if not exists(select 1 from public.print_costs where supplier_id = sup and product_id = pid and size_id = sid and ended_at is null) then
    insert into public.print_costs(supplier_id, product_id, size_id, print_cents, prep_cents, packaging_cents, shipping_cents, signed_extra_cents, note, created_by)
    values (sup, pid, sid, 11662, 0, 0, 0, 0, 'Calculadora pública WePrint 25/11/2026: R$ 333.19/m²', 'catálogo inicial');
  end if;
  select id into sid from public.print_sizes where w_cm = 59.4 and h_cm = 84.1;
  if sid is null then insert into public.print_sizes(label, w_cm, h_cm) values ('A1', 59.4, 84.1) returning id into sid; end if;
  if not exists(select 1 from public.print_costs where supplier_id = sup and product_id = pid and size_id = sid and ended_at is null) then
    insert into public.print_costs(supplier_id, product_id, size_id, print_cents, prep_cents, packaging_cents, shipping_cents, signed_extra_cents, note, created_by)
    values (sup, pid, sid, 16645, 0, 0, 0, 0, 'Calculadora pública WePrint 25/11/2026: R$ 333.19/m²', 'catálogo inicial');
  end if;
  select id into sid from public.print_sizes where w_cm = 60 and h_cm = 90;
  if sid is null then insert into public.print_sizes(label, w_cm, h_cm) values ('60 × 90', 60, 90) returning id into sid; end if;
  if not exists(select 1 from public.print_costs where supplier_id = sup and product_id = pid and size_id = sid and ended_at is null) then
    insert into public.print_costs(supplier_id, product_id, size_id, print_cents, prep_cents, packaging_cents, shipping_cents, signed_extra_cents, note, created_by)
    values (sup, pid, sid, 17993, 0, 0, 0, 0, 'Calculadora pública WePrint 25/11/2026: R$ 333.19/m²', 'catálogo inicial');
  end if;
  select id into sid from public.print_sizes where w_cm = 70 and h_cm = 100;
  if sid is null then insert into public.print_sizes(label, w_cm, h_cm) values ('70 × 100', 70, 100) returning id into sid; end if;
  if not exists(select 1 from public.print_costs where supplier_id = sup and product_id = pid and size_id = sid and ended_at is null) then
    insert into public.print_costs(supplier_id, product_id, size_id, print_cents, prep_cents, packaging_cents, shipping_cents, signed_extra_cents, note, created_by)
    values (sup, pid, sid, 23324, 0, 0, 0, 0, 'Calculadora pública WePrint 25/11/2026: R$ 333.19/m²', 'catálogo inicial');
  end if;
  select id into pid from public.print_products where name = 'Photo Lustre Premium 310';
  if pid is null then insert into public.print_products(name, paper, finish, description, min_dpi) values ('Photo Lustre Premium 310', 'Photo Lustre Premium 310 g/m²', 'Semibrilho', '', 300) returning id into pid; end if;
  select id into sid from public.print_sizes where w_cm = 21 and h_cm = 29.7;
  if sid is null then insert into public.print_sizes(label, w_cm, h_cm) values ('A4', 21, 29.7) returning id into sid; end if;
  if not exists(select 1 from public.print_costs where supplier_id = sup and product_id = pid and size_id = sid and ended_at is null) then
    insert into public.print_costs(supplier_id, product_id, size_id, print_cents, prep_cents, packaging_cents, shipping_cents, signed_extra_cents, note, created_by)
    values (sup, pid, sid, 3325, 0, 0, 0, 0, 'Calculadora pública WePrint 25/11/2026: R$ 533.00/m²', 'catálogo inicial');
  end if;
  select id into sid from public.print_sizes where w_cm = 20 and h_cm = 30;
  if sid is null then insert into public.print_sizes(label, w_cm, h_cm) values ('20 × 30', 20, 30) returning id into sid; end if;
  if not exists(select 1 from public.print_costs where supplier_id = sup and product_id = pid and size_id = sid and ended_at is null) then
    insert into public.print_costs(supplier_id, product_id, size_id, print_cents, prep_cents, packaging_cents, shipping_cents, signed_extra_cents, note, created_by)
    values (sup, pid, sid, 3198, 0, 0, 0, 0, 'Calculadora pública WePrint 25/11/2026: R$ 533.00/m²', 'catálogo inicial');
  end if;
  select id into sid from public.print_sizes where w_cm = 29.7 and h_cm = 42;
  if sid is null then insert into public.print_sizes(label, w_cm, h_cm) values ('A3', 29.7, 42) returning id into sid; end if;
  if not exists(select 1 from public.print_costs where supplier_id = sup and product_id = pid and size_id = sid and ended_at is null) then
    insert into public.print_costs(supplier_id, product_id, size_id, print_cents, prep_cents, packaging_cents, shipping_cents, signed_extra_cents, note, created_by)
    values (sup, pid, sid, 6649, 0, 0, 0, 0, 'Calculadora pública WePrint 25/11/2026: R$ 533.00/m²', 'catálogo inicial');
  end if;
  select id into sid from public.print_sizes where w_cm = 30 and h_cm = 40;
  if sid is null then insert into public.print_sizes(label, w_cm, h_cm) values ('30 × 40', 30, 40) returning id into sid; end if;
  if not exists(select 1 from public.print_costs where supplier_id = sup and product_id = pid and size_id = sid and ended_at is null) then
    insert into public.print_costs(supplier_id, product_id, size_id, print_cents, prep_cents, packaging_cents, shipping_cents, signed_extra_cents, note, created_by)
    values (sup, pid, sid, 6396, 0, 0, 0, 0, 'Calculadora pública WePrint 25/11/2026: R$ 533.00/m²', 'catálogo inicial');
  end if;
  select id into sid from public.print_sizes where w_cm = 30 and h_cm = 45;
  if sid is null then insert into public.print_sizes(label, w_cm, h_cm) values ('30 × 45', 30, 45) returning id into sid; end if;
  if not exists(select 1 from public.print_costs where supplier_id = sup and product_id = pid and size_id = sid and ended_at is null) then
    insert into public.print_costs(supplier_id, product_id, size_id, print_cents, prep_cents, packaging_cents, shipping_cents, signed_extra_cents, note, created_by)
    values (sup, pid, sid, 7196, 0, 0, 0, 0, 'Calculadora pública WePrint 25/11/2026: R$ 533.00/m²', 'catálogo inicial');
  end if;
  select id into sid from public.print_sizes where w_cm = 40 and h_cm = 50;
  if sid is null then insert into public.print_sizes(label, w_cm, h_cm) values ('40 × 50', 40, 50) returning id into sid; end if;
  if not exists(select 1 from public.print_costs where supplier_id = sup and product_id = pid and size_id = sid and ended_at is null) then
    insert into public.print_costs(supplier_id, product_id, size_id, print_cents, prep_cents, packaging_cents, shipping_cents, signed_extra_cents, note, created_by)
    values (sup, pid, sid, 10660, 0, 0, 0, 0, 'Calculadora pública WePrint 25/11/2026: R$ 533.00/m²', 'catálogo inicial');
  end if;
  select id into sid from public.print_sizes where w_cm = 42 and h_cm = 59.4;
  if sid is null then insert into public.print_sizes(label, w_cm, h_cm) values ('A2', 42, 59.4) returning id into sid; end if;
  if not exists(select 1 from public.print_costs where supplier_id = sup and product_id = pid and size_id = sid and ended_at is null) then
    insert into public.print_costs(supplier_id, product_id, size_id, print_cents, prep_cents, packaging_cents, shipping_cents, signed_extra_cents, note, created_by)
    values (sup, pid, sid, 13298, 0, 0, 0, 0, 'Calculadora pública WePrint 25/11/2026: R$ 533.00/m²', 'catálogo inicial');
  end if;
  select id into sid from public.print_sizes where w_cm = 40 and h_cm = 60;
  if sid is null then insert into public.print_sizes(label, w_cm, h_cm) values ('40 × 60', 40, 60) returning id into sid; end if;
  if not exists(select 1 from public.print_costs where supplier_id = sup and product_id = pid and size_id = sid and ended_at is null) then
    insert into public.print_costs(supplier_id, product_id, size_id, print_cents, prep_cents, packaging_cents, shipping_cents, signed_extra_cents, note, created_by)
    values (sup, pid, sid, 12792, 0, 0, 0, 0, 'Calculadora pública WePrint 25/11/2026: R$ 533.00/m²', 'catálogo inicial');
  end if;
  select id into sid from public.print_sizes where w_cm = 50 and h_cm = 70;
  if sid is null then insert into public.print_sizes(label, w_cm, h_cm) values ('50 × 70', 50, 70) returning id into sid; end if;
  if not exists(select 1 from public.print_costs where supplier_id = sup and product_id = pid and size_id = sid and ended_at is null) then
    insert into public.print_costs(supplier_id, product_id, size_id, print_cents, prep_cents, packaging_cents, shipping_cents, signed_extra_cents, note, created_by)
    values (sup, pid, sid, 18655, 0, 0, 0, 0, 'Calculadora pública WePrint 25/11/2026: R$ 533.00/m²', 'catálogo inicial');
  end if;
  select id into sid from public.print_sizes where w_cm = 59.4 and h_cm = 84.1;
  if sid is null then insert into public.print_sizes(label, w_cm, h_cm) values ('A1', 59.4, 84.1) returning id into sid; end if;
  if not exists(select 1 from public.print_costs where supplier_id = sup and product_id = pid and size_id = sid and ended_at is null) then
    insert into public.print_costs(supplier_id, product_id, size_id, print_cents, prep_cents, packaging_cents, shipping_cents, signed_extra_cents, note, created_by)
    values (sup, pid, sid, 26627, 0, 0, 0, 0, 'Calculadora pública WePrint 25/11/2026: R$ 533.00/m²', 'catálogo inicial');
  end if;
  select id into sid from public.print_sizes where w_cm = 60 and h_cm = 90;
  if sid is null then insert into public.print_sizes(label, w_cm, h_cm) values ('60 × 90', 60, 90) returning id into sid; end if;
  if not exists(select 1 from public.print_costs where supplier_id = sup and product_id = pid and size_id = sid and ended_at is null) then
    insert into public.print_costs(supplier_id, product_id, size_id, print_cents, prep_cents, packaging_cents, shipping_cents, signed_extra_cents, note, created_by)
    values (sup, pid, sid, 28782, 0, 0, 0, 0, 'Calculadora pública WePrint 25/11/2026: R$ 533.00/m²', 'catálogo inicial');
  end if;
  select id into sid from public.print_sizes where w_cm = 70 and h_cm = 100;
  if sid is null then insert into public.print_sizes(label, w_cm, h_cm) values ('70 × 100', 70, 100) returning id into sid; end if;
  if not exists(select 1 from public.print_costs where supplier_id = sup and product_id = pid and size_id = sid and ended_at is null) then
    insert into public.print_costs(supplier_id, product_id, size_id, print_cents, prep_cents, packaging_cents, shipping_cents, signed_extra_cents, note, created_by)
    values (sup, pid, sid, 37310, 0, 0, 0, 0, 'Calculadora pública WePrint 25/11/2026: R$ 533.00/m²', 'catálogo inicial');
  end if;
  select id into pid from public.print_products where name = 'Somerset Enhanced Velvet 330';
  if pid is null then insert into public.print_products(name, paper, finish, description, min_dpi) values ('Somerset Enhanced Velvet 330', 'Somerset Enhanced Velvet 330 g/m², algodão', 'Fosco com textura', '', 300) returning id into pid; end if;
  select id into sid from public.print_sizes where w_cm = 21 and h_cm = 29.7;
  if sid is null then insert into public.print_sizes(label, w_cm, h_cm) values ('A4', 21, 29.7) returning id into sid; end if;
  if not exists(select 1 from public.print_costs where supplier_id = sup and product_id = pid and size_id = sid and ended_at is null) then
    insert into public.print_costs(supplier_id, product_id, size_id, print_cents, prep_cents, packaging_cents, shipping_cents, signed_extra_cents, note, created_by)
    values (sup, pid, sid, 4663, 0, 0, 0, 0, 'Calculadora pública WePrint 25/11/2026: R$ 747.50/m²', 'catálogo inicial');
  end if;
  select id into sid from public.print_sizes where w_cm = 20 and h_cm = 30;
  if sid is null then insert into public.print_sizes(label, w_cm, h_cm) values ('20 × 30', 20, 30) returning id into sid; end if;
  if not exists(select 1 from public.print_costs where supplier_id = sup and product_id = pid and size_id = sid and ended_at is null) then
    insert into public.print_costs(supplier_id, product_id, size_id, print_cents, prep_cents, packaging_cents, shipping_cents, signed_extra_cents, note, created_by)
    values (sup, pid, sid, 4485, 0, 0, 0, 0, 'Calculadora pública WePrint 25/11/2026: R$ 747.50/m²', 'catálogo inicial');
  end if;
  select id into sid from public.print_sizes where w_cm = 29.7 and h_cm = 42;
  if sid is null then insert into public.print_sizes(label, w_cm, h_cm) values ('A3', 29.7, 42) returning id into sid; end if;
  if not exists(select 1 from public.print_costs where supplier_id = sup and product_id = pid and size_id = sid and ended_at is null) then
    insert into public.print_costs(supplier_id, product_id, size_id, print_cents, prep_cents, packaging_cents, shipping_cents, signed_extra_cents, note, created_by)
    values (sup, pid, sid, 9325, 0, 0, 0, 0, 'Calculadora pública WePrint 25/11/2026: R$ 747.50/m²', 'catálogo inicial');
  end if;
  select id into sid from public.print_sizes where w_cm = 30 and h_cm = 40;
  if sid is null then insert into public.print_sizes(label, w_cm, h_cm) values ('30 × 40', 30, 40) returning id into sid; end if;
  if not exists(select 1 from public.print_costs where supplier_id = sup and product_id = pid and size_id = sid and ended_at is null) then
    insert into public.print_costs(supplier_id, product_id, size_id, print_cents, prep_cents, packaging_cents, shipping_cents, signed_extra_cents, note, created_by)
    values (sup, pid, sid, 8970, 0, 0, 0, 0, 'Calculadora pública WePrint 25/11/2026: R$ 747.50/m²', 'catálogo inicial');
  end if;
  select id into sid from public.print_sizes where w_cm = 30 and h_cm = 45;
  if sid is null then insert into public.print_sizes(label, w_cm, h_cm) values ('30 × 45', 30, 45) returning id into sid; end if;
  if not exists(select 1 from public.print_costs where supplier_id = sup and product_id = pid and size_id = sid and ended_at is null) then
    insert into public.print_costs(supplier_id, product_id, size_id, print_cents, prep_cents, packaging_cents, shipping_cents, signed_extra_cents, note, created_by)
    values (sup, pid, sid, 10092, 0, 0, 0, 0, 'Calculadora pública WePrint 25/11/2026: R$ 747.50/m²', 'catálogo inicial');
  end if;
  select id into sid from public.print_sizes where w_cm = 40 and h_cm = 50;
  if sid is null then insert into public.print_sizes(label, w_cm, h_cm) values ('40 × 50', 40, 50) returning id into sid; end if;
  if not exists(select 1 from public.print_costs where supplier_id = sup and product_id = pid and size_id = sid and ended_at is null) then
    insert into public.print_costs(supplier_id, product_id, size_id, print_cents, prep_cents, packaging_cents, shipping_cents, signed_extra_cents, note, created_by)
    values (sup, pid, sid, 14950, 0, 0, 0, 0, 'Calculadora pública WePrint 25/11/2026: R$ 747.50/m²', 'catálogo inicial');
  end if;
  select id into sid from public.print_sizes where w_cm = 42 and h_cm = 59.4;
  if sid is null then insert into public.print_sizes(label, w_cm, h_cm) values ('A2', 42, 59.4) returning id into sid; end if;
  if not exists(select 1 from public.print_costs where supplier_id = sup and product_id = pid and size_id = sid and ended_at is null) then
    insert into public.print_costs(supplier_id, product_id, size_id, print_cents, prep_cents, packaging_cents, shipping_cents, signed_extra_cents, note, created_by)
    values (sup, pid, sid, 18649, 0, 0, 0, 0, 'Calculadora pública WePrint 25/11/2026: R$ 747.50/m²', 'catálogo inicial');
  end if;
  select id into sid from public.print_sizes where w_cm = 40 and h_cm = 60;
  if sid is null then insert into public.print_sizes(label, w_cm, h_cm) values ('40 × 60', 40, 60) returning id into sid; end if;
  if not exists(select 1 from public.print_costs where supplier_id = sup and product_id = pid and size_id = sid and ended_at is null) then
    insert into public.print_costs(supplier_id, product_id, size_id, print_cents, prep_cents, packaging_cents, shipping_cents, signed_extra_cents, note, created_by)
    values (sup, pid, sid, 17940, 0, 0, 0, 0, 'Calculadora pública WePrint 25/11/2026: R$ 747.50/m²', 'catálogo inicial');
  end if;
  select id into sid from public.print_sizes where w_cm = 50 and h_cm = 70;
  if sid is null then insert into public.print_sizes(label, w_cm, h_cm) values ('50 × 70', 50, 70) returning id into sid; end if;
  if not exists(select 1 from public.print_costs where supplier_id = sup and product_id = pid and size_id = sid and ended_at is null) then
    insert into public.print_costs(supplier_id, product_id, size_id, print_cents, prep_cents, packaging_cents, shipping_cents, signed_extra_cents, note, created_by)
    values (sup, pid, sid, 26163, 0, 0, 0, 0, 'Calculadora pública WePrint 25/11/2026: R$ 747.50/m²', 'catálogo inicial');
  end if;
  select id into sid from public.print_sizes where w_cm = 59.4 and h_cm = 84.1;
  if sid is null then insert into public.print_sizes(label, w_cm, h_cm) values ('A1', 59.4, 84.1) returning id into sid; end if;
  if not exists(select 1 from public.print_costs where supplier_id = sup and product_id = pid and size_id = sid and ended_at is null) then
    insert into public.print_costs(supplier_id, product_id, size_id, print_cents, prep_cents, packaging_cents, shipping_cents, signed_extra_cents, note, created_by)
    values (sup, pid, sid, 37342, 0, 0, 0, 0, 'Calculadora pública WePrint 25/11/2026: R$ 747.50/m²', 'catálogo inicial');
  end if;
  select id into sid from public.print_sizes where w_cm = 60 and h_cm = 90;
  if sid is null then insert into public.print_sizes(label, w_cm, h_cm) values ('60 × 90', 60, 90) returning id into sid; end if;
  if not exists(select 1 from public.print_costs where supplier_id = sup and product_id = pid and size_id = sid and ended_at is null) then
    insert into public.print_costs(supplier_id, product_id, size_id, print_cents, prep_cents, packaging_cents, shipping_cents, signed_extra_cents, note, created_by)
    values (sup, pid, sid, 40365, 0, 0, 0, 0, 'Calculadora pública WePrint 25/11/2026: R$ 747.50/m²', 'catálogo inicial');
  end if;
  select id into sid from public.print_sizes where w_cm = 70 and h_cm = 100;
  if sid is null then insert into public.print_sizes(label, w_cm, h_cm) values ('70 × 100', 70, 100) returning id into sid; end if;
  if not exists(select 1 from public.print_costs where supplier_id = sup and product_id = pid and size_id = sid and ended_at is null) then
    insert into public.print_costs(supplier_id, product_id, size_id, print_cents, prep_cents, packaging_cents, shipping_cents, signed_extra_cents, note, created_by)
    values (sup, pid, sid, 52325, 0, 0, 0, 0, 'Calculadora pública WePrint 25/11/2026: R$ 747.50/m²', 'catálogo inicial');
  end if;
  select id into pid from public.print_products where name = 'Canson Rag Photographique 310';
  if pid is null then insert into public.print_products(name, paper, finish, description, min_dpi) values ('Canson Rag Photographique 310', 'Rag Photographique 310 g/m², 100% algodão', 'Fosco', '', 300) returning id into pid; end if;
  select id into sid from public.print_sizes where w_cm = 21 and h_cm = 29.7;
  if sid is null then insert into public.print_sizes(label, w_cm, h_cm) values ('A4', 21, 29.7) returning id into sid; end if;
  if not exists(select 1 from public.print_costs where supplier_id = sup and product_id = pid and size_id = sid and ended_at is null) then
    insert into public.print_costs(supplier_id, product_id, size_id, print_cents, prep_cents, packaging_cents, shipping_cents, signed_extra_cents, note, created_by)
    values (sup, pid, sid, 5068, 0, 0, 0, 0, 'Calculadora pública WePrint 25/11/2026: R$ 812.42/m²', 'catálogo inicial');
  end if;
  select id into sid from public.print_sizes where w_cm = 20 and h_cm = 30;
  if sid is null then insert into public.print_sizes(label, w_cm, h_cm) values ('20 × 30', 20, 30) returning id into sid; end if;
  if not exists(select 1 from public.print_costs where supplier_id = sup and product_id = pid and size_id = sid and ended_at is null) then
    insert into public.print_costs(supplier_id, product_id, size_id, print_cents, prep_cents, packaging_cents, shipping_cents, signed_extra_cents, note, created_by)
    values (sup, pid, sid, 4875, 0, 0, 0, 0, 'Calculadora pública WePrint 25/11/2026: R$ 812.42/m²', 'catálogo inicial');
  end if;
  select id into sid from public.print_sizes where w_cm = 29.7 and h_cm = 42;
  if sid is null then insert into public.print_sizes(label, w_cm, h_cm) values ('A3', 29.7, 42) returning id into sid; end if;
  if not exists(select 1 from public.print_costs where supplier_id = sup and product_id = pid and size_id = sid and ended_at is null) then
    insert into public.print_costs(supplier_id, product_id, size_id, print_cents, prep_cents, packaging_cents, shipping_cents, signed_extra_cents, note, created_by)
    values (sup, pid, sid, 10135, 0, 0, 0, 0, 'Calculadora pública WePrint 25/11/2026: R$ 812.42/m²', 'catálogo inicial');
  end if;
  select id into sid from public.print_sizes where w_cm = 30 and h_cm = 40;
  if sid is null then insert into public.print_sizes(label, w_cm, h_cm) values ('30 × 40', 30, 40) returning id into sid; end if;
  if not exists(select 1 from public.print_costs where supplier_id = sup and product_id = pid and size_id = sid and ended_at is null) then
    insert into public.print_costs(supplier_id, product_id, size_id, print_cents, prep_cents, packaging_cents, shipping_cents, signed_extra_cents, note, created_by)
    values (sup, pid, sid, 9750, 0, 0, 0, 0, 'Calculadora pública WePrint 25/11/2026: R$ 812.42/m²', 'catálogo inicial');
  end if;
  select id into sid from public.print_sizes where w_cm = 30 and h_cm = 45;
  if sid is null then insert into public.print_sizes(label, w_cm, h_cm) values ('30 × 45', 30, 45) returning id into sid; end if;
  if not exists(select 1 from public.print_costs where supplier_id = sup and product_id = pid and size_id = sid and ended_at is null) then
    insert into public.print_costs(supplier_id, product_id, size_id, print_cents, prep_cents, packaging_cents, shipping_cents, signed_extra_cents, note, created_by)
    values (sup, pid, sid, 10968, 0, 0, 0, 0, 'Calculadora pública WePrint 25/11/2026: R$ 812.42/m²', 'catálogo inicial');
  end if;
  select id into sid from public.print_sizes where w_cm = 40 and h_cm = 50;
  if sid is null then insert into public.print_sizes(label, w_cm, h_cm) values ('40 × 50', 40, 50) returning id into sid; end if;
  if not exists(select 1 from public.print_costs where supplier_id = sup and product_id = pid and size_id = sid and ended_at is null) then
    insert into public.print_costs(supplier_id, product_id, size_id, print_cents, prep_cents, packaging_cents, shipping_cents, signed_extra_cents, note, created_by)
    values (sup, pid, sid, 16249, 0, 0, 0, 0, 'Calculadora pública WePrint 25/11/2026: R$ 812.42/m²', 'catálogo inicial');
  end if;
  select id into sid from public.print_sizes where w_cm = 42 and h_cm = 59.4;
  if sid is null then insert into public.print_sizes(label, w_cm, h_cm) values ('A2', 42, 59.4) returning id into sid; end if;
  if not exists(select 1 from public.print_costs where supplier_id = sup and product_id = pid and size_id = sid and ended_at is null) then
    insert into public.print_costs(supplier_id, product_id, size_id, print_cents, prep_cents, packaging_cents, shipping_cents, signed_extra_cents, note, created_by)
    values (sup, pid, sid, 20269, 0, 0, 0, 0, 'Calculadora pública WePrint 25/11/2026: R$ 812.42/m²', 'catálogo inicial');
  end if;
  select id into sid from public.print_sizes where w_cm = 40 and h_cm = 60;
  if sid is null then insert into public.print_sizes(label, w_cm, h_cm) values ('40 × 60', 40, 60) returning id into sid; end if;
  if not exists(select 1 from public.print_costs where supplier_id = sup and product_id = pid and size_id = sid and ended_at is null) then
    insert into public.print_costs(supplier_id, product_id, size_id, print_cents, prep_cents, packaging_cents, shipping_cents, signed_extra_cents, note, created_by)
    values (sup, pid, sid, 19499, 0, 0, 0, 0, 'Calculadora pública WePrint 25/11/2026: R$ 812.42/m²', 'catálogo inicial');
  end if;
  select id into sid from public.print_sizes where w_cm = 50 and h_cm = 70;
  if sid is null then insert into public.print_sizes(label, w_cm, h_cm) values ('50 × 70', 50, 70) returning id into sid; end if;
  if not exists(select 1 from public.print_costs where supplier_id = sup and product_id = pid and size_id = sid and ended_at is null) then
    insert into public.print_costs(supplier_id, product_id, size_id, print_cents, prep_cents, packaging_cents, shipping_cents, signed_extra_cents, note, created_by)
    values (sup, pid, sid, 28435, 0, 0, 0, 0, 'Calculadora pública WePrint 25/11/2026: R$ 812.42/m²', 'catálogo inicial');
  end if;
  select id into sid from public.print_sizes where w_cm = 59.4 and h_cm = 84.1;
  if sid is null then insert into public.print_sizes(label, w_cm, h_cm) values ('A1', 59.4, 84.1) returning id into sid; end if;
  if not exists(select 1 from public.print_costs where supplier_id = sup and product_id = pid and size_id = sid and ended_at is null) then
    insert into public.print_costs(supplier_id, product_id, size_id, print_cents, prep_cents, packaging_cents, shipping_cents, signed_extra_cents, note, created_by)
    values (sup, pid, sid, 40585, 0, 0, 0, 0, 'Calculadora pública WePrint 25/11/2026: R$ 812.42/m²', 'catálogo inicial');
  end if;
  select id into sid from public.print_sizes where w_cm = 60 and h_cm = 90;
  if sid is null then insert into public.print_sizes(label, w_cm, h_cm) values ('60 × 90', 60, 90) returning id into sid; end if;
  if not exists(select 1 from public.print_costs where supplier_id = sup and product_id = pid and size_id = sid and ended_at is null) then
    insert into public.print_costs(supplier_id, product_id, size_id, print_cents, prep_cents, packaging_cents, shipping_cents, signed_extra_cents, note, created_by)
    values (sup, pid, sid, 43871, 0, 0, 0, 0, 'Calculadora pública WePrint 25/11/2026: R$ 812.42/m²', 'catálogo inicial');
  end if;
  select id into sid from public.print_sizes where w_cm = 70 and h_cm = 100;
  if sid is null then insert into public.print_sizes(label, w_cm, h_cm) values ('70 × 100', 70, 100) returning id into sid; end if;
  if not exists(select 1 from public.print_costs where supplier_id = sup and product_id = pid and size_id = sid and ended_at is null) then
    insert into public.print_costs(supplier_id, product_id, size_id, print_cents, prep_cents, packaging_cents, shipping_cents, signed_extra_cents, note, created_by)
    values (sup, pid, sid, 56870, 0, 0, 0, 0, 'Calculadora pública WePrint 25/11/2026: R$ 812.42/m²', 'catálogo inicial');
  end if;
  select id into pid from public.print_products where name = 'Canson Aquarelle Rag 310';
  if pid is null then insert into public.print_products(name, paper, finish, description, min_dpi) values ('Canson Aquarelle Rag 310', 'Aquarelle Rag 310 g/m², 100% algodão', 'Fosco com textura de aquarela', '', 300) returning id into pid; end if;
  select id into sid from public.print_sizes where w_cm = 21 and h_cm = 29.7;
  if sid is null then insert into public.print_sizes(label, w_cm, h_cm) values ('A4', 21, 29.7) returning id into sid; end if;
  if not exists(select 1 from public.print_costs where supplier_id = sup and product_id = pid and size_id = sid and ended_at is null) then
    insert into public.print_costs(supplier_id, product_id, size_id, print_cents, prep_cents, packaging_cents, shipping_cents, signed_extra_cents, note, created_by)
    values (sup, pid, sid, 5283, 0, 0, 0, 0, 'Calculadora pública WePrint 25/11/2026: R$ 847.00/m²', 'catálogo inicial');
  end if;
  select id into sid from public.print_sizes where w_cm = 20 and h_cm = 30;
  if sid is null then insert into public.print_sizes(label, w_cm, h_cm) values ('20 × 30', 20, 30) returning id into sid; end if;
  if not exists(select 1 from public.print_costs where supplier_id = sup and product_id = pid and size_id = sid and ended_at is null) then
    insert into public.print_costs(supplier_id, product_id, size_id, print_cents, prep_cents, packaging_cents, shipping_cents, signed_extra_cents, note, created_by)
    values (sup, pid, sid, 5082, 0, 0, 0, 0, 'Calculadora pública WePrint 25/11/2026: R$ 847.00/m²', 'catálogo inicial');
  end if;
  select id into sid from public.print_sizes where w_cm = 29.7 and h_cm = 42;
  if sid is null then insert into public.print_sizes(label, w_cm, h_cm) values ('A3', 29.7, 42) returning id into sid; end if;
  if not exists(select 1 from public.print_costs where supplier_id = sup and product_id = pid and size_id = sid and ended_at is null) then
    insert into public.print_costs(supplier_id, product_id, size_id, print_cents, prep_cents, packaging_cents, shipping_cents, signed_extra_cents, note, created_by)
    values (sup, pid, sid, 10566, 0, 0, 0, 0, 'Calculadora pública WePrint 25/11/2026: R$ 847.00/m²', 'catálogo inicial');
  end if;
  select id into sid from public.print_sizes where w_cm = 30 and h_cm = 40;
  if sid is null then insert into public.print_sizes(label, w_cm, h_cm) values ('30 × 40', 30, 40) returning id into sid; end if;
  if not exists(select 1 from public.print_costs where supplier_id = sup and product_id = pid and size_id = sid and ended_at is null) then
    insert into public.print_costs(supplier_id, product_id, size_id, print_cents, prep_cents, packaging_cents, shipping_cents, signed_extra_cents, note, created_by)
    values (sup, pid, sid, 10164, 0, 0, 0, 0, 'Calculadora pública WePrint 25/11/2026: R$ 847.00/m²', 'catálogo inicial');
  end if;
  select id into sid from public.print_sizes where w_cm = 30 and h_cm = 45;
  if sid is null then insert into public.print_sizes(label, w_cm, h_cm) values ('30 × 45', 30, 45) returning id into sid; end if;
  if not exists(select 1 from public.print_costs where supplier_id = sup and product_id = pid and size_id = sid and ended_at is null) then
    insert into public.print_costs(supplier_id, product_id, size_id, print_cents, prep_cents, packaging_cents, shipping_cents, signed_extra_cents, note, created_by)
    values (sup, pid, sid, 11435, 0, 0, 0, 0, 'Calculadora pública WePrint 25/11/2026: R$ 847.00/m²', 'catálogo inicial');
  end if;
  select id into sid from public.print_sizes where w_cm = 40 and h_cm = 50;
  if sid is null then insert into public.print_sizes(label, w_cm, h_cm) values ('40 × 50', 40, 50) returning id into sid; end if;
  if not exists(select 1 from public.print_costs where supplier_id = sup and product_id = pid and size_id = sid and ended_at is null) then
    insert into public.print_costs(supplier_id, product_id, size_id, print_cents, prep_cents, packaging_cents, shipping_cents, signed_extra_cents, note, created_by)
    values (sup, pid, sid, 16940, 0, 0, 0, 0, 'Calculadora pública WePrint 25/11/2026: R$ 847.00/m²', 'catálogo inicial');
  end if;
  select id into sid from public.print_sizes where w_cm = 42 and h_cm = 59.4;
  if sid is null then insert into public.print_sizes(label, w_cm, h_cm) values ('A2', 42, 59.4) returning id into sid; end if;
  if not exists(select 1 from public.print_costs where supplier_id = sup and product_id = pid and size_id = sid and ended_at is null) then
    insert into public.print_costs(supplier_id, product_id, size_id, print_cents, prep_cents, packaging_cents, shipping_cents, signed_extra_cents, note, created_by)
    values (sup, pid, sid, 21131, 0, 0, 0, 0, 'Calculadora pública WePrint 25/11/2026: R$ 847.00/m²', 'catálogo inicial');
  end if;
  select id into sid from public.print_sizes where w_cm = 40 and h_cm = 60;
  if sid is null then insert into public.print_sizes(label, w_cm, h_cm) values ('40 × 60', 40, 60) returning id into sid; end if;
  if not exists(select 1 from public.print_costs where supplier_id = sup and product_id = pid and size_id = sid and ended_at is null) then
    insert into public.print_costs(supplier_id, product_id, size_id, print_cents, prep_cents, packaging_cents, shipping_cents, signed_extra_cents, note, created_by)
    values (sup, pid, sid, 20328, 0, 0, 0, 0, 'Calculadora pública WePrint 25/11/2026: R$ 847.00/m²', 'catálogo inicial');
  end if;
  select id into sid from public.print_sizes where w_cm = 50 and h_cm = 70;
  if sid is null then insert into public.print_sizes(label, w_cm, h_cm) values ('50 × 70', 50, 70) returning id into sid; end if;
  if not exists(select 1 from public.print_costs where supplier_id = sup and product_id = pid and size_id = sid and ended_at is null) then
    insert into public.print_costs(supplier_id, product_id, size_id, print_cents, prep_cents, packaging_cents, shipping_cents, signed_extra_cents, note, created_by)
    values (sup, pid, sid, 29645, 0, 0, 0, 0, 'Calculadora pública WePrint 25/11/2026: R$ 847.00/m²', 'catálogo inicial');
  end if;
  select id into sid from public.print_sizes where w_cm = 59.4 and h_cm = 84.1;
  if sid is null then insert into public.print_sizes(label, w_cm, h_cm) values ('A1', 59.4, 84.1) returning id into sid; end if;
  if not exists(select 1 from public.print_costs where supplier_id = sup and product_id = pid and size_id = sid and ended_at is null) then
    insert into public.print_costs(supplier_id, product_id, size_id, print_cents, prep_cents, packaging_cents, shipping_cents, signed_extra_cents, note, created_by)
    values (sup, pid, sid, 42313, 0, 0, 0, 0, 'Calculadora pública WePrint 25/11/2026: R$ 847.00/m²', 'catálogo inicial');
  end if;
  select id into sid from public.print_sizes where w_cm = 60 and h_cm = 90;
  if sid is null then insert into public.print_sizes(label, w_cm, h_cm) values ('60 × 90', 60, 90) returning id into sid; end if;
  if not exists(select 1 from public.print_costs where supplier_id = sup and product_id = pid and size_id = sid and ended_at is null) then
    insert into public.print_costs(supplier_id, product_id, size_id, print_cents, prep_cents, packaging_cents, shipping_cents, signed_extra_cents, note, created_by)
    values (sup, pid, sid, 45738, 0, 0, 0, 0, 'Calculadora pública WePrint 25/11/2026: R$ 847.00/m²', 'catálogo inicial');
  end if;
  select id into sid from public.print_sizes where w_cm = 70 and h_cm = 100;
  if sid is null then insert into public.print_sizes(label, w_cm, h_cm) values ('70 × 100', 70, 100) returning id into sid; end if;
  if not exists(select 1 from public.print_costs where supplier_id = sup and product_id = pid and size_id = sid and ended_at is null) then
    insert into public.print_costs(supplier_id, product_id, size_id, print_cents, prep_cents, packaging_cents, shipping_cents, signed_extra_cents, note, created_by)
    values (sup, pid, sid, 59290, 0, 0, 0, 0, 'Calculadora pública WePrint 25/11/2026: R$ 847.00/m²', 'catálogo inicial');
  end if;
  select id into pid from public.print_products where name = 'Canson Platine Fibre Rag 310';
  if pid is null then insert into public.print_products(name, paper, finish, description, min_dpi) values ('Canson Platine Fibre Rag 310', 'Platine Fibre Rag 310 g/m², algodão', 'Semibrilho (baritado)', '', 300) returning id into pid; end if;
  select id into sid from public.print_sizes where w_cm = 21 and h_cm = 29.7;
  if sid is null then insert into public.print_sizes(label, w_cm, h_cm) values ('A4', 21, 29.7) returning id into sid; end if;
  if not exists(select 1 from public.print_costs where supplier_id = sup and product_id = pid and size_id = sid and ended_at is null) then
    insert into public.print_costs(supplier_id, product_id, size_id, print_cents, prep_cents, packaging_cents, shipping_cents, signed_extra_cents, note, created_by)
    values (sup, pid, sid, 5685, 0, 0, 0, 0, 'Calculadora pública WePrint 25/11/2026: R$ 911.35/m²', 'catálogo inicial');
  end if;
  select id into sid from public.print_sizes where w_cm = 20 and h_cm = 30;
  if sid is null then insert into public.print_sizes(label, w_cm, h_cm) values ('20 × 30', 20, 30) returning id into sid; end if;
  if not exists(select 1 from public.print_costs where supplier_id = sup and product_id = pid and size_id = sid and ended_at is null) then
    insert into public.print_costs(supplier_id, product_id, size_id, print_cents, prep_cents, packaging_cents, shipping_cents, signed_extra_cents, note, created_by)
    values (sup, pid, sid, 5469, 0, 0, 0, 0, 'Calculadora pública WePrint 25/11/2026: R$ 911.35/m²', 'catálogo inicial');
  end if;
  select id into sid from public.print_sizes where w_cm = 29.7 and h_cm = 42;
  if sid is null then insert into public.print_sizes(label, w_cm, h_cm) values ('A3', 29.7, 42) returning id into sid; end if;
  if not exists(select 1 from public.print_costs where supplier_id = sup and product_id = pid and size_id = sid and ended_at is null) then
    insert into public.print_costs(supplier_id, product_id, size_id, print_cents, prep_cents, packaging_cents, shipping_cents, signed_extra_cents, note, created_by)
    values (sup, pid, sid, 11369, 0, 0, 0, 0, 'Calculadora pública WePrint 25/11/2026: R$ 911.35/m²', 'catálogo inicial');
  end if;
  select id into sid from public.print_sizes where w_cm = 30 and h_cm = 40;
  if sid is null then insert into public.print_sizes(label, w_cm, h_cm) values ('30 × 40', 30, 40) returning id into sid; end if;
  if not exists(select 1 from public.print_costs where supplier_id = sup and product_id = pid and size_id = sid and ended_at is null) then
    insert into public.print_costs(supplier_id, product_id, size_id, print_cents, prep_cents, packaging_cents, shipping_cents, signed_extra_cents, note, created_by)
    values (sup, pid, sid, 10937, 0, 0, 0, 0, 'Calculadora pública WePrint 25/11/2026: R$ 911.35/m²', 'catálogo inicial');
  end if;
  select id into sid from public.print_sizes where w_cm = 30 and h_cm = 45;
  if sid is null then insert into public.print_sizes(label, w_cm, h_cm) values ('30 × 45', 30, 45) returning id into sid; end if;
  if not exists(select 1 from public.print_costs where supplier_id = sup and product_id = pid and size_id = sid and ended_at is null) then
    insert into public.print_costs(supplier_id, product_id, size_id, print_cents, prep_cents, packaging_cents, shipping_cents, signed_extra_cents, note, created_by)
    values (sup, pid, sid, 12304, 0, 0, 0, 0, 'Calculadora pública WePrint 25/11/2026: R$ 911.35/m²', 'catálogo inicial');
  end if;
  select id into sid from public.print_sizes where w_cm = 40 and h_cm = 50;
  if sid is null then insert into public.print_sizes(label, w_cm, h_cm) values ('40 × 50', 40, 50) returning id into sid; end if;
  if not exists(select 1 from public.print_costs where supplier_id = sup and product_id = pid and size_id = sid and ended_at is null) then
    insert into public.print_costs(supplier_id, product_id, size_id, print_cents, prep_cents, packaging_cents, shipping_cents, signed_extra_cents, note, created_by)
    values (sup, pid, sid, 18227, 0, 0, 0, 0, 'Calculadora pública WePrint 25/11/2026: R$ 911.35/m²', 'catálogo inicial');
  end if;
  select id into sid from public.print_sizes where w_cm = 42 and h_cm = 59.4;
  if sid is null then insert into public.print_sizes(label, w_cm, h_cm) values ('A2', 42, 59.4) returning id into sid; end if;
  if not exists(select 1 from public.print_costs where supplier_id = sup and product_id = pid and size_id = sid and ended_at is null) then
    insert into public.print_costs(supplier_id, product_id, size_id, print_cents, prep_cents, packaging_cents, shipping_cents, signed_extra_cents, note, created_by)
    values (sup, pid, sid, 22737, 0, 0, 0, 0, 'Calculadora pública WePrint 25/11/2026: R$ 911.35/m²', 'catálogo inicial');
  end if;
  select id into sid from public.print_sizes where w_cm = 40 and h_cm = 60;
  if sid is null then insert into public.print_sizes(label, w_cm, h_cm) values ('40 × 60', 40, 60) returning id into sid; end if;
  if not exists(select 1 from public.print_costs where supplier_id = sup and product_id = pid and size_id = sid and ended_at is null) then
    insert into public.print_costs(supplier_id, product_id, size_id, print_cents, prep_cents, packaging_cents, shipping_cents, signed_extra_cents, note, created_by)
    values (sup, pid, sid, 21873, 0, 0, 0, 0, 'Calculadora pública WePrint 25/11/2026: R$ 911.35/m²', 'catálogo inicial');
  end if;
  select id into sid from public.print_sizes where w_cm = 50 and h_cm = 70;
  if sid is null then insert into public.print_sizes(label, w_cm, h_cm) values ('50 × 70', 50, 70) returning id into sid; end if;
  if not exists(select 1 from public.print_costs where supplier_id = sup and product_id = pid and size_id = sid and ended_at is null) then
    insert into public.print_costs(supplier_id, product_id, size_id, print_cents, prep_cents, packaging_cents, shipping_cents, signed_extra_cents, note, created_by)
    values (sup, pid, sid, 31898, 0, 0, 0, 0, 'Calculadora pública WePrint 25/11/2026: R$ 911.35/m²', 'catálogo inicial');
  end if;
  select id into sid from public.print_sizes where w_cm = 59.4 and h_cm = 84.1;
  if sid is null then insert into public.print_sizes(label, w_cm, h_cm) values ('A1', 59.4, 84.1) returning id into sid; end if;
  if not exists(select 1 from public.print_costs where supplier_id = sup and product_id = pid and size_id = sid and ended_at is null) then
    insert into public.print_costs(supplier_id, product_id, size_id, print_cents, prep_cents, packaging_cents, shipping_cents, signed_extra_cents, note, created_by)
    values (sup, pid, sid, 45527, 0, 0, 0, 0, 'Calculadora pública WePrint 25/11/2026: R$ 911.35/m²', 'catálogo inicial');
  end if;
  select id into sid from public.print_sizes where w_cm = 60 and h_cm = 90;
  if sid is null then insert into public.print_sizes(label, w_cm, h_cm) values ('60 × 90', 60, 90) returning id into sid; end if;
  if not exists(select 1 from public.print_costs where supplier_id = sup and product_id = pid and size_id = sid and ended_at is null) then
    insert into public.print_costs(supplier_id, product_id, size_id, print_cents, prep_cents, packaging_cents, shipping_cents, signed_extra_cents, note, created_by)
    values (sup, pid, sid, 49213, 0, 0, 0, 0, 'Calculadora pública WePrint 25/11/2026: R$ 911.35/m²', 'catálogo inicial');
  end if;
  select id into sid from public.print_sizes where w_cm = 70 and h_cm = 100;
  if sid is null then insert into public.print_sizes(label, w_cm, h_cm) values ('70 × 100', 70, 100) returning id into sid; end if;
  if not exists(select 1 from public.print_costs where supplier_id = sup and product_id = pid and size_id = sid and ended_at is null) then
    insert into public.print_costs(supplier_id, product_id, size_id, print_cents, prep_cents, packaging_cents, shipping_cents, signed_extra_cents, note, created_by)
    values (sup, pid, sid, 63795, 0, 0, 0, 0, 'Calculadora pública WePrint 25/11/2026: R$ 911.35/m²', 'catálogo inicial');
  end if;
end $$;

select p.name as papel, z.label as tamanho, to_char(c.print_cents / 100.0, 'FM9990.00') as custo_rs
from public.print_costs c join public.print_products p on p.id = c.product_id join public.print_sizes z on z.id = c.size_id
where c.ended_at is null order by p.name, z.w_cm * z.h_cm;
