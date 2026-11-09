revoke execute on function public.is_member(), public.my_role(), public.can_see_private(uuid), public.is_work_artist(uuid) from public, anon;
grant execute on function public.is_member(), public.my_role(), public.can_see_private(uuid), public.is_work_artist(uuid) to authenticated;
