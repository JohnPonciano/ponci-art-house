-- Reels de 25/11 a 02/12: dois por dia (11h40 e 18h40), com trilha original da PONCI no vídeo e capa.
-- Pode rodar de novo: não duplica (confere pelo nome).
insert into public.ig_posts(kind, media, caption, publish_at, label, cover_url)
select 'reel', array['https://ponci.art/kit/reels/reel-04-pov-atelie.mp4'], 'POV: você entrou no ateliê de um artista. 🎨
Cheiro de tinta, pincel no pote de requeijão e três telas começadas.
Marca aquele amigo que tem um cantinho assim em casa.

#atelieDeArte #artistaBrasileiro #arteBrasileira #processoCriativo', '2026-11-25 11:40:00-03', 'Reel · POV: ateliê', 'https://ponci.art/kit/reels/reel-04-pov-atelie-capa.jpg'
where not exists(select 1 from public.ig_posts where label = 'Reel · POV: ateliê');

insert into public.ig_posts(kind, media, caption, publish_at, label, cover_url)
select 'reel', array['https://ponci.art/kit/reels/reel-05-sinais-colecionador.mp4'], 'Sinais de que você vai virar colecionador (sem perceber). 👀
Quantos você marcou? Conta aqui embaixo.

#colecionadorDeArte #arteBrasileira #arteNaParede #decoracaoComArte', '2026-11-25 18:40:00-03', 'Reel · Sinais de colecionador', 'https://ponci.art/kit/reels/reel-05-sinais-colecionador-capa.jpg'
where not exists(select 1 from public.ig_posts where label = 'Reel · Sinais de colecionador');

insert into public.ig_posts(kind, media, caption, publish_at, label, cover_url)
select 'reel', array['https://ponci.art/kit/reels/reel-01-coisas-que-so-quem-pinta-entende.mp4'], 'Coisas que só quem pinta entende. 😅
Café no copo do pincel, tinta na roupa boa e a obra “quase pronta” há oito meses.
Qual faltou? Conta aqui embaixo e marca um amigo artista.

#artistaBrasileiro #vidaDeArtista #pintura #arteBrasileira', '2026-11-26 11:40:00-03', 'Reel · Coisas que só quem pinta entende', 'https://ponci.art/kit/reels/reel-01-coisas-que-so-quem-pinta-entende-capa.jpg'
where not exists(select 1 from public.ig_posts where label = 'Reel · Coisas que só quem pinta entende');

insert into public.ig_posts(kind, media, caption, publish_at, label, cover_url)
select 'reel', array['https://ponci.art/kit/reels/reel-09-altura-certa.mp4'], 'O erro que quase todo mundo comete: pendurar o quadro alto demais. 📏
O centro da obra fica a 1,50 m do chão, a altura que as galerias usam.
Salva pra próxima vez que pegar a furadeira.

#decoracao #arteNaParede #dicaDeDecoracao #casaComArte', '2026-11-26 18:40:00-03', 'Reel · Altura certa do quadro', 'https://ponci.art/kit/reels/reel-09-altura-certa-capa.jpg'
where not exists(select 1 from public.ig_posts where label = 'Reel · Altura certa do quadro');

insert into public.ig_posts(kind, media, caption, publish_at, label, cover_url)
select 'reel', array['https://ponci.art/kit/reels/reel-07-qual-vai-pra-parede.mp4'], 'A, B ou C: qual vai pra sua parede? 🖼️
Comenta a letra aqui embaixo.

#arteContemporanea #arteNaParede #arteBrasileira #decoracaoComArte', '2026-11-27 11:40:00-03', 'Reel · Qual vai pra parede? (reel)', 'https://ponci.art/kit/reels/reel-07-qual-vai-pra-parede-capa.jpg'
where not exists(select 1 from public.ig_posts where label = 'Reel · Qual vai pra parede? (reel)');

insert into public.ig_posts(kind, media, caption, publish_at, label, cover_url)
select 'reel', array['https://ponci.art/kit/reels/reel-08-artista-para-de-dizer.mp4'], 'Artista, para de dizer isso. ✋
“É só um rabisco” não é. É anos de prática.
Leva teu trabalho a sério, que a gente leva. Portfólio pelo link na bio.

