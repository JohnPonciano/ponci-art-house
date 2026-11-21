// Gera o kit de mídia do Instagram (PNG). Uso: node scripts/media-kit.js <pasta com kit-fonts/ e kit-img/> media-kit
const {chromium}=require('playwright');const fs=require('fs');
const SP=process.argv[2], OUT=process.argv[3], F=SP+'/kit-fonts', I=SP+'/kit-img';
const img=n=>'file://'+I+'/'+n+'.jpg';
const css=`
@font-face{font-family:Wide;src:url(file://${F}/wide900.ttf)}@font-face{font-family:Cond;src:url(file://${F}/cond800.ttf)}
@font-face{font-family:Grot;src:url(file://${F}/reg400.ttf);font-weight:400}@font-face{font-family:Grot;src:url(file://${F}/semi600.ttf);font-weight:600}
@font-face{font-family:Serif;src:url(file://${F}/InstrumentSerif.ttf);font-style:italic}@font-face{font-family:Serif;src:url(file://${F}/InstrumentSerif.ttf);font-style:normal}@font-face{font-family:Mono;src:url(file://${F}/IBMPlexMono.ttf)}
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
.serif{font-family:Serif;font-style:italic;line-height:1.02}
.mono{font-family:Mono}
.rule{height:4px;background:currentColor}
.wall{background:var(--wall);display:flex;align-items:center;justify-content:center}
.wall img{box-shadow:22px 28px 40px rgba(18,18,17,.32);object-fit:contain}
.bleed{position:absolute;object-fit:cover}
`;
const P=(w,h,cls,body)=>`<!doctype html><html><head><meta charset=utf-8><style>${css}</style></head><body style="--w:${w}px;--h:${h}px"><div class="f grain ${cls}">${body}</div></body></html>`;
const pieces=[];
const add=(name,w,h,cls,body)=>pieces.push({name,w,h,html:P(w,h,cls,body)});

/* ---------- ÍCONE DE PERFIL (1080, seguro para o recorte redondo) ---------- */
add('01-icone-perfil-wordmark',1080,1080,'dark',`
 <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:34px">
  <i style="width:70px;height:70px;background:var(--ocre);display:block"></i>
  <div class="wm" style="font-size:212px">PONCI</div></div>`);
add('02-icone-perfil-monograma',1080,1080,'paper',`
 <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">
  <div style="position:relative"><div class="wm" style="font-size:640px;line-height:.74">P</div>
  <i style="position:absolute;right:-86px;bottom:12px;width:120px;height:120px;background:var(--ocre);display:block"></i></div></div>`);

/* ---------- POSTS DE LANÇAMENTO (1080x1350) ---------- */
const foot=(c='')=>`<div style="position:absolute;left:84px;right:84px;bottom:70px;display:flex;justify-content:space-between;font:400 24px/1 Mono;letter-spacing:.12em;text-transform:uppercase;${c}"><span>ponci.art</span><span>Rede privada de arte</span></div>`;
add('post-01-manifesto',1080,1350,'dark',`
 <div style="position:absolute;inset:84px 84px 0">
  <div class="lab"><i></i>PONCI · 01</div>
  <p class="serif" style="font-size:138px;margin-top:210px">“Entre quem cria e quem coleciona, <span style="color:#B98F6B">nada</span> além da obra.”</p></div>
 ${foot('color:#A39F97')}`);
add('post-02-chegamos',1080,1350,'paper',`
 <img class="bleed" src="${img('s-galeria')}" style="left:0;top:0;width:1080px;height:800px">
 <div style="position:absolute;left:0;right:0;top:800px;height:6px;background:var(--ink)"></div>
 <div style="position:absolute;left:84px;right:84px;top:860px">
  <div class="wm" style="font-size:236px">PONCI</div>
  <p style="font:400 40px/1.35 Grot;margin-top:34px;max-width:840px">Uma rede fechada de artistas e colecionadores. Obras direto do ateliê, <b style="font-weight:600">só por convite.</b></p></div>`);
