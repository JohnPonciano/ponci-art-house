-- Revisão de segurança: "simular aprovação" vale só para contas de demonstração (antes, qualquer artista
-- podia publicar a própria obra pulando a curadoria chamando a função direto).
create or replace function public.demo_approve_work(p_work uuid) returns void language plpgsql security definer set search_path='' as $$
begin
  if coalesce((select email from auth.users where id = auth.uid()), '') not like '%@demo.ponci.art' then
    raise exception 'Disponível só nas contas de demonstração.' using errcode='42501'; end if;
  update public.works set status='published' where id = p_work and artist_id = auth.uid() and status='review';
  if not found then raise exception 'Obra não está em curadoria.' using errcode='P0001'; end if;
end $$;
-- função interna de event trigger: ninguém precisa chamá-la pela API
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