#artistaBrasileiro #arteBrasileira #artistasIndependentes #vidaDeArtista', '2026-11-27 18:40:00-03', 'Reel · Artista, para de dizer isso', 'https://ponci.art/kit/reels/reel-08-artista-para-de-dizer-capa.jpg'
where not exists(select 1 from public.ig_posts where label = 'Reel · Artista, para de dizer isso');

insert into public.ig_posts(kind, media, caption, publish_at, label, cover_url)
select 'reel', array['https://ponci.art/kit/reels/reel-10-original-ou-reproducao.mp4'], 'Original ou reprodução: qual a diferença? 🤔
Original é peça única, feita à mão. Reprodução é impressão de uma obra.
As duas valem, só precisa estar escrito. Na PONCI, reprodução vem com a etiqueta REPROD.

#arteOriginal #colecionadorDeArte #arteBrasileira #dicaDeArte', '2026-11-28 11:40:00-03', 'Reel · Original ou reprodução', 'https://ponci.art/kit/reels/reel-10-original-ou-reproducao-capa.jpg'
where not exists(select 1 from public.ig_posts where label = 'Reel · Original ou reprodução');

insert into public.ig_posts(kind, media, caption, publish_at, label, cover_url)
select 'reel', array['https://ponci.art/kit/reels/reel-11-coisas-que-so-colecionador-entende.mp4'], 'Coisas que só quem coleciona arte entende. 😂
Parede nenhuma sobrando e ainda assim cabe mais uma.
Qual é a sua? Conta aqui.

#colecionadorDeArte #arteNaParede #arteBrasileira #amoArte', '2026-11-28 18:40:00-03', 'Reel · Coisas que só colecionador entende', 'https://ponci.art/kit/reels/reel-11-coisas-que-so-colecionador-entende-capa.jpg'
where not exists(select 1 from public.ig_posts where label = 'Reel · Coisas que só colecionador entende');

insert into public.ig_posts(kind, media, caption, publish_at, label, cover_url)
select 'reel', array['https://ponci.art/kit/reels/reel-02-toda-obra-comeca-num-atelie.mp4'], 'Tem gente pintando no quarto, na varanda, na mesa da cozinha, depois do expediente.
A gente quer conhecer todo mundo. Do Oiapoque ao Chuí: se você pinta, mostra aí. 🇧🇷
Portfólio pelo link na bio.

#artistaBrasileiro #arteBrasileira #atelie #pintura', '2026-11-29 11:40:00-03', 'Reel · Toda obra começa num ateliê (reel)', 'https://ponci.art/kit/reels/reel-02-toda-obra-comeca-num-atelie-capa.jpg'
where not exists(select 1 from public.ig_posts where label = 'Reel · Toda obra começa num ateliê (reel)');

insert into public.ig_posts(kind, media, caption, publish_at, label, cover_url)
select 'reel', array['https://ponci.art/kit/reels/reel-15-sofa-quadro.mp4'], 'Qual tamanho de quadro pro seu sofá? 🛋️
A regra: uns 2/3 da largura do sofá. Não tem uma grande? Duas ou três menores alinhadas resolvem.
Salva e vai medir o seu.

#decoracao #arteNaParede #salaDeEstar #dicaDeDecoracao', '2026-11-29 18:40:00-03', 'Reel · Tamanho do quadro pro sofá', 'https://ponci.art/kit/reels/reel-15-sofa-quadro-capa.jpg'
where not exists(select 1 from public.ig_posts where label = 'Reel · Tamanho do quadro pro sofá');

insert into public.ig_posts(kind, media, caption, publish_at, label, cover_url)
select 'reel', array['https://ponci.art/kit/reels/reel-12-por-que-fechada.mp4'], 'Por que a PONCI é fechada? Spoiler: não é frescura.
Tem robô de IA copiando obra de artista pra gerar imagem “no estilo de”. Aqui, a obra só aparece pra membro.
IA é ferramenta pra facilitar a vida, não pra apagar quem cria. 🛡️

