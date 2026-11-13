-- PONCI · Comunidade: o Diário vira espaço de conversa entre artistas e colecionadores.
-- Todos os membros ativos publicam, comentam (com uma camada de respostas) e curtem.
-- A coluna posts.artist_id passa a significar "autor" (mantida pelo nome para não quebrar funções antigas).

alter table public.posts add column if not exists topic text not null default 'geral'
  constraint posts_topic_check check (topic in ('geral','processo','obras','exposicoes','colecao','mercado'));
update public.posts set topic = 'obras' where kind = 'obra_nova' and topic = 'geral';
update public.posts set topic = 'processo' where kind = 'post' and topic = 'geral';
create index if not exists posts_topic_created_idx on public.posts(topic, created_at desc);
comment on column public.posts.artist_id is 'Autor da publicação (artista ou colecionador).';

-- colecionadores aparecem pelo código de membro, a menos que escolham mostrar o nome
alter table public.profiles add column if not exists show_name boolean not null default false;
alter table public.profiles add column if not exists community_seen_at timestamptz not null default now();
grant update (show_name) on public.profiles to authenticated;

-- publicar: qualquer membro ativo com documentos aceitos; obra ligada só se for dele
alter policy "diário: artista publica" on public.posts rename to "comunidade: membro publica";
alter policy "comunidade: membro publica" on public.posts with check (
  artist_id = (select auth.uid()) and kind = 'post' and topic <> 'obras'
  and (select public.is_member()) and (select public.docs_ok((select auth.uid())))
  and (work_id is null or exists(select 1 from public.works w where w.id = work_id and w.artist_id = (select auth.uid()))));
alter policy "diário: artista apaga" on public.posts rename to "comunidade: autor apaga";
alter policy "mídia: artista anexa" on public.post_media rename to "mídia: autor anexa";

-- comentários (uma camada de respostas)
create table if not exists public.post_comments(
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts on delete cascade,
  parent_id uuid references public.post_comments on delete cascade,
  author_id uuid not null references public.profiles on delete cascade,
  body text not null check (length(btrim(body)) between 1 and 1000),
  created_at timestamptz not null default now(),
  removed_at timestamptz,
  removed_reason text not null default ''
);
create index if not exists post_comments_post_idx on public.post_comments(post_id, created_at);
create index if not exists post_comments_author_idx on public.post_comments(author_id);
create index if not exists post_comments_parent_idx on public.post_comments(parent_id);
alter table public.post_comments enable row level security;

create policy "comentários: leitura" on public.post_comments for select to authenticated
  using ((select public.can_see_post(post_id)) and (removed_at is null or author_id = (select auth.uid()) or (select public.is_admin())));
create policy "comentários: membro comenta" on public.post_comments for insert to authenticated
  with check (author_id = (select auth.uid()) and removed_at is null and (select public.is_member()) and (select public.docs_ok((select auth.uid())))
    and (select public.can_see_post(post_id))
    and (parent_id is null or exists(select 1 from public.post_comments c where c.id = parent_id and c.post_id = post_comments.post_id and c.parent_id is null)));
-- apaga o próprio comentário; o autor da publicação também pode apagar comentários nela
create policy "comentários: autor apaga" on public.post_comments for delete to authenticated
  using (author_id = (select auth.uid()) or exists(select 1 from public.posts p where p.id = post_id and p.artist_id = (select auth.uid())));

-- curtidas
create table if not exists public.post_likes(
  member_id uuid not null references public.profiles on delete cascade,
  post_id uuid not null references public.posts on delete cascade,
  created_at timestamptz not null default now(),
  primary key(member_id, post_id)
);
create index if not exists post_likes_post_idx on public.post_likes(post_id);
alter table public.post_likes enable row level security;
create policy "curtidas: leitura" on public.post_likes for select to authenticated using ((select public.can_see_post(post_id)));
create policy "curtidas: membro curte" on public.post_likes for insert to authenticated
  with check (member_id = (select auth.uid()) and (select public.is_member()) and (select public.can_see_post(post_id)));
