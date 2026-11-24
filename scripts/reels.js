// Gera os reels (MP4 1080x1920, 30 fps). Uso: node scripts/reels.js <pasta com kit-fonts/ e kit-img/> media-kit/reels
const {chromium}=require('playwright');const fs=require('fs');const {execFileSync}=require('child_process');
const SP=process.argv[2], OUT=process.argv[3], F=SP+'/kit-fonts', I=SP+'/kit-img', FPS=30;
const img=n=>'file://'+I+'/'+n+'.jpg';
const css=`
@font-face{font-family:Wide;src:url(file://${F}/wide900.ttf)}@font-face{font-family:Cond;src:url(file://${F}/cond800.ttf)}
@font-face{font-family:Grot;src:url(file://${F}/reg400.ttf)}
@font-face{font-family:PSerif;src:url(file://${F}/InstrumentSerif.ttf);font-style:italic}@font-face{font-family:Mono;src:url(file://${F}/IBMPlexMono.ttf)}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1920px;overflow:hidden;background:#121211;font-family:Grot;-webkit-font-smoothing:antialiased}
.sc{position:absolute;inset:0;overflow:hidden;visibility:hidden}
.dark{background:#121211;color:#F2F0EB}.paper{background:#F2F0EB;color:#121211}.ocre{background:#8B6A4F;color:#F2F0EB}
.ph{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(18,18,17,.5) 0%,rgba(18,18,17,0) 22%,rgba(18,18,17,.25) 45%,rgba(18,18,17,.9) 100%)}
.cond{font-family:Cond;text-transform:uppercase;line-height:.9;letter-spacing:-.01em}
.serif{font-family:PSerif;font-style:italic;line-height:1.02}
.wm{font-family:Wide;text-transform:uppercase;letter-spacing:-.035em;line-height:.8}
.txt{position:absolute;left:84px;right:170px}.ph~.txt{text-shadow:0 2px 28px rgba(0,0,0,.55)}
.sig{position:absolute;left:84px;top:230px;display:flex;align-items:center;gap:14px;font:400 26px/1 Mono;letter-spacing:.14em;text-transform:uppercase}
.sig i{width:20px;height:20px;background:#8B6A4F;display:block}
@keyframes vis{0%,100%{visibility:visible}}
@keyframes kb1{from{transform:scale(1.04)}to{transform:scale(1.16) translate(-1.5%,-1%)}}
@keyframes kb2{from{transform:scale(1.16) translate(1.5%,0)}to{transform:scale(1.04)}}
@keyframes rise{from{opacity:0;transform:translateY(60px)}to{opacity:1;transform:none}}
@keyframes pop{0%{opacity:0;transform:scale(.92)}100%{opacity:1;transform:none}}
`;
/* Cada cena: {d: duração, cls, photo, pos, body(r)} onde r(atraso) devolve o estilo de entrada do texto. */
function build(scenes){let t=0,html='';scenes.forEach((s,k)=>{const st=t;const r=(d=0,a='rise',len=.55)=>`animation:${a} ${len}s cubic-bezier(.2,.7,.2,1) ${(st+d).toFixed(2)}s both`;
 html+=`<div class="sc ${s.cls||'dark'}" style="animation:vis ${s.d}s step-end ${st}s">`+
 (s.photo?`<img class="ph" src="${img(s.photo)}" style="object-position:${s.pos||'center'};animation:${k%2?'kb2':'kb1'} ${s.d}s linear ${st}s both"><div class="shade"></div>`:'')+
 `<div class="sig" style="color:${s.cls==='paper'?'#121211':'#F2F0EB'}"><i></i>PONCI</div>`+s.body(r)+`</div>`;t+=s.d;});
 return {html:`<!doctype html><html><head><meta charset=utf-8><style>${css}</style></head><body>${html}</body></html>`,dur:t};}
