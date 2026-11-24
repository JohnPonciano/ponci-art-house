-- Coleção: o colecionador pode mostrar, no perfil da Comunidade, as obras que comprou e recebeu pela PONCI.
-- Tudo começa escondido; ele escolhe obra por obra. Preço nunca aparece.

create table if not exists public.collection_items(
  order_id uuid primary key references public.orders on delete cascade,
  buyer_id uuid not null references public.profiles on delete cascade,
  work_id uuid not null references public.works on delete cascade,
  visible boolean not null default false,
  note text not null default '' check (length(note) <= 280),
  updated_at timestamptz not null default now()
);
create index if not exists collection_items_buyer_idx on public.collection_items(buyer_id) where visible;
alter table public.collection_items enable row level security;
drop policy if exists "coleção: dono lê" on public.collection_items;
create policy "coleção: dono lê" on public.collection_items for select to authenticated
  using (buyer_id = (select auth.uid()) or (select public.is_admin()));

-- mostrar/esconder uma obra (só obra recebida, de venda não cancelada, do próprio colecionador)
create or replace function public.set_collection_item(p_order uuid, p_visible boolean, p_note text default '') returns void
language plpgsql security definer set search_path='' as $$
declare o public.orders;
begin
  select * into o from public.orders where id = p_order and buyer_id = auth.uid();
  if o.id is null then raise exception 'Compra não encontrada.' using errcode='P0001'; end if;
  if o.stage < 3 or o.cancelled_at is not null then raise exception 'Só obras já recebidas entram na coleção.' using errcode='P0001'; end if;
  insert into public.collection_items(order_id, buyer_id, work_id, visible, note)
  values (o.id, o.buyer_id, o.work_id, coalesce(p_visible, false), left(btrim(coalesce(p_note, '')), 280))
  on conflict (order_id) do update set visible = excluded.visible, note = excluded.note, updated_at = now();
end $$;
revoke execute on function public.set_collection_item(uuid, boolean, text) from public, anon;
grant execute on function public.set_collection_item(uuid, boolean, text) to authenticated;

-- coleção pública de um membro (só o que ele escolheu mostrar; sem preço), para membros da rede
create or replace function public.collection_of(p_member uuid)
returns table(order_id uuid, work_id uuid, title text, year int, medium text, h int, w int, cat text, gen jsonb,
              image_path text, img_w int, img_h int, reproduction boolean, note text, acquired timestamptz,
              artist_name text, artist_code text, artist_handle text)
language sql stable security definer set search_path='' as $$
  select o.id, wk.id, wk.title, wk.year, wk.medium, wk.h, wk.w, wk.cat, wk.gen, wk.image_path, wk.img_w, wk.img_h, wk.reproduction,
         ci.note, date_trunc('month', coalesce(o.delivered_at, o.created_at)), ap.display_name, ap.member_code, ap.handle
  from public.collection_items ci
  join public.orders o on o.id = ci.order_id
  join public.works wk on wk.id = ci.work_id
  join public.profiles ap on ap.id = wk.artist_id
  where ci.buyer_id = p_member and ci.visible and o.cancelled_at is null and o.stage = 3 and public.is_member()
  order by o.delivered_at desc nulls last
$$;
revoke execute on function public.collection_of(uuid) from public, anon;
grant execute on function public.collection_of(uuid) to authenticated;