create policy "curtidas: membro desfaz" on public.post_likes for delete to authenticated using (member_id = (select auth.uid()));

-- obra aprovada entra no espaço "Obras novas"
create or replace function public._post_new_work() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.status = 'published' and old.status = 'review' then
    insert into public.posts(artist_id, kind, work_id, topic) values (new.artist_id, 'obra_nova', new.id, 'obras');
  end if;
  return new;
end $$;

-- moderação de comentários
create or replace function public.admin_moderate_comment(p_comment uuid, p_remove boolean, p_reason text) returns void
language plpgsql security definer set search_path='' as $$
begin
  perform public._require_admin();
  if p_remove then update public.post_comments set removed_at = now(), removed_reason = left(coalesce(p_reason,''), 500) where id = p_comment;
  else update public.post_comments set removed_at = null, removed_reason = '' where id = p_comment; end if;
end $$;

-- atividade: comentários e curtidas nas minhas publicações e respostas aos meus comentários
create or replace function public.community_activity() returns json language sql stable security definer set search_path='' as $$
  with ev as (
    select 'comment'::text as kind, c.created_at, c.author_id as actor, c.post_id, left(c.body, 140) as body
      from public.post_comments c join public.posts p on p.id = c.post_id
      where p.artist_id = (select auth.uid()) and c.author_id <> (select auth.uid()) and c.removed_at is null and c.parent_id is null
    union all
    select 'reply', c.created_at, c.author_id, c.post_id, left(c.body, 140)
      from public.post_comments c join public.post_comments pc on pc.id = c.parent_id
      where pc.author_id = (select auth.uid()) and c.author_id <> (select auth.uid()) and c.removed_at is null
    union all
    select 'like', l.created_at, l.member_id, l.post_id, ''
      from public.post_likes l join public.posts p on p.id = l.post_id
      where p.artist_id = (select auth.uid()) and l.member_id <> (select auth.uid())
  ), seen as (select community_seen_at as t from public.profiles where id = (select auth.uid()))
  select json_build_object(
    'unseen', (select count(*) from ev where ev.created_at > coalesce((select t from seen), '-infinity'::timestamptz)),
    'items', coalesce((select json_agg(x order by x.created_at desc) from (
      select ev.kind, ev.created_at, ev.post_id, ev.body, ev.created_at > coalesce((select t from seen), '-infinity'::timestamptz) as fresh,
             pr.role, pr.member_code, pr.city,
             case when pr.role = 'artist' or pr.show_name then pr.display_name end as name
        from ev join public.profiles pr on pr.id = ev.actor order by ev.created_at desc limit 30) x), '[]'::json))
$$;
create or replace function public.mark_community_seen() returns void language sql security definer set search_path='' as $$
  update public.profiles set community_seen_at = now() where id = (select auth.uid())
$$;

create trigger audit_post_comments after insert or update or delete on public.post_comments for each row execute function public._audit();

revoke execute on function public.admin_moderate_comment(uuid,boolean,text), public.community_activity(), public.mark_community_seen() from public, anon;
grant execute on function public.admin_moderate_comment(uuid,boolean,text), public.community_activity(), public.mark_community_seen() to authenticated;

-- resposta só a comentário de primeiro nível da mesma publicação (função evita recursão de RLS)
create or replace function public._comment_parent_ok(p_parent uuid, p_post uuid) returns boolean language sql stable security definer set search_path='' as $$
  select p_parent is null or exists(select 1 from public.post_comments c where c.id = p_parent and c.post_id = p_post and c.parent_id is null)
$$;
revoke execute on function public._comment_parent_ok(uuid,uuid) from public, anon;
grant execute on function public._comment_parent_ok(uuid,uuid) to authenticated;
alter policy "comentários: membro comenta" on public.post_comments
  with check (author_id = (select auth.uid()) and removed_at is null and (select public.is_member()) and (select public.docs_ok((select auth.uid())))
    and (select public.can_see_post(post_id)) and public._comment_parent_ok(parent_id, post_id));
