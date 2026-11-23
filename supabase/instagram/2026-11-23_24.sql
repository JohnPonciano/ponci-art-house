-- Posts de hoje e amanhã: carrossel "Mito ou verdade?" (seg 23/11 19h30) e "Arte, pra mim, é ___" (ter 24/11 12h20), cada um com story de chamada.
insert into public.ig_posts(kind, media, caption, publish_at, label)
select 'carousel', array(select 'https://ponci.art/kit/novos/mito-ou-verdade-' || n || '.jpg' from generate_series(1, 8) n),
'Mito ou verdade? Testa aí e conta quantas você acertou! 👀

Arte é coisa de gente rica? Precisa entender de arte pra colecionar? Moldura é só detalhe?
Arrasta pro lado e descobre. Depois manda pra aquele amigo que acha que arte é só pra museu. 😉

#arteBrasileira #colecionadorDeArte #mitoOuVerdade #arteContemporanea',
'2026-11-23 19:30:00-03', 'Mito ou verdade?'
where not exists(select 1 from public.ig_posts where label = 'Mito ou verdade?');

insert into public.ig_posts(kind, media, caption, publish_at, label)
select 'story', array['https://ponci.art/kit/novos/story-mito-ou-verdade.jpg'], '', '2026-11-23 20:10:00-03', 'Story · Mito ou verdade?'
where not exists(select 1 from public.ig_posts where label = 'Story · Mito ou verdade?');

insert into public.ig_posts(kind, media, caption, publish_at, label)
select 'image', array['https://ponci.art/kit/novos/arte-pra-mim-1.jpg'],
'Complete a frase: arte, pra mim, é ______. ✍️

Pode ser uma palavra, uma lembrança, um lugar. Não tem resposta certa.
A gente lê todas (e as melhores podem aparecer por aqui).

#arte #arteBrasileira #artistaBrasileiro #completeAFrase',
'2026-11-24 12:20:00-03', 'Arte, pra mim, é…'
where not exists(select 1 from public.ig_posts where label = 'Arte, pra mim, é…');

insert into public.ig_posts(kind, media, caption, publish_at, label)
select 'story', array['https://ponci.art/kit/novos/story-arte-pra-mim.jpg'], '', '2026-11-24 13:00:00-03', 'Story · Arte, pra mim, é…'
where not exists(select 1 from public.ig_posts where label = 'Story · Arte, pra mim, é…');

select label, publish_at from public.ig_posts where label in ('Mito ou verdade?', 'Story · Mito ou verdade?', 'Arte, pra mim, é…', 'Story · Arte, pra mim, é…') order by publish_at;
