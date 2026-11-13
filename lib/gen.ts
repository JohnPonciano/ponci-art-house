// @ts-nocheck
/* Arte generativa (substitui fotografia de obra) e textura de concreto — portado do protótipo original. */
export function rng(seed){let s=seed>>>0;return()=>{s=(s+0x6D2B79F5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
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
export const GEN={
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
export const PALETTES={
  mono:[["#2F3C57","#45577A","#1D263B"],["#5A2A25","#7B3C33","#381916"],["#3E4A3A","#55654F","#262E24"],["#6B5A3E","#857152","#45392A"]],
  tex:[["#9A7542","#B8925A","#7A5A2E","#C9A877","#5E4626"],["#D7D0C3","#BDB4A4","#E8E3D8","#8E8678","#A79D8C"],["#6E4B3A","#8C6450","#4E3326","#A98670","#3A251B"]],
  geo:[["#E6E0D4","#1C1B19","#8B4A32","#B89A63","#4A5560"],["#ECE7DD","#22211F","#2F3B52","#A7A196","#7A3A2C"],["#EFEBE3","#2A2926","#C7B48C","#8C8F86","#5C3A2E"]],
  sur:[["#A9A397","#E2D8C4","#C4A57C","#8A6A47","#A85A3C","#2B2420"],["#8C949B","#D9D3C5","#C9B08A","#957652","#E2DCD0","#2E3A49"]],
  gest:[["#E7E1D4","#1E1D1B","#6E2F2A","#B08A4E","#3E4A57","#1E1D1B","#8B7562"],["#EDE8DE","#2A2926","#8B7562","#A35A3C","#2A2926"]],
  mix:[["#B19878","#EDE7DA","#D5CEC0","#C9BFAE","#2A2926","#7A3329"]],
  cena:[["#C9C4BA"]]
};
export const STYLE_NAMES={mono:"Campo",tex:"Matéria",geo:"Geometria",sur:"Paisagem",gest:"Gesto",mix:"Colagem"};

/** Dimensões de renderização (lado maior = 1000px) a partir das medidas em cm, ou da foto. */
export function renderSize(a,L=1000){
  if(a.img_w&&a.img_h)return {W:a.img_w,H:a.img_h};
return {W:a.w>=a.h?L:Math.round(L*a.w/a.h),H:a.h>=a.w?L:Math.round(L*a.h/a.w)};
}
const cache=new Map();
/** dataURL JPEG da composição generativa da obra (cacheado). */
export function genKey(a,L=1000){
  const gen=a.gen||{};const g=GEN[gen.g]?gen.g:"mono";const {W,H}=renderSize({h:a.h,w:a.w},L);
  return [g,gen.seed,W,H,typeof gen.v==="object"?JSON.stringify(gen.v):gen.v,(gen.p||[]).join()].join("|");
}
export function generate(a,L=1000){
  const gen=a.gen||{};const g=GEN[gen.g]?gen.g:"mono";const {W,H}=renderSize({h:a.h,w:a.w},L);
  const key=genKey(a,L);
  if(cache.has(key))return cache.get(key);
  const cv=document.createElement("canvas");cv.width=W;cv.height=H;
  const c=cv.getContext("2d",{willReadFrequently:true});
  const p=gen.p&&gen.p.length?gen.p:PALETTES[g][0];
  GEN[g](c,W,H,rng(gen.seed||1),p,{v:gen.v});
  const url=cv.toDataURL("image/jpeg",.86);cache.set(key,url);return url;
}

/* Concreto: marcas de fôrma, furos de tirante, poros (tileable). Define --tex no :root. */
export function concrete(){
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
}

/* ---------- Cenas de ateliê (fotografia ilustrativa para a Comunidade) ----------
   Desenha a obra real da artista num ambiente: parede de concreto, cavalete, mesa de tintas,
   exposição ou casa do colecionador, com figuras humanas em silhueta (de costas ou de perfil). */
function artCanvas(a,L){
  const g=GEN[a.g]?a.g:"mono",h=a.h||100,w=a.w||100;
  const W=w>=h?L:Math.round(L*w/h),H=h>=w?L:Math.round(L*h/w);
  const cv=document.createElement("canvas");cv.width=W;cv.height=H;const c=cv.getContext("2d",{willReadFrequently:true});
  GEN[g](c,W,H,rng(a.seed||1),a.p&&a.p.length?a.p:PALETTES[g][0],{v:a.v});return cv;
}
function hang(c,art,x,y,w,o={}){ // obra pendurada com sombra e espessura do chassi
  const h=w*art.height/art.width,d=Math.max(3,w*.018);
  c.save();c.shadowColor="rgba(10,8,6,.42)";c.shadowBlur=w*.06;c.shadowOffsetX=w*.03;c.shadowOffsetY=w*.04;
  c.fillStyle="#222";c.fillRect(x,y,w,h);c.restore();
  if(o.frame){c.fillStyle=o.frame;c.fillRect(x-w*.03,y-w*.03,w*1.06,h+w*.06);}
  c.drawImage(art,x,y,w,h);
  c.fillStyle="rgba(0,0,0,.28)";c.fillRect(x+w,y+d*.4,d*.8,h);
  if(o.part!=null){ // pintura em andamento: parte ainda na tela crua com esboço
    const cut=y+h*o.part;c.fillStyle="#EDE8DC";c.fillRect(x,cut,w,y+h-cut);
    c.strokeStyle="rgba(40,36,30,.35)";c.lineWidth=1.2;const r=rng(o.seed||3);
    for(let i=0;i<9;i++){c.beginPath();const sx=x+r()*w,sy=cut+r()*(y+h-cut);c.moveTo(sx,sy);c.lineTo(sx+(r()-.5)*w*.5,sy+(r()-.3)*h*.2);c.stroke();}
    c.fillStyle="rgba(0,0,0,.08)";c.fillRect(x,cut,w,3);
  }
  return h;
}
function wall(c,W,H,r,tone,floorY){
  const base=tone==="branco"?["#EEEBE5","#DCD8D0"]:tone==="quente"?["#D9CBB4","#BFAE93"]:["#C8C3B9","#A9A398"];
  let g=c.createLinearGradient(0,0,W,floorY);g.addColorStop(0,base[0]);g.addColorStop(1,base[1]);c.fillStyle=g;c.fillRect(0,0,W,floorY);
  if(tone!=="branco"&&tone!=="quente"){ // marcas de fôrma e poros do concreto
    const rows=6,bh=floorY/rows;
    for(let i=1;i<rows;i++){c.fillStyle="rgba(0,0,0,.07)";c.fillRect(0,i*bh,W,1.5);c.fillStyle="rgba(255,255,255,.06)";c.fillRect(0,i*bh+1.5,W,1);}
    for(let i=0;i<900;i++){c.fillStyle=`rgba(0,0,0,${.04+r()*.08})`;c.fillRect(r()*W,r()*floorY,1+r()*2,1+r()*2);}
    for(let i=0;i<60;i++){const x=r()*W,y=r()*floorY,R=20+r()*90,gg=c.createRadialGradient(x,y,0,x,y,R);gg.addColorStop(0,r()<.5?"rgba(0,0,0,.05)":"rgba(255,255,255,.06)");gg.addColorStop(1,"rgba(0,0,0,0)");c.fillStyle=gg;c.beginPath();c.arc(x,y,R,0,7);c.fill();}
  }
}
function floor(c,W,H,floorY,kind){
  const g=c.createLinearGradient(0,floorY,0,H);
  if(kind==="madeira"){g.addColorStop(0,"#8A6A4A");g.addColorStop(1,"#5E4530");}else if(kind==="claro"){g.addColorStop(0,"#BDB7AC");g.addColorStop(1,"#9C968B");}else{g.addColorStop(0,"#8E897F");g.addColorStop(1,"#5C5850");}
  c.fillStyle=g;c.fillRect(0,floorY,W,H-floorY);
  c.fillStyle="rgba(0,0,0,.22)";c.fillRect(0,floorY,W,3);
  if(kind==="madeira"){c.strokeStyle="rgba(30,18,8,.25)";c.lineWidth=1;for(let i=1;i<9;i++){const y=floorY+(H-floorY)*Math.pow(i/9,1.6);c.beginPath();c.moveTo(0,y);c.lineTo(W,y);c.stroke();}}
}
function light(c,W,H,fromLeft=true){ // luz de janela lateral
  const g=c.createLinearGradient(fromLeft?0:W,0,fromLeft?W:0,0);g.addColorStop(0,"rgba(255,244,222,.32)");g.addColorStop(.55,"rgba(255,244,222,0)");g.addColorStop(1,"rgba(20,16,10,.22)");
  c.fillStyle=g;c.fillRect(0,0,W,H);
}
function shadowAt(c,x,y,w){c.save();c.filter="blur(6px)";c.fillStyle="rgba(10,8,6,.38)";c.beginPath();c.ellipse(x,y,w,w*.14,0,0,7);c.fill();c.restore();}
/** Pessoa em silhueta. view: "back" (de costas) | "side" (de perfil, dir=-1 olha p/ esquerda). arm: "down" | "brush" | "hip" */
function person(c,x,footY,u,o,fromLeft=true){
  const cv=document.createElement("canvas"),PW=Math.ceil(u*.9),PH=Math.ceil(u*1.05);cv.width=PW;cv.height=PH;const k=cv.getContext("2d");
  const X=PW/2,F=PH-2,dir=o.dir||1,side=o.view==="side";
  const hr=u*.062,hy=F-u+hr+u*.01,sy=F-u*.80,sw=side?u*.15:u*.25,hipY=F-u*.47,hw=side?u*.14:u*.19;
  const fill=(col,f)=>{k.fillStyle=col;k.beginPath();f();k.fill();};
  // pernas
  const leg=(lx,tilt)=>fill(o.pants,()=>{k.moveTo(lx-u*.045,hipY-2);k.lineTo(lx+u*.045,hipY-2);k.lineTo(lx+u*.03+tilt,F-u*.02);k.lineTo(lx-u*.025+tilt,F-u*.02);k.closePath();});
  if(side){leg(X-u*.01,-u*.03*dir);leg(X+u*.02*dir,u*.04*dir);}else{leg(X-u*.05,-u*.008);leg(X+u*.05,u*.008);}
  k.fillStyle=o.shoe||"#141210";
  const shoe=(sx)=>{k.beginPath();k.ellipse(sx,F-u*.012,u*.04,u*.016,0,0,7);k.fill();};
  if(side){shoe(X-u*.01-u*.03*dir+u*.015*dir);shoe(X+u*.02*dir+u*.04*dir+u*.015*dir);}else{shoe(X-u*.058);shoe(X+u*.058);}
  // tronco
  fill(o.top,()=>{k.moveTo(X-sw/2,sy+u*.035);k.quadraticCurveTo(X-sw/2,sy-u*.005,X-sw/2+u*.05,sy-u*.01);k.lineTo(X+sw/2-u*.05,sy-u*.01);k.quadraticCurveTo(X+sw/2,sy-u*.005,X+sw/2,sy+u*.035);
    k.lineTo(X+hw/2+u*.01,hipY+u*.02);k.lineTo(X-hw/2-u*.01,hipY+u*.02);k.closePath();});
  // braços
  const arm=(ax,ex,ey,hx,hy2,wd)=>{k.strokeStyle=o.top;k.lineCap="round";k.lineJoin="round";k.lineWidth=wd;k.beginPath();k.moveTo(ax,sy+u*.03);k.lineTo(ex,ey);k.lineTo(hx,hy2);k.stroke();
    k.fillStyle=o.skin;k.beginPath();k.arc(hx,hy2,wd*.42,0,7);k.fill();};
  const aw=u*.06;
  if(o.arm==="brush"){ // braço estendido com pincel
    arm(X+sw*.25*dir,X+u*.15*dir,sy+u*.06,X+u*.29*dir,sy-u*.02,aw*.9);
    k.strokeStyle="#6B4A2C";k.lineWidth=u*.008;k.beginPath();k.moveTo(X+u*.27*dir,sy+u*.005);k.lineTo(X+u*.37*dir,sy-u*.06);k.stroke();
    if(!side)arm(X-sw/2+aw*.3,X-sw/2-u*.01,sy+u*.2,X-sw/2+u*.01,hipY-u*.02,aw);
    else arm(X-u*.02*dir,X-u*.03*dir,sy+u*.18,X+u*.03*dir,hipY-u*.03,aw*.9);
  }else if(o.arm==="hip"){
    arm(X-sw/2+aw*.3,X-sw/2-u*.07,sy+u*.15,X-hw/2+u*.01,hipY-u*.03,aw);arm(X+sw/2-aw*.3,X+sw/2+u*.01,sy+u*.2,X+sw/2-u*.01,hipY+u*.02,aw);
  }else{
    if(side){arm(X,X+u*.01*dir,sy+u*.18,X+u*.025*dir,hipY+u*.01,aw*.9);}
    else{arm(X-sw/2+aw*.3,X-sw/2-u*.012,sy+u*.19,X-sw/2+u*.004,hipY+u*.01,aw);arm(X+sw/2-aw*.3,X+sw/2+u*.012,sy+u*.19,X+sw/2-u*.004,hipY+u*.01,aw);}
  }
  // pescoço e cabeça
  k.fillStyle=o.skin;k.fillRect(X-u*.022,hy+hr*.5,u*.044,sy-hy-hr*.4);
  if(side){ // perfil: cabelo atrás, rosto à frente, nariz
    k.fillStyle=o.hair;k.beginPath();k.ellipse(X-hr*.15*dir,hy-hr*.1,hr*.96,hr*.94,0,0,7);k.fill();
    if(o.hairStyle==="coque"){k.beginPath();k.arc(X-hr*.95*dir,hy-hr*.55,hr*.45,0,7);k.fill();}
    if(o.hairStyle==="longo"){k.beginPath();k.moveTo(X-hr*1.05*dir,hy);k.quadraticCurveTo(X-hr*1.2*dir,hy+hr*2,X-hr*.2*dir,hy+hr*2.3);k.lineTo(X-hr*.1*dir,hy+hr*.5);k.closePath();k.fill();}
    k.fillStyle=o.skin;k.beginPath();k.ellipse(X+hr*.28*dir,hy+hr*.2,hr*.66,hr*.76,0,0,7);k.fill();
    k.beginPath();k.moveTo(X+hr*.88*dir,hy+hr*.02);k.lineTo(X+hr*1.08*dir,hy+hr*.3);k.lineTo(X+hr*.86*dir,hy+hr*.36);k.fill();
  }else{
    k.beginPath();k.ellipse(X,hy,hr*.92,hr,0,0,7);k.fill();
    k.fillStyle=o.hair;
    if(o.hairStyle==="longo"){k.beginPath();k.ellipse(X,hy-hr*.1,hr*1.04,hr*1.04,0,Math.PI,0);k.lineTo(X+hr*1.05,hy+hr*2.2);k.quadraticCurveTo(X,hy+hr*2.6,X-hr*1.05,hy+hr*2.2);k.closePath();k.fill();}
    else{k.beginPath();k.ellipse(X,hy-hr*.06,hr*.98,hr*.95,0,Math.PI*.9,Math.PI*2.1);k.fill();k.beginPath();k.ellipse(X,hy+hr*.15,hr*.92,hr*.72,0,0,Math.PI);k.fill();
      if(o.hairStyle==="coque"){k.beginPath();k.arc(X,hy-hr*1.05,hr*.48,0,7);k.fill();}}
  }
  // luz lateral sobre o corpo
  k.globalCompositeOperation="source-atop";const g=k.createLinearGradient(fromLeft?0:PW,0,fromLeft?PW:0,0);g.addColorStop(0,"rgba(255,240,215,.28)");g.addColorStop(.5,"rgba(255,240,215,0)");g.addColorStop(1,"rgba(0,0,0,.3)");k.fillStyle=g;k.fillRect(0,0,PW,PH);
  shadowAt(c,x+(fromLeft?u*.12:-u*.12),footY,u*.22);
  c.save();c.filter="blur(.6px)";c.drawImage(cv,x-PW/2,footY-PH+2);c.restore();
}
const PEOPLE=[
  {top:"#1F1E1C",pants:"#2C2A27",skin:"#8A5E44",hair:"#141110",hairStyle:"coque"},
  {top:"#7A5236",pants:"#23211E",skin:"#C79B7C",hair:"#2A1E16",hairStyle:"curto"},
  {top:"#D9D3C7",pants:"#3A3833",skin:"#6B4632",hair:"#0F0D0C",hairStyle:"curto"},
  {top:"#3E4A57",pants:"#1A1917",skin:"#D8B49A",hair:"#5A3B22",hairStyle:"longo"},
  {top:"#8B3A2E",pants:"#2A2825",skin:"#A87656",hair:"#191410",hairStyle:"longo"},
  {top:"#4A4A44",pants:"#C9C1B2",skin:"#B5876A",hair:"#B9B2A6",hairStyle:"curto"},
];
function finish(c,W,H,r,warm){
  c.fillStyle=warm?"rgba(255,200,140,.06)":"rgba(120,150,190,.04)";c.fillRect(0,0,W,H);
  const v=c.createRadialGradient(W/2,H/2,Math.min(W,H)*.35,W/2,H/2,Math.max(W,H)*.75);v.addColorStop(0,"rgba(0,0,0,0)");v.addColorStop(1,"rgba(0,0,0,.32)");c.fillStyle=v;c.fillRect(0,0,W,H);
  grain(c,W,H,14,0);
}
GEN.cena=function(c,W,H,r,_p,o){
  const v=o.v||{},kind=v.kind||"parede",who={...PEOPLE[(v.who??Math.floor(r()*PEOPLE.length))%PEOPLE.length],...(v.person||{})};
  const L=Math.round(Math.max(W,H)*.75);
  if(kind==="mesa"){ // vista de cima: mesa, paleta, pincéis e a obra no canto
    c.fillStyle="#8E8981";c.fillRect(0,0,W,H);for(let i=0;i<4000;i++){c.fillStyle=`rgba(${r()<.5?0:255},${r()<.5?0:255},${r()<.5?0:255},${.03+r()*.05})`;c.fillRect(r()*W,r()*H,1+r()*3,1+r()*2);}
    const art=artCanvas(v.art,L);c.save();c.translate(W*.62,H*.06);c.rotate(.06);c.shadowColor="rgba(0,0,0,.45)";c.shadowBlur=30;c.shadowOffsetY=12;c.drawImage(art,0,0,W*.5,W*.5*art.height/art.width);c.restore();
    const pal=(v.art.p&&v.art.p.length?v.art.p:PALETTES[v.art.g]?.[0])||["#333"];
    c.save();c.translate(W*.08,H*.42);c.rotate(-.12);c.shadowColor="rgba(0,0,0,.4)";c.shadowBlur=24;c.shadowOffsetY=10;c.fillStyle="#E8E1D2";c.beginPath();c.ellipse(W*.27,H*.17,W*.3,H*.19,0,0,7);c.fill();c.restore();
    const pcx=W*.355,pcy=H*.59,prx=W*.3,pry=H*.19;
    for(let i=0;i<pal.length+2;i++){const col=pal[i%pal.length],ang=-2.6+i*(4.2/(pal.length+2)),x=pcx+Math.cos(ang)*prx*.72,y=pcy+Math.sin(ang)*pry*.62;
      c.save();c.shadowColor="rgba(0,0,0,.25)";c.shadowBlur=4;c.shadowOffsetY=2;c.fillStyle=col;c.beginPath();for(let k=0;k<9;k++){const a=k/9*Math.PI*2,R=W*(.026+r()*.014);c.lineTo(x+Math.cos(a)*R,y+Math.sin(a)*R*.75);}c.closePath();c.fill();c.restore();
      c.fillStyle="rgba(255,255,255,.4)";c.beginPath();c.arc(x-W*.007,y-W*.006,W*.005,0,7);c.fill();}
    for(let i=0;i<3;i++){const a=pal[(i+2)%pal.length],b=pal[(i+3)%pal.length];c.globalAlpha=.75;c.strokeStyle=a;c.lineWidth=W*.02;c.lineCap="round";c.beginPath();const sx=pcx-prx*.25+i*prx*.18,sy=pcy+pry*(.05-i*.05);c.moveTo(sx,sy);c.quadraticCurveTo(sx+W*.04,sy+H*.04,sx+W*.09,sy+H*.01);c.stroke();c.strokeStyle=b;c.lineWidth=W*.008;c.stroke();c.globalAlpha=1;}
    for(let i=0;i<3;i++){const y=H*(.82+i*.045),x=W*(.18+i*.06);c.save();c.translate(x,y);c.rotate(-.18+i*.08);c.shadowColor="rgba(0,0,0,.35)";c.shadowBlur=6;c.shadowOffsetY=3;
      c.fillStyle=["#6B4A2C","#2B2A28","#8A6A44"][i];c.fillRect(0,-W*.007,W*.42,W*.014);c.fillStyle="#B7B2A8";c.fillRect(W*.42,-W*.009,W*.05,W*.018);c.fillStyle=pal[(i+1)%pal.length];c.beginPath();c.moveTo(W*.47,-W*.009);c.lineTo(W*.52,0);c.lineTo(W*.47,W*.009);c.fill();c.restore();}
    c.save();c.translate(W*.8,H*.8);c.rotate(.3);c.shadowColor="rgba(0,0,0,.3)";c.shadowBlur=10;c.shadowOffsetY=4;c.fillStyle="#D8D2C6";c.fillRect(-W*.12,-H*.09,W*.24,H*.18);c.restore();
    c.save();c.translate(W*.8,H*.8);c.rotate(.3);c.strokeStyle="rgba(0,0,0,.12)";c.lineWidth=2;for(let i=-2;i<=2;i++){c.beginPath();c.moveTo(-W*.12,i*H*.03);c.lineTo(W*.12,i*H*.035);c.stroke();}
    for(let i=0;i<5;i++){c.fillStyle=pal[i%pal.length];c.globalAlpha=.55;c.beginPath();c.ellipse((r()-.5)*W*.18,(r()-.5)*H*.12,W*.02,W*.012,r()*3,0,7);c.fill();}c.globalAlpha=1;c.restore();
    light(c,W,H,true);finish(c,W,H,r,true);return;
  }
  const floorY=H*(kind==="casa"?.74:.78);
  wall(c,W,H,r,kind==="galeria"?"branco":kind==="casa"?"quente":"concreto",floorY);floor(c,W,H,floorY,kind==="casa"?"madeira":kind==="galeria"?"claro":"cimento");
  if(kind==="parede"){
    const art=artCanvas(v.art,L),aw=Math.min(W*.5,floorY*.78*art.width/art.height),ah=aw*art.height/art.width;
    const ax=W*(.42+(r()-.5)*.08)-aw/2,ay=Math.max(H*.06,floorY-ah-H*.12);hang(c,art,ax,ay,aw);
    light(c,W,H,true);person(c,W*(.5+(r()<.5?-.16:.18)),H*.97,H*.66,{...who,view:"back",arm:v.arm||"down"},true);
  }else if(kind==="cavalete"){
    const art=artCanvas(v.art,L),aw=W*.34,ah=aw*art.height/art.width,ax=W*.2,ay=Math.min(floorY-ah-H*.1,H*.16);
    c.strokeStyle="#5A3F28";c.lineWidth=W*.012;c.lineCap="round";c.beginPath();c.moveTo(ax+aw*.5,ay-H*.05);c.lineTo(ax+aw*.5,H*.93);c.moveTo(ax+aw*.15,ay+ah);c.lineTo(ax-aw*.05,H*.95);c.moveTo(ax+aw*.85,ay+ah);c.lineTo(ax+aw*1.05,H*.95);c.stroke();
    hang(c,art,ax,ay,aw,{part:v.part??.62,seed:v.art.seed});c.fillStyle="#5A3F28";c.fillRect(ax-aw*.04,ay+ah,aw*1.08,H*.018);
    const tx=W*.78,ty=floorY+H*.02;c.fillStyle="#3A3632";c.fillRect(tx-W*.1,ty-H*.2,W*.2,H*.02);c.fillRect(tx-W*.09,ty-H*.18,W*.012,H*.2);c.fillRect(tx+W*.08,ty-H*.18,W*.012,H*.2);
    const pal=(v.art.p&&v.art.p.length?v.art.p:PALETTES[v.art.g]?.[0])||["#333"];
    for(let i=0;i<4;i++){c.fillStyle=i%2?"#CFC8BC":"#9EA39F";const jx=tx-W*.08+i*W*.045;c.fillRect(jx,ty-H*.27,W*.03,H*.07);c.fillStyle=pal[i%pal.length];c.fillRect(jx,ty-H*.27,W*.03,H*.02);}
    light(c,W,H,true);person(c,W*.6,H*.97,H*.7,{...who,view:"side",dir:-1,arm:"brush"},true);
  }else if(kind==="galeria"){
    const arts=(v.arts||[v.art]).slice(0,3).map((a)=>artCanvas(a,Math.round(L*.6)));const n=arts.length,gap=W/(n+1);
    arts.forEach((a,i)=>{const aw=Math.min(W*.24,floorY*.42*a.width/a.height);hang(c,a,gap*(i+1)-aw/2,floorY*.52-aw*a.height/a.width/2,aw);});
    c.fillStyle="rgba(255,255,255,.5)";for(let i=0;i<n;i++){c.beginPath();c.ellipse(gap*(i+1),floorY*.08,W*.06,H*.03,0,0,7);c.fill();}
    const ppl=v.people??3;for(let i=0;i<ppl;i++){const pp=PEOPLE[(i*2+(v.who||0))%PEOPLE.length];person(c,W*(.2+i*.3+(r()-.5)*.06),H*(.93-(i%2)*.05),H*(.5-(i%2)*.05),{...pp,view:i===1?"side":"back",dir:i%2?1:-1,arm:i===2?"hip":"down"},true);}
    finish(c,W,H,r,false);return;
  }else if(kind==="casa"){
    const art=artCanvas(v.art,L),aw=Math.min(W*.42,floorY*.5*art.width/art.height),ah=aw*art.height/art.width;hang(c,art,W*.5-aw/2,floorY*.42-ah/2,aw,{frame:v.frame||null});
    const sy=floorY+H*.02;c.save();c.shadowColor="rgba(0,0,0,.35)";c.shadowBlur=30;c.shadowOffsetY=14;c.fillStyle=v.sofa||"#6B6256";c.beginPath();c.roundRect(W*.18,sy-H*.2,W*.64,H*.2,W*.02);c.fill();c.restore();
    c.fillStyle="rgba(0,0,0,.12)";c.fillRect(W*.18,sy-H*.11,W*.64,H*.01);c.fillStyle="rgba(255,255,255,.08)";c.beginPath();c.roundRect(W*.2,sy-H*.25,W*.29,H*.12,W*.02);c.roundRect(W*.51,sy-H*.25,W*.29,H*.12,W*.02);c.fill();
    c.fillStyle="#2F2A24";c.fillRect(W*.86,floorY-H*.36,W*.006,H*.36+H*.02);c.fillStyle="#E9DCC4";c.beginPath();c.moveTo(W*.83,floorY-H*.36);c.lineTo(W*.892,floorY-H*.36);c.lineTo(W*.905,floorY-H*.3);c.lineTo(W*.817,floorY-H*.3);c.fill();
    c.fillStyle="#8C6B52";c.fillRect(W*.06,floorY-H*.06,W*.08,H*.09);for(let i=0;i<14;i++){c.fillStyle=["#3F5236","#55673F","#2E3E29"][i%3];c.beginPath();c.ellipse(W*(.1+(r()-.5)*.08),floorY-H*(.1+r()*.22),W*.02,W*.06,(r()-.5)*1.4,0,7);c.fill();}
    if(v.person!==false)person(c,W*.7,H*.99,H*.62,{...who,view:"back",arm:"hip"},true);
    light(c,W,H,false);
  }
  finish(c,W,H,r,kind!=="galeria");
};
