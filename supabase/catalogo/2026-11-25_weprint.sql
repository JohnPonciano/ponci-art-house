-- Catálogo de prints com a WePrint! Fine Art (Itu-SP). Já aplicado em produção em 25/11/2026.
-- Enxuto de propósito: 2 papéis × 4 tamanhos, os mais usados por artistas (série A e 50 × 70, quase a mesma proporção).
-- Custos = preço público da calculadora da WePrint em 25/11/2026 (área × preço por m², arredondado para cima no centavo),
-- embalagem em tubo sem custo, frete à parte. Extra de assinatura = 0 até a WePrint informar.
-- Resolução mínima 300 dpi (padrão usual de fine art): confirmar com a WePrint.
-- Pode rodar de novo sem duplicar.
do $$
declare sup uuid;
begin
  select id into sup from public.print_suppliers where name = 'WePrint! Fine Art';
  if sup is null then
    insert into public.print_suppliers(name, city, contact, notes) values ('WePrint! Fine Art', 'Itu-SP', 'weprint.com.br · WhatsApp (11) 4025-2904',
      'Estúdio certificado Canson. Custos iniciais = preço público da calculadora (25/11/2026); trocar pela tabela de parceiro quando vier.') returning id into sup;
  end if;
  insert into public.print_products(name, paper, finish, description, min_dpi)
    select n, pa, f, d, 300 from (values
      ('Canson Rag Photographique 310','Rag Photographique 310 g/m², 100% algodão','Fosco','Papel 100% algodão, fosco, padrão de museu. Preto profundo e cor fiel; o mais indicado para reproduzir obras.',812.42),
      ('Photo Lustre Premium 310','Photo Lustre Premium 310 g/m²','Semibrilho','Semibrilho com ótimo contraste, mais em conta. Boa escolha para tiragens abertas e ilustração.',533.00)
    ) v(n, pa, f, d, m2) where not exists(select 1 from public.print_products x where x.name = v.n);
  insert into public.print_sizes(label, w_cm, h_cm)
    select l, w, h from (values ('A4',21,29.7),('A3',29.7,42),('A2',42,59.4),('50 × 70',50,70)) v(l, w, h)
    where not exists(select 1 from public.print_sizes x where x.w_cm = v.w and x.h_cm = v.h);
  insert into public.print_costs(supplier_id, product_id, size_id, print_cents, prep_cents, packaging_cents, shipping_cents, signed_extra_cents, note, created_by)
    select sup, p.id, z.id, ceil(round(z.w_cm * z.h_cm / 10000.0 * v.m2 * 100, 6))::int, 0, 0, 0, 0, 'Calculadora pública WePrint 25/11/2026: R$ ' || v.m2 || '/m²', 'catálogo inicial'
    from (values ('Canson Rag Photographique 310',812.42),('Photo Lustre Premium 310',533.00)) v(n, m2)
    join public.print_products p on p.name = v.n
    join public.print_sizes z on (z.w_cm, z.h_cm) in ((21,29.7),(29.7,42),(42,59.4),(50,70))
    where not exists(select 1 from public.print_costs x where x.supplier_id = sup and x.product_id = p.id and x.size_id = z.id and x.ended_at is null);
end $$;
