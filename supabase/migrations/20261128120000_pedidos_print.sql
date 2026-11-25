-- Compra de prints (Fase 2b). Fluxo curto para o comprador e automático depois do pagamento:
--   comprar (1 clique, endereço do cadastro) → aguardando pagamento (vaga da edição guardada por 48 h)
--   → admin confirma o pagamento → número da edição atribuído na hora, em produção na gráfica
--   → despachado com rastreio (pela gráfica; se assinado, pela artista depois de assinar) → recebido → repasse.
-- Sem gateway de pagamento ainda: a confirmação do pagamento é a única etapa manual, e é ela que libera a produção.
-- Preço, remuneração e detalhamento são copiados da oferta no momento da compra: mudar a oferta depois não altera o pedido.

create sequence if not exists public.print_order_seq start 1001;

create table if not exists public.print_orders(
  id uuid primary key default gen_random_uuid(),
  ref text unique not null default 'PRT-' || nextval('public.print_order_seq'),
  offer_id uuid not null references public.print_offers on delete restrict,
  work_id uuid not null references public.works on delete restrict,
  artist_id uuid not null references public.profiles on delete restrict,
  buyer_id uuid not null references public.profiles on delete restrict,
  product_id uuid not null references public.print_products on delete restrict,
  size_id uuid not null references public.print_sizes on delete restrict,
  product_name text not null, size_label text not null, w_cm numeric(6,1) not null, h_cm numeric(6,1) not null,
  price_cents int not null check (price_cents > 0),
  artist_fee_cents int not null check (artist_fee_cents > 0),
  breakdown jsonb not null,
  supplier_id uuid references public.print_suppliers on delete restrict,
  edition text not null check (edition in ('open','limited')),
  edition_max int,
  edition_no int,                                   -- atribuído na confirmação do pagamento
  signed boolean not null, numbered boolean not null,
  ship_to jsonb not null,                           -- endereço do comprador no momento da compra
  status text not null default 'awaiting_payment' check (status in ('awaiting_payment','in_production','shipped','delivered','cancelled')),
  supplier_ref text, sent_to_supplier_at timestamptz,
  carrier text, tracking_code text,
  expires_at timestamptz not null default now() + interval '48 hours',
  paid_at timestamptz, shipped_at timestamptz, delivered_at timestamptz,
  cancelled_at timestamptz, cancel_reason text,
  payout_at timestamptz, payout_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint print_orders_edition_no_ck check (edition_no is null or (edition = 'limited' and edition_no between 1 and edition_max))
);
create index if not exists print_orders_buyer_idx on public.print_orders(buyer_id, created_at desc);
create index if not exists print_orders_artist_idx on public.print_orders(artist_id, created_at desc);
create index if not exists print_orders_offer_idx on public.print_orders(offer_id) where status <> 'cancelled';
create unique index if not exists print_orders_edition_no_uq on public.print_orders(offer_id, edition_no) where edition_no is not null;

alter table public.print_orders enable row level security;
-- comprador e admin leem a linha inteira; a artista lê pela função artist_print_orders (endereço só quando precisa enviar)
drop policy if exists "pedidos de print: comprador e admin" on public.print_orders;
create policy "pedidos de print: comprador e admin" on public.print_orders for select to authenticated
  using (buyer_id = (select auth.uid()) or (select public.is_admin()));
drop trigger if exists audit_print_orders on public.print_orders;
create trigger audit_print_orders after insert or update or delete on public.print_orders for each row execute function public._audit();

-- vagas ocupadas de uma edição limitada: vendidos + pedidos aguardando pagamento ainda no prazo
create or replace function public._print_held(p_offer uuid) returns int language sql stable security definer set search_path='' as $$
  select count(*)::int from public.print_orders where offer_id = p_offer and status = 'awaiting_payment' and expires_at > now()
$$;

