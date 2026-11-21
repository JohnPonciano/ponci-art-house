-- Marcação de reprodução (REPROD): a artista avisa quando a obra é uma reprodução (impressão, fine art, pôster).
alter table public.works add column if not exists reproduction boolean not null default false;

-- A artista liga ou desliga a marcação nas próprias obras.
create or replace function public.set_work_reproduction(p_work uuid, p_on boolean) returns void
language plpgsql security definer set search_path='' as $$
begin
  update public.works set reproduction = coalesce(p_on, false) where id = p_work and artist_id = auth.uid();
  if not found then raise exception 'Obra não encontrada.' using errcode='P0001'; end if;
end $$;
revoke execute on function public.set_work_reproduction(uuid, boolean) from public, anon;
grant execute on function public.set_work_reproduction(uuid, boolean) to authenticated;

-- Vitrine pública passa a informar a marcação.
drop function if exists public.vitrine(int);
create function public.vitrine(p_limit int default 6)
returns table(id uuid, slug text, no int, title text, year int, cat text, medium text, h int, w int, edition text,
              gen jsonb, image_path text, img_w int, img_h int, artist_name text, reproduction boolean)
language sql stable security definer set search_path='' as $$
  select w.id, w.slug, w.no, w.title, w.year, w.cat, w.medium, w.h, w.w, w.edition, w.gen, w.image_path, w.img_w, w.img_h, p.display_name, w.reproduction
  from public.works w join public.profiles p on p.id = w.artist_id
  where w.status = 'published' order by w.created_at desc limit least(greatest(p_limit,1),24)
$$;
grant execute on function public.vitrine(int) to anon, authenticated;
