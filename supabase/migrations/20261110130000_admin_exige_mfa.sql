-- Ações e leituras de admin só numa sessão que passou pelo segundo fator (aal2).
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path='' as $$
  select coalesce((select auth.jwt())->>'aal', '') = 'aal2'
     and exists(select 1 from public.admins where email = lower(coalesce((select auth.jwt())->>'email','')))
$$;
