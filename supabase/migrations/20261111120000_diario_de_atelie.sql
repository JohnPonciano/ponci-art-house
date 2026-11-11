-- PONCI · Diário de ateliê: posts dos artistas, seguir, salvar, "tenho interesse" e moderação.
-- Sem curtidas públicas nem contagem de seguidores visível: os números são privados da artista.

create table public.posts(
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references public.profiles on delete cascade,
  kind text not null default 'post' check (kind in ('post','obra_nova')),
  body text not null default '' check (length(body) <= 2200),
  work_id uuid references public.works on delete set null,
  created_at timestamptz not null default now(),
  removed_at timestamptz,
  removed_reason text not null default ''
);
create index on public.posts(artist_id, created_at desc);
create index on public.posts(created_at desc);
create index on public.posts(work_id);

create table public.post_media(
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts on delete cascade,
  position int not null default 0,
  path text,                 -- foto no bucket "works" (pasta do artista)
  gen jsonb,                 -- ou composição generativa (contas de demonstração)
  w int not null default 1000, h int not null default 1000,
  check (path is not null or gen is not null)
);
create index on public.post_media(post_id);

create table public.follows(
  member_id uuid not null references public.profiles on delete cascade,
  artist_id uuid not null references public.profiles on delete cascade,
  created_at timestamptz not null default now(),
  primary key(member_id, artist_id),
  check (member_id <> artist_id)
);
create index on public.follows(artist_id);

create table public.post_saves(
  member_id uuid not null references public.profiles on delete cascade,
  post_id uuid not null references public.posts on delete cascade,
  created_at timestamptz not null default now(),
  primary key(member_id, post_id)
);
create index on public.post_saves(post_id);

create table public.post_interests(
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts on delete cascade,
  buyer_id uuid not null references public.profiles on delete cascade,
  created_at timestamptz not null default now(),
  seen_at timestamptz,
  unique(post_id, buyer_id)
);
create index on public.post_interests(buyer_id);

create table public.post_reports(
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts on delete cascade,
  reporter_id uuid not null references public.profiles on delete cascade,
  reason text not null check (length(reason) between 3 and 1000),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  unique(post_id, reporter_id)
);
create index on public.post_reports(reporter_id);

alter table public.posts enable row level security;
alter table public.post_media enable row level security;
alter table public.follows enable row level security;
alter table public.post_saves enable row level security;
alter table public.post_interests enable row level security;
alter table public.post_reports enable row level security;

create or replace function public.can_see_post(p_post uuid) returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.posts p where p.id = p_post and (
    p.artist_id = (select auth.uid()) or (select public.is_admin()) or (p.removed_at is null and (select public.is_member()))))
$$;

-- posts: membros ativos veem os não removidos; a artista vê os próprios; admin vê tudo
create policy "diário: leitura" on public.posts for select to authenticated
  using (artist_id = (select auth.uid()) or (select public.is_admin()) or (removed_at is null and (select public.is_member())));
create policy "diário: artista publica" on public.posts for insert to authenticated
  with check (artist_id = (select auth.uid()) and kind = 'post' and (select public.my_role()) = 'artist' and (select public.is_member())
    and (select public.docs_ok((select auth.uid()))));
create policy "diário: artista apaga" on public.posts for delete to authenticated using (artist_id = (select auth.uid()));

create policy "mídia: leitura" on public.post_media for select to authenticated using ((select public.can_see_post(post_id)));
create policy "mídia: artista anexa" on public.post_media for insert to authenticated
  with check (exists(select 1 from public.posts p where p.id = post_id and p.artist_id = (select auth.uid()))
    and path is not null and gen is null and split_part(path, '/', 1) = (select auth.uid())::text);

create policy "seguir: dono lê" on public.follows for select to authenticated using (member_id = (select auth.uid()));
create policy "seguir: dono segue" on public.follows for insert to authenticated
  with check (member_id = (select auth.uid()) and (select public.is_member())
    and exists(select 1 from public.profiles a where a.id = artist_id and a.role = 'artist'));
create policy "seguir: dono deixa" on public.follows for delete to authenticated using (member_id = (select auth.uid()));

