// Gera o kit de mídia do Instagram (PNG). Uso: node scripts/media-kit.js <pasta com kit-fonts/ e kit-img/> media-kit
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

/* POSTS 1080x1350 */
add('post-01-toda-obra-comeca-num-atelie',1080,1350,'dark',`
 <img class="bleed" src="${img('u-maos')}" style="inset:0;width:1080px;height:1350px">
 <div style="position:absolute;inset:0;${shade}"></div><div style="position:absolute;left:0;right:0;top:0;height:260px;background:linear-gradient(180deg,rgba(18,18,17,.55),rgba(18,18,17,0))"></div>${sig()}${handle()}
 <div style="position:absolute;left:84px;right:84px;bottom:96px">
  <p class="serif" style="font-size:104px;color:var(--paper)">Toda obra começa num ateliê.</p>
  <p style="font:400 34px/1.4 Grot;color:#E6E2DA;margin-top:24px;max-width:820px">Às vezes é um quarto, às vezes a varanda, às vezes a mesa da cozinha. A gente quer conhecer todos.</p></div>`);
add('post-02-estamos-conhecendo-artistas',1080,1350,'paper',`${sig('var(--ink)')}${handle('var(--ink)')}
 <div style="position:absolute;left:84px;right:84px;top:250px">
  <p class="cond" style="font-size:132px">Estamos<br>conhecendo<br><span style="color:var(--ocre)">artistas.</span></p>
  <p style="font:400 40px/1.45 Grot;margin-top:56px;max-width:860px">Do Oiapoque ao Chuí: se você pinta, desenha, grava, fotografa ou esculpe, mostra aí. Tem gente querendo conhecer o seu trabalho.</p>
  <p class="mono" style="font-size:28px;letter-spacing:.1em;text-transform:uppercase;margin-top:56px;color:#6E6A63">Manda seu portfólio · link na bio</p></div>`);
add('post-03-o-que-a-gente-procura',1080,1350,'dark',`${sig()}${handle()}
 <div style="position:absolute;left:84px;right:84px;top:230px">
  <p class="serif" style="font-size:96px;color:var(--paper)">O que a gente procura</p>
  <div style="margin-top:60px;border-top:2px solid #3A3936">${[['Voz própria.','Aquele trabalho que a gente reconhece de longe.'],['Ralação.','Quem está no ateliê toda semana, faça chuva ou faça sol.'],['Papo bom.','Gostar de falar do processo, do material, do porquê.']].map(([t,d])=>`
   <div style="padding:34px 0;border-bottom:2px solid #3A3936"><b class="cond" style="font-size:62px;color:var(--paper);display:block">${t}</b><span style="font:400 32px/1.4 Grot;color:#BDB8AF">${d}</span></div>`).join('')}</div>
  <p style="font:400 32px/1.4 Grot;color:#B98F6B;margin-top:46px">Currículo não importa. O trabalho, sim.</p></div>`);
add('post-04-olhe-de-perto',1080,1350,'dark',`
 <img class="bleed" src="${img('u-textura')}" style="inset:0;width:1080px;height:1350px">
 <div style="position:absolute;inset:0;${shade}"></div><div style="position:absolute;left:0;right:0;top:0;height:260px;background:linear-gradient(180deg,rgba(18,18,17,.55),rgba(18,18,17,0))"></div>${sig()}${handle()}
 <div style="position:absolute;left:84px;right:84px;bottom:96px">
  <p class="cond" style="font-size:120px;color:var(--paper)">Olhe de perto.</p>
  <p class="serif" style="font-size:58px;color:#E6E2DA;margin-top:18px">Cada pincelada é uma escolha. Dá um zoom aí.</p></div>`);
add('post-05-arte-pra-morar-junto',1080,1350,'paper',`
 <img class="bleed" src="${img('u-olhar')}" style="left:0;top:0;width:1080px;height:860px;object-position:center 45%">
 ${sig('var(--ink)')}${handle('var(--ink)')}
 <div style="position:absolute;left:84px;right:84px;top:920px">
  <p class="serif" style="font-size:86px">Arte é pra morar junto,<br>não pra ficar guardada.</p>
  <p style="font:400 34px/1.4 Grot;margin-top:24px;color:#55524D">Na sala, no corredor, do lado do cafezinho. Direto de quem fez.</p></div>`);
