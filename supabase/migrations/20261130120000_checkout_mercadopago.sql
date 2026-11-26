-- E-commerce: sacola, checkout único (originais + prints num só pedido) e pagamento pelo Mercado Pago.
--
-- Fluxo:
--   sacola (cart_items) → checkout_create(): reserva os originais (contrato assinado pelas duas partes, artista
--   automaticamente) e cria os pedidos de print, tudo dentro de um pedido PED-; a sacola esvazia.
--   Se o Mercado Pago estiver conectado, o banco pede a preferência de pagamento (pg_net) e o site manda o comprador
--   para a página do Mercado Pago. O Mercado Pago avisa o site (webhook) → mp_notify() → o banco consulta o
--   pagamento na API do Mercado Pago com o token do cofre e só marca "pago" se estiver aprovado, com a referência
--   e o valor certos. Pago: originais vão para a artista despachar; prints entram em produção já numerados.
--   Sem pagamento em 3 dias, tudo cai sozinho (originais voltam para a galeria).
-- O token nunca sai do cofre (Vault), como o do Instagram.

-- ---------- configuração e token ----------
create table if not exists public.pay_settings(
  id int primary key default 1 check (id = 1),
  connected_at timestamptz, account_label text, sandbox boolean not null default false,
  last_tick_at timestamptz, last_message text
);
insert into public.pay_settings(id) values (1) on conflict do nothing;
alter table public.pay_settings enable row level security;
drop policy if exists "pagamento: admin lê" on public.pay_settings;
create policy "pagamento: admin lê" on public.pay_settings for select to authenticated using ((select public.is_admin()));

create or replace function public.admin_mp_set_token(p_token text, p_label text, p_sandbox boolean) returns void
language plpgsql security definer set search_path='' as $$
declare v uuid;
begin
  perform public._require_admin();
  if p_token is null or length(btrim(p_token)) < 20 then raise exception 'Token inválido.' using errcode='P0001'; end if;
  select id into v from vault.secrets where name = 'mp_access_token';
  if v is null then perform vault.create_secret(btrim(p_token), 'mp_access_token', 'Mercado Pago · PONCI');
  else perform vault.update_secret(v, btrim(p_token)); end if;
  update public.pay_settings set connected_at = now(), account_label = left(coalesce(p_label, ''), 120), sandbox = coalesce(p_sandbox, false), last_message = null where id = 1;
end $$;
revoke execute on function public.admin_mp_set_token(text, text, boolean) from public, anon;
grant execute on function public.admin_mp_set_token(text, text, boolean) to authenticated;

create or replace function public._mp_token() returns text language sql stable security definer set search_path='' as $$
  select decrypted_secret from vault.decrypted_secrets where name = 'mp_access_token' limit 1
$$;
revoke execute on function public._mp_token() from public, anon, authenticated;

-- o site pode mostrar "pague com Mercado Pago" sem ver o token
create or replace function public.payments_ready() returns boolean language sql stable security definer set search_path='' as $$
  select public._mp_token() is not null
$$;
grant execute on function public.payments_ready() to authenticated;

-- ---------- sacola ----------
create table if not exists public.cart_items(
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles on delete cascade,
  kind text not null check (kind in ('original','print')),
  work_id uuid not null references public.works on delete cascade,
  offer_id uuid references public.print_offers on delete cascade,
  product_id uuid references public.print_products on delete cascade,
  size_id uuid references public.print_sizes on delete cascade,
  created_at timestamptz not null default now(),
  constraint cart_items_print_ck check ((kind = 'print') = (offer_id is not null and product_id is not null and size_id is not null))
);
create unique index if not exists cart_items_uq on public.cart_items(buyer_id, kind, work_id, coalesce(product_id, '00000000-0000-0000-0000-000000000000'::uuid), coalesce(size_id, '00000000-0000-0000-0000-000000000000'::uuid));
alter table public.cart_items enable row level security;
drop policy if exists "sacola: dono lê" on public.cart_items;
create policy "sacola: dono lê" on public.cart_items for select to authenticated using (buyer_id = (select auth.uid()));
drop policy if exists "sacola: dono tira" on public.cart_items;
create policy "sacola: dono tira" on public.cart_items for delete to authenticated using (buyer_id = (select auth.uid()));

