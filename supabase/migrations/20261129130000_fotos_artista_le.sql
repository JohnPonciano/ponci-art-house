-- O Storage só apaga o que o usuário consegue ler: sem esta política, a artista não conseguia remover as próprias fotos.
drop policy if exists "artista lê as próprias fotos" on storage.objects;
create policy "artista lê as próprias fotos" on storage.objects for select to authenticated
  using (bucket_id = 'works' and (storage.foldername(name))[1] = (select auth.uid())::text);
