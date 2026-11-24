-- Prints sob demanda (Fase 2a): catálogo da PONCI, oferta de print por obra, autorização de reprodução e preço.
--
-- Princípios:
-- * O original continua como está (works.price / works.status). O print é uma oferta à parte, 1 por obra,
--   e pode seguir à venda depois que o original foi vendido (ganho contínuo do artista).
-- * Nenhum custo é inventado: fornecedores, papéis, tamanhos e custos nascem vazios e são cadastrados pelo admin.
-- * Valores em CENTAVOS (o preço calculado não é redondo).
-- * Preço final = (custos fixos + remuneração do artista) / (1 − comissão − taxa de pagamento − impostos).
--   Cada custo entra uma vez; percentuais ficam só no denominador. O arredondamento (para cima, no centavo)
--   fica com a comissão, de modo que as partes sempre somam exatamente o preço.
-- * Publicar exige: obra aprovada, regras de print definidas, custo vigente para cada tamanho, arquivo-mestre
--   com resolução suficiente e autorização explícita do artista para aquelas condições (texto + SHA-256, imutável).
--   Mudou a condição, a oferta volta a rascunho e precisa de nova autorização.

-- ---------- Catálogo (admin) ----------
create table if not exists public.print_suppliers(
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 2 and 120),
  city text not null default '' check (length(city) <= 120),
  contact text not null default '' check (length(contact) <= 300),
  notes text not null default '' check (length(notes) <= 1000),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.print_products(
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 2 and 120),     -- ex.: o nome comercial do papel
  paper text not null default '' check (length(paper) <= 160),
  finish text not null default '' check (length(finish) <= 160),
  description text not null default '' check (length(description) <= 1000),
  min_dpi int not null check (min_dpi between 72 and 600),               -- resolução mínima exigida do arquivo-mestre
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.print_sizes(
  id uuid primary key default gen_random_uuid(),
  label text not null check (length(btrim(label)) between 1 and 40),
  w_cm numeric(6,1) not null check (w_cm > 0 and w_cm <= 300),
  h_cm numeric(6,1) not null check (h_cm > 0 and h_cm <= 300),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (w_cm, h_cm)
);
-- Custo de um fornecedor para um papel num tamanho. Valores não mudam depois de gravados: para mudar, encerra-se a
-- linha (valid_to) e cadastra-se outra. Ofertas publicadas guardam a cópia do custo que usaram.
create table if not exists public.print_costs(
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.print_suppliers on delete restrict,
  product_id uuid not null references public.print_products on delete restrict,
  size_id uuid not null references public.print_sizes on delete restrict,
  print_cents int not null check (print_cents >= 0),            -- impressão
  prep_cents int not null default 0 check (prep_cents >= 0),     -- preparo do arquivo, prova
  packaging_cents int not null default 0 check (packaging_cents >= 0),
  shipping_cents int not null default 0 check (shipping_cents >= 0),   -- frete-base embutido, se a PONCI decidir embutir
  signed_extra_cents int not null default 0 check (signed_extra_cents >= 0), -- custo extra quando o print vai ao artista assinar
  valid_from date not null default current_date,
  valid_to date check (valid_to is null or valid_to >= valid_from),
  ended_at timestamptz,                                           -- substituída ou retirada pelo admin
  note text not null default '' check (length(note) <= 300),
  created_at timestamptz not null default now(),
  created_by text
);
create index if not exists print_costs_lookup_idx on public.print_costs(product_id, size_id);

create or replace function public._print_cost_frozen() returns trigger language plpgsql set search_path='' as $$
begin
  if tg_op = 'DELETE' then raise exception 'Custos não são apagados; encerre a vigência.' using errcode='P0001'; end if;
  if (new.supplier_id, new.product_id, new.size_id, new.print_cents, new.prep_cents, new.packaging_cents, new.shipping_cents, new.signed_extra_cents, new.valid_from)
     is distinct from (old.supplier_id, old.product_id, old.size_id, old.print_cents, old.prep_cents, old.packaging_cents, old.shipping_cents, old.signed_extra_cents, old.valid_from) then
    raise exception 'Valores de custo não mudam: encerre esta linha e cadastre outra.' using errcode='P0001'; end if;
  return new;
end $$;
drop trigger if exists print_costs_frozen on public.print_costs;
create trigger print_costs_frozen before update or delete on public.print_costs for each row execute function public._print_cost_frozen();