create or replace function public.cart_add(p_kind text, p_work uuid, p_product uuid default null, p_size uuid default null) returns int
language plpgsql security definer set search_path='' as $$
declare wk public.works; o public.print_offers; n int;
begin
  if not public.is_member() or public.my_role() <> 'buyer' then raise exception 'Só colecionadores compram.' using errcode='P0001'; end if;
  select * into wk from public.works where id = p_work;
  if wk.id is null then raise exception 'Obra não encontrada.' using errcode='P0001'; end if;
  if p_kind = 'original' then
    if wk.status <> 'published' then raise exception 'O original não está disponível.' using errcode='P0001'; end if;
    insert into public.cart_items(buyer_id, kind, work_id) values (auth.uid(), 'original', p_work) on conflict do nothing;
  elsif p_kind = 'print' then
    select * into o from public.print_offers where work_id = p_work and status = 'active';
    if o.id is null or not exists(select 1 from public.print_offer_sizes where offer_id = o.id and product_id = p_product and size_id = p_size and price_cents is not null) then
      raise exception 'Este print não está disponível.' using errcode='P0001'; end if;
    if public._is_demo(o.artist_id) and not public._is_demo(auth.uid()) then
      raise exception 'Esta é uma obra de demonstração: o print é só um exemplo e não pode ser comprado.' using errcode='P0001'; end if;
    insert into public.cart_items(buyer_id, kind, work_id, offer_id, product_id, size_id) values (auth.uid(), 'print', p_work, o.id, p_product, p_size) on conflict do nothing;
  else raise exception 'Item inválido.' using errcode='P0001'; end if;
  select count(*) into n from public.cart_items where buyer_id = auth.uid();
  if n > 10 then raise exception 'A sacola aceita até 10 itens.' using errcode='P0001'; end if;
  return n;
end $$;

-- a sacola com preço atual e disponibilidade de cada item
create or replace function public.cart_view()
returns table(id uuid, kind text, work_id uuid, slug text, title text, artist_name text, image_path text, img_w int, img_h int,
              label text, price_cents bigint, available boolean, note text)
language sql stable security definer set search_path='' as $$
  select c.id, c.kind, w.id, w.slug, w.title, ap.display_name, w.image_path, w.img_w, w.img_h,
    case when c.kind = 'original' then 'Obra original · ' || w.h || ' × ' || w.w || ' cm'
         else 'Print · ' || z.label || ' · ' || p.name end,
    case when c.kind = 'original' then w.price::bigint * 100 else os.price_cents::bigint end,
    case when c.kind = 'original' then w.status = 'published'
         else o.status = 'active' and os.price_cents is not null and (o.edition = 'open' or o.sold_count + public._print_held(o.id) < o.edition_max) end,
    case when c.kind = 'original' and w.status <> 'published' then 'Alguém comprou antes.'
         when c.kind = 'print' and (o.status is distinct from 'active' or os.price_cents is null) then 'Este print saiu de venda.'
         when c.kind = 'print' and o.edition = 'limited' and o.sold_count + public._print_held(o.id) >= o.edition_max then 'Edição esgotada.'
         when c.kind = 'print' and o.edition = 'limited' then 'Edição limitada · restam ' || (o.edition_max - o.sold_count - public._print_held(o.id))
         else null end
  from public.cart_items c
  join public.works w on w.id = c.work_id
  join public.profiles ap on ap.id = w.artist_id
  left join public.print_offers o on o.id = c.offer_id
  left join public.print_offer_sizes os on os.offer_id = c.offer_id and os.product_id = c.product_id and os.size_id = c.size_id
  left join public.print_products p on p.id = c.product_id
  left join public.print_sizes z on z.id = c.size_id
  where c.buyer_id = auth.uid()
  order by c.created_at
