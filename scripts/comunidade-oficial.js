// Gera as imagens dos posts oficiais da Comunidade. Uso: node scripts/comunidade-oficial.js <pasta com kit-fonts/ e kit-img/> public/comunidade/oficial
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

serie('boas-vindas',[
 cover('u-galeria','center 45%','Boas-vindas à Comunidade','o lugar da rede pra conversar sobre arte'),
 list('paper','Aqui a gente…',[['Mostra o ateliê','O processo, a técnica, a obra em andamento.'],['Conta como vive com arte','A obra que chegou, a parede certa, a luz da tarde.'],['Troca ideia','Dúvida, indicação, agenda de exposição.']]),
 list('dark','Dá pra…',[['Publicar notas','Com até 9 fotos, ou só texto.'],['Curtir e comentar','E responder quem comentou.'],['Salvar e seguir','Guarde o que gostou, siga quem te inspira.']]),
 quote('ocre','Se apresenta aqui embaixo.','Quem é você e o que te trouxe pra PONCI?'),
]);
serie('primeira-nota',[
 cover('u-mesa','center 45%','Sua primeira nota','em 3 passos'),
 tip('paper','01','Toca no +','No menu de baixo, no celular, ou na lateral, no computador.'),
 tip('dark','02','Fotos e texto','Até 9 fotos: a primeira vira a capa. Sem foto, a nota vira um cartão de texto.'),
 tip('paper','03','Escolhe o espaço','E, se você for artista, dá pra ligar a nota a uma obra publicada.','u-pincel','center 50%'),
]);
serie('espacos',[
 cover('u-visita','center 40%','Os espaços da Comunidade','cada conversa no seu lugar'),
 list('paper','Seis espaços',[['#Conversa','Apresentações, recados, assunto da rede.'],['#Processo','Ateliê, técnica, obra em andamento.'],['#Obras novas','O que acabou de passar pela curadoria.'],['#Agenda','Exposições, aberturas, feiras e visitas.'],['#Coleção','Como cada um vive com as obras.'],['#Dúvidas','Conservação, moldura, transporte.']]),
 quote('ocre','Na busca, dá pra explorar por espaço.','E cada nota mostra o espaço dela: é só tocar pra ver mais do mesmo assunto.'),
]);
serie('artistas',[
 cover('u-atelie','center 30%','Da obra cadastrada à vitrine','pra artistas'),
 list('paper','O caminho',[['01 · Cadastro','Foto, técnica, medidas, preço e uma boa descrição.'],['02 · Curadoria','Aprova, pede um ajuste (você vê o recado e reenvia) ou explica o motivo.'],['03 · Vitrine','Aprovada, a obra aparece pros colecionadores da rede.']]),
 {cls:'dark',body:`<div style="position:absolute;left:84px;right:84px;top:0;bottom:200px;display:flex;flex-direction:column;justify-content:center">
  <p class="serif" style="font-size:96px;color:var(--paper)">É uma reprodução?</p>
  <p style="font:400 40px/1.45 Grot;color:#BDB8AF;margin-top:30px">Impressão ou fine art de uma obra sua: marque como reprodução no cadastro.</p>
  <div style="margin-top:56px">${tagBox('■ REPROD')}</div>
  <p style="font:400 32px/1.45 Grot;color:#BDB8AF;margin-top:40px">A etiqueta aparece no acervo, na ficha e no contrato. Ninguém se confunde.</p></div>`},
 tip('paper','','Preço fixo ou aceita proposta?','Você escolhe no Ateliê. Com proposta, dá pra aceitar, recusar ou fazer uma contraproposta.','u-artista','center 30%'),
]);
serie('colecionadores',[
 cover('u-sala','center 35%','Comprar com segurança','pra colecionadores'),
 list('paper','Do sim à parede',[['1 · Reserva ou proposta','Pelo preço, ou propondo um valor quando a artista aceita negociar.'],['2 · Contrato','Assinado pelas duas partes, direto na plataforma.'],['3 · Pagamento guardado','O dinheiro fica com a PONCI, não vai direto pra artista.']]),
 list('dark','Depois do pagamento',[['4 · Rastreio','A artista despacha e você acompanha pelo código.'],['5 · Recebeu bem?','Confirma o recebimento e sai o certificado da obra.']],'Chegou com algum problema? Não confirma: abre uma solicitação.'),
 quote('ocre','7 dias pra desistir.','Depois de receber a obra, se precisar, dá pra desistir da compra. Tá na lei, e tá no contrato.'),
]);
serie('perfil',[
 {cls:'paper',body:`<div style="position:absolute;left:84px;right:84px;top:0;bottom:200px;display:flex;flex-direction:column;justify-content:center">
  <p class="cond" style="font-size:132px">Seu perfil com a <span style="color:var(--ocre)">sua cara.</span></p>
  <p style="font:400 40px/1.45 Grot;color:#55524D;margin-top:36px">Tudo em Editar perfil, no seu perfil da Comunidade.</p></div>`},
 list('dark','O que dá pra mudar',[['Nome','Como você quer aparecer.'],['@','Seu endereço: comunidade.ponci.art/u/seu.arroba'],['Foto e bio','Uma foto e duas linhas sobre você.']]),
 quote('paper','Colecionador: nome ou código?','Você escolhe se aparece pelo nome ou pelo código de membro, tipo COL-0105. Os dois jeitos funcionam.'),
]);
serie('privacidade',[
 {cls:'dark',body:`<div style="position:absolute;left:84px;right:84px;top:0;bottom:200px;display:flex;flex-direction:column;justify-content:center">
  <p class="cond" style="font-size:128px;color:var(--paper)">O que os outros veem de você</p></div>`},
 {cls:'paper',body:`<div style="position:absolute;left:84px;right:84px;top:220px">
  <p class="serif" style="font-size:84px">Ninguém da rede vê</p>
  <p style="font:400 40px/1.6 Grot;margin-top:24px;color:#55524D">e-mail · telefone · CPF · endereço</p>
  <div style="height:2px;background:#D9D4CA;margin:56px 0"></div>
  <p class="serif" style="font-size:84px">Numa negociação</p>
  <p style="font:400 40px/1.45 Grot;margin-top:24px;color:#55524D">a artista vê o seu código de membro e a sua cidade.</p></div>`},
 quote('ocre','O nome só aparece quando a venda fecha.','No contrato, pras duas partes. Dúvida sobre seus dados? É só pedir em Minha conta.'),
]);
serie('combinados',[
 cover('u-olhar','center 45%','Os combinados da Comunidade','pra rede continuar boa pra todo mundo'),
 list('paper','Combinado é combinado',[['Respeito sempre','Mesmo quando a opinião é diferente.'],['Foto com permissão','E com o crédito de quem fez.'],['Negocie pela PONCI','É o que garante contrato, pagamento guardado e certificado.'],['Viu algo estranho?','Toca em Denunciar. A curadoria olha tudo.']]),
 {cls:'ocre',body:`<div style="position:absolute;left:84px;right:84px;top:0;bottom:200px;display:flex;flex-direction:column;justify-content:center">
  <p class="serif" style="font-size:118px;color:var(--paper)">Valeu por fazer parte!</p>
  <p class="wm" style="font-size:170px;margin-top:90px;color:var(--paper)">PONCI</p>
  <p style="font:400 32px/1 Mono;letter-spacing:.12em;margin-top:28px;color:#F2E8DA">comunidade.ponci.art</p></div>`}
]);
(async()=>{fs.mkdirSync(SP+'/kit-html',{recursive:true});const b=await chromium.launch({args:['--allow-file-access-from-files']});
 for(const pc of pieces){const p=await b.newPage({viewport:{width:pc.w,height:pc.h}});const tmp=SP+'/kit-html/'+pc.name.replace(/\//g,'_')+'.html';fs.mkdirSync(require('path').dirname(`${OUT}/${pc.name}.png`),{recursive:true});fs.writeFileSync(tmp,pc.html);await p.goto('file://'+tmp,{waitUntil:'load'});await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(200);
  await p.screenshot({path:`${OUT}/${pc.name}.jpg`,type:'jpeg',quality:84});await p.close();console.log('ok',pc.name);}
 await b.close();})();