-- ---------- comprador ----------
create or replace function public.buy_print(p_offer uuid, p_product uuid, p_size uuid) returns text
language plpgsql security definer set search_path='' as $$
declare o public.print_offers; os public.print_offer_sizes; k public.kyc; pr public.print_products; z public.print_sizes; v_ref text;
begin
  if not public.is_member() then raise exception 'Conta inativa.' using errcode='P0001'; end if;
  select * into o from public.print_offers where id = p_offer for update;
  if o.id is null or o.status <> 'active' then raise exception 'Este print não está à venda agora.' using errcode='P0001'; end if;
  if o.artist_id = auth.uid() then raise exception 'Você não pode comprar print da própria obra.' using errcode='P0001'; end if;
  select * into os from public.print_offer_sizes where offer_id = p_offer and product_id = p_product and size_id = p_size and price_cents is not null;
  if os.offer_id is null then raise exception 'Papel ou tamanho indisponível.' using errcode='P0001'; end if;
  select * into k from public.kyc where user_id = auth.uid();
  if k.user_id is null or k.completed_at is null or coalesce(k.cep, '') = '' or coalesce(k.street, '') = '' or coalesce(k.city, '') = '' then
    raise exception 'Complete seu cadastro com o endereço de entrega antes de comprar.' using errcode='P0001'; end if;
  if o.edition = 'limited' and o.sold_count + public._print_held(o.id) >= o.edition_max then
    raise exception 'Esta edição esgotou.' using errcode='P0001'; end if;
  if exists(select 1 from public.print_orders where buyer_id = auth.uid() and offer_id = o.id and status = 'awaiting_payment' and expires_at > now()) then
    raise exception 'Você já tem um pedido deste print aguardando pagamento. Veja em Aquisições.' using errcode='P0001'; end if;
  select * into pr from public.print_products where id = p_product;
  select * into z from public.print_sizes where id = p_size;
  insert into public.print_orders(offer_id, work_id, artist_id, buyer_id, product_id, size_id, product_name, size_label, w_cm, h_cm,
    price_cents, artist_fee_cents, breakdown, supplier_id, edition, edition_max, signed, numbered, ship_to)
  values (o.id, o.work_id, o.artist_id, auth.uid(), p_product, p_size, pr.name, z.label, z.w_cm, z.h_cm,
    os.price_cents, os.artist_fee_cents, os.breakdown, (os.breakdown->>'supplier_id')::uuid, o.edition, o.edition_max, o.signed, o.numbered,
    jsonb_build_object('name', k.legal_name, 'phone', k.phone, 'cep', k.cep, 'street', k.street, 'number', k.number, 'complement', k.complement,
      'district', k.district, 'city', k.city, 'uf', k.uf))
  returning ref into v_ref;
  return v_ref;
end $$;

