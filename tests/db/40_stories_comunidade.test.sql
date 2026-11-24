-- Stories da Comunidade (24h). Usa os membros criados em 10_.
select pg_temp.como('00000000-0000-0000-0000-0000000000a1','artista@demo.ponci.art');
set role authenticated;
insert into public.stories(author_id, path, w, h, caption) values ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000a1/stories/1.jpg', 1080, 1920, 'No ateliê');
select set_config('t.st', (select id::text from public.stories where caption = 'No ateliê'), false);
select pg_temp.espera_erro($$insert into public.stories(author_id, path, w, h) values ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000b1/stories/x.jpg', 1, 1)$$, 'policy', 'não publica em nome de outra pessoa');
select pg_temp.espera_erro($$insert into public.stories(author_id, path, w, h) values ('00000000-0000-0000-0000-0000000000a1', 'outra/pasta/x.jpg', 1, 1)$$, 'policy', 'foto precisa estar na pasta de stories da autora');
select pg_temp.espera_erro($$insert into public.stories(author_id, path, w, h, expires_at) values ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000a1/stories/2.jpg', 1, 1, now() + interval '3 days')$$, 'policy', 'não fica mais de 24 horas');
select pg_temp.espera_erro($$insert into public.stories(author_id, path, w, h, caption) values ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000a1/stories/3.jpg', 1, 1, repeat('x', 141))$$, 'check', 'legenda até 140 caracteres');
reset role;

select pg_temp.como('00000000-0000-0000-0000-0000000000b1','colecionadora@demo.ponci.art');
set role authenticated;
select pg_temp.confere((select count(*) = 1 from public.stories where id = current_setting('t.st')::uuid), 'outro membro vê o story');
insert into public.story_views(story_id, viewer_id) values (current_setting('t.st')::uuid, '00000000-0000-0000-0000-0000000000b1');
select pg_temp.espera_erro($$insert into public.story_views(story_id, viewer_id) values (current_setting('t.st')::uuid, '00000000-0000-0000-0000-0000000000a1')$$, 'policy', 'não marca visto por outra pessoa');
delete from public.stories where id = current_setting('t.st')::uuid;
select pg_temp.espera_erro($$select public.admin_remove_story(current_setting('t.st')::uuid, 'x')$$, 'restrito', 'membro não modera');
reset role;
select pg_temp.confere((select count(*) = 1 from public.stories where id = current_setting('t.st')::uuid), 'outro membro não apaga o story');

set role anon;
select pg_temp.confere((select count(*) = 0 from public.stories), 'visitante não vê stories');
reset role;

select pg_temp.como('00000000-0000-0000-0000-0000000000a1','artista@demo.ponci.art');
set role authenticated;
select pg_temp.confere((select count(*) = 1 from public.story_views where story_id = current_setting('t.st')::uuid), 'autora vê quem viu');
reset role;

-- vencido some para os outros, continua para a autora
update public.stories set created_at = now() - interval '25 hours', expires_at = now() - interval '1 hour' where id = current_setting('t.st')::uuid;
select pg_temp.como('00000000-0000-0000-0000-0000000000b1','colecionadora@demo.ponci.art');
set role authenticated;
select pg_temp.confere((select count(*) = 0 from public.stories where id = current_setting('t.st')::uuid), 'depois de 24h some para os outros');
reset role;
update public.stories set expires_at = now() + interval '1 hour' where id = current_setting('t.st')::uuid;

-- moderação
select pg_temp.como('00000000-0000-0000-0000-0000000000f1','admin@ponci.art','aal2');
set role authenticated;
select public.admin_remove_story(current_setting('t.st')::uuid, 'Imagem de terceiro');
reset role;
select pg_temp.confere((select removed_at is not null and removed_reason = 'Imagem de terceiro' from public.stories where id = current_setting('t.st')::uuid), 'admin remove com motivo');
select pg_temp.como('00000000-0000-0000-0000-0000000000b1','colecionadora@demo.ponci.art');
set role authenticated;
select pg_temp.confere((select count(*) = 0 from public.stories where id = current_setting('t.st')::uuid), 'removido some para os membros');
reset role;
