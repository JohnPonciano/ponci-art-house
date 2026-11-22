-- Envio: depois do pagamento em custódia, quem despacha é a artista (transportadora + rastreio);
-- a colecionadora só paga e confirma o recebimento.
-- Curadoria: aprovar, pedir ajustes (a obra volta para a artista editar) ou recusar com motivo,
-- com histórico das decisões visível para a artista.

-- ============ ENVIO ============
alter table public.orders
  add column if not exists paid_at timestamptz,
  add column if not exists shipped_at timestamptz,
  add column if not exists carrier text,
  add column if not exists tracking_code text;

-- colecionadora: 0 → 1 (pagar em custódia) e 2 → 3 (confirmar recebimento)
create or replace function public.advance_order(p_order uuid) returns int language plpgsql security definer set search_path='' as $$
declare o public.orders; v_signed int;
begin
  select * into o from public.orders where id = p_order and buyer_id = auth.uid() for update;
  if o.id is null then raise exception 'Pedido não encontrado.' using errcode='P0001'; end if;
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

-- artista: 1 → 2 (despachar), com transportadora e código de rastreio
create or replace function public.ship_order(p_order uuid, p_carrier text, p_tracking text) returns void
language plpgsql security definer set search_path='' as $$
declare o public.orders; v_carrier text := btrim(coalesce(p_carrier, '')); v_code text := upper(btrim(coalesce(p_tracking, '')));
begin
  select ord.* into o from public.orders ord join public.works wo on wo.id = ord.work_id
    where ord.id = p_order and wo.artist_id = auth.uid() for update of ord;
  if o.id is null then raise exception 'Pedido não encontrado.' using errcode='P0001'; end if;
  if o.stage <> 1 then raise exception 'O envio só pode ser registrado depois do pagamento em custódia.' using errcode='P0001'; end if;
  if not (v_carrier = any(array['Correios','Jadlog','Loggi','Transportadora de arte','Entrega em mãos'])) then
    raise exception 'Escolha a forma de envio.' using errcode='P0001'; end if;
  if v_carrier <> 'Entrega em mãos' and length(v_code) < 6 then
    raise exception 'Informe o código de rastreio.' using errcode='P0001'; end if;
  if length(v_code) > 60 then raise exception 'Código de rastreio muito longo.' using errcode='P0001'; end if;
  update public.orders set stage = 2, shipped_at = now(), carrier = v_carrier, tracking_code = nullif(v_code, '') where id = o.id;
end $$;
revoke execute on function public.ship_order(uuid, text, text) from public, anon;
grant execute on function public.ship_order(uuid, text, text) to authenticated;

-- ============ CURADORIA ============
alter table public.works
  add column if not exists curation_note text,
  add column if not exists changes_requested_at timestamptz;

create table if not exists public.curation_log(
  id bigint generated always as identity primary key,
  work_id uuid references public.works on delete set null,
  artist_id uuid not null references public.profiles on delete cascade,
  title text not null,
  decision text not null check (decision in ('aprovada','ajustes','recusada','reenviada')),
  note text not null default '' check (length(note) <= 2000),
  created_at timestamptz not null default now()
);
create index if not exists curation_log_artist_idx on public.curation_log(artist_id, created_at desc);
create index if not exists curation_log_work_idx on public.curation_log(work_id);
alter table public.curation_log enable row level security;
drop policy if exists "curadoria: artista lê o próprio histórico" on public.curation_log;
create policy "curadoria: artista lê o próprio histórico" on public.curation_log for select to authenticated
  using (artist_id = (select auth.uid()) or (select public.is_admin()));

