// Gera as peças do lote 2 do Instagram (feed + stories). Uso: node scripts/instagram-lote2.js <pasta com kit-fonts/ e kit-img/> <saída>
const {chromium}=require('playwright');const fs=require('fs');
const SP=process.argv[2], OUT=process.argv[3], F=SP+'/kit-fonts', I=SP+'/kit-img';
const img=n=>'file://'+I+'/'+n+'.jpg';
const css=`
@font-face{font-family:Wide;src:url(file://${F}/wide900.ttf)}@font-face{font-family:Cond;src:url(file://${F}/cond800.ttf)}
@font-face{font-family:Grot;src:url(file://${F}/reg400.ttf);font-weight:400}@font-face{font-family:Grot;src:url(file://${F}/semi600.ttf);font-weight:600}
@font-face{font-family:PSerif;src:url(file://${F}/InstrumentSerif.ttf);font-style:italic}@font-face{font-family:PSerif;src:url(file://${F}/InstrumentSerif.ttf);font-style:normal}@font-face{font-family:Mono;src:url(file://${F}/IBMPlexMono.ttf)}
*{margin:0;padding:0;box-sizing:border-box}
:root{--ink:#121211;--paper:#F2F0EB;--ocre:#8B6A4F;--wall:#E3DED4;--muted:#8E8A82}
body{width:var(--w);height:var(--h);overflow:hidden;font-family:Grot;color:var(--ink);-webkit-font-smoothing:antialiased}
.f{position:relative;width:var(--w);height:var(--h);overflow:hidden}
.grain::after{content:"";position:absolute;inset:0;pointer-events:none;opacity:.09;mix-blend-mode:multiply;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E")}
.dark{background:var(--ink);color:var(--paper)}.paper{background:var(--paper)}.ocre{background:var(--ocre);color:var(--paper)}
.lab{font:400 26px/1 Mono;letter-spacing:.14em;text-transform:uppercase;display:flex;align-items:center;gap:16px}
.lab i{width:22px;height:22px;background:var(--ocre);display:block}
.dark .lab{color:#A39F97}
.wm{font-family:Wide;letter-spacing:-.035em;line-height:.8;text-transform:uppercase}
.cond{font-family:Cond;text-transform:uppercase;letter-spacing:-.01em;line-height:.9}
.serif{font-family:PSerif;font-style:italic;line-height:1.02}
.mono{font-family:Mono}
.rule{height:4px;background:currentColor}
.wall{background:var(--wall);display:flex;align-items:center;justify-content:center}
.wall img{box-shadow:22px 28px 40px rgba(18,18,17,.32);object-fit:contain}
.bleed{position:absolute;object-fit:cover}
`;
const P=(w,h,cls,body)=>`<!doctype html><html><head><meta charset=utf-8><style>${css}</style></head><body style="--w:${w}px;--h:${h}px"><div class="f grain ${cls}">${body}</div></body></html>`;
const pieces=[];
const add=(name,w,h,cls,body)=>pieces.push({name,w,h,html:P(w,h,cls,body)});


/* Série 2: conversa sobre arte, sem propaganda. Foto em primeiro plano, texto curto. */
const shade='background:linear-gradient(180deg,rgba(18,18,17,0) 0%,rgba(18,18,17,.15) 45%,rgba(18,18,17,.82) 100%)';
const sig=(c='var(--paper)')=>`<div style="position:absolute;left:84px;top:84px;display:flex;align-items:center;gap:14px;font:400 24px/1 Mono;letter-spacing:.14em;text-transform:uppercase;color:${c}"><i style="width:20px;height:20px;background:var(--ocre);display:block"></i>PONCI</div>`;
const handle=(c='var(--paper)')=>`<div style="position:absolute;right:84px;top:84px;font:400 24px/1 Mono;letter-spacing:.1em;color:${c};opacity:.8">@ponci.art</div>`;

/* CARROSSÉIS 1080x1350: cada um numa pasta, slides 01, 02… na ordem de postagem */
const top='<div style="position:absolute;left:0;right:0;top:0;height:260px;background:linear-gradient(180deg,rgba(18,18,17,.55),rgba(18,18,17,0))"></div>';
const foot=(i,n,c)=>`<div style="position:absolute;left:84px;right:84px;bottom:64px;display:flex;justify-content:space-between;font:400 24px/1 Mono;letter-spacing:.12em;text-transform:uppercase;color:${c};opacity:.75"><span>${String(i).padStart(2,'0')} / ${String(n).padStart(2,'0')}</span><span>${i<n?'Arrasta →':'@ponci.art'}</span></div>`;
function carousel(dir,slides){/*substituído abaixo*/const n=slides.length;slides.forEach((s,k)=>{const i=k+1,c=s.cls==='paper'?'var(--ink)':'var(--paper)';
 add(`${dir}/${String(i).padStart(2,'0')}`,1080,1350,s.cls,`${s.body}${sig(c)}${handle(c)}${foot(i,n,c)}`);});}
