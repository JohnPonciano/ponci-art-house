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
  // capa do reel: o quadro da primeira cena com o texto já entrando
  fs.copyFileSync(`${dir}/${String(Math.min(N-1,Math.round(1.6*FPS))).padStart(4,'0')}.jpg`,`${OUT}/${name}-capa.jpg`);
  console.log('ok',name,dur.toFixed(1)+'s',N,'quadros');}
 await b.close();})();