-- admin decide: 'aprovada' | 'ajustes' | 'recusada'
create or replace function public.admin_curate(p_work uuid, p_decision text, p_note text default '')
returns void language plpgsql security definer set search_path='' as $$
declare wk public.works; v_note text := btrim(coalesce(p_note, ''));
begin
  perform public._require_admin();
  select * into wk from public.works where id = p_work and status = 'review' for update;
  if wk.id is null then raise exception 'Obra não está em curadoria.' using errcode='P0001'; end if;
  if p_decision in ('ajustes','recusada') and length(v_note) < 10 then
    raise exception 'Escreva para a artista o que precisa mudar (mínimo 10 caracteres).' using errcode='P0001'; end if;
  if p_decision = 'aprovada' then
    update public.works set status = 'published', curation_note = nullif(v_note, ''), changes_requested_at = null where id = wk.id;
  elsif p_decision = 'ajustes' then
    update public.works set curation_note = v_note, changes_requested_at = now() where id = wk.id;
  elsif p_decision = 'recusada' then
    null;
  else raise exception 'Decisão inválida.' using errcode='P0001'; end if;
  insert into public.curation_log(work_id, artist_id, title, decision, note)
    values (case when p_decision = 'recusada' then null else wk.id end, wk.artist_id, wk.title, p_decision, v_note);
  if p_decision = 'recusada' then delete from public.works where id = wk.id; end if;
end $$;
revoke execute on function public.admin_curate(uuid, text, text) from public, anon;
grant execute on function public.admin_curate(uuid, text, text) to authenticated;

-- compatibilidade com o botão antigo
create or replace function public.admin_review_work(p_work uuid, p_approve boolean) returns void language plpgsql security definer set search_path='' as $$
begin
  perform public.admin_curate(p_work, case when p_approve then 'aprovada' else 'recusada' end,
    case when p_approve then '' else 'Recusada pela curadoria.' end);
end $$;

-- artista edita a obra enquanto está em curadoria e reenvia
create or replace function public.update_work_review(p_work uuid, p jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare wk public.works; v_desc text[];
begin
  select * into wk from public.works where id = p_work and artist_id = auth.uid() and status = 'review' for update;
  if wk.id is null then raise exception 'Só dá para editar obras em curadoria.' using errcode='P0001'; end if;
  select coalesce(array_agg(btrim(x)) filter (where btrim(x) <> ''), '{}') into v_desc
    from regexp_split_to_table(coalesce(p->>'description', array_to_string(wk.description, E'\n')), E'\n+') x;
  update public.works set
    title = coalesce(nullif(btrim(p->>'title'), ''), title),
    year = coalesce((p->>'year')::int, year),
    medium = coalesce(nullif(btrim(p->>'medium'), ''), medium),
    h = coalesce((p->>'h')::int, h),
    w = coalesce((p->>'w')::int, w),
    edition = case when p ? 'edition' then nullif(btrim(p->>'edition'), '') else edition end,
    price = coalesce((p->>'price')::int, price),
    description = v_desc,
    reproduction = coalesce((p->>'reproduction')::boolean, reproduction),
    changes_requested_at = null
  where id = wk.id;
  if wk.changes_requested_at is not null then
    insert into public.curation_log(work_id, artist_id, title, decision, note)
      values (wk.id, wk.artist_id, coalesce(nullif(btrim(p->>'title'), ''), wk.title), 'reenviada', '');
  end if;
end $$;
revoke execute on function public.update_work_review(uuid, jsonb) from public, anon;
grant execute on function public.update_work_review(uuid, jsonb) to authenticated;

-- simulação (contas demo) também entra no histórico
create or replace function public.demo_approve_work(p_work uuid) returns void language plpgsql security definer set search_path='' as $$
declare wk public.works;
begin
  if coalesce((select email from auth.users where id = auth.uid()), '') not like '%@demo.ponci.art' then
    raise exception 'Disponível só nas contas de demonstração.' using errcode='42501'; end if;
  update public.works set status='published', changes_requested_at = null where id = p_work and artist_id = auth.uid() and status='review'
    returning * into wk;
  if wk.id is null then raise exception 'Obra não está em curadoria.' using errcode='P0001'; end if;
  insert into public.curation_log(work_id, artist_id, title, decision, note) values (wk.id, wk.artist_id, wk.title, 'aprovada', 'Aprovação simulada (conta de demonstração).');
end $$;