alter table public.print_suppliers enable row level security;
alter table public.print_products enable row level security;
alter table public.print_sizes enable row level security;
alter table public.print_costs enable row level security;
drop policy if exists "prints: admin lê fornecedores" on public.print_suppliers;
create policy "prints: admin lê fornecedores" on public.print_suppliers for select to authenticated using ((select public.is_admin()));
drop policy if exists "prints: membros e admin leem papéis" on public.print_products;
create policy "prints: membros e admin leem papéis" on public.print_products for select to authenticated using ((select public.is_member()) or (select public.is_admin()));
drop policy if exists "prints: membros e admin leem tamanhos" on public.print_sizes;
create policy "prints: membros e admin leem tamanhos" on public.print_sizes for select to authenticated using ((select public.is_member()) or (select public.is_admin()));
drop policy if exists "prints: admin lê custos" on public.print_costs;
create policy "prints: admin lê custos" on public.print_costs for select to authenticated using ((select public.is_admin()));

do $$ declare t text; begin
  foreach t in array array['print_suppliers','print_products','print_sizes','print_costs'] loop
    execute format('drop trigger if exists audit_%s on public.%I', t, t);
    execute format('create trigger audit_%s after insert or update or delete on public.%I for each row execute function public._audit()', t, t);
  end loop; end $$;

-- ---------- Oferta de print ----------
create table if not exists public.print_authorizations(
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null,
  work_id uuid not null references public.works on delete cascade,
  artist_id uuid not null references public.profiles on delete cascade,
  terms jsonb not null,
  body text not null,
  sha256 text not null,
  accepted_at timestamptz not null default now(),
  ip text, ua text
);
drop trigger if exists print_authorizations_immutable on public.print_authorizations;
create trigger print_authorizations_immutable before update on public.print_authorizations for each row execute function public._immutable();

create table if not exists public.print_offers(
  id uuid primary key default gen_random_uuid(),
  work_id uuid not null unique references public.works on delete cascade,
  artist_id uuid not null references public.profiles on delete cascade,
  status text not null default 'draft' check (status in ('draft','active','paused')),
  edition text not null default 'open' check (edition in ('open','limited')),
  edition_max int check (edition_max between 1 and 9999),
  signed boolean not null default false,
  numbered boolean not null default false,
  master_path text, master_w int check (master_w > 0), master_h int check (master_h > 0),
  authorization_id uuid references public.print_authorizations on delete set null,
  sold_count int not null default 0 check (sold_count >= 0),
  paused_reason text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint print_offers_edition_ck check ((edition = 'limited') = (edition_max is not null)),
  constraint print_offers_numbered_ck check (not numbered or edition = 'limited'),
  constraint print_offers_sold_ck check (edition_max is null or sold_count <= edition_max)
);
alter table public.print_authorizations drop constraint if exists print_authorizations_offer_fk;
alter table public.print_authorizations add constraint print_authorizations_offer_fk foreign key (offer_id) references public.print_offers on delete cascade;

create table if not exists public.print_offer_sizes(
  offer_id uuid not null references public.print_offers on delete cascade,
  product_id uuid not null references public.print_products on delete restrict,
  size_id uuid not null references public.print_sizes on delete restrict,
  artist_fee_cents int not null check (artist_fee_cents between 100 and 100000000),
  -- cópia congelada na publicação
  cost_id uuid references public.print_costs on delete restrict,
  settings_id bigint references public.commerce_settings on delete restrict,
  breakdown jsonb,
  price_cents int check (price_cents > 0),
  primary key (offer_id, product_id, size_id)
);

alter table public.print_offers enable row level security;
alter table public.print_offer_sizes enable row level security;
alter table public.print_authorizations enable row level security;
drop policy if exists "prints: artista, admin e membros (ativas)" on public.print_offers;
create policy "prints: artista, admin e membros (ativas)" on public.print_offers for select to authenticated
  using (artist_id = (select auth.uid()) or (select public.is_admin()) or (status = 'active' and (select public.is_member())));
-- o detalhamento do preço (custos) é do artista e do admin; quem compra vê as opções por work_print_options()
drop policy if exists "prints: tamanhos para artista e admin" on public.print_offer_sizes;
create policy "prints: tamanhos para artista e admin" on public.print_offer_sizes for select to authenticated
  using ((select public.is_admin()) or exists(select 1 from public.print_offers o where o.id = offer_id and o.artist_id = (select auth.uid())));