create or replace function public.cancel_print_order(p_order uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
  update public.print_orders set status = 'cancelled', cancelled_at = now(), cancel_reason = 'Cancelado pelo comprador antes do pagamento.', updated_at = now()
  where id = p_order and buyer_id = auth.uid() and status = 'awaiting_payment';
  if not found then raise exception 'Só dá para cancelar antes do pagamento.' using errcode='P0001'; end if;
end $$;

create or replace function public.confirm_print_received(p_order uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
  update public.print_orders set status = 'delivered', delivered_at = now(), updated_at = now()
  where id = p_order and buyer_id = auth.uid() and status = 'shipped';
  if not found then raise exception 'O print ainda não foi despachado.' using errcode='P0001'; end if;
end $$;

-- ---------- artista ----------
-- pedidos de print das obras da artista; o endereço do comprador só aparece quando é ela quem envia (print assinado, em produção)
create or replace function public.artist_print_orders()
returns table(id uuid, ref text, work_id uuid, product_name text, size_label text, w_cm numeric, h_cm numeric, artist_fee_cents int,
  edition text, edition_max int, edition_no int, signed boolean, numbered boolean, status text, carrier text, tracking_code text,
  buyer_city text, ship_to jsonb, paid_at timestamptz, shipped_at timestamptz, delivered_at timestamptz, payout_at timestamptz, created_at timestamptz)
language sql stable security definer set search_path='' as $$
  select o.id, o.ref, o.work_id, o.product_name, o.size_label, o.w_cm, o.h_cm, o.artist_fee_cents, o.edition, o.edition_max, o.edition_no, o.signed, o.numbered,
         o.status, o.carrier, o.tracking_code, coalesce(o.ship_to->>'city', '') || '/' || coalesce(o.ship_to->>'uf', ''),
         case when o.signed and o.status = 'in_production' then o.ship_to end, o.paid_at, o.shipped_at, o.delivered_at, o.payout_at, o.created_at
  from public.print_orders o
  where o.artist_id = auth.uid() and o.status <> 'cancelled' and (o.status <> 'awaiting_payment' or o.expires_at > now())
  order by o.created_at desc
$$;

-- print assinado: a artista assina, numera e despacha
create or replace function public.artist_ship_print(p_order uuid, p_carrier text, p_tracking text) returns void
language plpgsql security definer set search_path='' as $$
declare v_carrier text := btrim(coalesce(p_carrier, '')); v_code text := upper(btrim(coalesce(p_tracking, '')));
begin
  if v_carrier not in ('Correios','Jadlog','Loggi','Azul Cargo','Transportadora','Outra') then raise exception 'Escolha a forma de envio.' using errcode='P0001'; end if;
  if length(v_code) < 4 then raise exception 'Informe o código de rastreio.' using errcode='P0001'; end if;
  update public.print_orders set status = 'shipped', carrier = v_carrier, tracking_code = v_code, shipped_at = now(), updated_at = now()
  where id = p_order and artist_id = auth.uid() and signed and status = 'in_production';
  if not found then raise exception 'Pedido não encontrado ou ainda não pago.' using errcode='P0001'; end if;
end $$;

-- ---------- admin ----------
-- confirmar pagamento: libera a produção e numera o exemplar (automático)
create or replace function public.admin_confirm_print_payment(p_order uuid) returns int
language plpgsql security definer set search_path='' as $$
declare po public.print_orders; o public.print_offers; v_no int;
begin
  perform public._require_admin();
  select * into po from public.print_orders where id = p_order for update;
  if po.id is null or po.status <> 'awaiting_payment' then raise exception 'Pedido não está aguardando pagamento.' using errcode='P0001'; end if;
  select * into o from public.print_offers where id = po.offer_id for update;
  if o.edition = 'limited' then
    if o.sold_count >= o.edition_max then raise exception 'A edição esgotou: cancele este pedido e devolva o valor.' using errcode='P0001'; end if;
    v_no := o.sold_count + 1;
  end if;
  update public.print_offers set sold_count = sold_count + 1, updated_at = now() where id = o.id;
  update public.print_orders set status = 'in_production', paid_at = now(), edition_no = v_no, updated_at = now() where id = po.id;
  return v_no;
end $$;

create or replace function public.admin_print_order_action(p_order uuid, p_action text, p_carrier text default null, p_tracking text default null, p_note text default null)
returns void language plpgsql security definer set search_path='' as $$
declare po public.print_orders; v_carrier text := btrim(coalesce(p_carrier, '')); v_code text := upper(btrim(coalesce(p_tracking, ''))); v_note text := btrim(coalesce(p_note, ''));
begin
  perform public._require_admin();
  select * into po from public.print_orders where id = p_order for update;
  if po.id is null then raise exception 'Pedido não encontrado.' using errcode='P0001'; end if;
  if p_action = 'supplier' then          -- ordem enviada à gráfica
    if po.status <> 'in_production' then raise exception 'Só pedidos pagos vão para a gráfica.' using errcode='P0001'; end if;
    update public.print_orders set sent_to_supplier_at = now(), supplier_ref = nullif(left(v_note, 120), ''), updated_at = now() where id = po.id;
  elsif p_action = 'shipped' then        -- gráfica despachou direto ao comprador (print sem assinatura)
    if po.status <> 'in_production' then raise exception 'Pedido não está em produção.' using errcode='P0001'; end if;
    if po.signed then raise exception 'Print assinado é despachado pela artista.' using errcode='P0001'; end if;
    if v_carrier = '' or length(v_code) < 4 then raise exception 'Informe transportadora e rastreio.' using errcode='P0001'; end if;
    update public.print_orders set status = 'shipped', carrier = left(v_carrier, 60), tracking_code = left(v_code, 60), shipped_at = now(), updated_at = now() where id = po.id;
  elsif p_action = 'delivered' then
    if po.status <> 'shipped' then raise exception 'Pedido não foi despachado.' using errcode='P0001'; end if;
    update public.print_orders set status = 'delivered', delivered_at = now(), updated_at = now() where id = po.id;
  elsif p_action = 'cancel' then
    if po.status in ('delivered','cancelled') then raise exception 'Pedido já encerrado.' using errcode='P0001'; end if;
    if length(v_note) < 5 then raise exception 'Explique o motivo do cancelamento.' using errcode='P0001'; end if;
    if po.status <> 'awaiting_payment' then   -- já pago: devolve a vaga da edição (o número não é reaproveitado)
      update public.print_offers set sold_count = greatest(sold_count - 1, 0), updated_at = now() where id = po.offer_id and po.edition = 'open';
    end if;
    update public.print_orders set status = 'cancelled', cancelled_at = now(), cancel_reason = left(v_note, 300), updated_at = now() where id = po.id;
  elsif p_action = 'payout' then
    if po.status <> 'delivered' or po.payout_at is not null then raise exception 'Repasse só depois da entrega, uma vez.' using errcode='P0001'; end if;
    update public.print_orders set payout_at = now(), payout_note = nullif(left(v_note, 300), ''), updated_at = now() where id = po.id;
  else
    raise exception 'Ação inválida.' using errcode='P0001';
  end if;
end $$;

revoke execute on function public._print_held(uuid) from public, anon, authenticated;
revoke execute on function public.buy_print(uuid, uuid, uuid), public.cancel_print_order(uuid), public.confirm_print_received(uuid), public.artist_print_orders(),
  public.artist_ship_print(uuid, text, text), public.admin_confirm_print_payment(uuid), public.admin_print_order_action(uuid, text, text, text, text) from public, anon;
grant execute on function public.buy_print(uuid, uuid, uuid), public.cancel_print_order(uuid), public.confirm_print_received(uuid), public.artist_print_orders(),
  public.artist_ship_print(uuid, text, text), public.admin_confirm_print_payment(uuid), public.admin_print_order_action(uuid, text, text, text, text) to authenticated;

-- opções à venda: a "restam" passa a descontar as vagas guardadas por pedidos aguardando pagamento
create or replace function public.work_print_options(p_work uuid)
returns table(offer_id uuid, edition text, edition_max int, remaining int, signed boolean, numbered boolean,
              product_id uuid, product_name text, paper text, finish text, size_id uuid, label text, w_cm numeric, h_cm numeric, price_cents int)
language sql stable security definer set search_path='' as $$
  select o.id, o.edition, o.edition_max, case when o.edition = 'limited' then o.edition_max - o.sold_count - public._print_held(o.id) end, o.signed, o.numbered,
         p.id, p.name, p.paper, p.finish, z.id, z.label, z.w_cm, z.h_cm, os.price_cents
  from public.print_offers o
  join public.works wk on wk.id = o.work_id and wk.status <> 'review'
  join public.print_offer_sizes os on os.offer_id = o.id and os.price_cents is not null
  join public.print_products p on p.id = os.product_id
  join public.print_sizes z on z.id = os.size_id
  where o.work_id = p_work and o.status = 'active' and public.is_member()
    and (o.edition = 'open' or o.sold_count + public._print_held(o.id) < o.edition_max)
  order by z.w_cm * z.h_cm, p.name
$$;
