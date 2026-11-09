create policy "membro lê o próprio perfil" on public.profiles for select to authenticated using (id = (select auth.uid()));