drop policy if exists "prints: autorizações do artista e admin" on public.print_authorizations;
create policy "prints: autorizações do artista e admin" on public.print_authorizations for select to authenticated
  using (artist_id = (select auth.uid()) or (select public.is_admin()));

do $$ declare t text; begin
  foreach t in array array['print_offers','print_offer_sizes','print_authorizations'] loop
    execute format('drop trigger if exists audit_%s on public.%I', t, t);
    execute format('create trigger audit_%s after insert or update or delete on public.%I for each row execute function public._audit()', t, t);
  end loop; end $$;

-- ---------- Arquivo-mestre (privado) ----------
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('print-masters', 'print-masters', false, 52428800, array['image/jpeg','image/png','image/tiff'])
on conflict (id) do nothing;
drop policy if exists "mestres: artista envia na própria pasta" on storage.objects;
create policy "mestres: artista envia na própria pasta" on storage.objects for insert to authenticated
  with check (bucket_id = 'print-masters' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "mestres: artista e admin leem" on storage.objects;
create policy "mestres: artista e admin leem" on storage.objects for select to authenticated
  using (bucket_id = 'print-masters' and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_admin())));
drop policy if exists "mestres: artista remove" on storage.objects;
create policy "mestres: artista remove" on storage.objects for delete to authenticated
  using (bucket_id = 'print-masters' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- ---------- Preço ----------
-- custo vigente mais barato para papel × tamanho (fornecedor, papel e tamanho ativos)
create or replace function public._print_best_cost(p_product uuid, p_size uuid) returns public.print_costs
language sql stable security definer set search_path='' as $$
  select c.* from public.print_costs c
  join public.print_suppliers s on s.id = c.supplier_id and s.active
  join public.print_products p on p.id = c.product_id and p.active
  join public.print_sizes z on z.id = c.size_id and z.active
  where c.product_id = p_product and c.size_id = p_size
    and c.ended_at is null and c.valid_from <= current_date and (c.valid_to is null or c.valid_to >= current_date)
  order by c.print_cents + c.prep_cents + c.packaging_cents + c.shipping_cents, c.created_at
  limit 1
$$;

-- conta pura (testável): devolve todas as parcelas, que somam exatamente o preço final
create or replace function public._print_price(p_cost public.print_costs, p_signed boolean, p_fee int, s public.commerce_settings) returns jsonb
language plpgsql immutable set search_path='' as $$
declare fixed bigint; rate numeric; final bigint; payfee bigint; tax bigint; comm bigint; extra bigint;
begin
  if s.print_commission_pct is null or s.payment_fee_pct is null or s.tax_pct is null then
    raise exception 'A PONCI ainda não definiu as regras de print (comissão, taxa de pagamento e impostos).' using errcode='P0001'; end if;
  if p_cost.id is null then raise exception 'Este papel e tamanho ainda não têm custo cadastrado.' using errcode='P0001'; end if;
  if p_fee is null or p_fee < 100 then raise exception 'Remuneração mínima de R$ 1,00 por unidade.' using errcode='P0001'; end if;
  extra := case when p_signed then p_cost.signed_extra_cents else 0 end;
  fixed := p_cost.print_cents + p_cost.prep_cents + p_cost.packaging_cents + p_cost.shipping_cents + extra;
  rate := (s.print_commission_pct + s.payment_fee_pct + s.tax_pct) / 100;
  if rate >= 0.9 then raise exception 'Regras de print inválidas.' using errcode='P0001'; end if;
  final := ceil((fixed + p_fee) / (1 - rate));
  payfee := round(final * s.payment_fee_pct / 100);
  tax := round(final * s.tax_pct / 100);
  comm := final - fixed - p_fee - payfee - tax;          -- recebe o arredondamento: nada é contado duas vezes
  return jsonb_build_object(
    'print', p_cost.print_cents, 'prep', p_cost.prep_cents, 'packaging', p_cost.packaging_cents,
    'shipping', p_cost.shipping_cents, 'signed_extra', extra, 'fixed', fixed,
    'artist_fee', p_fee, 'payment_fee', payfee, 'tax', tax, 'commission', comm, 'final', final,
    'commission_pct', s.print_commission_pct, 'payment_fee_pct', s.payment_fee_pct, 'tax_pct', s.tax_pct,
    'settings_id', s.id, 'cost_id', p_cost.id, 'supplier_id', p_cost.supplier_id);
end $$;
revoke execute on function public._print_best_cost(uuid, uuid), public._print_price(public.print_costs, boolean, int, public.commerce_settings) from public, anon, authenticated;

-- prévia para o artista (ou admin): quanto o comprador paga por papel × tamanho com essa remuneração
create or replace function public.print_quote(p_product uuid, p_size uuid, p_signed boolean, p_fee_cents int) returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
  if not (public.is_admin() or (public.is_member() and public.my_role() = 'artist')) then
    raise exception 'Acesso restrito.' using errcode='42501'; end if;
  return public._print_price(public._print_best_cost(p_product, p_size), coalesce(p_signed, false), p_fee_cents, public.commerce_current())
         - 'cost_id' - 'supplier_id';   -- artista vê as parcelas, não qual gráfica
end $$;
revoke execute on function public.print_quote(uuid, uuid, boolean, int) from public, anon;
grant execute on function public.print_quote(uuid, uuid, boolean, int) to authenticated;

-- ---------- Artista configura ----------
-- Salvar sempre volta a rascunho: qualquer mudança exige nova autorização antes de publicar.
create or replace function public.save_print_offer(p_work uuid, p_edition text, p_edition_max int, p_signed boolean, p_numbered boolean,
  p_sizes jsonb, p_master_path text, p_master_w int, p_master_h int) returns uuid
language plpgsql security definer set search_path='' as $$
declare wk public.works; o public.print_offers; v uuid; it jsonb; n int := 0;
begin
  select * into wk from public.works where id = p_work and artist_id = auth.uid();
  if wk.id is null then raise exception 'Obra não encontrada.' using errcode='P0001'; end if;
  if not public.is_member() then raise exception 'Conta inativa.' using errcode='P0001'; end if;
  if wk.status = 'review' then raise exception 'A obra precisa ser aprovada pela curadoria antes de ter prints.' using errcode='P0001'; end if;
  if wk.reproduction then raise exception 'Esta peça já é uma reprodução (REPROD); prints são feitos a partir de obras originais.' using errcode='P0001'; end if;
  if p_edition not in ('open','limited') then raise exception 'Escolha edição aberta ou limitada.' using errcode='P0001'; end if;
  if p_edition = 'limited' and (p_edition_max is null or p_edition_max < 1 or p_edition_max > 9999) then
    raise exception 'Informe a tiragem máxima da edição limitada (1 a 9999).' using errcode='P0001'; end if;
  if coalesce(p_numbered, false) and p_edition <> 'limited' then raise exception 'Só edição limitada é numerada.' using errcode='P0001'; end if;
  if p_master_path is not null and p_master_path not like auth.uid()::text || '/%' then raise exception 'Arquivo inválido.' using errcode='P0001'; end if;
  if jsonb_typeof(p_sizes) <> 'array' or jsonb_array_length(p_sizes) = 0 then raise exception 'Escolha pelo menos um tamanho.' using errcode='P0001'; end if;
  if jsonb_array_length(p_sizes) > 12 then raise exception 'No máximo 12 opções de papel e tamanho.' using errcode='P0001'; end if;

  select * into o from public.print_offers where work_id = p_work for update;
  if o.id is not null and o.sold_count > 0 then
    if p_edition <> o.edition or coalesce(p_signed, false) <> o.signed or coalesce(p_numbered, false) <> o.numbered then
      raise exception 'Depois da primeira venda, tipo de edição, assinatura e numeração não mudam.' using errcode='P0001'; end if;
    if p_edition = 'limited' and p_edition_max <> o.edition_max then
      raise exception 'Depois da primeira venda, a tiragem da edição limitada não muda.' using errcode='P0001'; end if;
  end if;

  insert into public.print_offers(work_id, artist_id, edition, edition_max, signed, numbered, master_path, master_w, master_h)
  values (p_work, auth.uid(), p_edition, case when p_edition = 'limited' then p_edition_max end, coalesce(p_signed, false), coalesce(p_numbered, false),
          p_master_path, p_master_w, p_master_h)
  on conflict (work_id) do update set edition = excluded.edition, edition_max = excluded.edition_max, signed = excluded.signed,
    numbered = excluded.numbered, master_path = coalesce(excluded.master_path, public.print_offers.master_path),
    master_w = case when excluded.master_path is null then public.print_offers.master_w else excluded.master_w end,
    master_h = case when excluded.master_path is null then public.print_offers.master_h else excluded.master_h end,
    status = 'draft', authorization_id = null, updated_at = now()   -- pausa do admin (paused_reason) continua valendo
  returning id into v;

  delete from public.print_offer_sizes where offer_id = v;
  for it in select * from jsonb_array_elements(p_sizes) loop
    if not exists(select 1 from public.print_products where id = (it->>'product')::uuid and active)
       or not exists(select 1 from public.print_sizes where id = (it->>'size')::uuid and active) then
      raise exception 'Papel ou tamanho indisponível.' using errcode='P0001'; end if;
    insert into public.print_offer_sizes(offer_id, product_id, size_id, artist_fee_cents)
    values (v, (it->>'product')::uuid, (it->>'size')::uuid, (it->>'fee_cents')::int);
    n := n + 1;
  end loop;
  return v;
end $$;

-- termos e texto da autorização para as condições atuais (o artista lê antes de aceitar)
create or replace function public._print_terms(p_offer uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare o public.print_offers; wk public.works; s public.commerce_settings := public.commerce_current(); r record; sizes jsonb := '[]'; q jsonb; px numeric;
begin
  select * into o from public.print_offers where id = p_offer;
  select * into wk from public.works where id = o.work_id;
  if o.master_path is null then raise exception 'Envie o arquivo-mestre em alta resolução.' using errcode='P0001'; end if;
  for r in select os.*, p.name pname, p.paper, p.finish, p.min_dpi, z.label, z.w_cm, z.h_cm
           from public.print_offer_sizes os join public.print_products p on p.id = os.product_id join public.print_sizes z on z.id = os.size_id
           where os.offer_id = p_offer order by z.w_cm * z.h_cm, p.name loop
    -- resolução: o lado maior do arquivo cobre o lado maior do papel (e o menor, o menor) no DPI mínimo do papel
    px := r.min_dpi / 2.54;
    if greatest(o.master_w, o.master_h) < ceil(greatest(r.w_cm, r.h_cm) * px) or least(o.master_w, o.master_h) < ceil(least(r.w_cm, r.h_cm) * px) then
      raise exception 'O arquivo-mestre (% × % px) é pequeno para % em % (mínimo % × % px a % dpi).',
        o.master_w, o.master_h, r.label, r.pname, ceil(greatest(r.w_cm, r.h_cm) * px), ceil(least(r.w_cm, r.h_cm) * px), r.min_dpi using errcode='P0001'; end if;
    q := public._print_price(public._print_best_cost(r.product_id, r.size_id), o.signed, r.artist_fee_cents, s);
    sizes := sizes || jsonb_build_object('product', r.product_id, 'size', r.size_id, 'product_name', r.pname, 'paper', r.paper, 'finish', r.finish,
      'label', r.label, 'w_cm', r.w_cm, 'h_cm', r.h_cm, 'artist_fee', r.artist_fee_cents, 'price', q->'final', 'quote', q);
  end loop;
  if jsonb_array_length(sizes) = 0 then raise exception 'Escolha pelo menos um tamanho.' using errcode='P0001'; end if;
  return jsonb_build_object('work', jsonb_build_object('id', wk.id, 'no', wk.no, 'title', wk.title, 'year', wk.year),
    'edition', o.edition, 'edition_max', o.edition_max, 'signed', o.signed, 'numbered', o.numbered,
    'master', jsonb_build_object('path', o.master_path, 'w', o.master_w, 'h', o.master_h), 'settings_id', s.id, 'sizes', sizes);
end $$;

create or replace function public._brl_cents(c bigint) returns text language sql immutable set search_path='' as $$
  select 'R$ ' || translate(to_char(c / 100.0, 'FM999,999,999,990.00'), ',.', '.,')
$$;

create or replace function public._print_auth_body(t jsonb, p_artist uuid) returns text
language plpgsql stable security definer set search_path='' as $$
declare ap public.profiles; k public.kyc; lines text := ''; z jsonb;
begin
  select * into ap from public.profiles where id = p_artist;
  select * into k from public.kyc where user_id = p_artist;
  for z in select * from jsonb_array_elements(t->'sizes') loop
    lines := lines || format(E'- %s, %s (%s × %s cm): remuneração de %s por exemplar; preço ao comprador %s.\n',
      z->>'product_name', z->>'label', replace(z->>'w_cm', '.', ','), replace(z->>'h_cm', '.', ','),
      public._brl_cents((z->>'artist_fee')::bigint), public._brl_cents((z->>'price')::bigint));
  end loop;
  return format(E'# Autorização de reprodução\n\n'
    'Eu, %s (%s), membro %s, autor(a) da obra **%s** (%s), registrada na rede PONCI sob o nº %s, autorizo a PONCI a produzir, '
    'por meio de gráficas homologadas, e a vender reproduções impressas dessa obra exclusivamente nas condições abaixo.\n\n'
    '## Condições\n\n'
    '- Edição: %s.\n'
    '- %s\n'
    '- Arquivo-mestre fornecido por mim: %s × %s px.\n\n'
    '## Papéis, tamanhos e valores\n\n%s\n'
    '## Compromissos\n\n'
    '1. A reprodução é feita sem cortes nem alterações da imagem; cada exemplar é vendido como reprodução, nunca como original.\n'
    '2. A produção de cada exemplar só começa depois do pagamento confirmado.\n'
    '3. Em edição limitada, a PONCI controla a numeração e não produz exemplares além da tiragem.\n'
    '4. Esta autorização não transfere direitos autorais: autorizo apenas estas reproduções, nestas condições. '
    'Qualquer mudança exige nova autorização; posso pausar a venda a qualquer momento, sem afetar exemplares já vendidos.\n'
    '5. A certificação da PONCI não substitui esta autorização nem a documentação dos direitos.\n',
    coalesce(k.legal_name, ap.display_name), ap.display_name, ap.member_code, t->'work'->>'title', t->'work'->>'year', t->'work'->>'no',
    case when t->>'edition' = 'limited' then format('limitada, tiragem máxima de %s exemplares somando todos os tamanhos', t->>'edition_max') else 'aberta, sem limite de exemplares' end,
    case when (t->>'signed')::boolean and (t->>'numbered')::boolean then 'Cada exemplar é assinado e numerado por mim antes do envio.'
         when (t->>'signed')::boolean then 'Cada exemplar é assinado por mim antes do envio.'
         else 'Exemplares sem assinatura, enviados direto da gráfica ao comprador.' end,
    t->'master'->>'w', t->'master'->>'h', lines);
end $$;
revoke execute on function public._print_terms(uuid), public._print_auth_body(jsonb, uuid), public._brl_cents(bigint) from public, anon, authenticated;

-- prévia da autorização (texto + hash). O artista aceita exatamente o que viu.
create or replace function public.print_authorization_preview(p_offer uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare t jsonb; b text;
begin
  if not exists(select 1 from public.print_offers where id = p_offer and artist_id = auth.uid()) then
    raise exception 'Oferta não encontrada.' using errcode='P0001'; end if;
  t := public._print_terms(p_offer); b := public._print_auth_body(t, auth.uid());
  return jsonb_build_object('terms', t, 'body', b, 'sha256', encode(extensions.digest(b, 'sha256'), 'hex'));
end $$;

-- autoriza e publica: só se o texto aceito for o mesmo das condições atuais
create or replace function public.publish_print_offer(p_offer uuid, p_sha256 text, p_ip text default null, p_ua text default null) returns uuid
language plpgsql security definer set search_path='' as $$
declare o public.print_offers; wk public.works; t jsonb; b text; h text; a uuid; z jsonb;
begin
  select * into o from public.print_offers where id = p_offer and artist_id = auth.uid() for update;
  if o.id is null then raise exception 'Oferta não encontrada.' using errcode='P0001'; end if;
  if not public.is_member() then raise exception 'Conta inativa.' using errcode='P0001'; end if;
  select * into wk from public.works where id = o.work_id;
  if wk.status = 'review' then raise exception 'A obra precisa ser aprovada pela curadoria antes de ter prints.' using errcode='P0001'; end if;
  if o.paused_reason is not null then
    raise exception 'A PONCI pausou estes prints: %. Fale com a curadoria para liberar.', o.paused_reason using errcode='P0001'; end if;
  t := public._print_terms(p_offer); b := public._print_auth_body(t, auth.uid()); h := encode(extensions.digest(b, 'sha256'), 'hex');
  if p_sha256 is distinct from h then raise exception 'As condições mudaram desde a prévia. Revise a autorização de novo.' using errcode='P0001'; end if;
  insert into public.print_authorizations(offer_id, work_id, artist_id, terms, body, sha256, ip, ua)
  values (o.id, o.work_id, auth.uid(), t, b, h, left(p_ip, 64), left(p_ua, 300)) returning id into a;
  for z in select * from jsonb_array_elements(t->'sizes') loop
    update public.print_offer_sizes set cost_id = (z->'quote'->>'cost_id')::uuid, settings_id = (z->'quote'->>'settings_id')::bigint,
      breakdown = z->'quote', price_cents = (z->>'price')::int
    where offer_id = o.id and product_id = (z->>'product')::uuid and size_id = (z->>'size')::uuid;
  end loop;
  update public.print_offers set status = 'active', authorization_id = a, paused_reason = null, published_at = coalesce(published_at, now()), updated_at = now()
  where id = o.id;
  return a;
end $$;

create or replace function public.pause_print_offer(p_offer uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
  update public.print_offers set status = 'paused', updated_at = now() where id = p_offer and artist_id = auth.uid() and status = 'active';
  if not found then raise exception 'Oferta não encontrada ou não está à venda.' using errcode='P0001'; end if;
end $$;

-- admin tira uma oferta do ar (padrão de qualidade, direito autoral), com motivo; o artista vê o motivo
create or replace function public.admin_pause_print_offer(p_offer uuid, p_reason text) returns void
language plpgsql security definer set search_path='' as $$
begin
  perform public._require_admin();
  if length(btrim(coalesce(p_reason, ''))) < 5 then raise exception 'Explique o motivo para o artista.' using errcode='P0001'; end if;
  update public.print_offers set status = 'paused', paused_reason = left(btrim(p_reason), 500), updated_at = now() where id = p_offer;
  if not found then raise exception 'Oferta não encontrada.' using errcode='P0001'; end if;
end $$;

-- admin libera uma oferta que tinha pausado (o artista publica de novo, com nova autorização)
create or replace function public.admin_release_print_offer(p_offer uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
  perform public._require_admin();
  update public.print_offers set paused_reason = null, updated_at = now() where id = p_offer and paused_reason is not null;
  if not found then raise exception 'Oferta não estava pausada pela PONCI.' using errcode='P0001'; end if;
end $$;

revoke execute on function public.save_print_offer(uuid, text, int, boolean, boolean, jsonb, text, int, int), public.print_authorization_preview(uuid),
  public.publish_print_offer(uuid, text, text, text), public.pause_print_offer(uuid), public.admin_pause_print_offer(uuid, text), public.admin_release_print_offer(uuid) from public, anon;
grant execute on function public.save_print_offer(uuid, text, int, boolean, boolean, jsonb, text, int, int), public.print_authorization_preview(uuid),
  public.publish_print_offer(uuid, text, text, text), public.pause_print_offer(uuid), public.admin_pause_print_offer(uuid, text), public.admin_release_print_offer(uuid) to authenticated;

-- ---------- Comprador vê ----------
-- opções de print à venda de uma obra (preço congelado na publicação; sem custos nem fornecedor)
create or replace function public.work_print_options(p_work uuid)
returns table(offer_id uuid, edition text, edition_max int, remaining int, signed boolean, numbered boolean,
              product_id uuid, product_name text, paper text, finish text, size_id uuid, label text, w_cm numeric, h_cm numeric, price_cents int)
language sql stable security definer set search_path='' as $$
  select o.id, o.edition, o.edition_max, case when o.edition = 'limited' then o.edition_max - o.sold_count end, o.signed, o.numbered,
         p.id, p.name, p.paper, p.finish, z.id, z.label, z.w_cm, z.h_cm, os.price_cents
  from public.print_offers o
  join public.works wk on wk.id = o.work_id and wk.status <> 'review'
  join public.print_offer_sizes os on os.offer_id = o.id and os.price_cents is not null
  join public.print_products p on p.id = os.product_id
  join public.print_sizes z on z.id = os.size_id
  where o.work_id = p_work and o.status = 'active' and public.is_member()
    and (o.edition = 'open' or o.sold_count < o.edition_max)
  order by z.w_cm * z.h_cm, p.name
$$;
revoke execute on function public.work_print_options(uuid) from public, anon;
grant execute on function public.work_print_options(uuid) to authenticated;

-- ---------- Admin: catálogo ----------
create or replace function public.admin_print_supplier_save(p_id uuid, p_name text, p_city text, p_contact text, p_notes text, p_active boolean) returns uuid
language plpgsql security definer set search_path='' as $$
declare v uuid;
begin
  perform public._require_admin();
  if p_id is null then
    insert into public.print_suppliers(name, city, contact, notes, active) values (btrim(p_name), btrim(coalesce(p_city,'')), btrim(coalesce(p_contact,'')), btrim(coalesce(p_notes,'')), coalesce(p_active, true)) returning id into v;
  else
    update public.print_suppliers set name = btrim(p_name), city = btrim(coalesce(p_city,'')), contact = btrim(coalesce(p_contact,'')), notes = btrim(coalesce(p_notes,'')), active = coalesce(p_active, active)
    where id = p_id returning id into v;
    if v is null then raise exception 'Fornecedor não encontrado.' using errcode='P0001'; end if;
  end if;
  return v;
end $$;

create or replace function public.admin_print_product_save(p_id uuid, p_name text, p_paper text, p_finish text, p_description text, p_min_dpi int, p_active boolean) returns uuid
language plpgsql security definer set search_path='' as $$
declare v uuid;
begin
  perform public._require_admin();
  if p_id is null then
    insert into public.print_products(name, paper, finish, description, min_dpi, active) values (btrim(p_name), btrim(coalesce(p_paper,'')), btrim(coalesce(p_finish,'')), btrim(coalesce(p_description,'')), p_min_dpi, coalesce(p_active, true)) returning id into v;
  else
    update public.print_products set name = btrim(p_name), paper = btrim(coalesce(p_paper,'')), finish = btrim(coalesce(p_finish,'')), description = btrim(coalesce(p_description,'')), min_dpi = p_min_dpi, active = coalesce(p_active, active)
    where id = p_id returning id into v;
    if v is null then raise exception 'Papel não encontrado.' using errcode='P0001'; end if;
  end if;
  return v;
end $$;

create or replace function public.admin_print_size_save(p_id uuid, p_label text, p_w numeric, p_h numeric, p_active boolean) returns uuid
language plpgsql security definer set search_path='' as $$
declare v uuid;
begin
  perform public._require_admin();
  if p_id is null then
    insert into public.print_sizes(label, w_cm, h_cm, active) values (btrim(p_label), p_w, p_h, coalesce(p_active, true)) returning id into v;
  else
    update public.print_sizes set label = btrim(p_label), active = coalesce(p_active, active) where id = p_id returning id into v;   -- medidas não mudam
    if v is null then raise exception 'Tamanho não encontrado.' using errcode='P0001'; end if;
  end if;
  return v;
end $$;

create or replace function public.admin_print_cost_add(p_supplier uuid, p_product uuid, p_size uuid, p_print int, p_prep int, p_packaging int, p_shipping int, p_signed_extra int,
  p_valid_from date, p_note text) returns uuid
language plpgsql security definer set search_path='' as $$
declare v uuid;
begin
  perform public._require_admin();
  -- a linha anterior do mesmo fornecedor × papel × tamanho é substituída (ofertas já publicadas guardam a cópia)
  update public.print_costs set ended_at = now()
  where supplier_id = p_supplier and product_id = p_product and size_id = p_size and ended_at is null;
  insert into public.print_costs(supplier_id, product_id, size_id, print_cents, prep_cents, packaging_cents, shipping_cents, signed_extra_cents, valid_from, note, created_by)
  values (p_supplier, p_product, p_size, p_print, coalesce(p_prep,0), coalesce(p_packaging,0), coalesce(p_shipping,0), coalesce(p_signed_extra,0),
          coalesce(p_valid_from, current_date), btrim(coalesce(p_note,'')), auth.jwt()->>'email')
  returning id into v;
  return v;
end $$;

create or replace function public.admin_print_cost_end(p_cost uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
  perform public._require_admin();
  update public.print_costs set ended_at = now() where id = p_cost and ended_at is null;
  if not found then raise exception 'Custo não encontrado ou já encerrado.' using errcode='P0001'; end if;
end $$;

revoke execute on function public.admin_print_supplier_save(uuid, text, text, text, text, boolean), public.admin_print_product_save(uuid, text, text, text, text, int, boolean),
  public.admin_print_size_save(uuid, text, numeric, numeric, boolean), public.admin_print_cost_add(uuid, uuid, uuid, int, int, int, int, int, date, text),
  public.admin_print_cost_end(uuid) from public, anon;
grant execute on function public.admin_print_supplier_save(uuid, text, text, text, text, boolean), public.admin_print_product_save(uuid, text, text, text, text, int, boolean),
  public.admin_print_size_save(uuid, text, numeric, numeric, boolean), public.admin_print_cost_add(uuid, uuid, uuid, int, int, int, int, int, date, text),
  public.admin_print_cost_end(uuid) to authenticated;
