-- Vendas no admin: cancelar uma venda antes do envio (a obra volta para a vitrine) e registrar o repasse à artista
-- depois do prazo de arrependimento. Pedidos cancelados ficam travados para as partes.

alter table public.orders
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancel_reason text,
  add column if not exists payout_at timestamptz,
  add column if not exists payout_note text;

-- colecionadora: 0 → 1 (pagar em custódia) e 2 → 3 (confirmar recebimento); pedido cancelado não anda
create or replace function public.advance_order(p_order uuid) returns int language plpgsql security definer set search_path='' as $$
declare o public.orders; v_signed int;
begin
  select * into o from public.orders where id = p_order and buyer_id = auth.uid() for update;
  if o.id is null then raise exception 'Pedido não encontrado.' using errcode='P0001'; end if;
  if o.cancelled_at is not null then raise exception 'Esta venda foi cancelada.' using errcode='P0001'; end if;
  if o.stage >= 3 then return 3; end if;
  if o.stage = 0 then
    select count(*) into v_signed from public.contract_signatures s join public.contracts c on c.id = s.contract_id
      where c.order_id = o.id and s.party in ('comprador','artista');
    if v_signed < 2 then raise exception 'O contrato precisa estar assinado pelas duas partes antes do pagamento.' using errcode='P0001'; end if;
    update public.orders set stage = 1, paid_at = now() where id = o.id;
    return 1;
  end if;
  if o.stage = 1 then raise exception 'A artista ainda não despachou a obra.' using errcode='P0001'; end if;
  update public.orders set stage = 3, delivered_at = now() where id = o.id;
  update public.works set status = 'sold' where id = o.work_id;
  return 3;
end $$;

-- artista: 1 → 2 (despachar); pedido cancelado não anda
create or replace function public.ship_order(p_order uuid, p_carrier text, p_tracking text) returns void
language plpgsql security definer set search_path='' as $$
declare o public.orders; v_carrier text := btrim(coalesce(p_carrier, '')); v_code text := upper(btrim(coalesce(p_tracking, '')));
begin
  select ord.* into o from public.orders ord join public.works wo on wo.id = ord.work_id
    where ord.id = p_order and wo.artist_id = auth.uid() for update of ord;
  if o.id is null then raise exception 'Pedido não encontrado.' using errcode='P0001'; end if;
  if o.cancelled_at is not null then raise exception 'Esta venda foi cancelada.' using errcode='P0001'; end if;
  if o.stage <> 1 then raise exception 'O envio só pode ser registrado depois do pagamento em custódia.' using errcode='P0001'; end if;
  if not (v_carrier = any(array['Correios','Jadlog','Loggi','Transportadora de arte','Entrega em mãos'])) then
    raise exception 'Escolha a forma de envio.' using errcode='P0001'; end if;
  if v_carrier <> 'Entrega em mãos' and length(v_code) < 6 then
    raise exception 'Informe o código de rastreio.' using errcode='P0001'; end if;
  if length(v_code) > 60 then raise exception 'Código de rastreio muito longo.' using errcode='P0001'; end if;
  update public.orders set stage = 2, shipped_at = now(), carrier = v_carrier, tracking_code = nullif(v_code, '') where id = o.id;
end $$;

-- admin: cancelar antes do envio (reservada ou paga). Se já foi paga, o estorno é feito por fora e anotado no motivo.
create or replace function public.admin_cancel_order(p_order uuid, p_reason text) returns void
language plpgsql security definer set search_path='' as $$
declare o public.orders; v_reason text := btrim(coalesce(p_reason, ''));
begin
  perform public._require_admin();
  select * into o from public.orders where id = p_order for update;
  if o.id is null then raise exception 'Pedido não encontrado.' using errcode='P0001'; end if;
  if o.cancelled_at is not null then raise exception 'Esta venda já foi cancelada.' using errcode='P0001'; end if;
  if o.stage > 1 then raise exception 'Depois do envio, use uma solicitação de devolução.' using errcode='P0001'; end if;
  if length(v_reason) < 10 then raise exception 'Escreva o motivo do cancelamento (mínimo 10 caracteres).' using errcode='P0001'; end if;
  update public.orders set cancelled_at = now(), cancel_reason = v_reason where id = o.id;
  update public.works set status = 'published' where id = o.work_id and status = 'reserved';
end $$;
revoke execute on function public.admin_cancel_order(uuid, text) from public, anon;
grant execute on function public.admin_cancel_order(uuid, text) to authenticated;

-- admin: registrar o repasse à artista (depois dos 7 dias de arrependimento e sem pedido de desistência em aberto)
create or replace function public.admin_mark_payout(p_order uuid, p_note text default '') returns void
language plpgsql security definer set search_path='' as $$
declare o public.orders;
begin
  perform public._require_admin();
  select * into o from public.orders where id = p_order for update;
  if o.id is null then raise exception 'Pedido não encontrado.' using errcode='P0001'; end if;
  if o.cancelled_at is not null then raise exception 'Esta venda foi cancelada.' using errcode='P0001'; end if;
  if o.stage < 3 or o.delivered_at is null then raise exception 'A obra ainda não foi entregue.' using errcode='P0001'; end if;
  if o.payout_at is not null then raise exception 'O repasse já foi registrado.' using errcode='P0001'; end if;
  if now() < o.delivered_at + interval '7 days' then
    raise exception 'O prazo de arrependimento do comprador ainda está correndo.' using errcode='P0001'; end if;
  if exists(select 1 from public.member_requests r where r.order_id = o.id and r.kind in ('arrependimento','problema') and r.status in ('aberta','em_andamento')) then
    raise exception 'Há uma solicitação de desistência ou problema em aberto para esta venda.' using errcode='P0001'; end if;
  update public.orders set payout_at = now(), payout_note = nullif(btrim(coalesce(p_note, '')), '') where id = o.id;
end $$;
revoke execute on function public.admin_mark_payout(uuid, text) from public, anon;
grant execute on function public.admin_mark_payout(uuid, text) to authenticated;
