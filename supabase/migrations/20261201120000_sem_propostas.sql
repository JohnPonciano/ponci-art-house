-- Propostas desativadas: a PONCI trabalha com preço fixo (comprar agora / sacola).
-- Negociações em aberto são encerradas com aviso; ninguém mais recebe propostas.
with c as (
  update public.proposals set status = 'closed', updated_at = now() where status in ('open','countered') returning id)
insert into public.proposal_events(proposal_id, actor, kind, msg)
select id, 'system', 'close', 'A PONCI passou a trabalhar só com preço fixo. Para levar a obra, use “Comprar agora”.' from c;

update public.profiles set accepts_offers = false where accepts_offers;
alter table public.profiles alter column accepts_offers set default false;

create or replace function public.make_proposal(p_work uuid, p_amount int, p_msg text default '')
returns text language plpgsql security definer set search_path='' as $$
begin
  raise exception 'A PONCI trabalha com preço fixo: use “Comprar agora”.' using errcode='P0001';
end $$;