const low=(inner)=>`<div class="txt" style="bottom:470px">${inner}</div>`;   // acima da legenda do Instagram
const mid=(inner)=>`<div class="txt" style="top:0;bottom:200px;display:flex;flex-direction:column;justify-content:center">${inner}</div>`;
const H=(t,r,sz=150,c='')=>`<p class="cond" style="font-size:${sz}px;${c};${r}">${t}</p>`;
const S=(t,r,sz=96,c='')=>`<p class="serif" style="font-size:${sz}px;${c};${r}">${t}</p>`;
const B=(t,r,c='')=>`<p style="font:400 46px/1.4 Grot;margin-top:30px;${c};${r}">${t}</p>`;
const end=(r,line1,line2)=>mid(`${S(line1,r(0),118)}${B(line2,r(.5),'color:#F2E8DA')}<p class="wm" style="font-size:150px;margin-top:110px;${r(1.0,'pop',.6)}">PONCI</p><p style="font:400 32px/1 Mono;letter-spacing:.12em;margin-top:28px;color:#F2E8DA;${r(1.2)}">@ponci.art</p>`);

const reels={
'reel-01-coisas-que-so-quem-pinta-entende':[
 {d:2.6,photo:'u-mesa',pos:'center 45%',body:r=>low(H('Coisas que só quem pinta entende',r(.1),150,'color:#F2F0EB')+S('(marca um amigo)',r(.7),72,'color:#E6E2DA;margin-top:24px'))},
 {d:2.4,cls:'paper',body:r=>mid(S('Molhar o pincel no copo do café.',r(0),118)+B('Ou tomar café no copo do pincel.',r(.9),'color:#55524D'))},
 {d:2.4,photo:'u-abs-rosa',pos:'center 40%',body:r=>low(H('A obra “quase pronta” há oito meses.',r(0),130,'color:#F2F0EB')+B('Falta só um detalhe. Sempre.',r(.9),'color:#E6E2DA'))},
 {d:2.2,body:r=>mid(S('Tinta na roupa boa.',r(0),130)+B('Nunca na roupa velha.',r(.8),'color:#BDB8AF'))},
 {d:2.6,photo:'u-pincel',pos:'center 50%',body:r=>low(H('“Nossa, eu não tenho dom nenhum.”',r(0),130,'color:#F2F0EB')+B('Todo almoço de família.',r(1.0),'color:#E6E2DA'))},
 {d:3.0,cls:'ocre',body:r=>end(r,'Qual faltou?','Conta aqui embaixo.')}],
'reel-02-toda-obra-comeca-num-atelie':[
 {d:2.0,photo:'u-maos',pos:'center 40%',body:r=>low(S('Tem gente pintando no quarto.',r(.1),110,'color:#F2F0EB'))},
 {d:1.6,photo:'u-mesa',pos:'center 40%',body:r=>low(S('Na varanda.',r(0),130,'color:#F2F0EB'))},
 {d:1.6,photo:'u-atelie',pos:'center 30%',body:r=>low(S('Na mesa da cozinha.',r(0),130,'color:#F2F0EB'))},
 {d:1.8,photo:'u-pintora',pos:'center 30%',body:r=>low(S('Depois do expediente.',r(0),130,'color:#F2F0EB'))},
 {d:2.2,body:r=>mid(H('A gente quer ver todos.',r(0),170))},
 {d:3.6,cls:'paper',body:r=>mid(H('Estamos conhecendo <span style="color:#8B6A4F">artistas.</span>',r(0),124)+B('Do Oiapoque ao Chuí: se você pinta, mostra aí.',r(.7),'color:#55524D')+`<p style="font:400 34px/1 Mono;letter-spacing:.1em;text-transform:uppercase;margin-top:60px;${r(1.3)}">Manda seu portfólio · link na bio</p>`)}],
'reel-03-como-comecar-a-colecionar':[
 {d:2.6,photo:'u-visita',pos:'center 40%',body:r=>low(H('Como começar a colecionar arte',r(.1),136,'color:#F2F0EB')+S('sem ser milionário',r(.7),80,'color:#E6E2DA;margin-top:24px'))},
 ...[['01','Compra o que te faz parar.','Voltou pra olhar duas vezes? Bom sinal.','paper'],['02','Começa pequeno.','Desenho, gravura, obra em papel.','dark',],
     ['03','Conversa com quem fez.','Artista adora um bom papo.','photo:u-artista:center 30%'],['04','Pergunta como cuidar.','Sol, umidade, maresia: cada obra pede um cuidado.','dark'],
     ['05','Pendura logo.','Arte é pra morar junto.','photo:u-sala:center 35%']].map(([n,t,b,k])=>{const ph=k.startsWith('photo')?k.split(':'):null;const tc=k==='paper'?'':'color:#F2F0EB';
   return {d:2.2,cls:ph?'dark':k,photo:ph&&ph[1],pos:ph&&ph[2],body:r=>(ph?low:mid)(`<p style="font:400 40px/1 Mono;letter-spacing:.14em;color:#B98F6B;${r(0)}">${n}</p>`+H(t,r(.15),140,tc+';margin-top:26px')+B(b,r(.7),ph?'color:#E6E2DA':k==='paper'?'color:#55524D':'color:#BDB8AF'))};}),
 {d:3.2,cls:'ocre',body:r=>end(r,'Salva e manda pra aquele amigo do “um dia eu compro um quadro”.','O dia é hoje.')}],
};

