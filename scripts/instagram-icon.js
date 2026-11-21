const {chromium}=require('playwright');const OUT=process.argv[2];
// mesma composição do ícone do app (public/icons/icon-512.png), centralizada para o recorte redondo do Instagram
const html=(bg,mark)=>`<html><head><style>html,body{margin:0;width:1080px;height:1080px;background:${bg}}
.c{width:1080px;height:1080px;display:flex;align-items:center;justify-content:center}
.blk{display:inline-flex;flex-direction:column;align-items:flex-start;transform:translateY(24px)}
b{font:900 228px/0.8 "Arial Black","Helvetica Neue",Arial,sans-serif;letter-spacing:-10px;color:#F2F0EB}
.sq{width:96px;height:96px;background:#8B6A4F;margin-bottom:44px}
svg{display:block;width:180px;height:180px;margin-bottom:36px}</style></head>
<body><div class="c"><div class="blk">${mark}<b>PONCI</b></div></div></body></html>`;
(async()=>{const b=await chromium.launch();
 for(const [name,bg,mark] of [['01-icone-perfil-instagram','#121211','<i class="sq"></i>'],['02-icone-perfil-comunidade','#8B6A4F','<svg viewBox="0 0 24 24"><path d="M3 3h18v13H8l-5 5z" fill="#121211"/></svg>']]){
  const p=await b.newPage({viewport:{width:1080,height:1080}});await p.setContent(html(bg,mark));await p.screenshot({path:`${OUT}/${name}.png`});await p.close();}
 await b.close();})();
