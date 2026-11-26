-- Compra simples do original e cadastro simples da obra.
--
-- 1) "Comprar" no lugar de "reservar": o comprador tem 3 dias para pagar. Sem pagamento, o pedido é cancelado
--    sozinho e a obra volta para a galeria. (Os documentos v2 dizem que a reserva PODE ser cancelada depois de 48 h;
--    esperar 72 h é mais generoso com o comprador e cabe no texto.)
-- 2) Compra pelo preço anunciado: o contrato é assinado automaticamente em nome da artista (ela anunciou a obra
--    com esse preço e aceitou o contrato de intermediação). Fica registrado como assinatura "automatica".
--    Proposta com outro valor continua pedindo o aceite dela.
-- 3) Ao cadastrar a obra, a artista pode deixar os prints encaminhados: a foto em alta já fica guardada como
--    arquivo de impressão (cofre privado) e, depois da aprovação, ela só confere e autoriza.

-- ---------- 1) prazo de pagamento ----------
alter table public.orders add column if not exists pay_until timestamptz;
-- pedidos que já estavam aguardando ganham 3 dias a partir de agora (ninguém é cancelado de surpresa)
update public.orders set pay_until = now() + interval '3 days' where pay_until is null and stage = 0 and cancelled_at is null;

create or replace function public._order_pay_until() returns trigger language plpgsql set search_path='' as $$
begin new.pay_until := coalesce(new.pay_until, now() + interval '3 days'); return new; end $$;
drop trigger if exists orders_pay_until on public.orders;
create trigger orders_pay_until before insert on public.orders for each row execute function public._order_pay_until();

create or replace function public.expire_unpaid_orders() returns int
language plpgsql security definer set search_path='' as $$
declare n int;
begin
  with x as (
    update public.orders set cancelled_at = now(), cancel_reason = 'Pagamento não feito em 3 dias: a obra voltou para a galeria.'
    where stage = 0 and cancelled_at is null and pay_until < now()
    returning work_id)
  update public.works set status = 'published' where id in (select work_id from x) and status = 'reserved';
  get diagnostics n = row_count;
  return n;
end $$;
revoke execute on function public.expire_unpaid_orders() from public, anon, authenticated;
select cron.schedule('ponci-expira-pedidos', '*/10 * * * *', 'select public.expire_unpaid_orders()');

-- ---------- 2) assinatura automática da artista na compra pelo preço ----------
create or replace function public._auto_sign_artist() returns trigger
language plpgsql security definer set search_path='' as $$
declare o public.orders; w public.works; v_name text;
begin
  select * into o from public.orders where id = new.order_id;
  if o.via <> 'direct' then return new; end if;
  select * into w from public.works where id = o.work_id;
  select coalesce(k.legal_name, p.display_name) into v_name from public.profiles p left join public.kyc k on k.user_id = p.id where p.id = w.artist_id;
  insert into public.contract_signatures(contract_id, party, user_id, name, doc_sha256, method)
  values (new.id, 'artista', w.artist_id, coalesce(v_name, 'Artista'), new.sha256, 'automatica')
  on conflict (contract_id, party) do nothing;
  return new;
end $$;
revoke execute on function public._auto_sign_artist() from public, anon, authenticated;
drop trigger if exists contracts_auto_sign_artist on public.contracts;
create trigger contracts_auto_sign_artist after insert on public.contracts for each row execute function public._auto_sign_artist();

-- ---------- 3) prints encaminhados no cadastro ----------
alter table public.works add column if not exists prints_wanted boolean not null default false;
alter table public.works add column if not exists print_master_path text;
alter table public.works add column if not exists print_master_w int check (print_master_w > 0);
alter table public.works add column if not exists print_master_h int check (print_master_h > 0);
alter table public.works drop constraint if exists works_print_master_owner_ck;
alter table public.works add constraint works_print_master_owner_ck check (print_master_path is null or print_master_path like artist_id::text || '/%');