const cover=(photo,pos,title,sub)=>({cls:'dark',body:`<img class="bleed" src="${img(photo)}" style="inset:0;width:1080px;height:1350px;object-position:${pos}">
 <div style="position:absolute;inset:0;${shade}"></div>${top}
 <div style="position:absolute;left:84px;right:84px;bottom:150px"><p class="cond" style="font-size:124px;color:var(--paper)">${title}</p>
 <p class="serif" style="font-size:62px;color:#E6E2DA;margin-top:22px">${sub}</p></div>`});
const tip=(cls,no,title,text,photo,pos)=>{const dk=cls!=='paper',tc=dk?'var(--paper)':'var(--ink)',bc=cls==='ocre'?'#F2E8DA':dk?'#BDB8AF':'#55524D',nc=cls==='ocre'?'#F2E8DA':'#B98F6B';
 return {cls,body:(!photo&&no?`<p class="wm" style="position:absolute;right:60px;bottom:120px;font-size:520px;color:${cls==='paper'?'#E2DDD3':'#22211F'}">${no}</p>`:'')+(photo?`<img class="bleed" src="${img(photo)}" style="left:0;top:0;width:1080px;height:640px;object-position:${pos||'center'}">${top}`:'')+
 `<div style="position:absolute;left:84px;right:84px;top:${photo?700:250}px">${no?`<p class="mono" style="font-size:30px;letter-spacing:.14em;color:${nc}">${no}</p>`:''}
 <p class="cond" style="font-size:${photo?96:112}px;color:${tc};margin-top:${no?26:0}px">${title}</p>
 <p style="font:400 ${photo?38:42}px/1.45 Grot;color:${bc};margin-top:${photo?28:40}px;max-width:880px">${text}</p></div>`};};
const quote=(cls,text,note)=>{const dk=cls!=='paper';return {cls,body:`<div style="position:absolute;left:84px;right:84px;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center">
 <p class="serif" style="font-size:96px;color:${dk?'var(--paper)':'var(--ink)'}">${text}</p>${note?`<p style="font:400 38px/1.45 Grot;color:${cls==='ocre'?'#F2E8DA':dk?'#BDB8AF':'#55524D'};margin-top:36px">${note}</p>`:''}</div>`};};


/* Posts oficiais da Comunidade: um arquivo por slide, <slug>-<n>.jpg (1080x1350). */
function serie(slug,slides){const n=slides.length;slides.forEach((s,k)=>{const i=k+1,c=s.cls==='paper'?'var(--ink)':'var(--paper)';
 add(`${slug}-${i}`,1080,1350,s.cls,`${s.body}${sig(c)}${handle(c)}${foot(i,n,c)}`);});}
const list=(cls,title,items,note)=>{const dk=cls!=='paper',tc=dk?'var(--paper)':'var(--ink)',bc=cls==='ocre'?'#F2E8DA':dk?'#BDB8AF':'#55524D',ln=dk?'#3A3936':'#D9D4CA';
 return {cls,body:`<div style="position:absolute;left:84px;right:84px;top:220px">
 <p class="serif" style="font-size:92px;color:${tc}">${title}</p>
 <div style="margin-top:48px;border-top:2px solid ${ln}">${items.map(([t,d])=>`<div style="padding:26px 0;border-bottom:2px solid ${ln}"><b class="cond" style="font-size:54px;color:${tc};display:block">${t}</b>${d?`<span style="font:400 32px/1.4 Grot;color:${bc}">${d}</span>`:''}</div>`).join('')}</div>
 ${note?`<p style="font:400 32px/1.4 Grot;color:#B98F6B;margin-top:40px">${note}</p>`:''}</div>`};};
const tagBox=(t)=>`<span style="display:inline-flex;align-items:center;gap:14px;border:4px dashed #B98F6B;color:#B98F6B;padding:14px 22px;font:500 44px/1 Mono;letter-spacing:.1em">${t}</span>`;