#arteBrasileira #artistaBrasileiro #direitoAutoral #arteEIA', '2026-11-30 11:40:00-03', 'Reel · Por que fechada (reel)', 'https://ponci.art/kit/reels/reel-12-por-que-fechada-capa.jpg'
where not exists(select 1 from public.ig_posts where label = 'Reel · Por que fechada (reel)');

insert into public.ig_posts(kind, media, caption, publish_at, label, cover_url)
select 'reel', array['https://ponci.art/kit/reels/reel-06-quanto-custa-uma-obra.mp4'], 'Quanto custa uma obra original? Depende. 💸
Tamanho, técnica, tempo de ateliê e trajetória: tudo entra na conta.
Na PONCI, quem define o preço é o artista.

#mercadoDeArte #colecionadorDeArte #arteBrasileira #arteOriginal', '2026-11-30 18:40:00-03', 'Reel · Quanto custa uma obra', 'https://ponci.art/kit/reels/reel-06-quanto-custa-uma-obra-capa.jpg'
where not exists(select 1 from public.ig_posts where label = 'Reel · Quanto custa uma obra');

insert into public.ig_posts(kind, media, caption, publish_at, label, cover_url)
select 'reel', array['https://ponci.art/kit/reels/reel-14-arte-de-presente.mp4'], 'Arte de presente de Natal? Sim! 🎄
Pensa na pessoa, não na parede. Obra pequena também emociona. E conta quem fez.
Salva pra lembrar até o dia 24.

#presenteDeNatal #arteDePresente #arteBrasileira #natal', '2026-12-01 11:40:00-03', 'Reel · Arte de presente (reel)', 'https://ponci.art/kit/reels/reel-14-arte-de-presente-capa.jpg'
where not exists(select 1 from public.ig_posts where label = 'Reel · Arte de presente (reel)');

insert into public.ig_posts(kind, media, caption, publish_at, label, cover_url)
select 'reel', array['https://ponci.art/kit/reels/reel-13-do-atelie-ate-a-parede.mp4'], 'Do ateliê até a sua parede: como funciona na PONCI.
O artista cadastra, a curadoria olha uma por uma, você compra com contrato e o artista envia com rastreio. 📦
Quer entrar? Link na bio.

#arteBrasileira #colecionadorDeArte #artistaBrasileiro #comprarArte', '2026-12-01 18:40:00-03', 'Reel · Do ateliê até a parede', 'https://ponci.art/kit/reels/reel-13-do-atelie-ate-a-parede-capa.jpg'
where not exists(select 1 from public.ig_posts where label = 'Reel · Do ateliê até a parede');

insert into public.ig_posts(kind, media, caption, publish_at, label, cover_url)
select 'reel', array['https://ponci.art/kit/reels/reel-16-perguntas-pro-artista.mp4'], '3 perguntas pra fazer ao artista antes de comprar. 💬
A história, o material e a série. Às vezes a sua obra está na próxima.

#colecionadorDeArte #arteBrasileira #artistaBrasileiro #dicaDeArte', '2026-12-02 11:40:00-03', 'Reel · 3 perguntas pro artista', 'https://ponci.art/kit/reels/reel-16-perguntas-pro-artista-capa.jpg'
where not exists(select 1 from public.ig_posts where label = 'Reel · 3 perguntas pro artista');

insert into public.ig_posts(kind, media, caption, publish_at, label, cover_url)
select 'reel', array['https://ponci.art/kit/reels/reel-03-como-comecar-a-colecionar.mp4'], 'Como começar a colecionar arte sem ser milionário. ✨
Compra o que te faz parar, começa pequeno, conversa com quem fez e pendura logo.
Manda pra aquele amigo do “um dia eu compro um quadro”. O dia é hoje.

#colecionadorDeArte #arteBrasileira #comoColecionar #arteNaParede', '2026-12-02 18:40:00-03', 'Reel · Como começar a colecionar (reel)', 'https://ponci.art/kit/reels/reel-03-como-comecar-a-colecionar-capa.jpg'
where not exists(select 1 from public.ig_posts where label = 'Reel · Como começar a colecionar (reel)');

select publish_at at time zone 'America/Sao_Paulo' as quando, label, status from public.ig_posts where kind = 'reel' order by publish_at;
