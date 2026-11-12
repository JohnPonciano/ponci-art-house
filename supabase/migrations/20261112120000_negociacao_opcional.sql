-- Negociação é opcional: cada artista decide se aceita propostas. Padrão: preço fixo.
alter table public.profiles add column if not exists accepts_offers boolean not null default false;
grant update (accepts_offers) on public.profiles to authenticated;

create or replace function public.make_proposal(p_work uuid, p_amount int, p_msg text default '')
returns text language plpgsql security definer set search_path='' as $$
declare w public.works; p public.proposals; me uuid := auth.uid();
begin
  if (select public.my_role()) is distinct from 'buyer' then raise exception 'Somente colecionadores fazem propostas.' using errcode='P0001'; end if;
  perform public._require_ready();
  select * into w from public.works where id = p_work;
  if w.id is null or w.status <> 'published' then raise exception 'A obra não está disponível.' using errcode='P0001'; end if;
  if not coalesce((select accepts_offers from public.profiles where id = w.artist_id), false) then
    raise exception 'Esta artista trabalha com preço fixo.' using errcode='P0001'; end if;
  if p_amount < ceil(w.price * 0.5) then raise exception 'Propostas abaixo de 50%% do preço não são enviadas.' using errcode='P0001'; end if;
  if p_amount >= w.price then raise exception 'Para pagar o preço cheio, use a reserva pelo preço.' using errcode='P0001'; end if;
  select * into p from public.proposals where work_id = p_work and buyer_id = me and status in ('open','countered') for update;
  if p.id is null then
    insert into public.proposals(work_id, buyer_id) values (p_work, me) returning * into p;
  else
    update public.proposals set status='open', updated_at=now() where id = p.id;
  end if;
  insert into public.proposal_events(proposal_id, actor, kind, amount, msg) values (p.id, 'buyer', 'offer', p_amount, left(coalesce(p_msg,''),2000));
  return p.ref;
end $$;