add('post-03-como-funciona',1080,1350,'paper',`
 <div style="position:absolute;inset:84px">
  <div class="lab"><i></i>Como funciona</div>
  <p class="cond" style="font-size:118px;margin-top:40px">Do convite<br><span class="serif" style="font-family:Serif;text-transform:none;font-size:128px;letter-spacing:0">à parede.</span></p>
  <div style="margin-top:56px;border-top:6px solid var(--ink)">${[['01','Convite','Artistas e colecionadores entram por indicação. Cada membro é aprovado.'],['02','Curadoria','Toda obra é revisada antes de chegar à vitrine.'],['03','Negociação privada','Compra pelo preço ou proposta direta à artista.'],['04','Custódia e entrega','O pagamento só é liberado quando a obra chega.']].map(([n,t,d])=>`
   <div style="display:grid;grid-template-columns:110px 1fr;gap:10px;padding:26px 0;border-bottom:2px solid #CDC9C1">
    <span class="mono" style="font-size:30px;color:var(--ocre)">${n}</span><div><b class="cond" style="font-size:52px;display:block">${t}</b><span style="font-size:30px;line-height:1.35;color:#55524D">${d}</span></div></div>`).join('')}</div></div>`);
add('post-04-para-artistas',1080,1350,'paper',`
 <img class="bleed" src="${img('s-cavalete')}" style="left:0;top:0;width:1080px;height:640px">
 <div style="position:absolute;left:0;right:0;top:640px;bottom:0;background:var(--ink);color:var(--paper);padding:70px 84px">
  <div class="lab"><i></i>Para artistas</div>
  <p class="cond" style="font-size:96px;margin-top:30px">Você define<br>o preço.</p>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:26px 40px;margin-top:44px;font-size:30px;line-height:1.3">
   <div><b class="cond" style="font-size:72px;color:#B98F6B;display:block">0</b>para entrar na rede</div>
   <div><b class="cond" style="font-size:72px;color:#B98F6B;display:block">15%</b>só quando a obra vende</div></div></div>`);
add('post-05-para-colecionadores',1080,1350,'paper',`
 <img class="bleed" src="${img('s-casa')}" style="left:0;top:0;width:1080px;height:700px">
 <div style="position:absolute;left:84px;right:84px;top:760px">
  <div class="lab"><i></i>Para colecionadores</div>
  <p class="serif" style="font-size:84px;margin-top:28px">Obras que não estão em nenhuma outra vitrine.</p>
  <div style="display:flex;flex-wrap:wrap;gap:14px;margin-top:38px">${['Preço visível','Pagamento em custódia','Certificado de procedência','Compra direta do ateliê'].map(t=>`<span style="border:3px solid var(--ink);padding:16px 22px;font:600 26px/1 Grot;text-transform:uppercase;letter-spacing:.06em">${t}</span>`).join('')}</div></div>`);
add('post-06-peca-seu-convite',1080,1350,'dark',`
 <div class="wall" style="position:absolute;left:84px;right:84px;top:84px;height:640px"><img src="${img('geo')}" style="height:470px"></div>
 <div style="position:absolute;left:84px;right:84px;top:780px">
  <p class="cond" style="font-size:150px">Peça o seu<br><span style="color:#B98F6B">convite.</span></p>
  <p class="mono" style="font-size:28px;letter-spacing:.12em;text-transform:uppercase;margin-top:40px;color:#A39F97">Link na bio · ponci.art</p></div>`);

/* ---------- STORIES (1080x1920 — zonas seguras: 250 px no topo, 340 px embaixo) ---------- */
add('story-01-chegamos',1080,1920,'paper',`
 <div style="position:absolute;left:80px;right:80px;top:250px"><div class="lab"><i></i>Rede privada de arte</div></div>
 <div class="wall" style="position:absolute;left:80px;right:80px;top:340px;height:860px"><img src="${img('ocre')}" style="height:660px"></div>
 <div style="position:absolute;left:80px;right:80px;top:1250px"><div class="wm" style="font-size:222px">PONCI</div>
  <p style="font:400 44px/1.3 Grot;margin-top:30px">Artistas e colecionadores.<br><b style="font-weight:600">Só por convite.</b></p></div>`);
