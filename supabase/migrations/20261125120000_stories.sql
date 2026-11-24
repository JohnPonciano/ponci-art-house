-- Stories da Comunidade: uma foto vertical que fica 24 horas no ar.
-- Qualquer membro ativo publica; membros veem; quem publicou vê quantas pessoas viram; admin pode remover.

create table if not exists public.stories(
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles on delete cascade,
  path text not null,
  w int not null check (w > 0), h int not null check (h > 0),
  caption text not null default '' check (length(caption) <= 140),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '24 hours',
  removed_at timestamptz,
  removed_reason text
);
create index if not exists stories_live_idx on public.stories(expires_at) where removed_at is null;
create index if not exists stories_author_idx on public.stories(author_id, created_at);

create table if not exists public.story_views(
  story_id uuid not null references public.stories on delete cascade,
  viewer_id uuid not null references public.profiles on delete cascade,
  seen_at timestamptz not null default now(),
  primary key (story_id, viewer_id)
);

alter table public.stories enable row level security;
alter table public.story_views enable row level security;

drop policy if exists "stories: membros veem os do dia" on public.stories;
create policy "stories: membros veem os do dia" on public.stories for select to authenticated
  using (author_id = (select auth.uid()) or (select public.is_admin())
         or (removed_at is null and expires_at > now() and (select public.is_member())));
drop policy if exists "stories: membro ativo publica" on public.stories;
create policy "stories: membro ativo publica" on public.stories for insert to authenticated
  with check (author_id = (select auth.uid())
    and exists(select 1 from public.profiles p where p.id = (select auth.uid()) and p.status = 'active')
    and path like (select auth.uid())::text || '/stories/%'
    and expires_at <= now() + interval '24 hours 1 minute' and removed_at is null);
drop policy if exists "stories: autor apaga" on public.stories;
create policy "stories: autor apaga" on public.stories for delete to authenticated using (author_id = (select auth.uid()));

drop policy if exists "stories: marcar como visto" on public.story_views;
create policy "stories: marcar como visto" on public.story_views for insert to authenticated
  with check (viewer_id = (select auth.uid()) and (select public.is_member()));
drop policy if exists "stories: vistos próprios e do autor" on public.story_views;
create policy "stories: vistos próprios e do autor" on public.story_views for select to authenticated
  using (viewer_id = (select auth.uid())
         or exists(select 1 from public.stories s where s.id = story_id and s.author_id = (select auth.uid())));

-- admin remove (moderação), com motivo
create or replace function public.admin_remove_story(p_story uuid, p_reason text) returns void
language plpgsql security definer set search_path='' as $$
begin
  perform public._require_admin();
  update public.stories set removed_at = now(), removed_reason = left(btrim(coalesce(p_reason, '')), 300) where id = p_story and removed_at is null;
  if not found then raise exception 'Story não encontrado.' using errcode='P0001'; end if;
end $$;
revoke execute on function public.admin_remove_story(uuid, text) from public, anon;
grant execute on function public.admin_remove_story(uuid, text) to authenticated;

-- admin publica story pelo perfil oficial da PONCI (foto na pasta oficial)
create or replace function public.admin_story_as_ponci(p_path text, p_w int, p_h int, p_caption text default '') returns uuid
language plpgsql security definer set search_path='' as $$
declare v uuid := public.official_id(); sid uuid;
begin
  perform public._require_admin();
  if v is null then raise exception 'Perfil oficial não encontrado.' using errcode='P0001'; end if;
  if p_path not like v::text || '/stories/%' then raise exception 'Imagem inválida.' using errcode='P0001'; end if;
  insert into public.stories(author_id, path, w, h, caption) values (v, p_path, p_w, p_h, left(btrim(coalesce(p_caption, '')), 140)) returning id into sid;
  return sid;
end $$;
revoke execute on function public.admin_story_as_ponci(text, int, int, text) from public, anon;
grant execute on function public.admin_story_as_ponci(text, int, int, text) to authenticated;