/* ===== Lote 2: feed (1080x1350) ===== */
const phone=(f,w=470)=>`<div style="width:${w}px;border-radius:${w*0.12}px;padding:${w*0.035}px;background:#121211;box-shadow:0 40px 80px rgba(18,18,17,.35)"><img src="${img(f)}" style="display:block;width:100%;border-radius:${w*0.09}px"></div>`;
const shot=(cls,f,title,text)=>{const dk=cls!=='paper',tc=dk?'var(--paper)':'var(--ink)',bc=cls==='ocre'?'#F2E8DA':dk?'#BDB8AF':'#55524D';
 return {cls,body:`<div style="position:absolute;left:84px;right:84px;top:190px;display:grid;grid-template-columns:minmax(0,1fr) 380px;gap:44px;align-items:center;bottom:150px">
 <div><p class="cond" style="font-size:76px;color:${tc}">${title}</p><p style="font:400 32px/1.45 Grot;color:${bc};margin-top:28px">${text}</p></div>
 <div>${phone(f,380)}</div></div>`};};
const frame=(f,n)=>`<div style="display:flex;flex-direction:column;align-items:center;gap:26px"><div style="background:#F7F5F0;padding:22px;box-shadow:14px 20px 34px rgba(18,18,17,.28);border:10px solid #1E1D1B"><img src="${img(f)}" style="display:block;width:300px;height:390px;object-fit:cover"></div><span class="wm" style="font-size:96px;color:var(--ink)">${n}</span></div>`;

serie('cuidar-da-pintura',[
 cover('u-sala','center 35%','Como cuidar de uma pintura em casa','sem neura'),
 tip('paper','01','Longe do sol direto','A luz do sol desbota a cor aos pouquinhos. Luz indireta é a melhor amiga da obra.'),
 tip('dark','02','Longe da umidade','Banheiro, cozinha e parede externa, não. Mora no litoral? Fica de olho na maresia.'),
 tip('paper','03','Limpeza? Só espanador','Pano molhado, álcool e produto de limpeza nunca encostam na pintura.','u-pincel','center 50%'),
 tip('dark','04','Pendura direito','Prego ou gancho certo pro peso. Obra encostada no chão é acidente esperando acontecer.'),
 quote('ocre','Na dúvida, pergunta pra quem fez.','Artista adora contar como a obra gosta de ser cuidada. Salva esse post pra quando precisar.'),
]);
serie('glossario',[
 {cls:'dark',body:`<div style="position:absolute;left:84px;right:84px;top:0;bottom:200px;display:flex;flex-direction:column;justify-content:center">
  <p class="mono" style="font-size:30px;letter-spacing:.14em;color:#B98F6B">GLOSSÁRIO</p>
  <p class="cond" style="font-size:138px;color:var(--paper);margin-top:24px">Pra não boiar na conversa de arte</p>
  <p class="serif" style="font-size:62px;color:#E6E2DA;margin-top:30px">salva que um dia você vai precisar</p></div>`},
 list('paper','Parte 1',[['Técnica mista','Mais de um material na mesma obra.'],['Tiragem','Quantas cópias existem. “12/30” é a cópia 12 de 30.'],['P.A.','Prova de artista: cópias fora da tiragem, que ficam com quem fez.']]),
 list('dark','Parte 2',[['Fine art','Impressão de alta qualidade em papel de algodão. É reprodução, não original.'],['Procedência','A história da obra: quem fez, quem teve, por onde passou.'],['Certificado','Documento que garante quem fez a obra e de onde ela veio.']]),
 quote('ocre','Faltou alguma palavra?','Manda nos comentários que a gente explica no próximo glossário.'),
]);
add('qual-vai-pra-parede-1',1080,1350,'paper',`<div style="position:absolute;inset:0;background:var(--wall)"></div>
 <div style="position:absolute;left:84px;right:84px;top:150px;text-align:center"><p class="cond" style="font-size:104px">Qual vai pra sua parede?</p></div>
 <div style="position:absolute;left:0;right:0;top:420px;display:flex;justify-content:center;gap:90px">${frame('u-abs-azul','1')}${frame('u-abs-rosa','2')}</div>
 <p style="position:absolute;left:0;right:0;bottom:96px;text-align:center;font:400 34px/1.4 Grot;color:#55524D">Responde nos comentários: 1 ou 2?</p>
 ${sig('var(--ink)')}${handle('var(--ink)')}`);
