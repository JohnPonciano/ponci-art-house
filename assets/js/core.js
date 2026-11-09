/* PONCI · Rede privada — núcleo compartilhado
   Ícones, utilidades, arte generativa (substitui fotografia de obra), textura de concreto,
   tipografia ajustada, cabeçalho/rodapé e roteamento por hash. */
(function(){
"use strict";

const ICONS={
  right:'<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  left:'<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
  menu:'<line x1="4" x2="20" y1="7" y2="7"/><line x1="4" x2="20" y1="17" y2="17"/>',
  x:'<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  check:'<path d="M20 6 9 17l-5-5"/>',
  info:'<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  lock:'<rect width="18" height="11" x="3" y="11" rx="0" ry="0"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  bookmark:'<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>',
  upload:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>',
  logout:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>',
  plus:'<path d="M5 12h14"/><path d="M12 5v14"/>',
  shield:'<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
  swap:'<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>'
};
const icon=n=>`<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n]}</svg>`;
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const $=(s,el=document)=>el.querySelector(s);
const $$=(s,el=document)=>[...el.querySelectorAll(s)];
const pad=n=>String(n).padStart(2,"0");
const brl=n=>"R$ "+Math.round(n).toLocaleString("pt-BR");
const num=n=>n.toLocaleString("pt-BR",{minimumFractionDigits:1,maximumFractionDigits:1});
const dims=a=>`${a.h} × ${a.w} cm`;
const dimsIn=a=>`${num(a.h/2.54)} × ${num(a.w/2.54)} in`;
const MONTHS=["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
const dateBR=ts=>{const d=new Date(ts);return `${pad(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;};
const parseMoney=v=>{const n=Number(String(v).replace(/[^\d,]/g,"").replace(",","."));return isFinite(n)?Math.round(n):0;};
const initials=n=>n.split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0]).join("").toUpperCase();

const CAT={painting:"Pintura",mixed:"Técnica mista",paper:"Obra sobre papel",edition:"Edição"};
const STATUS={published:["Publicada","t-pub"],review:["Em curadoria","t-rev"],reserved:["Reservada","t-res"],sold:["Vendida","t-sold"]};
const PSTATUS={open:["Aguardando artista","t-open"],countered:["Contraproposta","t-countered"],accepted:["Aceita","t-accepted"],declined:["Recusada","t-declined"],closed:["Encerrada","t-closed"],withdrawn:["Retirada","t-withdrawn"]};
const STAGES=[["Reservada","Obra retirada da vitrine"],["Pagamento em custódia","Valor retido pela PONCI"],["Em transporte","Embalagem e seguro"],["Entregue","Certificado emitido"]];
const tag=(map,k)=>`<span class="tag ${map[k][1]}">${map[k][0]}</span>`;

/* ---------- Arte generativa (do protótipo original) ---------- */
function rng(seed){let s=seed>>>0;return()=>{s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
const pick=(r,arr)=>arr[Math.floor(r()*arr.length)];
function grain(c,W,H,amt,weave){
  const d=c.getImageData(0,0,W,H),px=d.data;
  for(let y=0;y<H;y++){for(let x=0;x<W;x++){const i=(y*W+x)*4;let n=(Math.random()-.5)*amt;
    if(weave){if((x&3)===0)n-=weave;if((y&3)===0)n-=weave*.7;}
    px[i]+=n;px[i+1]+=n;px[i+2]+=n;}}
  c.putImageData(d,0,0);
}
function torn(c,x,y,w,h,r){
  const st=9;c.beginPath();c.moveTo(x,y);
  for(let s=0;s<=w;s+=st)c.lineTo(x+s,y+(r()-.5)*4);
  for(let s=0;s<=h;s+=st)c.lineTo(x+w+(r()-.5)*5,y+s);
  for(let s=w;s>=0;s-=st)c.lineTo(x+s,y+h+(r()-.5)*7);
  for(let s=h;s>=0;s-=st)c.lineTo(x+(r()-.5)*4,y+s);
  c.closePath();
}
const GEN={
  mono(c,W,H,r,p){
    c.fillStyle=p[0];c.fillRect(0,0,W,H);
    const m=Math.min(W,H)*.085,j=()=>(r()-.5)*m*.9;
    const split=H*(.56+r()*.06);
    for(let k=0;k<70;k++){c.globalAlpha=.03;c.fillStyle=p[1];c.fillRect(m+j(),m*1.1+j(),W-2*m+j(),split-m*1.6+j());}
    for(let k=0;k<70;k++){c.globalAlpha=.03;c.fillStyle=p[2];c.fillRect(m+j(),split+m*.4+j(),W-2*m+j(),H-split-m*1.5+j());}
    for(let i=0;i<2400;i++){c.globalAlpha=.012+r()*.03;c.fillStyle=r()<.5?p[1]:p[2];const x=r()*W,w=1+r()*7;c.fillRect(x,r()*H*.3,w,H*(.3+r()*.7));}
    for(let i=0;i<900;i++){c.globalAlpha=.02+r()*.02;c.fillStyle=r()<.5?p[1]:p[2];c.fillRect(r()*W,r()*H,W*(.05+r()*.3),1+r()*3);}
    c.globalAlpha=1;grain(c,W,H,16,7);
  },
  tex(c,W,H,r,p){
    c.fillStyle=p[0];c.fillRect(0,0,W,H);
    for(let i=0;i<380;i++){
      const y=r()*H,h=3+r()*36,x=-60+r()*W*.85,len=W*(.2+r()*.95),col=p[1+Math.floor(r()*(p.length-1))];
      c.globalAlpha=.14+r()*.5;c.fillStyle=col;c.beginPath();c.moveTo(x,y);
      for(let s=0;s<=len;s+=12)c.lineTo(x+s,y+(r()-.5)*4);
      for(let s=len;s>=0;s-=12)c.lineTo(x+s,y+h+(r()-.5)*7);
      c.closePath();c.fill();
      c.globalAlpha=.22;c.fillStyle="#FFF8EA";c.fillRect(x,y-1,len,1.4);
      c.globalAlpha=.16;c.fillStyle="#120E08";c.fillRect(x,y+h,len,1.8);
    }
    for(let i=0;i<3200;i++){c.globalAlpha=.06+r()*.14;c.fillStyle=r()<.5?"#120E08":"#FFF8EA";c.fillRect(r()*W,r()*H,1+r()*2.5,1+r()*2);}
    c.globalAlpha=1;grain(c,W,H,22,4);
  },
  geo(c,W,H,r,p){
    c.fillStyle=p[0];c.fillRect(0,0,W,H);
    const cols=W>H*1.05?5:(W<H*.85?3:4),rows=Math.max(3,Math.round(cols*H/W));
    const mx=W*.1,my=H*.1,cw=(W-2*mx)/cols,ch=(H-2*my)/rows;
    const n=4+Math.floor(r()*3);
    for(let i=0;i<n;i++){
      const cx=Math.floor(r()*cols),cy=Math.floor(r()*rows),sw=1+Math.floor(r()*2),sh=1+Math.floor(r()*2);
      c.fillStyle=p[2+Math.floor(r()*3)];c.globalAlpha=.9+r()*.1;
      c.fillRect(mx+cx*cw,my+cy*ch,Math.min(sw,cols-cx)*cw,Math.min(sh,rows-cy)*ch);
    }
    c.globalAlpha=1;
    c.save();c.beginPath();c.rect(mx,my,W-2*mx,H-2*my);c.clip();
    const ox=mx+(1+Math.floor(r()*(cols-1)))*cw,oy=my+(1+Math.floor(r()*(rows-1)))*ch,R=Math.min(cw,ch)*(1+r()*.8);
    c.fillStyle=p[1];c.beginPath();c.arc(ox,oy,R,0,Math.PI*2);c.fill();
    c.globalCompositeOperation="source-atop";c.fillStyle=p[2];c.fillRect(ox,oy-R,R,R);c.globalCompositeOperation="source-over";
    c.restore();
    c.strokeStyle=p[1];c.lineWidth=1.4;c.globalAlpha=.85;
    for(let i=0;i<=cols;i++){c.beginPath();c.moveTo(mx+i*cw,my);c.lineTo(mx+i*cw,H-my);c.stroke();}
    for(let i=0;i<=rows;i++){if(r()<.55||i===0||i===rows){c.beginPath();c.moveTo(mx,my+i*ch);c.lineTo(W-mx,my+i*ch);c.stroke();}}
    c.globalAlpha=1;c.fillStyle=p[1];
    const bx=mx+Math.floor(r()*cols)*cw+cw*.5;c.fillRect(bx-W*.006,my*.55,W*.012,H-my*1.1);
    c.fillStyle=p[4];const sq=Math.min(cw,ch)*.28;c.fillRect(mx+Math.floor(r()*cols)*cw+cw*.12,my+Math.floor(r()*rows)*ch+ch*.12,sq,sq);
    grain(c,W,H,14,0);
  },
  sur(c,W,H,r,p,a){
    const hz=H*(a.v==="door"?.6:.67);
    let g=c.createLinearGradient(0,0,0,hz);g.addColorStop(0,p[0]);g.addColorStop(1,p[1]);c.fillStyle=g;c.fillRect(0,0,W,hz);
    g=c.createLinearGradient(0,hz,0,H);g.addColorStop(0,p[2]);g.addColorStop(1,p[3]);c.fillStyle=g;c.fillRect(0,hz,W,H-hz);
    g=c.createLinearGradient(0,hz-H*.09,0,hz);g.addColorStop(0,"rgba(255,250,240,0)");g.addColorStop(1,"rgba(255,250,240,.28)");c.fillStyle=g;c.fillRect(0,hz-H*.09,W,H*.09);
    for(let i=0;i<46;i++){const t=i/46,y=hz+(H-hz)*t*t;c.globalAlpha=.07;c.fillStyle=p[3];c.fillRect(0,y,W,1+t*2.5);}
    c.globalAlpha=1;
    if(a.v==="sphere"){
      const cx=W*.4,cy=hz*.6,R=Math.min(W,H)*.14;
      c.globalAlpha=.42;c.fillStyle=p[5];c.beginPath();c.ellipse(cx+W*.26,hz+(H-hz)*.45,R*2.1,R*.2,0,0,Math.PI*2);c.fill();c.globalAlpha=1;
      const rg=c.createRadialGradient(cx-R*.42,cy-R*.45,R*.08,cx,cy,R*1.02);rg.addColorStop(0,"#EFD2B2");rg.addColorStop(.45,p[4]);rg.addColorStop(1,p[5]);
      c.fillStyle=rg;c.beginPath();c.arc(cx,cy,R,0,Math.PI*2);c.fill();
      const x=W*.8,w=W*.022,top=hz-H*.2,sd=(H-hz)*.2;
      c.globalAlpha=.38;c.fillStyle=p[5];c.beginPath();c.moveTo(x,hz);c.lineTo(x+w,hz);c.lineTo(x+w+W*.36,hz+sd);c.lineTo(x+W*.36,hz+sd);c.closePath();c.fill();c.globalAlpha=1;
      c.fillStyle=p[5];c.fillRect(x,top,w,hz-top);c.fillStyle="#6B5644";c.fillRect(x,top,w*.35,hz-top);
      const fx=W*.18,fh=H*.035;c.fillStyle=p[5];c.fillRect(fx,hz+(H-hz)*.12-fh,W*.006,fh);
      c.globalAlpha=.35;c.fillRect(fx,hz+(H-hz)*.12,W*.07,2);c.globalAlpha=1;
    } else {
      const x0=W*.32,w=W*.24,top=hz-H*.4,bottom=hz+(H-hz)*.18,th=W*.03;
      c.globalAlpha=.36;c.fillStyle=p[5];c.beginPath();c.moveTo(x0,bottom);c.lineTo(x0+w,bottom);c.lineTo(x0+w-W*.34,bottom+(H-bottom)*.55);c.lineTo(x0-W*.34,bottom+(H-bottom)*.55);c.closePath();c.fill();c.globalAlpha=1;
      c.fillStyle="#B8AE9C";c.beginPath();c.moveTo(x0+w,top);c.lineTo(x0+w+th,top+th*.5);c.lineTo(x0+w+th,bottom-th*.2);c.lineTo(x0+w,bottom);c.closePath();c.fill();
      c.fillStyle=p[4];c.fillRect(x0,top,w,bottom-top);
      const ow=w*.5,ox=x0+(w-ow)/2,oy=top+(bottom-top)*.22,oh=bottom-oy;
      c.save();c.beginPath();c.moveTo(ox,oy+oh);c.lineTo(ox,oy+ow/2);c.arc(ox+ow/2,oy+ow/2,ow/2,Math.PI,0);c.lineTo(ox+ow,oy+oh);c.closePath();c.clip();
      const sh=oy+oh*.5;g=c.createLinearGradient(0,oy,0,sh);g.addColorStop(0,"#7F8B97");g.addColorStop(1,"#C9CDCB");c.fillStyle=g;c.fillRect(ox,oy,ow,sh-oy);
      g=c.createLinearGradient(0,sh,0,oy+oh);g.addColorStop(0,"#45576A");g.addColorStop(1,p[5]);c.fillStyle=g;c.fillRect(ox,sh,ow,oy+oh-sh);
      c.globalAlpha=.5;c.fillStyle="#E8ECEA";for(let i=0;i<14;i++){c.fillRect(ox,sh+i*(oh*.5/14)+r()*4,ow*(.2+r()*.8),1);}c.globalAlpha=1;
      c.restore();
      c.fillStyle="rgba(0,0,0,.08)";c.fillRect(x0,top,w*.04,bottom-top);
      const sx=W*.8,sw=W*.05,stop=hz-H*.08;c.fillStyle="#C9C0AF";c.fillRect(sx,stop,sw,hz-stop+2);
      c.globalAlpha=.3;c.fillStyle=p[5];c.beginPath();c.moveTo(sx,hz+2);c.lineTo(sx+sw,hz+2);c.lineTo(sx+sw-W*.1,hz+(H-hz)*.06);c.lineTo(sx-W*.1,hz+(H-hz)*.06);c.closePath();c.fill();c.globalAlpha=1;
    }
    grain(c,W,H,18,5);
  },
  gest(c,W,H,r,p){
    c.fillStyle=p[0];c.fillRect(0,0,W,H);
    c.lineCap="round";c.lineJoin="round";
    const cols=p.slice(1);
    for(let i=0;i<42;i++){
      const col=pick(r,cols),big=i<13,lw=big?34+r()*120:5+r()*42;
      const x0=r()*W,y0=r()*H,ang=r()*Math.PI*2,len=(.25+r()*.6)*Math.max(W,H);
      const x3=x0+Math.cos(ang)*len,y3=y0+Math.sin(ang)*len;
      const x1=x0+(r()-.5)*len,y1=y0+(r()-.5)*len,x2=x3+(r()-.5)*len,y2=y3+(r()-.5)*len;
      const passes=big?10:5,jj=()=>(r()-.5)*lw*.5;
      for(let k=0;k<passes;k++){c.globalAlpha=(big?.07:.12)+r()*.13;c.strokeStyle=col;c.lineWidth=lw*(.3+r()*.7);
        c.beginPath();c.moveTo(x0+jj(),y0+jj());c.bezierCurveTo(x1+jj(),y1+jj(),x2+jj(),y2+jj(),x3+jj(),y3+jj());c.stroke();}
      if(r()<.5){for(let b=0;b<16;b++){const o=(r()-.5)*lw;c.globalAlpha=.15+r()*.3;c.lineWidth=.8+r()*2.2;
        c.beginPath();c.moveTo(x0+o,y0+o*.6);c.bezierCurveTo(x1+o,y1+o,x2+o,y2+o,x3+o*.8,y3+o);c.stroke();}}
    }
    c.strokeStyle=p[1];
    for(let l=0;l<5;l++){let x=r()*W,y=r()*H;c.globalAlpha=.55+r()*.3;c.lineWidth=1+r()*2;c.beginPath();c.moveTo(x,y);
      for(let s=0;s<36;s++){const nx=x+(r()-.5)*90,ny=y+(r()-.5)*90;c.quadraticCurveTo(x+(r()-.5)*50,y+(r()-.5)*50,nx,ny);x=Math.max(0,Math.min(W,nx));y=Math.max(0,Math.min(H,ny));}
      c.stroke();}
    for(let i=0;i<180;i++){c.globalAlpha=.5+r()*.4;c.fillStyle=pick(r,cols);c.beginPath();c.arc(r()*W,r()*H,.6+Math.pow(r(),3)*7,0,Math.PI*2);c.fill();}
    c.globalAlpha=1;grain(c,W,H,16,5);
  },
  mix(c,W,H,r,p){
    c.fillStyle=p[0];c.fillRect(0,0,W,H);
    for(let i=0;i<1400;i++){c.globalAlpha=.05;c.fillStyle=r()<.5?"#5A4630":"#E9DCC4";c.fillRect(r()*W,r()*H,r()*30,1);}
    c.globalAlpha=1;
    for(let i=0;i<10;i++){
      const w=W*(.22+r()*.42),h=H*(.12+r()*.32),x=r()*(W-w*.6)-w*.15,y=r()*(H-h*.6)-h*.15,rot=(r()-.5)*.16,fill=pick(r,[p[1],p[2],p[3],p[1],p[5]]);
      c.save();c.translate(x+w/2,y+h/2);c.rotate(rot);
      c.shadowColor="rgba(30,20,10,.22)";c.shadowBlur=12;c.shadowOffsetY=4;c.fillStyle=fill;torn(c,-w/2,-h/2,w,h,r);c.fill();c.shadowColor="transparent";
      if(fill!==p[5]&&r()<.65){c.strokeStyle=p[4];c.globalAlpha=.5;c.lineWidth=1;const lines=Math.floor(h/15)-1;
        for(let l=0;l<lines;l++){const yy=-h/2+18+l*15;let xx=-w/2+18;c.beginPath();c.moveTo(xx,yy);
          while(xx<w/2-18-r()*40){xx+=3;if(r()<.06){xx+=8;c.moveTo(xx,yy);}else c.lineTo(xx,yy+Math.sin(xx*.7)*1.6+(r()-.5)*1.4);}
          c.stroke();}
        c.globalAlpha=1;}
      if(r()<.5){c.fillStyle="rgba(238,226,196,.55)";c.save();c.translate(-w/2+10,-h/2);c.rotate(-.5);c.fillRect(-28,-9,56,18);c.restore();}
      c.restore();
    }
    c.strokeStyle=p[5];c.lineWidth=1.6;c.globalAlpha=.9;
    for(let i=0;i<3;i++){const x0=r()*W,y0=r()*H*.2,x3=r()*W,y3=H*(.8+r()*.2);c.beginPath();c.moveTo(x0,y0);c.bezierCurveTo(r()*W,r()*H,r()*W,r()*H,x3,y3);c.stroke();
      c.fillStyle=p[4];c.beginPath();c.arc(x0,y0,2.5,0,7);c.arc(x3,y3,2.5,0,7);c.fill();}
    c.globalAlpha=.55;c.lineWidth=3;c.strokeStyle=p[5];c.beginPath();c.arc(W*(.2+r()*.6),H*(.2+r()*.6),Math.min(W,H)*.06,0,Math.PI*2);c.stroke();
    c.globalAlpha=1;grain(c,W,H,20,0);
  }
};
const PALETTES={
  mono:[["#2F3C57","#45577A","#1D263B"],["#5A2A25","#7B3C33","#381916"],["#3E4A3A","#55654F","#262E24"],["#6B5A3E","#857152","#45392A"]],
  tex:[["#9A7542","#B8925A","#7A5A2E","#C9A877","#5E4626"],["#D7D0C3","#BDB4A4","#E8E3D8","#8E8678","#A79D8C"],["#6E4B3A","#8C6450","#4E3326","#A98670","#3A251B"]],
  geo:[["#E6E0D4","#1C1B19","#8B4A32","#B89A63","#4A5560"],["#ECE7DD","#22211F","#2F3B52","#A7A196","#7A3A2C"],["#EFEBE3","#2A2926","#C7B48C","#8C8F86","#5C3A2E"]],
  sur:[["#A9A397","#E2D8C4","#C4A57C","#8A6A47","#A85A3C","#2B2420"],["#8C949B","#D9D3C5","#C9B08A","#957652","#E2DCD0","#2E3A49"]],
  gest:[["#E7E1D4","#1E1D1B","#6E2F2A","#B08A4E","#3E4A57","#1E1D1B","#8B7562"],["#EDE8DE","#2A2926","#8B7562","#A35A3C","#2A2926"]],
  mix:[["#B19878","#EDE7DA","#D5CEC0","#C9BFAE","#2A2926","#7A3329"]]
};
const STYLE_NAMES={mono:"Campo",tex:"Matéria",geo:"Geometria",sur:"Paisagem",gest:"Gesto",mix:"Colagem"};
function sizeFor(a){if(a.img&&a.imgW){a.W=a.imgW;a.H=a.imgH;return a;}const L=1000;a.W=a.w>=a.h?L:Math.round(L*a.w/a.h);a.H=a.h>=a.w?L:Math.round(L*a.h/a.w);return a;}
const artCache={};
function getArt(a){
  if(a.img)return a.img;
  const key=a.id+":"+a.seed+":"+a.g+":"+a.W+"x"+a.H+":"+(a.v||"");
  if(artCache[key])return artCache[key];
  const cv=document.createElement("canvas");cv.width=a.W;cv.height=a.H;
  const c=cv.getContext("2d",{willReadFrequently:true});
  GEN[a.g](c,a.W,a.H,rng(a.seed),a.p,a);
  return artCache[key]=cv.toDataURL("image/jpeg",.86);
}
const BLANK="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
const ARTS={};
function artImg(a){ARTS[a.id]=a;sizeFor(a);return `<img src="${BLANK}" data-art="${esc(a.id)}" width="${a.W}" height="${a.H}" style="aspect-ratio:${a.W}/${a.H}" alt="${esc((a.img?"Imagem enviada pela artista: ":"Composição generativa no lugar da fotografia da obra: ")+a.title+", "+a.year)}" decoding="async">`;}
let hydrateToken=0;
function hydrate(root=document){
  const imgs=$$("img[data-art]",root).filter(i=>!i.classList.contains("ready"));let i=0;const tok=++hydrateToken;
  const step=()=>{if(tok!==hydrateToken)return;const t0=performance.now();
    while(i<imgs.length&&performance.now()-t0<28){const im=imgs[i++];const a=ARTS[im.dataset.art];if(a){im.src=getArt(a);im.classList.add("ready");}}
    if(i<imgs.length)setTimeout(step,16);};
  step();
}

/* ---------- Concreto: marcas de fôrma, furos de tirante, poros ---------- */
(function concrete(){
  try{
    const S=640,cv=document.createElement("canvas");cv.width=cv.height=S;const c=cv.getContext("2d");
    const r=rng(1957),rows=8,bh=S/rows;
    const blot=(x,y,rad,col)=>{for(const dx of [-S,0,S])for(const dy of [-S,0,S]){const X=x+dx,Y=y+dy;if(X+rad<0||X-rad>S||Y+rad<0||Y-rad>S)continue;
      const g=c.createRadialGradient(X,Y,0,X,Y,rad);g.addColorStop(0,col);g.addColorStop(1,"rgba(0,0,0,0)");c.fillStyle=g;c.beginPath();c.arc(X,Y,rad,0,Math.PI*2);c.fill();}};
    for(let i=0;i<rows;i++){
      c.fillStyle=r()<.5?`rgba(0,0,0,${.02+r()*.035})`:`rgba(255,255,255,${.02+r()*.04})`;c.fillRect(0,i*bh,S,bh);
      c.save();c.beginPath();c.rect(0,i*bh,S,bh);c.clip();
      for(let l=0;l<16;l++){
        const y0=i*bh+r()*bh,amp=1+r()*3.5,k=1+Math.floor(r()*3),ph=r()*6.28;
        c.strokeStyle=r()<.7?`rgba(0,0,0,${.03+r()*.05})`:`rgba(255,255,255,${.04+r()*.05})`;c.lineWidth=.6+r()*1.3;c.beginPath();
        for(let x=0;x<=S;x+=8){const y=y0+amp*Math.sin(2*Math.PI*x/S*k+ph);x?c.lineTo(x,y):c.moveTo(x,y);}
        c.stroke();
      }
      c.restore();
      c.fillStyle="rgba(0,0,0,.13)";c.fillRect(0,i*bh,S,1.5);
      c.fillStyle="rgba(255,255,255,.08)";c.fillRect(0,i*bh+1.5,S,1);
    }
    for(let i=0;i<50;i++)blot(r()*S,r()*S,30+r()*90,r()<.6?`rgba(0,0,0,${.012+r()*.025})`:`rgba(255,255,255,${.015+r()*.03})`);
    for(const [x,y] of [[160,bh*1.5],[480,bh*1.5],[160,bh*5.5],[480,bh*5.5]]){
      const g=c.createRadialGradient(x,y,0,x,y,10);g.addColorStop(0,"rgba(0,0,0,.45)");g.addColorStop(.55,"rgba(0,0,0,.22)");g.addColorStop(1,"rgba(0,0,0,0)");
      c.fillStyle=g;c.beginPath();c.arc(x,y,10,0,Math.PI*2);c.fill();
      c.fillStyle="rgba(255,255,255,.1)";c.beginPath();c.arc(x+1.5,y+2.5,5,0,Math.PI*2);c.fill();
    }
    for(let i=0;i<2600;i++){const s=.6+Math.pow(r(),3)*2.6;c.fillStyle=`rgba(0,0,0,${.05+r()*.2})`;c.fillRect(r()*S,r()*S,s,s);}
    for(let i=0;i<1400;i++){const s=.6+r()*1.6;c.fillStyle=`rgba(255,255,255,${.05+r()*.12})`;c.fillRect(r()*S,r()*S,s,s);}
    document.documentElement.style.setProperty("--tex",`url(${cv.toDataURL("image/png")})`);
  }catch(e){}
})();

/* ---------- Tipografia ajustada à largura ---------- */
function fit(root=document){
  $$(".fit",root).forEach(el=>{
    const s=el.firstElementChild;if(!s)return;
    el.classList.remove("nofit");el.classList.toggle("acc",/[À-ÖØ-öø-ÿ]/.test(s.textContent));el.style.fontSize="100px";
    const avail=el.clientWidth;
    if(s.textContent.trim().length>12&&/\s/.test(s.textContent.trim())&&avail<700){el.classList.add("nofit");el.style.fontSize="";return;}
    const w=s.getBoundingClientRect().width;
    if(w>0&&avail>0)el.style.fontSize=Math.floor(100*avail/w*0.995*100)/100+"px";
  });
}
let fitT;window.addEventListener("resize",()=>{clearTimeout(fitT);fitT=setTimeout(()=>fit(),120);});
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>fit());

/* ---------- Componentes ---------- */
function slab(a,h,plaque=true,extra=""){
  return `<div class="slab${plaque?"":" np"}"${h?` style="--h:${h}"`:""}><div class="hang">${artImg(a)}</div>${plaque?`<p class="plaque"><b>${esc(a.title)}</b><span>${a.year}</span><span>${extra||"Composição de demonstração"}</span></p>`:""}</div>`;
}
function secHead(n,eyebrow,title,id,href,linkText,extra=""){
  return `<div class="sec-head"><p class="n">${n} — ${eyebrow}</p><h2 id="${id}">${title}</h2>${href?`<div class="side"><a href="${href}"${extra}>${linkText} ${icon("right")}</a></div>`:""}</div>`;
}
function pageHead(title,label,intro,count){
  return `<header class="page-head"><h1 class="fit"><span>${title}</span></h1>
    <div class="page-strip"><p class="lab">${label}</p><p class="intro">${intro}</p><p class="count">${count}</p></div></header>`;
}
const wordmark=(href="index.html",tagText="Rede privada de arte")=>`<a href="${href}" class="wordmark" aria-label="PONCI — início"><b>PONCI</b><small>${tagText}</small></a>`;

/* Campos de formulário com validação no navegador */
function field(o){
  const id="i-"+o.name,attrs=o.attrs||"";
  const label=`<label for="${id}" class="lab"><span>${o.label}</span>${o.aside?`<span class="count" id="c-${o.name}">${o.aside}</span>`:""}</label>`;
  let ctl;
  if(o.type==="select")ctl=`<select id="${id}" name="${o.name}" aria-describedby="e-${o.name}"${o.req===false?"":" required"}>${o.options}</select>`;
  else if(o.type==="textarea")ctl=`<textarea id="${id}" name="${o.name}" rows="${o.rows||5}" placeholder="${esc(o.ph||"")}" aria-describedby="e-${o.name}"${o.req===false?"":" required"} ${attrs}>${esc(o.value||"")}</textarea>`;
  else ctl=`<input id="${id}" name="${o.name}" type="${o.type||"text"}" placeholder="${esc(o.ph||"")}" value="${esc(o.value||"")}" aria-describedby="e-${o.name}"${o.req===false?"":" required"} ${attrs}>`;
  return `<div class="field" id="f-${o.name}">${label}${ctl}<p class="err" id="e-${o.name}"></p></div>`;
}
const V={
  name:v=>v.trim().length<2?"Informe seu nome.":"",
  email:v=>/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())?"":"Informe um e-mail válido, como nome@dominio.com.",
  req:(msg)=>v=>String(v).trim()?"":msg,
  min:(n,msg)=>v=>v.trim().length<n?msg(v.trim().length):"",
  money:(min=1)=>v=>parseMoney(v)>=min?"":`Informe um valor de pelo menos ${brl(min)}.`,
  range:(lo,hi,msg)=>v=>{const n=+v;return n>=lo&&n<=hi?"":msg;}
};
/* Liga validação a um <form>. rules: {nome: fn}. Retorna {check(), values()} */
function bindValidation(form,rules,onInput){
  const touched={};
  const set=name=>{const el=form.elements[name];if(!el||!rules[name])return "";const m=rules[name](el.value,form);
    const f=$("#f-"+name,form);f&&f.classList.toggle("bad",!!m);el.setAttribute("aria-invalid",m?"true":"false");const e=$("#e-"+name,form);if(e)e.textContent=m;return m;};
  form.addEventListener("input",e=>{const n=e.target.name;onInput&&onInput(e);if(n&&touched[n])set(n);if(e.target.tagName==="SELECT"){touched[n]=true;set(n);}});
  form.addEventListener("focusout",e=>{const n=e.target.name;if(n&&e.target.value!==""){touched[n]=true;set(n);}});
  return{
    check(){const names=Object.keys(rules);names.forEach(n=>touched[n]=true);const bad=names.filter(n=>set(n));
      const st=$(".form-status",form);if(st)st.textContent=bad.length?"Alguns campos precisam de atenção antes do envio.":"";
      if(bad.length)form.elements[bad[0]].focus();return !bad.length;},
    values(){const o={};[...form.elements].forEach(el=>{if(el.name)o[el.name]=el.value;});return o;}
  };
}

/* ---------- Toast ---------- */
let toastT;
function toast(msg){
  let t=$("#toast");if(!t){t=document.createElement("div");t.id="toast";t.className="toast";t.setAttribute("role","status");document.body.appendChild(t);}
  t.innerHTML=`${icon("check")}<span>${esc(msg)}</span>`;t.classList.add("on");clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove("on"),3200);
}

/* ---------- Cabeçalho, menu e rodapé ---------- */
/* cfg: {nav:[[href,label,badge?]], current, user:{name,role,onLogout}|null, enter:bool, band:[l,r]|null, tagText} */
function chrome(cfg){
  const cur=cfg.current;
  const navItems=cfg.nav.map(([h,l,b],i)=>`<li><a href="${h}"${cur===h?' aria-current="page"':""}><span>${pad(i+1)}</span>${l}${b?` <i class="badge-n">${b}</i>`:""}</a></li>`).join("");
  const enter=cfg.enter?`<li><a href="#entrar" class="enter-a" data-enter><span>${icon("lock")}</span>Entrar</a></li>`:"";
  const who=cfg.user?`<div class="who"><span class="av" aria-hidden="true">${esc(initials(cfg.user.name))}</span><span><b>${esc(cfg.user.name)}</b>${esc(cfg.user.role)}</span><button type="button" data-logout>${icon("logout")} Sair</button></div>`:"";
  $("#brand").innerHTML=wordmark(cfg.home||"index.html",cfg.tagText);
  $("#nav").innerHTML=`<ul>${navItems}${enter}</ul>${who}`;
  $("#menu-btn").innerHTML=`Menu ${icon("menu")}`;
  const mItems=[...cfg.nav,...(cfg.enter?[["#entrar","Entrar"]]:[])];
  $("#menu").innerHTML=`<div class="wrap" style="display:flex;flex-direction:column;flex:1">
    <div class="top">${wordmark(cfg.home||"index.html",cfg.tagText)}<button class="menu-btn" type="button" id="menu-close" style="display:inline-flex">Fechar ${icon("x")}</button></div>
    <ul>${mItems.map(([h,l,b],i)=>`<li><a href="${h}"${cur===h?' aria-current="page"':""}${h==="#entrar"?" data-enter":""}>${l}${b?` (${b})`:""}<span>${pad(i+1)}</span></a></li>`).join("")}</ul>
    <div class="foot2"><span class="lab">${cfg.user?esc(cfg.user.name)+" · "+esc(cfg.user.role):"ponci.art"}</span>${cfg.user?`<button type="button" class="btn ghost sm" data-logout>Sair ${icon("logout")}</button>`:`<a class="btn sm" href="index.html#acesso">Solicitar acesso ${icon("right")}</a>`}</div></div>`;
  const band=$("#band");
  if(band){band.hidden=!cfg.band;if(cfg.band)band.innerHTML=`<div class="wrap"><span>${cfg.band[0]}</span><span>${cfg.band[1]}</span></div>`;}
  $("#foot").innerHTML=`<div class="wrap">
    <div class="foot-grid">
      <div class="c1"><p class="lab">PONCI</p><p class="ftag">Rede privada de artistas e colecionadores. Brasil, fund. 2026.</p><span class="domain">ponci.art</span></div>
      <nav class="c2" aria-label="Índice"><p class="lab">Índice</p><ul><li><a href="index.html">A rede</a></li><li><a href="artista.html">Área do artista</a></li><li><a href="comprador.html">Área do colecionador</a></li><li><a href="index.html#acesso">Solicitar acesso</a></li></ul></nav>
      <div class="c3"><p class="lab">Acesso</p><ul class="note" style="gap:4px"><li>Somente por convite</li><li>Membros verificados</li><li>Transação em custódia</li></ul></div>
      <p class="c4 note">Este site é um protótipo. Obras, nomes de artistas e colecionadores, preços e transações são conteúdo de demonstração. Os dados ficam apenas no seu navegador.</p>
    </div>
    <div class="fit foot-mega" aria-hidden="true"><span>PONCI</span></div>
    <div class="foot-base"><span>© 2026 PONCI</span><span>ponci.art</span><span>Brasil — Fund. 2026</span></div>
  </div>`;
}
function openMenu(){const m=$("#menu");m.hidden=false;document.body.classList.add("locked");$("#menu-btn").setAttribute("aria-expanded","true");$("#menu-close")?.focus();}
function closeMenu(focusBtn){const m=$("#menu");if(!m||m.hidden)return;m.hidden=true;document.body.classList.remove("locked");$("#menu-btn").setAttribute("aria-expanded","false");if(focusBtn)$("#menu-btn").focus();}
document.addEventListener("click",e=>{
  const t=e.target.closest("#menu-btn,#menu-close,#menu a,#menu [data-logout]");if(!t)return;
  if(t.id==="menu-btn")openMenu();else if(t.id==="menu-close")closeMenu(true);else closeMenu(false);
});
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeMenu(true);});
window.addEventListener("resize",()=>{if(window.innerWidth>1000)closeMenu(false);});
document.addEventListener("DOMContentLoaded",()=>{$("#skip")?.addEventListener("click",()=>$("#main").focus());});

/* ---------- Roteador por hash para as áreas ---------- */
function router(opts){
  /* opts: {resolve(hash)->{title,html,after}, chrome()->void} */
  function render(fresh){
    const y=window.scrollY;
    opts.chrome();
    const v=opts.resolve(decodeURIComponent(location.hash.slice(1))),main=$("#main");
    main.innerHTML=v.html;document.title=v.title;
    if(fresh){main.classList.remove("enter");void main.offsetWidth;main.classList.add("enter");}
    v.after&&v.after();
    hydrate(main);fit();
    if(fresh&&!v.keepScroll){window.scrollTo({top:0,behavior:"instant"});main.focus({preventScroll:true});}
    else window.scrollTo({top:y,behavior:"instant"});
  }
  window.addEventListener("hashchange",()=>{closeMenu(false);render(true);});
  return render;
}

/* ---------- Acesso restrito (login de demonstração) ---------- */
/* o: {role:"artist"|"buyer", title, label, intro, art, demo:{id,name}, onEnter(id)} */
function gate(o){
  const html=`<div class="wrap">
    ${pageHead(o.title,o.label,o.intro,"Acesso restrito<br>Somente membros")}
    <section class="gate" aria-labelledby="gate-t">
      <div class="gate-art" aria-hidden="true">${slab(o.art,null,true,"Na rede")}</div>
      <div class="gate-main">
        <p class="lab">Entrar</p>
        <h2 id="gate-t">${o.heading}</h2>
        <p>${o.sub}</p>
        <form class="form" id="login" novalidate>
          ${field({name:"email",label:"E-mail",type:"email",ph:"nome@dominio.com",attrs:'autocomplete="email" inputmode="email"'})}
          ${field({name:"code",label:"Código de convite",ph:"PONCI-0000",attrs:'autocomplete="one-time-code" autocapitalize="characters" spellcheck="false"'})}
          <p class="form-status" role="alert"></p>
          <div class="form-actions"><button class="btn" type="submit">Entrar ${icon("right")}</button><a class="linkbtn" href="index.html#acesso">Não tenho convite</a></div>
        </form>
        <div class="demo-box">
          <p class="lab" style="color:var(--ink)">Protótipo</p>
          <p class="hint">Use qualquer e-mail com o código <code>${window.Store.CODE}</code>, ou entre direto com a conta de demonstração.</p>
          <button class="btn ghost" type="button" id="demo-in">Entrar como ${esc(o.demo.name)} ${icon("right")}</button>
        </div>
      </div>
    </section></div>`;
  return {title:"PONCI — "+o.title,html,after(){
    const f=$("#login");
    const val=bindValidation(f,{email:V.email,code:v=>v.trim().toUpperCase()===window.Store.CODE?"":"Código inválido. No protótipo, use "+window.Store.CODE+"."});
    f.addEventListener("submit",e=>{e.preventDefault();if(val.check())o.onEnter(o.demo.id);});
    $("#demo-in").addEventListener("click",()=>o.onEnter(o.demo.id));
  }};
}

window.P={gate,icon,esc,$,$$,pad,brl,num,dims,dimsIn,dateBR,parseMoney,initials,CAT,STATUS,PSTATUS,STAGES,tag,
  rng,GEN,PALETTES,STYLE_NAMES,sizeFor,getArt,artImg,hydrate,fit,slab,secHead,pageHead,wordmark,field,V,bindValidation,toast,chrome,closeMenu,router};
})();