$$;
revoke execute on function public.cart_add(text, uuid, uuid, uuid), public.cart_view() from public, anon;
grant execute on function public.cart_add(text, uuid, uuid, uuid), public.cart_view() to authenticated;

-- ---------- pedido (checkout) ----------
create sequence if not exists public.checkout_seq start 1001;
create table if not exists public.checkouts(
  id uuid primary key default gen_random_uuid(),
  ref text unique not null default 'PED-' || nextval('public.checkout_seq'),
  buyer_id uuid not null references public.profiles on delete restrict,
  total_cents bigint not null check (total_cents > 0),
  items jsonb not null,                      -- resumo para a tela (título, imagem, tipo, preço)
  status text not null default 'awaiting_payment' check (status in ('awaiting_payment','paid','expired','cancelled','problem')),
  pay_until timestamptz not null default now() + interval '3 days',
  mp_req_id bigint, mp_preference_id text, mp_init_point text, mp_error text,
  mp_payment_id text, paid_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists checkouts_buyer_idx on public.checkouts(buyer_id, created_at desc);
alter table public.checkouts enable row level security;
drop policy if exists "pedidos: comprador e admin" on public.checkouts;
create policy "pedidos: comprador e admin" on public.checkouts for select to authenticated
  using (buyer_id = (select auth.uid()) or (select public.is_admin()));
drop trigger if exists audit_checkouts on public.checkouts;
create trigger audit_checkouts after insert or update or delete on public.checkouts for each row execute function public._audit();

alter table public.orders add column if not exists checkout_id uuid references public.checkouts on delete set null;
alter table public.print_orders add column if not exists checkout_id uuid references public.checkouts on delete set null;

-- endereço público do site para o Mercado Pago voltar e avisar (só ponci.art)
create or replace function public._site(p_site text) returns text language sql immutable set search_path='' as $$
  select case when p_site ~ '^https://(www\.)?ponci\.art$' then p_site else 'https://ponci.art' end
$$;

create or replace function public._mp_request_preference(p_checkout uuid, p_site text) returns void
language plpgsql security definer set search_path='' as $$
declare c public.checkouts; tok text := public._mp_token(); site text := public._site(p_site); em text; items jsonb; req bigint;
begin
  if tok is null then return; end if;
  select * into c from public.checkouts where id = p_checkout;
  select email into em from auth.users where id = c.buyer_id;
  select jsonb_agg(jsonb_build_object('id', x->>'ref', 'title', left(x->>'title' || ' · ' || (x->>'label'), 250), 'quantity', 1,
    'currency_id', 'BRL', 'unit_price', round((x->>'price_cents')::numeric / 100, 2),
    'picture_url', case when x->>'image' is not null then 'https://wcdetrugbkgmapeehyxg.supabase.co/storage/v1/object/public/works/' || (x->>'image') end))
  into items from jsonb_array_elements(c.items) x;
  req := net.http_post('https://api.mercadopago.com/checkout/preferences',
    jsonb_strip_nulls(jsonb_build_object(
      'items', items, 'external_reference', c.ref,
      'payer', jsonb_build_object('email', em),
      'notification_url', site || '/api/mp/webhook?source_news=webhooks',
      'back_urls', jsonb_build_object('success', site || '/colecionador/pedido/' || c.ref, 'pending', site || '/colecionador/pedido/' || c.ref, 'failure', site || '/colecionador/pedido/' || c.ref),
      'auto_return', 'approved', 'statement_descriptor', 'PONCI', 'payment_methods', jsonb_build_object('installments', 12),
      'expires', true, 'expiration_date_to', to_char(c.pay_until at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.000"Z"'))),
    '{}'::jsonb, jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || tok, 'X-Idempotency-Key', c.ref || '-pref'), 20000);
  update public.checkouts set mp_req_id = req, mp_error = null, updated_at = now() where id = c.id;
end $$;

create or replace function public.checkout_create(p_site text default null, p_ip text default null, p_ua text default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare it record; v_ref text; cid uuid; c_ref text; total bigint := 0; summary jsonb := '[]'; n int := 0;
begin
  if not public.is_member() or public.my_role() <> 'buyer' then raise exception 'Só colecionadores compram.' using errcode='P0001'; end if;
  if exists(select 1 from public.cart_view() v where not v.available) then
    raise exception 'Algum item da sacola não está mais disponível. Tire-o para continuar.' using errcode='P0001'; end if;
  insert into public.checkouts(buyer_id, total_cents, items) values (auth.uid(), 1, '[]') returning id, ref into cid, c_ref;
  for it in select c.*, w.title, w.image_path, w.price from public.cart_items c join public.works w on w.id = c.work_id
            where c.buyer_id = auth.uid() order by c.created_at for update of c loop
    if it.kind = 'original' then
      v_ref := public.reserve_work(it.work_id, p_ip, p_ua);   -- exige cadastro completo; contrato assinado pelas duas partes
      update public.orders set checkout_id = cid, pay_until = (select pay_until from public.checkouts where id = cid) where ref = v_ref;
      total := total + it.price::bigint * 100;
      summary := summary || jsonb_build_object('kind', 'original', 'ref', v_ref, 'title', it.title, 'label', 'Obra original', 'price_cents', it.price::bigint * 100, 'image', it.image_path);
    else
      v_ref := public.buy_print(it.offer_id, it.product_id, it.size_id);
      update public.print_orders set checkout_id = cid, expires_at = (select pay_until from public.checkouts where id = cid) where ref = v_ref;
      select total + price_cents into total from public.print_orders where ref = v_ref;
      summary := summary || (select jsonb_build_object('kind', 'print', 'ref', v_ref, 'title', it.title, 'label', 'Print ' || size_label || ' · ' || product_name, 'price_cents', price_cents, 'image', it.image_path)
                              from public.print_orders where ref = v_ref);
    end if;
    n := n + 1;
  end loop;
  if n = 0 then raise exception 'Sua sacola está vazia.' using errcode='P0001'; end if;
  update public.checkouts set total_cents = total, items = summary where id = cid;
  delete from public.cart_items where buyer_id = auth.uid();
  perform public._mp_request_preference(cid, p_site);
  return jsonb_build_object('id', cid, 'ref', c_ref, 'mp', public._mp_token() is not null);
end $$;

-- lê a resposta do Mercado Pago (link de pagamento) quando ela chega
create or replace function public._mp_pref_collect(p_checkout uuid) returns void
language plpgsql security definer set search_path='' as $$
declare c public.checkouts; h record; j jsonb; sb boolean;
begin
  select * into c from public.checkouts where id = p_checkout for update;
  if c.mp_req_id is null or c.mp_init_point is not null then return; end if;
  select * into h from net._http_response where id = c.mp_req_id;
  if h.id is null then return; end if;
  select sandbox into sb from public.pay_settings where id = 1;
  begin j := h.content::jsonb; exception when others then j := null; end;
  if h.status_code between 200 and 299 and j ? 'id' then
    update public.checkouts set mp_preference_id = j->>'id', mp_init_point = case when sb then coalesce(j->>'sandbox_init_point', j->>'init_point') else j->>'init_point' end, updated_at = now() where id = c.id;
  else
    update public.checkouts set mp_error = left(coalesce(j->>'message', h.error_msg, 'Mercado Pago respondeu ' || h.status_code), 300), updated_at = now() where id = c.id;
  end if;
end $$;

-- ---------- confirmação do pagamento ----------
create table if not exists public.mp_events(
  payment_id text primary key check (payment_id ~ '^[0-9]{1,30}$'),
  req_id bigint, asked_at timestamptz, status text, detail text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.mp_events enable row level security;   -- só funções do banco mexem

-- o Mercado Pago avisou que algo aconteceu com um pagamento: o banco vai conferir na API (nada é confiado no aviso)
create or replace function public.mp_notify(p_payment_id text) returns void
language plpgsql security definer set search_path='' as $$
declare tok text := public._mp_token(); e public.mp_events;
begin
  if tok is null or p_payment_id !~ '^[0-9]{1,30}$' then return; end if;
  insert into public.mp_events(payment_id) values (p_payment_id) on conflict (payment_id) do nothing;
  select * into e from public.mp_events where payment_id = p_payment_id for update;
  if e.status in ('approved_ok','refunded','cancelled') then return; end if;
  if e.asked_at is not null and e.asked_at > now() - interval '10 seconds' then return; end if;   -- evita enxurrada
  update public.mp_events set asked_at = now(), updated_at = now(),
    req_id = net.http_get('https://api.mercadopago.com/v1/payments/' || p_payment_id, '{}'::jsonb, jsonb_build_object('Authorization', 'Bearer ' || tok), 20000)
  where payment_id = p_payment_id;
end $$;

create or replace function public._print_confirm(p_order uuid) returns int
language plpgsql security definer set search_path='' as $$
declare po public.print_orders; o public.print_offers; v_no int;
begin
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

create or replace function public.admin_confirm_print_payment(p_order uuid) returns int
language plpgsql security definer set search_path='' as $$
begin
  perform public._require_admin();
  return public._print_confirm(p_order);
end $$;

-- pedido pago: libera tudo
create or replace function public._checkout_paid(p_checkout uuid, p_payment text) returns void
language plpgsql security definer set search_path='' as $$
declare c public.checkouts; r record;
begin
  select * into c from public.checkouts where id = p_checkout for update;
  if c.status = 'paid' then return; end if;
  if c.status <> 'awaiting_payment' or exists(select 1 from public.orders where checkout_id = c.id and cancelled_at is not null)
     or exists(select 1 from public.print_orders where checkout_id = c.id and status = 'cancelled') then
    update public.checkouts set status = 'problem', mp_payment_id = p_payment, paid_at = now(), updated_at = now(),
      mp_error = 'Pagamento recebido depois que o pedido caiu: devolva o valor ou reative os itens.' where id = c.id;
    return;
  end if;
  update public.orders set stage = 1, paid_at = now() where checkout_id = c.id and stage = 0 and cancelled_at is null;
  for r in select id from public.print_orders where checkout_id = c.id and status = 'awaiting_payment' loop
    perform public._print_confirm(r.id);
  end loop;
  update public.checkouts set status = 'paid', paid_at = now(), mp_payment_id = p_payment, mp_error = null, updated_at = now() where id = c.id;
end $$;

-- lê as respostas da API de pagamentos que chegaram e aplica
create or replace function public._mp_collect() returns int
language plpgsql security definer set search_path='' as $$
declare e public.mp_events; h record; j jsonb; c public.checkouts; n int := 0; st text;
begin
  for e in select * from public.mp_events where req_id is not null and (status is null or status not in ('approved_ok','refunded','cancelled'))
           order by updated_at limit 50 for update skip locked loop
    select * into h from net._http_response where id = e.req_id;
    continue when h.id is null;
    begin j := h.content::jsonb; exception when others then j := null; end;
    if h.status_code <> 200 or j is null then
      update public.mp_events set status = 'error', detail = left(coalesce(j->>'message', h.error_msg, 'HTTP ' || h.status_code), 300), req_id = null, updated_at = now() where payment_id = e.payment_id;
      continue;
    end if;
    st := j->>'status';
    select * into c from public.checkouts where ref = j->>'external_reference';
    if st = 'approved' and c.id is not null and (j->>'transaction_amount')::numeric * 100 >= c.total_cents - 1 and (j->>'currency_id') = 'BRL' then
      perform public._checkout_paid(c.id, e.payment_id);
      st := 'approved_ok'; n := n + 1;
    elsif st = 'approved' then
      st := 'approved_mismatch';
    end if;
    update public.mp_events set status = st, detail = left(coalesce(j->>'external_reference', '') || ' · ' || coalesce(j->>'transaction_amount', '') || ' · ' || coalesce(j->>'status_detail', ''), 300), req_id = null, updated_at = now()
    where payment_id = e.payment_id;
  end loop;
  return n;
end $$;

-- comprador acompanha o pedido (e aproveita para puxar o que já chegou do Mercado Pago)
create or replace function public.checkout_status(p_checkout uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare c public.checkouts;
begin
  if not exists(select 1 from public.checkouts where id = p_checkout and buyer_id = auth.uid()) then raise exception 'Pedido não encontrado.' using errcode='P0001'; end if;
  perform public._mp_pref_collect(p_checkout);
  perform public._mp_collect();
  select * into c from public.checkouts where id = p_checkout;
  return jsonb_build_object('ref', c.ref, 'status', c.status, 'pay_link', c.mp_init_point, 'pay_error', c.mp_error, 'waiting_link', c.mp_req_id is not null and c.mp_init_point is null and c.mp_error is null);
end $$;

-- pedir um link novo (ex.: o anterior deu erro)
create or replace function public.checkout_retry_link(p_checkout uuid, p_site text default null) returns void
language plpgsql security definer set search_path='' as $$
begin
  if not exists(select 1 from public.checkouts where id = p_checkout and buyer_id = auth.uid() and status = 'awaiting_payment' and pay_until > now()) then
    raise exception 'Pedido não está aguardando pagamento.' using errcode='P0001'; end if;
  update public.checkouts set mp_req_id = null, mp_init_point = null, mp_error = null where id = p_checkout;
  perform public._mp_request_preference(p_checkout, p_site);
end $$;

-- admin: pagamento recebido por fora (Pix direto, transferência)
create or replace function public.admin_checkout_mark_paid(p_checkout uuid, p_note text) returns void
language plpgsql security definer set search_path='' as $$
begin
  perform public._require_admin();
  if length(btrim(coalesce(p_note, ''))) < 3 then raise exception 'Anote como foi pago.' using errcode='P0001'; end if;
  perform public._checkout_paid(p_checkout, 'manual: ' || left(btrim(p_note), 80));
end $$;

-- ---------- disparador (pg_cron) ----------
create or replace function public.pay_tick() returns void
language plpgsql security definer set search_path='' as $$
declare r record;
begin
  update public.pay_settings set last_tick_at = now() where id = 1;
  for r in select id from public.checkouts where mp_req_id is not null and mp_init_point is null and mp_error is null loop
    perform public._mp_pref_collect(r.id);
  end loop;
  perform public._mp_collect();
  -- pedido vencido: prints caem; originais caem pelo expire_unpaid_orders (mesmo prazo)
  with x as (update public.checkouts set status = 'expired', updated_at = now() where status = 'awaiting_payment' and pay_until < now() returning id)
  update public.print_orders set status = 'cancelled', cancelled_at = now(), cancel_reason = 'Pagamento não feito em 3 dias.', updated_at = now()
  where checkout_id in (select id from x) and status = 'awaiting_payment';
  perform public.expire_unpaid_orders();
end $$;
select cron.schedule('ponci-pagamentos', '* * * * *', 'select public.pay_tick()');

revoke execute on function public._site(text), public._mp_request_preference(uuid, text), public._mp_pref_collect(uuid), public._print_confirm(uuid),
  public._checkout_paid(uuid, text), public._mp_collect(), public.pay_tick() from public, anon, authenticated;
revoke execute on function public.checkout_create(text, text, text), public.checkout_status(uuid), public.checkout_retry_link(uuid, text),
  public.admin_checkout_mark_paid(uuid, text), public.admin_confirm_print_payment(uuid) from public, anon;
grant execute on function public.checkout_create(text, text, text), public.checkout_status(uuid), public.checkout_retry_link(uuid, text),
  public.admin_checkout_mark_paid(uuid, text), public.admin_confirm_print_payment(uuid) to authenticated;
-- o aviso do Mercado Pago chega sem login
revoke execute on function public.mp_notify(text) from public;
grant execute on function public.mp_notify(text) to anon, authenticated;

-- ---------- frete grátis embutido ----------
-- regra nova: o preço do original já inclui o envio (a artista embala e despacha). Obras demo seguem a regra.
alter table public.works alter column ship_included set default true;
update public.works w set ship_included = true from auth.users u where u.id = w.artist_id and u.email like '%@demo.ponci.art' and not w.ship_included;
