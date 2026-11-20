-- Perfil personalizável: @usuário único e foto de perfil. Nome de exibição e bio passam a ser editáveis pelo membro.
alter table public.profiles add column if not exists handle text;
alter table public.profiles add column if not exists avatar_path text;

-- @ inicial a partir do nome (artistas) ou do código (colecionadores), sem repetição
do $$
declare r record; base text; h text; n int;
begin
  for r in select id, role, display_name, member_code from public.profiles where handle is null order by created_at loop
    base := case when r.role = 'artist'
      then left(regexp_replace(lower(translate(r.display_name, 'áàâãäéèêëíìîïóòôõöúùûüçñ', 'aaaaaeeeeiiiiooooouuuucn')), '[^a-z0-9]+', '', 'g'), 24)
      else lower(replace(r.member_code, '-', '')) end;
    if length(coalesce(base, '')) < 3 then base := lower(replace(r.member_code, '-', '')); end if;
    h := base; n := 1;
    while exists(select 1 from public.profiles where handle = h) loop n := n + 1; h := base || n; end loop;
    update public.profiles set handle = h where id = r.id;
  end loop;
end $$;

alter table public.profiles add constraint profiles_handle_fmt check (handle ~ '^[a-z0-9._]{3,30}$');
create unique index if not exists profiles_handle_key on public.profiles(handle);

-- novos membros ganham um @ provisório pelo código (podem trocar depois)
create or replace function public._profile_handle() returns trigger language plpgsql security definer set search_path='' as $$
declare h text; n int := 1;
begin
  if new.handle is null then
    h := lower(replace(new.member_code, '-', ''));
    while exists(select 1 from public.profiles where handle = h) loop n := n + 1; h := lower(replace(new.member_code, '-', '')) || n; end loop;
    new.handle := h;
  end if;
  return new;
end $$;
create trigger profiles_handle before insert on public.profiles for each row execute function public._profile_handle();
revoke execute on function public._profile_handle() from public, anon, authenticated;

grant update (display_name, handle, avatar_path, bio, city, practice) on public.profiles to authenticated;