/* ---------- lote 2 (dezembro): 2 reels por dia ---------- */
const NUM=(n,r)=>`<p style="font:400 40px/1 Mono;letter-spacing:.14em;color:#B98F6B;${r}">${n}</p>`;
const tip=(n,t,b,k,sz=140)=>{const ph=k.startsWith('photo')?k.split(':'):null;const tc=k==='paper'?'':'color:#F2F0EB';
 return {d:2.4,cls:ph?'dark':k,photo:ph&&ph[1],pos:ph&&ph[2],body:r=>(ph?low:mid)(NUM(n,r(0))+H(t,r(.15),sz,tc+';margin-top:26px')+B(b,r(.7),ph?'color:#E6E2DA':k==='paper'?'color:#55524D':'color:#BDB8AF'))};};
const opener=(photo,pos,t,sub,sz=140)=>({d:2.6,photo,pos,body:r=>low(H(t,r(.1),sz,'color:#F2F0EB')+(sub?S(sub,r(.7),76,'color:#E6E2DA;margin-top:24px'):''))});
const card=(cls,t,b,sz=118)=>({d:2.4,cls,body:r=>mid(S(t,r(0),sz)+(b?B(b,r(.8),cls==='paper'?'color:#55524D':'color:#BDB8AF'):''))});
Object.assign(reels,{
'reel-04-pov-atelie':[
 {d:2.2,photo:'u-atelie',pos:'center 35%',body:r=>low(S('POV: você entrou no ateliê de um artista',r(.1),104,'color:#F2F0EB'))},
 {d:1.8,photo:'u-mesa',pos:'center 45%',body:r=>low(H('Cheiro de tinta.',r(0),130,'color:#F2F0EB'))},
 {d:1.8,photo:'u-pincel',pos:'center 50%',body:r=>low(H('Pincel de molho no pote de requeijão.',r(0),120,'color:#F2F0EB'))},
 {d:1.8,photo:'u-maos',pos:'center 40%',body:r=>low(H('Mão suja até o cotovelo.',r(0),130,'color:#F2F0EB'))},
 {d:2.0,photo:'u-textura',pos:'center 50%',body:r=>low(H('Três telas começadas e nenhuma pronta.',r(0),120,'color:#F2F0EB'))},
 {d:3.0,cls:'ocre',body:r=>end(r,'Melhor lugar do mundo.','Concorda? Marca quem tem um ateliê assim.')}],
'reel-05-sinais-colecionador':[
 opener('u-olhar','center 40%','Sinais de que você vai virar colecionador','(sem perceber)',116),
 card('paper','Você para na frente de quadro em consultório.','E fica olhando mais que pro celular.'),
 card('dark','Sabe a medida de todas as paredes da casa.','De cabeça.'),
 card('paper','Já trocou a almofada pra combinar com o quadro.','E não o contrário.'),
 card('dark','Segue mais artista do que famoso.','O feed agradece.'),
 {d:3.0,cls:'ocre',body:r=>end(r,'Quantos você marcou?','3 ou mais: não tem mais volta.')}],
'reel-06-quanto-custa-uma-obra':[
 opener('u-galeria','center 45%','Quanto custa uma obra original?','depende. e a gente te conta do quê'),
 tip('01','Tamanho.','Obra maior leva mais material e mais tempo.','paper'),
 tip('02','Técnica.','Óleo, acrílica, gravura, papel: cada uma tem seu custo.','dark'),
 tip('03','Tempo de ateliê.','Tem obra que leva uma semana. Tem obra que leva um ano.','photo:u-pintora:center 35%'),
 tip('04','Trajetória.','Exposições, prêmios, quem já coleciona.','dark'),
 {d:3.2,cls:'ocre',body:r=>end(r,'Preço justo é bom pros dois lados.','Na PONCI, quem define é o artista.')}],
'reel-07-qual-vai-pra-parede':[
 {d:2.6,cls:'dark',body:r=>mid(H('Qual vai pra sua parede?',r(.1),170)+S('vota nos comentários',r(.7),80,'color:#BDB8AF;margin-top:24px'))},
 ...[['A','geo'],['B','gesto'],['C','anil']].map(([l,ph])=>({d:2.4,cls:'paper',body:r=>`<img src="${img(ph)}" style="position:absolute;left:140px;right:140px;top:330px;width:800px;height:1000px;object-fit:cover;box-shadow:0 30px 80px rgba(0,0,0,.25);${r(0,'pop',.6)}"><p class="wm" style="position:absolute;left:84px;bottom:330px;font-size:220px;${r(.3,'pop',.5)}">${l}</p>`})),
 {d:3.0,cls:'ocre',body:r=>end(r,'A, B ou C?','Comenta a letra aqui embaixo.')}],
'reel-08-artista-para-de-dizer':[
 opener('u-artista','center 30%','Artista, para de dizer isso',''),
 card('dark','“É só um rabisco.”','Não é. É anos de prática.',124),
 card('paper','“Faço por hobby, não sou artista.”','Pintou, mostrou, tocou alguém? É artista.',110),
 card('dark','“Ninguém ia pagar por isso.”','Tem gente procurando exatamente o seu trabalho.',110),
 {d:3.2,cls:'ocre',body:r=>end(r,'Leva teu trabalho a sério.','A gente leva. Manda teu portfólio: link na bio.')}],
'reel-09-altura-certa':[
 opener('s-parede','center 40%','O erro que todo mundo comete ao pendurar quadro',''),
 card('paper','Pendurar alto demais.','Quase todo mundo faz.'),
 {d:3.0,cls:'dark',body:r=>mid(H('1,50&nbsp;m',r(0),260,'color:#B98F6B;white-space:nowrap')+B('do chão até o centro da obra.',r(.6))+B('É a altura que as galerias usam.',r(1.2),'color:#BDB8AF'))},
 card('paper','Em cima do sofá?','Deixa uns 20 a 25 cm entre o encosto e a moldura.',124),
 {d:3.0,cls:'ocre',body:r=>end(r,'Salva pra próxima mudança.','E manda pra quem tá montando a casa.')}],
'reel-10-original-ou-reproducao':[
 opener('u-textura','center 50%','Original ou reprodução?','qual a diferença, afinal'),
 tip('01','Original é peça única.','Feita à mão. Só existe uma no mundo.','paper'),
 tip('02','Reprodução é cópia.','Impressão de uma obra. Pode ter muitas iguais.','dark'),
 tip('03','As duas valem.','Reprodução é ótima pra começar. Só precisa estar escrito.','photo:u-sala:center 35%'),
 {d:3.4,cls:'ocre',body:r=>end(r,'Na PONCI, reprodução vem com a etiqueta REPROD.','Sem pegadinha.')}],
'reel-11-coisas-que-so-colecionador-entende':[
 opener('u-sala','center 40%','Coisas que só quem coleciona arte entende',''),
 card('dark','Parede nenhuma sobrando.','E ainda assim cabe mais uma.'),
 card('paper','A mudança mais tensa da vida.','“Cuidado com esse aí!”'),
 card('dark','A visita que não comenta nada.','Nada. Nem do quadro novo.'),
 card('paper','Conhecer o artista pelo nome.','E mandar foto da obra na parede.'),
 {d:3.0,cls:'ocre',body:r=>end(r,'Qual é a sua?','Conta aqui embaixo.')}],
'reel-12-por-que-fechada':[
 {d:2.6,cls:'dark',body:r=>mid(H('Por que a PONCI é fechada?',r(.1),170)+S('spoiler: não é frescura',r(.7),80,'color:#BDB8AF;margin-top:24px'))},
 card('paper','Tem robô de IA copiando obra de artista.','Pra gerar imagem “no estilo de”.',110),
 card('dark','Aqui, a obra só aparece pra membro.','Robô não entra.',124),
 card('paper','IA é ferramenta pra facilitar a vida.','Não pra apagar quem cria.',110),
 {d:3.2,cls:'ocre',body:r=>end(r,'Proteção, não elitismo.','Leia mais em ponci.art/protecao')}],
'reel-13-do-atelie-ate-a-parede':[
 opener('u-pintora','center 35%','Do ateliê até a sua parede','como funciona na PONCI'),
 tip('01','O artista cadastra a obra.','Fotos, medidas, técnica e preço.','paper',124),
 tip('02','A curadoria olha uma por uma.','Aprova ou pede ajustes.','dark',124),
 tip('03','Você compra com contrato.','Tudo assinado, tudo registrado.','photo:s-galeria:center 40%',124),
 tip('04','O artista envia com rastreio.','Embalagem caprichada e código de rastreio no seu pedido.','dark',124),
 {d:3.2,cls:'ocre',body:r=>end(r,'E a obra chega pra morar com você.','Quer entrar? Link na bio.')}],
'reel-14-arte-de-presente':[
 opener('u-visita','center 40%','Arte de presente de Natal?','sim. e a gente te ajuda'),
 tip('01','Pensa na pessoa, não na parede.','Do que ela gosta? Mar, cor, silêncio?','paper',124),
 tip('02','Obra pequena também emociona.','Papel e gravura cabem em qualquer canto.','dark',124),
 tip('03','Conta quem fez.','Um cartão com a história do artista vale ouro.','paper',124),
 {d:3.2,cls:'ocre',body:r=>end(r,'Presente que não vai pro armário.','Salva pra lembrar até o dia 24. 🎄')}],
'reel-15-sofa-quadro':[
 opener('u-sala','center 40%','Qual tamanho de quadro pro seu sofá?',''),
 {d:3.0,cls:'dark',body:r=>mid(H('2/3',r(0),320,'color:#B98F6B')+B('da largura do sofá.',r(.6))+B('Sofá de 2 m? Obra (ou conjunto) de uns 1,30 m.',r(1.2),'color:#BDB8AF'))},
 card('paper','Quadro pequeno demais some.','Parece selo na parede.'),
 card('dark','Não tem uma grande?','Duas ou três menores, alinhadas, fazem o mesmo papel.',110),
 {d:3.0,cls:'ocre',body:r=>end(r,'Salva e mede o seu sofá.','Depois conta aqui quanto deu.')}],
'reel-16-perguntas-pro-artista':[
 opener('u-artista','center 30%','3 perguntas pra fazer ao artista','antes de comprar'),
 tip('01','“O que te levou a fazer essa?”','A história faz parte da obra.','paper',118),
 tip('02','“Com que material você pintou?”','Ajuda a saber como cuidar.','dark',118),
 tip('03','“Tem outras dessa série?”','Às vezes a sua está na próxima.','paper',118),
 {d:3.2,cls:'ocre',body:r=>end(r,'Artista adora um bom papo.','Na PONCI, a conversa é direta.')}],
});