serie('escolher-obra',[
 cover('u-galeria','center 45%','Como escolher a obra certa pra sua parede','4 dicas de galeria'),
 tip('paper','01','Mede antes','Em cima do sofá ou da cama, a obra fica bonita com uns 2/3 da largura do móvel.'),
 tip('dark','02','Na altura do olho','O centro da obra a uns 1,50 m do chão. É a altura que as galerias usam.'),
 tip('paper','03','Olha a luz','Pintura escura pede parede bem iluminada. Papel e aquarela pedem luz suave.','u-visita','center 40%'),
 tip('dark','04','Escolhe com o coração','Combinar com a almofada é o de menos. A obra tem que te fazer parar.'),
 quote('ocre','Salva pra quando for escolher a sua.','E manda pra quem tá montando a casa nova. 🏠'),
]);
serie('comunidade-ponci',[
 shot('dark','s-perfil','Chegou a Comunidade PONCI','O lugar da rede pra conversar sobre arte: artistas, colecionadores e a curadoria.'),
 shot('paper','s-post','Processo, ateliê e conversa','Artistas mostram a obra nascendo. Colecionadores contam como vivem com ela.'),
 shot('dark','s-novo','Publicar é rapidinho','Até 9 fotos, um título e a história. Sem foto, vira cartão de texto.'),
 quote('ocre','Só pra membros.','A comunidade é fechada, como a rede. Quer entrar? Pede seu convite pelo link na bio.'),
]);
serie('por-tras-da-curadoria',[
 {cls:'dark',body:`<div style="position:absolute;left:84px;right:84px;top:0;bottom:200px;display:flex;flex-direction:column;justify-content:center">
  <p class="cond" style="font-size:150px;color:var(--paper)">Por trás da curadoria</p>
  <p class="serif" style="font-size:66px;color:#E6E2DA;margin-top:30px">o que a gente olha numa obra</p></div>`},
 list('paper','Primeiro, a obra',[['Voz própria','Um trabalho que dá pra reconhecer de longe.'],['Consistência','Uma pesquisa que continua, não uma obra solta.'],['Acabamento','Cuidado com o suporte, a tela, a moldura.']]),
 list('dark','Depois, o resto',[['Foto honesta','Cor e tamanho de verdade, sem filtro.'],['A história','O que a obra investiga, como foi feita.'],['Preço coerente','Justo pro trabalho e pro momento da carreira.']]),
 quote('ocre','Não é sobre currículo.','Tem artista começando agora na rede. O que conta é o trabalho.'),
]);
serie('preco-da-arte',[
 cover('u-artista','center 30%','Como dar preço pra sua arte','sem chutar'),
 tip('paper','01','Soma o custo','Tela, tinta, moldura, embalagem: tudo entra na conta.'),
 tip('dark','02','Conta as horas','Seu tempo vale. Define um valor por hora e seja honesto com ele.'),
 tip('paper','03','Olha o mercado','Quanto custam obras parecidas, de artistas no mesmo momento da carreira?','u-textura','center 40%'),
 tip('dark','04','Seja consistente','Mesmo tamanho e mesma técnica, preço parecido. Em todo lugar onde você vende.'),
 quote('ocre','Barato demais também afasta.','Quem coleciona desconfia de obra boa a preço de banana. Valoriza o teu trabalho.'),
]);
serie('arte-de-presente',[
 cover('u-abs-azul','center','Arte de presente','o presente que não vai pro fundo do armário'),
 list('paper','Pra acertar',[['Pensa na pessoa','Não na parede. O que ela gosta, o que ela vive?'],['Começa pequeno','Desenho, gravura, obra em papel: cabe no bolso e em qualquer canto.'],['Leva o certificado','Procedência também é presente.']]),
 quote('dark','Conta a história no cartão.','Quem fez, como fez, por que você escolheu. Vira parte do presente.'),
 {cls:'ocre',body:`<div style="position:absolute;left:84px;right:84px;top:0;bottom:200px;display:flex;flex-direction:column;justify-content:center">
  <p class="serif" style="font-size:118px;color:var(--paper)">Natal com arte de verdade.</p>
  <p class="wm" style="font-size:170px;margin-top:90px;color:var(--paper)">PONCI</p>
  <p style="font:400 32px/1 Mono;letter-spacing:.12em;margin-top:28px;color:#F2E8DA">link na bio</p></div>`},
]);

