-- PONCI · Rede privada — esquema, RLS e regras de negociação
create extension if not exists pgcrypto with schema extensions;

create type public.member_role as enum ('artist','buyer');
create type public.work_status as enum ('review','published','reserved','sold');
create type public.proposal_status as enum ('open','countered','accepted','declined','closed','withdrawn');

create sequence public.member_seq start 100;
create sequence public.ref_seq start 1100;

-- Convites (somente lidos pelo gatilho de cadastro)
create table public.invites(
  code text primary key,
  role public.member_role not null,
  uses_left int not null default 1,
  created_at timestamptz not null default now()
);

-- Perfil público dentro da rede
create table public.profiles(
  id uuid primary key references auth.users on delete cascade,
  role public.member_role not null,
  member_code text unique not null,
  display_name text not null,           -- artistas: nome artístico; colecionadores: "Colecionador verificado"
  city text not null default '',
  practice text not null default '',
  bio text not null default '',
  created_at timestamptz not null default now()
);
-- Dados privados (nome civil, e-mail): visíveis só ao dono e à contraparte de uma venda
create table public.profile_private(
  id uuid primary key references public.profiles on delete cascade,
  full_name text not null,
  email text not null default ''
);

create table public.works(
  id uuid primary key default gen_random_uuid(),
  no int generated always as identity,
  slug text unique not null,
  artist_id uuid not null references public.profiles on delete cascade,
  title text not null check (length(title) between 1 and 160),
  year int not null check (year between 1900 and 2100),
  cat text not null check (cat in ('painting','mixed','paper','edition')),
  medium text not null,
  h int not null check (h between 1 and 2000),
  w int not null check (w between 1 and 2000),
  edition text,
  price int not null check (price >= 500),
  description text[] not null default '{}',
  status public.work_status not null default 'review',
  gen jsonb not null default '{}'::jsonb,   -- composição generativa {g, seed, p, v} quando não há foto
  image_path text,
  img_w int, img_h int,
  created_at timestamptz not null default now()
);
create index on public.works(artist_id);
create index on public.works(status);

