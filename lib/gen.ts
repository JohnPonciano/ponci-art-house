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
  mix:[["#B19878","#EDE7DA","#D5CEC0","#C9BFAE","#2A2926","#7A3329"]]
};
export const STYLE_NAMES={mono:"Campo",tex:"Matéria",geo:"Geometria",sur:"Paisagem",gest:"Gesto",mix:"Colagem"};

/** Dimensões de renderização (lado maior = 1000px) a partir das medidas em cm, ou da foto. */
export function renderSize(a){
  if(a.img_w&&a.img_h)return {W:a.img_w,H:a.img_h};
  const L=1000;return {W:a.w>=a.h?L:Math.round(L*a.w/a.h),H:a.h>=a.w?L:Math.round(L*a.h/a.w)};
}
const cache=new Map();
/** dataURL JPEG da composição generativa da obra (cacheado). */
export function generate(a){
  const gen=a.gen||{};const g=GEN[gen.g]?gen.g:"mono";const {W,H}=renderSize({h:a.h,w:a.w});
  const key=[g,gen.seed,W,H,gen.v,(gen.p||[]).join()].join("|");
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