add('post-06-conhece-alguem',1080,1350,'ocre',`${sig()}${handle()}
 <div style="position:absolute;left:84px;right:84px;top:260px">
  <p class="cond" style="font-size:124px;color:var(--paper)">Conhece alguém que pinta demais e quase ninguém viu?</p>
  <p class="serif" style="font-size:66px;color:#F2E8DA;margin-top:56px">Marca aqui embaixo.</p>
  <p style="font:400 32px/1.4 Grot;color:#F2E8DA;margin-top:22px;opacity:.85">A gente vai olhar um por um, com carinho.</p></div>`);

/* STORIES 1080x1920 — zonas livres: 250 px no topo e 340 px embaixo; espaço reservado para figurinha */
const ssig=(c='var(--paper)')=>`<div style="position:absolute;left:80px;top:250px;display:flex;align-items:center;gap:14px;font:400 26px/1 Mono;letter-spacing:.14em;text-transform:uppercase;color:${c}"><i style="width:20px;height:20px;background:var(--ocre);display:block"></i>PONCI</div>`;
add('story-01-voce-pinta',1080,1920,'dark',`
 <img class="bleed" src="${img('u-pintora')}" style="inset:0;width:1080px;height:1920px;object-position:center 30%">
 <div style="position:absolute;inset:0;${shade}"></div><div style="position:absolute;left:0;right:0;top:0;height:420px;background:linear-gradient(180deg,rgba(18,18,17,.55),rgba(18,18,17,0))"></div>${ssig()}
 <div style="position:absolute;left:80px;right:80px;top:1060px">
  <p class="cond" style="font-size:150px;color:var(--paper)">Você pinta?</p>
  <p style="font:400 40px/1.4 Grot;color:#E6E2DA;margin-top:22px">Ou desenha, grava, esculpe, fotografa…<br>Conta pra gente!</p></div>`);
add('story-02-mostra-teu-atelie',1080,1920,'paper',`
 <img class="bleed" src="${img('u-mesa')}" style="left:0;top:0;width:1080px;height:1020px;object-position:center 40%">
 <div style="position:absolute;left:0;right:0;top:0;height:420px;background:linear-gradient(180deg,rgba(18,18,17,.55),rgba(18,18,17,0))"></div>${ssig()}
 <div style="position:absolute;left:80px;right:80px;top:1080px">
  <p class="serif" style="font-size:112px">Mostra teu ateliê.</p>
  <p style="font:400 40px/1.4 Grot;margin-top:22px;color:#55524D">Pode ser o quarto, a varanda ou a mesa da cozinha. Manda uma foto: alguns vão aparecer aqui.</p></div>`);
add('story-03-primeira-obra',1080,1920,'dark',`${ssig()}
 <div style="position:absolute;left:80px;right:80px;top:420px">
  <p class="mono" style="font-size:28px;letter-spacing:.14em;text-transform:uppercase;color:#B98F6B">Pergunta da semana</p>
  <p class="serif" style="font-size:118px;color:var(--paper);margin-top:30px">Qual foi a primeira obra de arte que você comprou?</p>
  <p style="font:400 38px/1.4 Grot;color:#BDB8AF;margin-top:40px">Vale até aquela da feirinha de domingo.</p></div>`);
add('story-04-indica-um-artista',1080,1920,'ocre',`
 <img class="bleed" src="${img('u-maos')}" style="left:0;top:0;width:1080px;height:960px;object-position:center 40%">
 <div style="position:absolute;left:0;right:0;top:0;height:420px;background:linear-gradient(180deg,rgba(18,18,17,.55),rgba(18,18,17,0))"></div>${ssig()}
 <div style="position:absolute;left:80px;right:80px;top:1020px">
  <p class="cond" style="font-size:118px;color:var(--paper)">Indica um artista.</p>
  <p style="font:400 40px/1.4 Grot;color:#F2E8DA;margin-top:22px">Aquele primo, aquela amiga, aquele vizinho que manda muito bem. Marca o @!</p></div>`);
(async()=>{fs.mkdirSync(SP+'/kit-html',{recursive:true});const b=await chromium.launch({args:['--allow-file-access-from-files']});
 for(const pc of pieces){const p=await b.newPage({viewport:{width:pc.w,height:pc.h}});const tmp=SP+'/kit-html/'+pc.name+'.html';fs.writeFileSync(tmp,pc.html);await p.goto('file://'+tmp,{waitUntil:'load'});await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(200);
  await p.screenshot({path:`${OUT}/${pc.name}.png`});await p.close();console.log('ok',pc.name);}
 await b.close();})();
