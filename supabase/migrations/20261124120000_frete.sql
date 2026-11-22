-- Frete: medidas de envio da obra (profundidade e peso com embalagem) e a região de origem para cotação.
-- O CEP completo da artista nunca sai do banco: a cotação usa só a região (5 primeiros dígitos).

alter table public.works
  add column if not exists depth_cm int check (depth_cm between 1 and 300),
  add column if not exists weight_kg numeric(6,2) check (weight_kg > 0 and weight_kg <= 300);

-- artista atualiza os dados de envio das próprias obras (qualquer etapa antes de vendida)
create or replace function public.set_work_shipping(p_work uuid, p_depth int, p_weight numeric) returns void
language plpgsql security definer set search_path='' as $$
begin
  if p_depth is not null and (p_depth < 1 or p_depth > 300) then raise exception 'Profundidade entre 1 e 300 cm.' using errcode='P0001'; end if;
  if p_weight is not null and (p_weight <= 0 or p_weight > 300) then raise exception 'Peso entre 0,1 e 300 kg.' using errcode='P0001'; end if;
  update public.works set depth_cm = p_depth, weight_kg = p_weight where id = p_work and artist_id = auth.uid() and status <> 'sold';
  if not found then raise exception 'Obra não encontrada.' using errcode='P0001'; end if;
end $$;
revoke execute on function public.set_work_shipping(uuid, int, numeric) from public, anon;
grant execute on function public.set_work_shipping(uuid, int, numeric) to authenticated;

-- região de origem (CEP com os 3 últimos dígitos zerados) de uma obra à venda, só para membros
create or replace function public.ship_origin(p_work uuid) returns text
language sql stable security definer set search_path='' as $$
  select left(regexp_replace(k.cep, '\D', '', 'g'), 5) || '000'
  from public.works w join public.kyc k on k.user_id = w.artist_id
  where w.id = p_work and w.status in ('published', 'reserved') and public.is_member()
    and length(regexp_replace(coalesce(k.cep, ''), '\D', '', 'g')) = 8
$$;
revoke execute on function public.ship_origin(uuid) from public, anon;
grant execute on function public.ship_origin(uuid) to authenticated;