create policy "salvos: dono lê" on public.post_saves for select to authenticated using (member_id = (select auth.uid()));
create policy "salvos: dono salva" on public.post_saves for insert to authenticated
  with check (member_id = (select auth.uid()) and (select public.can_see_post(post_id)));
create policy "salvos: dono remove" on public.post_saves for delete to authenticated using (member_id = (select auth.uid()));

create policy "interesse: colecionador e artista" on public.post_interests for select to authenticated
  using (buyer_id = (select auth.uid()) or (select public.is_admin())
    or exists(select 1 from public.posts p where p.id = post_id and p.artist_id = (select auth.uid())));

create policy "denúncias: admin e autor" on public.post_reports for select to authenticated
  using (reporter_id = (select auth.uid()) or (select public.is_admin()));
create policy "denúncias: membro denuncia" on public.post_reports for insert to authenticated
  with check (reporter_id = (select auth.uid()) and (select public.can_see_post(post_id)));

-- "Tenho interesse": só colecionador ativo, uma vez por post. A artista vê o código do membro e a cidade.
create or replace function public.register_interest(p_post uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare v_work uuid;
begin
  if (select public.my_role()) is distinct from 'buyer' then raise exception 'Somente colecionadores registram interesse.' using errcode='P0001'; end if;
  if not public.is_member() then raise exception 'Sua conta não está ativa.' using errcode='P0001'; end if;
  if not public.can_see_post(p_post) then raise exception 'Publicação não encontrada.' using errcode='P0001'; end if;
  insert into public.post_interests(post_id, buyer_id) values (p_post, auth.uid()) on conflict (post_id, buyer_id) do nothing;
  select work_id into v_work from public.posts where id = p_post;
  return v_work;
end $$;

create or replace function public.mark_interests_seen() returns void language sql security definer set search_path='' as $$
  update public.post_interests i set seen_at = now()
  from public.posts p where p.id = i.post_id and p.artist_id = (select auth.uid()) and i.seen_at is null
$$;

-- números privados do diário (só a própria artista)
create or replace function public.diary_stats() returns json language sql stable security definer set search_path='' as $$
  select json_build_object(
    'followers', (select count(*) from public.follows where artist_id = (select auth.uid())),
    'saves', (select count(*) from public.post_saves s join public.posts p on p.id = s.post_id where p.artist_id = (select auth.uid())),
    'interests', (select count(*) from public.post_interests i join public.posts p on p.id = i.post_id where p.artist_id = (select auth.uid())),
    'unseen', (select count(*) from public.post_interests i join public.posts p on p.id = i.post_id where p.artist_id = (select auth.uid()) and i.seen_at is null),
    'posts', (select count(*) from public.posts where artist_id = (select auth.uid()) and removed_at is null))
$$;

-- moderação
create or replace function public.admin_moderate_post(p_post uuid, p_remove boolean, p_reason text) returns void language plpgsql security definer set search_path='' as $$
begin
  perform public._require_admin();
  if p_remove then
    update public.posts set removed_at = now(), removed_reason = left(coalesce(p_reason,''), 500) where id = p_post;
  else
    update public.posts set removed_at = null, removed_reason = '' where id = p_post;
  end if;
  update public.post_reports set resolved_at = now() where post_id = p_post and resolved_at is null;
end $$;

-- obra aprovada pela curadoria entra no diário da artista como "Obra nova"
create or replace function public._post_new_work() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.status = 'published' and old.status = 'review' then
    insert into public.posts(artist_id, kind, work_id) values (new.artist_id, 'obra_nova', new.id);
  end if;
  return new;
end $$;
create trigger works_new_post after update of status on public.works for each row execute function public._post_new_work();

do $$
declare t text;
begin
  foreach t in array array['posts','post_reports'] loop
    execute format('create trigger audit_%s after insert or update or delete on public.%I for each row execute function public._audit()', t, t);
  end loop;
end $$;

revoke execute on function public._post_new_work() from public, anon, authenticated;
revoke execute on function public.register_interest(uuid), public.mark_interests_seen(), public.diary_stats(),
  public.admin_moderate_post(uuid,boolean,text), public.can_see_post(uuid) from public, anon;
