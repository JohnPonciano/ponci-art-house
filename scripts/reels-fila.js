// Gera supabase/instagram/reels-dezembro.sql: 2 reels por dia (11h40 e 18h40, Brasília), de 25/11 a 02/12.
const fs=require('fs');
const R=[
['2026-11-25 11:40','reel-04-pov-atelie','POV: ateliê',`POV: você entrou no ateliê de um artista. 🎨
Cheiro de tinta, pincel no pote de requeijão e três telas começadas.
Marca aquele amigo que tem um cantinho assim em casa.

#atelieDeArte #artistaBrasileiro #arteBrasileira #processoCriativo`],
['2026-11-25 18:40','reel-05-sinais-colecionador','Sinais de colecionador',`Sinais de que você vai virar colecionador (sem perceber). 👀
Quantos você marcou? Conta aqui embaixo.

#colecionadorDeArte #arteBrasileira #arteNaParede #decoracaoComArte`],
['2026-11-26 11:40','reel-01-coisas-que-so-quem-pinta-entende','Coisas que só quem pinta entende',`Coisas que só quem pinta entende. 😅
Café no copo do pincel, tinta na roupa boa e a obra “quase pronta” há oito meses.
Qual faltou? Conta aqui embaixo e marca um amigo artista.

#artistaBrasileiro #vidaDeArtista #pintura #arteBrasileira`],
['2026-11-26 18:40','reel-09-altura-certa','Altura certa do quadro',`O erro que quase todo mundo comete: pendurar o quadro alto demais. 📏
O centro da obra fica a 1,50 m do chão, a altura que as galerias usam.
Salva pra próxima vez que pegar a furadeira.

#decoracao #arteNaParede #dicaDeDecoracao #casaComArte`],
['2026-11-27 11:40','reel-07-qual-vai-pra-parede','Qual vai pra parede? (reel)',`A, B ou C: qual vai pra sua parede? 🖼️
Comenta a letra aqui embaixo.

#arteContemporanea #arteNaParede #arteBrasileira #decoracaoComArte`],
['2026-11-27 18:40','reel-08-artista-para-de-dizer','Artista, para de dizer isso',`Artista, para de dizer isso. ✋
“É só um rabisco” não é. É anos de prática.
Leva teu trabalho a sério, que a gente leva. Portfólio pelo link na bio.

#artistaBrasileiro #arteBrasileira #artistasIndependentes #vidaDeArtista`],
['2026-11-28 11:40','reel-10-original-ou-reproducao','Original ou reprodução',`Original ou reprodução: qual a diferença? 🤔
Original é peça única, feita à mão. Reprodução é impressão de uma obra.
As duas valem, só precisa estar escrito. Na PONCI, reprodução vem com a etiqueta REPROD.

#arteOriginal #colecionadorDeArte #arteBrasileira #dicaDeArte`],
['2026-11-28 18:40','reel-11-coisas-que-so-colecionador-entende','Coisas que só colecionador entende',`Coisas que só quem coleciona arte entende. 😂
Parede nenhuma sobrando e ainda assim cabe mais uma.
Qual é a sua? Conta aqui.

#colecionadorDeArte #arteNaParede #arteBrasileira #amoArte`],
['2026-11-29 11:40','reel-02-toda-obra-comeca-num-atelie','Toda obra começa num ateliê (reel)',`Tem gente pintando no quarto, na varanda, na mesa da cozinha, depois do expediente.
A gente quer conhecer todo mundo. Do Oiapoque ao Chuí: se você pinta, mostra aí. 🇧🇷
Portfólio pelo link na bio.

#artistaBrasileiro #arteBrasileira #atelie #pintura`],
['2026-11-29 18:40','reel-15-sofa-quadro','Tamanho do quadro pro sofá',`Qual tamanho de quadro pro seu sofá? 🛋️
A regra: uns 2/3 da largura do sofá. Não tem uma grande? Duas ou três menores alinhadas resolvem.
Salva e vai medir o seu.

#decoracao #arteNaParede #salaDeEstar #dicaDeDecoracao`],
['2026-11-30 11:40','reel-12-por-que-fechada','Por que fechada (reel)',`Por que a PONCI é fechada? Spoiler: não é frescura.
Tem robô de IA copiando obra de artista pra gerar imagem “no estilo de”. Aqui, a obra só aparece pra membro.
IA é ferramenta pra facilitar a vida, não pra apagar quem cria. 🛡️

#arteBrasileira #artistaBrasileiro #direitoAutoral #arteEIA`],
['2026-11-30 18:40','reel-06-quanto-custa-uma-obra','Quanto custa uma obra',`Quanto custa uma obra original? Depende. 💸
Tamanho, técnica, tempo de ateliê e trajetória: tudo entra na conta.
Na PONCI, quem define o preço é o artista.

#mercadoDeArte #colecionadorDeArte #arteBrasileira #arteOriginal`],
['2026-12-01 11:40','reel-14-arte-de-presente','Arte de presente (reel)',`Arte de presente de Natal? Sim! 🎄
Pensa na pessoa, não na parede. Obra pequena também emociona. E conta quem fez.
Salva pra lembrar até o dia 24.

#presenteDeNatal #arteDePresente #arteBrasileira #natal`],
['2026-12-01 18:40','reel-13-do-atelie-ate-a-parede','Do ateliê até a parede',`Do ateliê até a sua parede: como funciona na PONCI.
O artista cadastra, a curadoria olha uma por uma, você compra com contrato e o artista envia com rastreio. 📦
Quer entrar? Link na bio.

#arteBrasileira #colecionadorDeArte #artistaBrasileiro #comprarArte`],
['2026-12-02 11:40','reel-16-perguntas-pro-artista','3 perguntas pro artista',`3 perguntas pra fazer ao artista antes de comprar. 💬
A história, o material e a série. Às vezes a sua obra está na próxima.

#colecionadorDeArte #arteBrasileira #artistaBrasileiro #dicaDeArte`],
['2026-12-02 18:40','reel-03-como-comecar-a-colecionar','Como começar a colecionar (reel)',`Como começar a colecionar arte sem ser milionário. ✨
Compra o que te faz parar, começa pequeno, conversa com quem fez e pendura logo.
Manda pra aquele amigo do “um dia eu compro um quadro”. O dia é hoje.

#colecionadorDeArte #arteBrasileira #comoColecionar #arteNaParede`],
];
const q=s=>"'"+s.replace(/'/g,"''")+"'";
let out='-- Reels de 25/11 a 02/12: dois por dia (11h40 e 18h40), com trilha original da PONCI no vídeo e capa.\n-- Pode rodar de novo: não duplica (confere pelo nome).\n';
for(const [when,file,label,cap] of R){
 out+=`insert into public.ig_posts(kind, media, caption, publish_at, label, cover_url)
select 'reel', array['https://ponci.art/kit/reels/${file}.mp4'], ${q(cap)}, '${when}:00-03', ${q('Reel · '+label)}, 'https://ponci.art/kit/reels/${file}-capa.jpg'
where not exists(select 1 from public.ig_posts where label = ${q('Reel · '+label)});\n\n`;}
out+="select publish_at at time zone 'America/Sao_Paulo' as quando, label, status from public.ig_posts where kind = 'reel' order by publish_at;\n";
fs.writeFileSync('supabase/instagram/reels-dezembro.sql',out);console.log(R.length,'reels');
