-- Prints de obras demo (artistas fictícios, e-mail @demo.ponci.art) servem de vitrine:
-- só contas demo podem comprá-los. Um membro real vê o exemplo, mas não consegue fazer pedido.
create or replace function public._is_demo(p_uid uuid) returns boolean language sql stable security definer set search_path='' as $$
  select coalesce((select email like '%@demo.ponci.art' from auth.users where id = p_uid), false)
$$;
revoke execute on function public._is_demo(uuid) from public, anon, authenticated;

create or replace function public._buy_print_guard() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if public._is_demo(new.artist_id) and not public._is_demo(new.buyer_id) then
    raise exception 'Esta é uma obra de demonstração: o print é só um exemplo e não pode ser comprado.' using errcode='P0001';
  end if;
  return new;
end $$;
drop trigger if exists print_orders_demo_guard on public.print_orders;
create trigger print_orders_demo_guard before insert on public.print_orders for each row execute function public._buy_print_guard();

-- a vitrine avisa: opções de print trazem se a obra é demo
create or replace function public.work_is_demo(p_work uuid) returns boolean language sql stable security definer set search_path='' as $$
  select public._is_demo((select artist_id from public.works where id = p_work)) and public.is_member()
$$;
revoke execute on function public.work_is_demo(uuid) from public, anon;
grant execute on function public.work_is_demo(uuid) to authenticated;