/* ===== Stories (1080x1920; sem figurinha, área livre em cima e embaixo) ===== */
const ssig=(c='var(--paper)')=>`<div style="position:absolute;left:80px;top:250px;display:flex;align-items:center;gap:14px;font:400 26px/1 Mono;letter-spacing:.14em;text-transform:uppercase;color:${c}"><i style="width:20px;height:20px;background:var(--ocre);display:block"></i>PONCI</div>`;
const teaser=(name,feed,title,cls='dark')=>{const tc=cls==='paper'?'var(--ink)':'var(--paper)',bc=cls==='paper'?'#55524D':cls==='ocre'?'#F2E8DA':'#BDB8AF';
 add('story-'+name,1080,1920,cls,`${ssig(tc)}
 <div style="position:absolute;left:80px;right:80px;top:360px"><p class="mono" style="font-size:30px;letter-spacing:.14em;color:#B98F6B">POST NOVO NO FEED</p>
 <p class="cond" style="font-size:96px;color:${tc};margin-top:22px">${title}</p></div>
 <div style="position:absolute;left:250px;right:250px;top:720px"><img src="${img(feed)}" style="display:block;width:100%;box-shadow:0 30px 60px rgba(0,0,0,.35)"></div>
 <p style="position:absolute;left:80px;right:80px;bottom:370px;text-align:center;font:400 38px/1.4 Grot;color:${bc}">Toca no perfil e corre lá ↗</p>`);};
const fato=(name,big,small,cls)=>{const tc=cls==='paper'?'var(--ink)':'var(--paper)',bc=cls==='paper'?'#55524D':cls==='ocre'?'#F2E8DA':'#BDB8AF';
 add('story-'+name,1080,1920,cls,`${ssig(tc)}
 <div style="position:absolute;left:80px;right:80px;top:0;bottom:340px;display:flex;flex-direction:column;justify-content:center">
 <p class="mono" style="font-size:30px;letter-spacing:.14em;color:${cls==='ocre'?'#F2E8DA':'#B98F6B'}">VOCÊ SABIA?</p>
 <p class="serif" style="font-size:104px;color:${tc};margin-top:30px">${big}</p>
 <p style="font:400 42px/1.45 Grot;color:${bc};margin-top:40px">${small}</p></div>`);};
teaser('arte-pra-morar-junto','post-05-arte-pra-morar-junto','Arte é pra morar junto','paper');
teaser('coisas-que-so-quem-pinta','carrossel-03-coisas-que-so-quem-pinta-entende-01','Coisas que só quem pinta entende');
teaser('fotografa-tua-obra','carrossel-02-fotografa-tua-obra-01','Fotografa tua obra com o celular','ocre');
teaser('o-que-a-gente-procura','post-03-o-que-a-gente-procura','O que a gente procura','paper');
teaser('conhecendo-artistas','post-02-estamos-conhecendo-artistas','Estamos conhecendo artistas');
teaser('cuidar-da-pintura','cuidar-da-pintura-1','Como cuidar de uma pintura em casa','paper');
teaser('glossario','glossario-1','Glossário da arte','ocre');
teaser('qual-vai-pra-parede','qual-vai-pra-parede-1','1 ou 2? Vota lá no post','dark');
teaser('escolher-obra','escolher-obra-1','Como escolher a obra certa pra sua parede','paper');
teaser('comunidade-ponci','comunidade-ponci-1','Chegou a Comunidade PONCI','dark');
teaser('por-tras-da-curadoria','por-tras-da-curadoria-1','Por trás da curadoria','ocre');
teaser('preco-da-arte','preco-da-arte-1','Como dar preço pra sua arte','paper');
teaser('arte-de-presente','arte-de-presente-1','Arte de presente','dark');
fato('tiragem','“12/30” numa gravura quer dizer: cópia 12 de 30.','Esse número é a tiragem. Quanto menor, mais rara a obra.','dark');
fato('sol','Sol direto desbota pintura.','Parede que não pega sol é a melhor amiga da tua obra.','paper');
fato('fine-art','Fine art é reprodução, não original.','Na PONCI, reprodução vem com a etiqueta REPROD. Ninguém se confunde.','ocre');
fato('altura','O centro do quadro fica a 1,50 m do chão.','É a altura que as galerias usam. Testa aí na tua casa.','dark');
(async()=>{fs.mkdirSync(SP+'/kit-html',{recursive:true});const b=await chromium.launch({args:['--allow-file-access-from-files']});
 for(const pc of pieces){const p=await b.newPage({viewport:{width:pc.w,height:pc.h}});const tmp=SP+'/kit-html/'+pc.name.replace(/\//g,'_')+'.html';fs.mkdirSync(require('path').dirname(`${OUT}/${pc.name}.png`),{recursive:true});fs.writeFileSync(tmp,pc.html);await p.goto('file://'+tmp,{waitUntil:'load'});await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(200);
  await p.screenshot({path:`${OUT}/${pc.name}.jpg`,type:'jpeg',quality:84});await p.close();console.log('ok',pc.name);}
 await b.close();})();