add('story-02-voce-e-artista',1080,1920,'dark',`
 <img class="bleed" src="${img('s-parede')}" style="left:0;top:0;width:1080px;height:960px;object-position:center 30%">
 <div style="position:absolute;left:80px;right:80px;top:1020px">
  <div class="lab"><i></i>Para artistas</div>
  <p class="cond" style="font-size:128px;margin-top:26px">Você é<br>artista?</p>
  <p style="font:400 40px/1.35 Grot;margin-top:26px;color:#D8D4CC">Mostre seu trabalho a quem coleciona. Você define o preço.</p></div>`);
add('story-03-voce-coleciona',1080,1920,'paper',`
 <img class="bleed" src="${img('s-galeria')}" style="left:0;top:0;width:1080px;height:960px">
 <div style="position:absolute;left:80px;right:80px;top:1020px">
  <div class="lab"><i></i>Para colecionadores</div>
  <p class="serif" style="font-size:118px;margin-top:22px">Você coleciona?</p>
  <p style="font:400 40px/1.35 Grot;margin-top:22px;color:#55524D">Acervo fechado, preço visível e pagamento em custódia até a obra chegar.</p></div>`);
add('story-04-fechada-por-principio',1080,1920,'dark',`
 <div style="position:absolute;left:80px;right:80px;top:250px"><div class="lab"><i></i>A rede</div>
  <p class="cond" style="font-size:150px;margin-top:40px">Fechada<br>por <span style="color:#B98F6B">princípio.</span></p></div>
 <div style="position:absolute;left:80px;right:80px;top:880px;border-top:6px solid var(--paper)">${['Curadoria','Confiança','Privacidade','Procedência'].map((t,i)=>`
  <div style="display:flex;align-items:baseline;gap:34px;padding:30px 0;border-bottom:2px solid #3A3936"><span class="mono" style="font-size:30px;color:#B98F6B">0${i+1}</span><span class="cond" style="font-size:86px">${t}</span></div>`).join('')}</div>
 <p class="mono" style="position:absolute;left:80px;bottom:360px;font-size:28px;letter-spacing:.12em;text-transform:uppercase;color:#A39F97">ponci.art</p>`);

/* ---------- CAPAS DE DESTAQUES (1080x1920, ícone no centro) ---------- */
const ic={rede:'<rect x="6" y="6" width="22" height="22"/><rect x="36" y="6" width="22" height="22"/><rect x="6" y="36" width="22" height="22"/><rect x="36" y="36" width="22" height="22"/>',
 artistas:'<path d="M44 8l12 12-26 26-14 2 2-14z"/><path d="M38 14l12 12"/><path d="M10 54c6 0 10-3 10-8"/>',
 colecao:'<rect x="8" y="10" width="48" height="44"/><rect x="18" y="20" width="28" height="24"/>',
 convite:'<rect x="6" y="14" width="52" height="36"/><path d="M6 16l26 20 26-20"/>',
 duvidas:'<circle cx="32" cy="32" r="26"/><path d="M24 25c0-5 4-8 8-8s8 3 8 7c0 6-8 6-8 13"/><circle cx="32" cy="46" r="1.5" fill="currentColor"/>'};
const names={rede:'A rede',artistas:'Artistas',colecao:'Coleção',convite:'Convite',duvidas:'Dúvidas'};
Object.keys(ic).forEach((k,i)=>add(`destaque-0${i+1}-${k}`,1080,1920,'ocre',`
 <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">
  <svg viewBox="0 0 64 64" width="360" height="360" fill="none" stroke="#F2F0EB" stroke-width="3.4" stroke-linejoin="miter">${ic[k]}</svg></div>
 <p class="mono" style="position:absolute;left:0;right:0;bottom:250px;text-align:center;font-size:30px;letter-spacing:.16em;text-transform:uppercase;color:#F2F0EB;opacity:.75">${names[k]}</p>`));

(async()=>{fs.mkdirSync(SP+'/kit-html',{recursive:true});const b=await chromium.launch({args:['--allow-file-access-from-files']});
 for(const pc of pieces){const p=await b.newPage({viewport:{width:pc.w,height:pc.h}});const tmp=SP+'/kit-html/'+pc.name+'.html';fs.writeFileSync(tmp,pc.html);await p.goto('file://'+tmp,{waitUntil:'load'});await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(200);
  await p.screenshot({path:`${OUT}/${pc.name}.png`});await p.close();console.log('ok',pc.name);}
 await b.close();})();