/* trilha de cada reel: [faixa, segundo de início] — alterna as quatro pra não repetir no feed */
const TRILHA={'reel-01-coisas-que-so-quem-pinta-entende':['vitrine',0],'reel-02-toda-obra-comeca-num-atelie':['atelie',0],'reel-03-como-comecar-a-colecionar':['parede',0],
 'reel-04-pov-atelie':['atelie',11],'reel-05-sinais-colecionador':['feira',0],'reel-06-quanto-custa-uma-obra':['parede',13],'reel-07-qual-vai-pra-parede':['vitrine',8.6],
 'reel-08-artista-para-de-dizer':['feira',9.8],'reel-09-altura-certa':['atelie',22],'reel-10-original-ou-reproducao':['parede',26.7],'reel-11-coisas-que-so-colecionador-entende':['vitrine',17.1],
 'reel-12-por-que-fechada':['parede',6.7],'reel-13-do-atelie-ate-a-parede':['feira',19.6],'reel-14-arte-de-presente':['atelie',5.6],'reel-15-sofa-quadro':['vitrine',25.7],'reel-16-perguntas-pro-artista':['feira',24.5]};
(async()=>{fs.mkdirSync(OUT,{recursive:true});const b=await chromium.launch({args:['--allow-file-access-from-files']});
 for(const [name,scenes] of Object.entries(reels)){
  if(process.argv[4]&&!name.includes(process.argv[4]))continue;
  const {html,dur}=build(scenes);const dir=SP+'/reel-frames/'+name;fs.rmSync(dir,{recursive:true,force:true});fs.mkdirSync(dir,{recursive:true});
  const tmp=SP+'/reel-frames/'+name+'.html';fs.writeFileSync(tmp,html);
  const p=await b.newPage({viewport:{width:1080,height:1920}});await p.goto('file://'+tmp,{waitUntil:'load'});await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(300);
  const N=Math.round(dur*FPS);
  for(let f=0;f<N;f++){const t=f/FPS*1000;await p.evaluate(t=>document.getAnimations().forEach(a=>{a.pause();a.currentTime=t}),t);
   await p.screenshot({path:`${dir}/${String(f).padStart(4,'0')}.jpg`,type:'jpeg',quality:92});}
  await p.close();
  execFileSync('ffmpeg',['-y','-loglevel','error','-framerate',String(FPS),'-i',`${dir}/%04d.jpg`,'-c:v','libx264','-preset','slow','-crf','19','-pix_fmt','yuv420p','-movflags','+faststart',`${OUT}/${name}.mp4`]);
  // trilha original (scripts/trilha.py): TRILHAS=<pasta dos .wav>
  if(process.env.TRILHAS){const [tr,ss]=TRILHA[name]||['atelie',0];const fo=Math.max(0,dur-1.2).toFixed(2);
   execFileSync('ffmpeg',['-y','-loglevel','error','-i',`${OUT}/${name}.mp4`,'-ss',String(ss),'-i',`${process.env.TRILHAS}/${tr}.wav`,'-filter_complex',`[1:a]atrim=0:${dur},asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.3,afade=t=out:st=${fo}:d=1.2[a]`,
    '-map','0:v','-map','[a]','-c:v','copy','-c:a','aac','-b:a','160k','-ar','44100','-movflags','+faststart','-shortest',`${OUT}/${name}.tmp.mp4`]);
   fs.renameSync(`${OUT}/${name}.tmp.mp4`,`${OUT}/${name}.mp4`);}
  // capa do reel: o quadro da primeira cena com o texto já entrando
  fs.copyFileSync(`${dir}/${String(Math.min(N-1,Math.round(1.6*FPS))).padStart(4,'0')}.jpg`,`${OUT}/${name}-capa.jpg`);
  console.log('ok',name,dur.toFixed(1)+'s',N,'quadros');}
 await b.close();})();