create table public.proposals(
  id uuid primary key default gen_random_uuid(),
  ref text unique not null default 'PRP-'||nextval('public.ref_seq'),
  work_id uuid not null references public.works on delete cascade,
  buyer_id uuid not null references public.profiles on delete cascade,
  status public.proposal_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.proposals(work_id);
create index on public.proposals(buyer_id);

create table public.proposal_events(
  id bigint generated always as identity primary key,
  proposal_id uuid not null references public.proposals on delete cascade,
  actor text not null check (actor in ('buyer','artist','system')),
  kind text not null check (kind in ('offer','counter','decline','accept','close','withdraw')),
  amount int,
  msg text not null default '',
  created_at timestamptz not null default now()
);
create index on public.proposal_events(proposal_id);

create table public.orders(
  id uuid primary key default gen_random_uuid(),
  ref text unique not null default 'ORD-'||nextval('public.ref_seq'),
  work_id uuid not null references public.works on delete cascade,
  buyer_id uuid not null references public.profiles on delete cascade,
  proposal_id uuid references public.proposals on delete set null,
  amount int not null,
  via text not null check (via in ('direct','proposal')),
  stage int not null default 0 check (stage between 0 and 3),
  created_at timestamptz not null default now()
);
create index on public.orders(work_id);
create index on public.orders(buyer_id);
create index on public.orders(proposal_id);

create table public.favorites(
  buyer_id uuid not null references public.profiles on delete cascade,
  work_id uuid not null references public.works on delete cascade,
  created_at timestamptz not null default now(),
  primary key(buyer_id, work_id)
);
create index on public.favorites(work_id);

create table public.access_requests(
  id uuid primary key default gen_random_uuid(),
  ref text not null default 'PNC-ACS-'||nextval('public.ref_seq'),
  role public.member_role not null,
  name text not null check (length(name) between 2 and 160),
  email text not null check (email ~ '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$'),
  city text not null default '',
  link text not null default '',
  practice text not null default '',
  msg text not null default '' check (length(msg) <= 4000),
  created_at timestamptz not null default now()
);

-- ---------- RLS ----------
alter table public.invites enable row level security;
alter table public.profiles enable row level security;
alter table public.profile_private enable row level security;
alter table public.works enable row level security;
alter table public.proposals enable row level security;
alter table public.proposal_events enable row level security;
alter table public.orders enable row level security;
alter table public.favorites enable row level security;
alter table public.access_requests enable row level security;

create or replace function public.is_member() returns boolean language sql stable security definer set search_path='' as
$$ select exists(select 1 from public.profiles where id = (select auth.uid())) $$;
create or replace function public.my_role() returns public.member_role language sql stable security definer set search_path='' as
$$ select role from public.profiles where id = (select auth.uid()) $$;
create or replace function public.can_see_private(target uuid) returns boolean language sql stable security definer set search_path='' as $$
  select target = (select auth.uid())
    or exists(select 1 from public.orders o join public.works w on w.id=o.work_id
              where (o.buyer_id=target and w.artist_id=(select auth.uid()))
                 or (w.artist_id=target and o.buyer_id=(select auth.uid())))
$$;
create or replace function public.is_work_artist(p_work uuid) returns boolean language sql stable security definer set search_path='' as
$$ select exists(select 1 from public.works where id=p_work and artist_id=(select auth.uid())) $$;

create policy "membros veem perfis" on public.profiles for select to authenticated using ((select public.is_member()));
create policy "membro edita o próprio perfil" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
-- impede mudar papel/código pelo cliente
revoke update on public.profiles from authenticated;
grant update (display_name, city, practice, bio) on public.profiles to authenticated;

create policy "privado: dono e contraparte" on public.profile_private for select to authenticated using ((select public.can_see_private(id)));
create policy "privado: dono edita" on public.profile_private for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
revoke update on public.profile_private from authenticated;
grant update (full_name) on public.profile_private to authenticated;

create policy "obras: vitrine para membros e ateliê para a artista" on public.works for select to authenticated
  using (artist_id = (select auth.uid()) or (status <> 'review' and (select public.is_member())));
create policy "obras: artista cadastra para curadoria" on public.works for insert to authenticated
  with check (artist_id = (select auth.uid()) and status = 'review' and (select public.my_role()) = 'artist');

create policy "propostas: partes envolvidas" on public.proposals for select to authenticated
  using (buyer_id = (select auth.uid()) or (select public.is_work_artist(work_id)));
create policy "eventos: partes envolvidas" on public.proposal_events for select to authenticated
  using (exists(select 1 from public.proposals p where p.id = proposal_id
    and (p.buyer_id = (select auth.uid()) or (select public.is_work_artist(p.work_id)))));
create policy "pedidos: partes envolvidas" on public.orders for select to authenticated
  using (buyer_id = (select auth.uid()) or (select public.is_work_artist(work_id)));

create policy "favoritos: dono lê" on public.favorites for select to authenticated using (buyer_id = (select auth.uid()));
create policy "favoritos: dono adiciona" on public.favorites for insert to authenticated with check (buyer_id = (select auth.uid()) and (select public.my_role()) = 'buyer');
create policy "favoritos: dono remove" on public.favorites for delete to authenticated using (buyer_id = (select auth.uid()));

create policy "qualquer um pede convite" on public.access_requests for insert to anon, authenticated with check (true);

-- ---------- Cadastro por convite ----------
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path='' as $$
declare inv public.invites; v_code text := upper(trim(coalesce(new.raw_user_meta_data->>'invite_code','')));
  v_name text := trim(coalesce(new.raw_user_meta_data->>'full_name',''));
begin
  select * into inv from public.invites where code = v_code and uses_left > 0 for update;
  if inv.code is null then raise exception 'Convite inválido ou esgotado.' using errcode='P0001'; end if;
  if length(v_name) < 2 then raise exception 'Informe seu nome.' using errcode='P0001'; end if;
  update public.invites set uses_left = uses_left - 1 where code = inv.code;
  insert into public.profiles(id, role, member_code, display_name, city, practice)
  values (new.id, inv.role,
          case inv.role when 'artist' then 'ART-' else 'COL-' end || lpad(nextval('public.member_seq')::text, 4, '0'),
          case inv.role when 'artist' then coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'),''), v_name) else 'Colecionador verificado' end,
          coalesce(new.raw_user_meta_data->>'city',''), coalesce(new.raw_user_meta_data->>'practice',''));
  insert into public.profile_private(id, full_name, email) values (new.id, v_name, coalesce(new.email,''));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- ---------- Regras de negociação ----------
create or replace function public._reserve(p_work uuid, p_buyer uuid, p_amount int, p_via text, p_proposal uuid)
returns text language plpgsql security definer set search_path='' as $$
declare w public.works; v_ref text;
begin
  select * into w from public.works where id = p_work for update;
  if w.id is null or w.status <> 'published' then raise exception 'A obra não está mais disponível.' using errcode='P0001'; end if;
  update public.works set status = 'reserved' where id = p_work;
  with c as (
    update public.proposals set status='closed', updated_at=now()
    where work_id = p_work and id is distinct from p_proposal and status in ('open','countered') returning id)
  insert into public.proposal_events(proposal_id, actor, kind, msg) select id, 'system', 'close', 'Obra reservada por outro membro.' from c;
  insert into public.orders(work_id, buyer_id, proposal_id, amount, via) values (p_work, p_buyer, p_proposal, p_amount, p_via) returning ref into v_ref;
  return v_ref;
end $$;

create or replace function public.make_proposal(p_work uuid, p_amount int, p_msg text default '')
returns text language plpgsql security definer set search_path='' as $$
declare w public.works; p public.proposals; me uuid := auth.uid();
begin
  if (select public.my_role()) is distinct from 'buyer' then raise exception 'Somente colecionadores fazem propostas.' using errcode='P0001'; end if;
  select * into w from public.works where id = p_work;
  if w.id is null or w.status <> 'published' then raise exception 'A obra não está disponível.' using errcode='P0001'; end if;
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

create or replace function public.respond_proposal(p_proposal uuid, p_kind text, p_amount int default null, p_msg text default '')
returns text language plpgsql security definer set search_path='' as $$
declare p public.proposals; w public.works; me uuid := auth.uid(); v_actor text; v_cur int; v_ref text;
begin
  select * into p from public.proposals where id = p_proposal for update;
  if p.id is null then raise exception 'Proposta não encontrada.' using errcode='P0001'; end if;
  select * into w from public.works where id = p.work_id;
  if w.artist_id = me then v_actor := 'artist';
  elsif p.buyer_id = me then v_actor := 'buyer';
  else raise exception 'Sem permissão.' using errcode='42501'; end if;

  if v_actor = 'artist' and not (p.status = 'open' and p_kind in ('accept','decline','counter')) then
    raise exception 'Esta proposta não aguarda a sua resposta.' using errcode='P0001'; end if;
  if v_actor = 'buyer' and not ((p.status = 'countered' and p_kind in ('accept','decline')) or (p.status in ('open','countered') and p_kind = 'withdraw')) then
    raise exception 'Ação indisponível para esta proposta.' using errcode='P0001'; end if;

  select amount into v_cur from public.proposal_events where proposal_id = p.id and amount is not null order by id desc limit 1;

  if p_kind = 'counter' then
    if p_amount is null or p_amount < 500 or p_amount > w.price then raise exception 'Valor de contraproposta inválido.' using errcode='P0001'; end if;
    insert into public.proposal_events(proposal_id, actor, kind, amount, msg) values (p.id, 'artist', 'counter', p_amount, left(coalesce(p_msg,''),2000));
    update public.proposals set status='countered', updated_at=now() where id = p.id;
    return p.ref;
  elsif p_kind = 'accept' then
    v_ref := public._reserve(p.work_id, p.buyer_id, v_cur, 'proposal', p.id);
    insert into public.proposal_events(proposal_id, actor, kind, amount, msg) values (p.id, v_actor, 'accept', v_cur, left(coalesce(p_msg,''),2000));
    update public.proposals set status='accepted', updated_at=now() where id = p.id;
    return v_ref;
  elsif p_kind = 'decline' then
    insert into public.proposal_events(proposal_id, actor, kind, msg) values (p.id, v_actor, 'decline', left(coalesce(p_msg,''),2000));
    update public.proposals set status='declined', updated_at=now() where id = p.id;
    return p.ref;
  else
    insert into public.proposal_events(proposal_id, actor, kind, msg) values (p.id, 'buyer', 'withdraw', '');
    update public.proposals set status='withdrawn', updated_at=now() where id = p.id;
    return p.ref;
  end if;
end $$;

create or replace function public.reserve_work(p_work uuid) returns text language plpgsql security definer set search_path='' as $$
declare v_price int;
begin
  if (select public.my_role()) is distinct from 'buyer' then raise exception 'Somente colecionadores reservam obras.' using errcode='P0001'; end if;
  select price into v_price from public.works where id = p_work;
  return public._reserve(p_work, auth.uid(), v_price, 'direct', null);
end $$;

-- Etapas de custódia. No protótipo o próprio colecionador avança (simulação de pagamento/transporte).
create or replace function public.advance_order(p_order uuid) returns int language plpgsql security definer set search_path='' as $$
declare o public.orders;
begin
  select * into o from public.orders where id = p_order and buyer_id = auth.uid() for update;
  if o.id is null then raise exception 'Pedido não encontrado.' using errcode='P0001'; end if;
  if o.stage >= 3 then return 3; end if;
  update public.orders set stage = stage + 1 where id = o.id;
  if o.stage + 1 = 3 then update public.works set status='sold' where id = o.work_id; end if;
  return o.stage + 1;
end $$;

create or replace function public.update_work_price(p_work uuid, p_price int) returns void language plpgsql security definer set search_path='' as $$
begin
  if p_price < 500 then raise exception 'Preço mínimo de R$ 500.' using errcode='P0001'; end if;
  update public.works set price = p_price where id = p_work and artist_id = auth.uid() and status in ('review','published');
  if not found then raise exception 'Não é possível alterar o preço desta obra.' using errcode='P0001'; end if;
end $$;

create or replace function public.withdraw_work(p_work uuid) returns void language plpgsql security definer set search_path='' as $$
begin
  delete from public.works where id = p_work and artist_id = auth.uid() and status in ('review','published')
    and not exists(select 1 from public.orders where work_id = p_work);
  if not found then raise exception 'Esta obra não pode ser retirada.' using errcode='P0001'; end if;
end $$;

-- Simulação da curadoria (no produto, isto seria uma ação do painel de curadoria)
create or replace function public.demo_approve_work(p_work uuid) returns void language plpgsql security definer set search_path='' as $$
begin
  update public.works set status='published' where id = p_work and artist_id = auth.uid() and status='review';
  if not found then raise exception 'Obra não está em curadoria.' using errcode='P0001'; end if;
end $$;

-- Vitrine pública (LP): sem preço, sem obras em curadoria
create or replace function public.vitrine(p_limit int default 6)
returns table(id uuid, slug text, no int, title text, year int, cat text, medium text, h int, w int, edition text,
              gen jsonb, image_path text, img_w int, img_h int, artist_name text)
language sql stable security definer set search_path='' as $$
  select w.id, w.slug, w.no, w.title, w.year, w.cat, w.medium, w.h, w.w, w.edition, w.gen, w.image_path, w.img_w, w.img_h, p.display_name
  from public.works w join public.profiles p on p.id = w.artist_id
  where w.status = 'published' order by w.created_at desc limit least(greatest(p_limit,1),24)
$$;
create or replace function public.network_stats() returns json language sql stable security definer set search_path='' as $$
  select json_build_object(
    'artists', (select count(*) from public.profiles where role='artist'),
    'buyers', (select count(*) from public.profiles where role='buyer'),
    'published', (select count(*) from public.works where status='published'))
$$;

revoke execute on function public._reserve(uuid,uuid,int,text,uuid) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.make_proposal(uuid,int,text), public.respond_proposal(uuid,text,int,text), public.reserve_work(uuid),
  public.advance_order(uuid), public.update_work_price(uuid,int), public.withdraw_work(uuid), public.demo_approve_work(uuid) from public, anon;
grant execute on function public.vitrine(int), public.network_stats() to anon, authenticated;

-- ---------- Storage: fotos das obras ----------
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('works','works', true, 8388608, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
create policy "artista envia fotos na própria pasta" on storage.objects for insert to authenticated
  with check (bucket_id = 'works' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "artista remove as próprias fotos" on storage.objects for delete to authenticated
  using (bucket_id = 'works' and (storage.foldername(name))[1] = (select auth.uid())::text);
