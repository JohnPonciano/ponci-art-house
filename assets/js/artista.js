/* PONCI · Rede privada — Área do artista */
(function(){
"use strict";
const {icon,esc,$,$$,pad,brl,dims,dimsIn,dateBR,parseMoney,CAT,STATUS,PSTATUS,STAGES,tag,PALETTES,STYLE_NAMES,
  artImg,hydrate,fit,slab,secHead,pageHead,field,V,bindValidation,toast,chrome,router,gate}=P;
const S=Store;
const ui={filter:"all",pfilter:"open",counter:null,confirm:null,draft:null};
const me=()=>{const id=S.session().artist;return id?S.artist(id):null;};

/* ---------- Peças ---------- */
function workCard(a){
  return `<article class="card"><a class="card-link" href="#obra-${a.id}">
    <div class="card-top"><span>${a.no}</span><span>${a.year}</span></div>
    <div class="card-img">${artImg(a)}</div>
    <div class="card-cap">
      <h3 class="card-title">${esc(a.title)}</h3>
      <p class="card-meta first">${esc(a.medium)}</p>
      <p class="card-meta">${dims(a)}${a.ed?" · "+esc(a.ed):""}</p>
      ${tag(STATUS,a.status)}
    </div>
    <div class="card-foot"><span class="price">${brl(a.price)}<small>Seu preço</small></span><span class="go">Gerenciar ${icon("right")}</span></div>
  </a></article>`;
}
function buyerLabel(p){const b=S.buyer(p.buyerId);return `${p.buyerId} · ${esc(b?b.city:"")}`;}
function propRow(p){
  const a=S.work(p.workId);if(!a)return "";
  const cur=S.current(p),last=S.last(p),diff=Math.round((cur/a.price-1)*100);
  let act;
  if(p.status==="open"){
    if(ui.counter===p.id){
      act=`<form class="inline-form" data-counter="${p.id}"><label class="lab" for="cv-${p.id}">Seu valor</label>
        <input id="cv-${p.id}" name="amount" inputmode="numeric" value="${brl(Math.round((cur+a.price)/2/500)*500)}" required>
        <input name="msg" placeholder="Mensagem (opcional)" aria-label="Mensagem">
        <button class="btn sm" type="submit">Enviar ${icon("swap")}</button><button class="linkbtn" type="button" data-act="cancel">Cancelar</button></form>`;
    }else if(ui.confirm===p.id){
      act=`<span class="hint">Aceitar ${brl(cur)}? A obra será reservada e as outras propostas encerradas.</span>
        <button class="btn sm ocre" type="button" data-act="accept" data-p="${p.id}">Confirmar ${icon("check")}</button><button class="linkbtn" type="button" data-act="cancel">Cancelar</button>`;
    }else{
      act=`<button class="btn sm" type="button" data-act="ask-accept" data-p="${p.id}">Aceitar ${icon("check")}</button>
        <button class="btn sm ghost" type="button" data-act="counter" data-p="${p.id}">Contrapropor ${icon("swap")}</button>
        <button class="linkbtn" type="button" data-act="decline" data-p="${p.id}">Recusar</button>`;
    }
  }else{
    act=tag(PSTATUS,p.status)+(p.status==="countered"?`<span class="hint">Aguardando o colecionador.</span>`:"")+(p.status==="accepted"?`<a class="linkbtn" href="#vendas">Ver venda</a>`:"");
  }
  const msg=last.msg?`“${esc(last.msg)}”`:"";
  return `<div class="lrow">
    <span class="l-ref">${p.id}<small>${dateBR(p.createdAt)}</small>${p.status==="open"?"":""}</span>
    <a class="l-thumb" href="#obra-${a.id}" aria-hidden="true" tabindex="-1">${artImg(a)}</a>
    <span class="l-main"><a href="#obra-${a.id}"><b>${esc(a.title)}</b></a><span>${buyerLabel(p)}</span><span>${last.by==="artist"?"Você respondeu":"Colecionador"} · ${dateBR(last.at)}</span></span>
    <span class="l-msg">${msg}</span>
    <span class="l-val">${brl(cur)}<small>${last.by==="artist"?"Sua contraproposta":"Oferta"}</small><small>${diff>=0?"+":""}${diff}% do preço (${brl(a.price)})</small></span>
    <span class="l-act">${act}</span>
  </div>`;
}
function ledger(rows,emptyT,emptyB){
  if(!rows.length)return `<div class="empty sm"><p>${emptyT}</p><p style="color:var(--muted)">${emptyB}</p></div>`;
  return `<div class="ledger"><div class="lrow head"><span>Ref.</span><span>Obra</span><span></span><span>Mensagem</span><span>Valor</span><span>Ação</span></div>${rows.join("")}</div>`;
}
function orderBlock(o,showBuyer=true){
  const a=S.work(o.workId),b=S.buyer(o.buyerId);if(!a)return "";
  const net=Math.round(o.amount*.85);
  return `<article class="order">
    <div class="order-art">${slab(a,null,false)}</div>
    <div class="order-info">
      <div class="top"><div><b>${esc(a.title)}</b><span>${o.id} · ${dateBR(o.createdAt)} · ${o.via==="direct"?"Compra pelo preço":"Proposta aceita"}</span>${showBuyer?`<span>Colecionador: ${esc(b.name)} (${o.buyerId}) · ${esc(b.city)}</span>`:""}</div>
        <div class="price" style="text-align:right">${brl(o.amount)}<small>Líquido para você: ${brl(net)}</small></div></div>
      <ol class="track">${STAGES.map((s,i)=>`<li class="${i<o.stage||o.stage===3?"done":""} ${i===o.stage&&o.stage<3?"now":""}"><i>${pad(i+1)}</i><b>${s[0]}</b><span class="hint" style="color:inherit;opacity:.8">${s[1]}</span></li>`).join("")}</ol>
    </div>
  </article>`;
}

/* ---------- Views ---------- */
function vPainel(u){
  const ws=S.worksBy(u.id),ps=S.proposalsForArtist(u.id),os=S.ordersForArtist(u.id);
  const open=ps.filter(p=>p.status==="open");
  const done=os.filter(o=>o.stage===3).reduce((s,o)=>s+o.amount*.85,0),cust=os.filter(o=>o.stage<3).reduce((s,o)=>s+o.amount*.85,0);
  const c=k=>ws.filter(a=>a.status===k).length;
  const first=u.name.split(" ")[0];
  return {title:"PONCI — Ateliê",html:`<div class="wrap">
    ${pageHead("Ateliê","Área do artista",`Olá, ${esc(first)}. ${open.length?`<em>${open.length===1?"Uma proposta aguarda":open.length+" propostas aguardam"}</em> a sua resposta.`:"Nenhuma proposta pendente no momento."}`,`${esc(u.city)}<br>Membro desde ${u.since}`)}
    <div class="stats" style="--n:5">
      <a href="#obras" data-f="published"><span class="lab">Publicadas</span><b>${pad(c("published"))}</b></a>
      <a href="#obras" data-f="review"><span class="lab">Em curadoria</span><b>${pad(c("review"))}</b></a>
      <a href="#propostas"><span class="lab">Propostas abertas</span><b class="${open.length?"ok-c":""}">${pad(open.length)}</b></a>
      <a href="#vendas"><span class="lab">Em custódia</span><b class="money">${brl(cust)}</b></a>
      <a href="#vendas"><span class="lab">Recebido (líquido)</span><b class="money">${brl(done)}</b></a>
    </div>
    <section class="sub-sec" aria-labelledby="p-t">
      ${secHead("01","Propostas","Aguardando <em>sua resposta</em>","p-t","#propostas","Todas as propostas")}
      ${ledger(open.slice(0,4).map(propRow),"Nada pendente.","Quando um colecionador fizer uma proposta, ela aparece aqui.")}
    </section>
    <section class="sub-sec" aria-labelledby="w-t">
      ${secHead("02","Obras","No seu <em>ateliê</em>","w-t","#nova","Cadastrar nova obra")}
      ${ws.length?`<div class="board">${ws.slice().sort((a,b)=>b.createdAt-a.createdAt).slice(0,6).map(workCard).join("")}</div>`:`<div class="empty sm"><p>Nenhuma obra ainda.</p><a class="btn" href="#nova">Cadastrar primeira obra ${icon("plus")}</a></div>`}
    </section>
  </div>`};
}

function vObras(u){
  const ws=S.worksBy(u.id).sort((a,b)=>b.createdAt-a.createdAt);
  const list=ws.filter(a=>ui.filter==="all"||a.status===ui.filter);
  const chip=(v,l)=>`<button type="button" class="chip" data-wf="${v}" aria-pressed="${ui.filter===v}">${l} <span class="count">${v==="all"?ws.length:ws.filter(a=>a.status===v).length}</span></button>`;
  return {title:"PONCI — Minhas obras",html:`<div class="wrap">
    ${pageHead("Obras","Seu catálogo","Toda obra passa pela curadoria antes de aparecer na vitrine da rede. Você pode ajustar o preço enquanto ela estiver publicada.",`${ws.length} obras`)}
    <div class="filters"><div class="frow" role="group" aria-label="Status"><span class="lab">Status</span>${chip("all","Todas")}${Object.keys(STATUS).map(k=>chip(k,STATUS[k][0])).join("")}</div></div>
    <div class="results-meta"><span>${list.length} ${list.length===1?"obra":"obras"}</span><a class="btn sm" href="#nova">Nova obra ${icon("plus")}</a></div>
    ${list.length?`<div class="board cat">${list.map(workCard).join("")}</div>`:`<div class="empty"><p>Nenhuma obra com este status.</p><button class="btn ghost" type="button" data-wf="all">Ver todas ${icon("x")}</button></div>`}
  </div>`};
}

function vObra(u,id){
  const a=S.work(id);if(!a||a.artist!==u.id)return vNF();
  const ps=S.proposalsForArtist(u.id).filter(p=>p.workId===a.id),o=S.ordersForArtist(u.id).find(x=>x.workId===a.id);
  let actions="";
  if(a.status==="review")actions=`<div class="d-buy"><span class="price">${brl(a.price)}<small>Preço proposto</small></span>
      <p class="notice">${icon("info")}<span>A curadoria revisa documentação e imagem em até 3 dias úteis. Até lá, a obra não aparece para colecionadores.</span></p>
      <button class="btn" type="button" data-act="approve" data-w="${a.id}">Simular aprovação da curadoria ${icon("check")}</button>
      <button class="linkbtn" type="button" data-act="withdraw" data-w="${a.id}" style="align-self:flex-start">Retirar envio</button></div>`;
  else if(a.status==="published")actions=`<form class="d-buy offer" id="price-f" novalidate>
      <div class="row">${field({name:"price",label:"Preço na vitrine",value:brl(a.price),attrs:'inputmode="numeric"'})}<button class="btn" type="submit">Salvar</button></div>
      <p class="hint">Comissão PONCI de 15%. Você recebe ${brl(a.price*.85)} pelo preço atual.</p>
      <button class="linkbtn" type="button" data-act="withdraw" data-w="${a.id}" style="align-self:flex-start">Retirar da vitrine</button></form>`;
  else actions=`<div class="d-buy"><span class="price">${brl(o?o.amount:a.price)}<small>${a.status==="sold"?"Vendida":"Reservada"}${o?" · "+o.id:""}</small></span>${o?`<a class="btn ghost" href="#vendas">Acompanhar venda ${icon("right")}</a>`:""}</div>`;
  return {title:`${a.title} — PONCI`,html:`<div class="wrap">
    <nav class="crumbs" aria-label="Trilha"><a href="#painel">Ateliê</a><span aria-hidden="true">/</span><a href="#obras">Obras</a><span aria-hidden="true">/</span><span aria-current="page">${esc(a.title)}</span></nav>
    <article class="detail">
      <div class="detail-media">${slab(a,null,true,STATUS[a.status][0])}</div>
      <div class="detail-info">
        <div class="d-no"><span>${a.no}</span>${tag(STATUS,a.status)}</div>
        <div><h1 class="d-title">${esc(a.title)}</h1></div>
        <dl class="spec">
          <dt>Ano</dt><dd>${a.year}</dd>
          <dt>Técnica</dt><dd>${esc(a.medium)}</dd>
          <dt>Dimensões</dt><dd>${dims(a)}<small>${dimsIn(a)}</small></dd>
          <dt>Edição</dt><dd>${a.ed?esc(a.ed):"Obra única"}</dd>
          <dt>Categoria</dt><dd>${CAT[a.cat]}</dd>
          <dt>Cadastro</dt><dd>${dateBR(a.createdAt)}</dd>
        </dl>
        ${a.d&&a.d.length?`<div class="d-desc">${a.d.map(p=>`<p>${esc(p)}</p>`).join("")}</div>`:""}
        ${actions}
      </div>
    </article>
    <section class="sub-sec" aria-labelledby="op-t">
      ${secHead("—","Propostas para esta obra",ps.length?`${ps.length} ${ps.length===1?"proposta":"propostas"}`:"Nenhuma <em>ainda</em>","op-t","#propostas","Todas as propostas")}
      ${ps.length?ledger(ps.map(propRow)):""}
    </section>
  </div>`,after(){
    const f=$("#price-f");if(!f)return;
    const val=bindValidation(f,{price:V.money(500)});
    f.addEventListener("submit",e=>{e.preventDefault();if(!val.check())return;S.updatePrice(a.id,parseMoney(f.elements.price.value));toast("Preço atualizado na vitrine.");render(false);});
  }};
}

function vNova(u){
  const d=ui.draft=ui.draft||{g:"mono",pi:0,seed:Math.floor(Math.random()*9000)+100,img:null};
  const opts=Object.keys(CAT).map(k=>`<option value="${k}">${CAT[k]}</option>`).join("");
  return {title:"PONCI — Nova obra",html:`<div class="wrap">
    <header class="page-head">
      <p class="lab" style="color:var(--ink)">Ateliê / Nova obra</p>
      <h1 class="acq-title">Cadastrar <em>nova obra.</em></h1>
      <div class="page-strip" style="margin-top:clamp(24px,3vw,40px)"><p class="lab">Curadoria</p><p class="intro">Preencha como uma galeria documentaria a obra. Ela vai para a curadoria e, aprovada, aparece na vitrine fechada da rede.</p><p class="count">Comissão 15%<br>Sem taxa de cadastro</p></div>
    </header>
    <section class="acq" aria-labelledby="nf-t" style="margin-top:clamp(36px,5vw,64px)">
      <div class="acq-aside"><p class="lab">Prévia</p><h2 id="nf-t">Como a obra aparecerá.</h2>
        <p>Envie uma fotografia da obra. Sem foto, o protótipo gera uma composição de demonstração no estilo escolhido.</p>
        <div class="preview-slab" id="preview" aria-live="polite"></div></div>
      <div class="acq-main">
        <form class="form" id="work-f" novalidate>
          ${field({name:"title",label:"Título",ph:"Ex.: Campo de Anil III"})}
          <div class="two">
            ${field({name:"year",label:"Ano",type:"number",value:"2026",attrs:'inputmode="numeric" min="1950" max="2026"'})}
            ${field({name:"cat",label:"Categoria",type:"select",options:opts})}
          </div>
          ${field({name:"medium",label:"Técnica",ph:"Ex.: Óleo sobre linho"})}
          <div class="three">
            ${field({name:"h",label:"Altura (cm)",type:"number",value:"120",attrs:'inputmode="decimal" min="5" max="600"'})}
            ${field({name:"w",label:"Largura (cm)",type:"number",value:"100",attrs:'inputmode="decimal" min="5" max="600"'})}
            ${field({name:"ed",label:"Edição",ph:"Obra única",req:false})}
          </div>
          ${field({name:"price",label:"Preço",ph:"R$ 0",attrs:'inputmode="numeric"',aside:"Você recebe —"})}
          ${field({name:"desc",label:"Descrição",type:"textarea",rows:4,ph:"O que a obra investiga, como foi feita, como se comporta na luz…",aside:"0 / 40+"})}
          <div class="field"><span class="lab">Imagem</span>
            <label class="drop" id="drop"><input type="file" accept="image/*" id="file"><b>${icon("upload")} ${d.img?"Trocar fotografia":"Enviar fotografia da obra"}</b><span>${d.img?"Imagem carregada. Ela substitui a composição gerada.":"JPG ou PNG. A imagem é reduzida e guardada só neste navegador."}</span></label>
            ${d.img?`<button type="button" class="linkbtn" data-act="clear-img" style="align-self:flex-start">Remover imagem</button>`:`
            <span class="lab" style="margin-top:8px">Ou estilo da composição de demonstração</span>
            <div class="styles" role="group" aria-label="Estilo">${Object.keys(STYLE_NAMES).map(k=>`<button type="button" data-style="${k}" aria-pressed="${d.g===k}">${STYLE_NAMES[k]}</button>`).join("")}</div>
            <button type="button" class="linkbtn" data-act="reseed" style="align-self:flex-start;margin-top:4px">Gerar outra variação</button>`}
          </div>
          <p class="form-status" role="alert"></p>
          <div class="form-actions"><button class="btn" type="submit" id="submit">Enviar para curadoria ${icon("right")}</button><p>Protótipo: a obra fica salva apenas neste navegador.</p></div>
        </form>
      </div>
    </section></div>`,after(){bindNova(u);}};
}
function draftWork(f){
  const d=ui.draft,v=n=>f?f.elements[n].value:"";
  const h=Math.max(5,+v("h")||120),w=Math.max(5,+v("w")||100);
  return {id:"draft",title:v("title").trim()||"Sem título",date:String(+v("year")||2026),h:Math.round(h),w:Math.round(w),g:d.g,seed:d.seed,
    p:PALETTES[d.g][d.pi%PALETTES[d.g].length],v:d.g==="sur"?(d.seed%2?"sphere":"door"):undefined,img:d.img,imgW:d.imgW,imgH:d.imgH,year:+v("year")||2026};
}
function bindNova(u){
  const f=$("#work-f");
  const prev=()=>{const a=draftWork(f);$("#preview").innerHTML=slab(a,null,true,"Prévia · Em curadoria");hydrate($("#preview"));};
  let pt;const later=()=>{clearTimeout(pt);pt=setTimeout(prev,350);};
  prev();
  const val=bindValidation(f,{
    title:V.req("Informe o título da obra."),
    year:V.range(1950,2026,"Informe um ano entre 1950 e 2026."),
    medium:V.req("Informe a técnica, como “Óleo sobre tela”."),
    h:V.range(5,600,"Entre 5 e 600 cm."),w:V.range(5,600,"Entre 5 e 600 cm."),
    price:V.money(500),
    desc:V.min(40,n=>`Escreva pelo menos 40 caracteres (${n} até agora).`)
  },e=>{
    const n=e.target.name;
    if(n==="price"){const p=parseMoney(e.target.value);$("#c-price").textContent=p?"Você recebe "+brl(p*.85):"Você recebe —";}
    if(n==="desc")$("#c-desc").textContent=`${e.target.value.trim().length} / 40+`;
    if(["title","year","h","w"].includes(n))later();
  });
  f.elements.price.addEventListener("blur",e=>{const p=parseMoney(e.target.value);if(p)e.target.value=brl(p);});
  $$("[data-style]",f).forEach(b=>b.addEventListener("click",()=>{ui.draft.g=b.dataset.style;ui.draft.pi=Math.floor(Math.random()*9);
    $$("[data-style]",f).forEach(x=>x.setAttribute("aria-pressed",String(x===b)));prev();}));
  $("[data-act=reseed]",f)?.addEventListener("click",()=>{ui.draft.seed=Math.floor(Math.random()*9000)+100;ui.draft.pi++;prev();});
  const keep=()=>{const o={};[...f.elements].forEach(el=>{if(el.name)o[el.name]=el.value;});return o;};
  const restore=o=>{Object.keys(o).forEach(k=>{if(f.elements[k])f.elements[k].value=o[k];});};
  $("[data-act=clear-img]",f)?.addEventListener("click",()=>{const o=keep();ui.draft.img=null;render(false);restore(o);$("#work-f [data-act=reseed]")&&prevAfter();});
  function prevAfter(){const a=draftWork($("#work-f"));$("#preview").innerHTML=slab(a,null,true,"Prévia · Em curadoria");hydrate($("#preview"));}
  const file=$("#file"),drop=$("#drop");
  const take=fl=>{if(!fl||!/^image\//.test(fl.type))return;const rd=new FileReader();rd.onload=()=>{const im=new Image();im.onload=()=>{
      const M=1100,k=Math.min(1,M/Math.max(im.width,im.height)),cv=document.createElement("canvas");cv.width=Math.round(im.width*k);cv.height=Math.round(im.height*k);
      cv.getContext("2d").drawImage(im,0,0,cv.width,cv.height);
      const o=keep();ui.draft.img=cv.toDataURL("image/jpeg",.82);ui.draft.imgW=cv.width;ui.draft.imgH=cv.height;render(false);restore(o);prevAfter();toast("Imagem carregada.");};im.src=rd.result;};rd.readAsDataURL(fl);};
  file.addEventListener("change",()=>take(file.files[0]));
  ["dragenter","dragover"].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.add("over");}));
  ["dragleave","drop"].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.remove("over");}));
  drop.addEventListener("drop",e=>take(e.dataTransfer.files[0]));
  f.addEventListener("submit",e=>{
    e.preventDefault();if(!val.check())return;
    const v=val.values(),dw=draftWork(f);
    const work=S.addWork(u.id,{title:v.title.trim(),date:String(v.year),h:dw.h,w:dw.w,cat:v.cat,medium:v.medium.trim(),ed:v.ed.trim()||undefined,
      price:parseMoney(v.price),d:v.desc.trim().split(/\n+/).filter(Boolean),g:dw.g,seed:dw.seed,p:dw.p,v:dw.v,img:dw.img||undefined,imgW:dw.imgW,imgH:dw.imgH});
    ui.draft=null;toast("Obra enviada para a curadoria.");location.hash="obra-"+work.id;
  });
}

function vPropostas(u){
  const ps=S.proposalsForArtist(u.id);
  const list=ps.filter(p=>ui.pfilter==="all"||(ui.pfilter==="open"?p.status==="open"||p.status==="countered":p.status===ui.pfilter));
  const chip=(v,l,n)=>`<button type="button" class="chip" data-pf="${v}" aria-pressed="${ui.pfilter===v}">${l} <span class="count">${n}</span></button>`;
  return {title:"PONCI — Propostas",html:`<div class="wrap">
    ${pageHead("Propostas","Negociação privada","Os colecionadores aparecem pelo código de membro verificado. O nome é revelado às duas partes quando a venda é fechada.",`${ps.filter(p=>p.status==="open").length} aguardando você`)}
    <div class="filters"><div class="frow" role="group" aria-label="Situação"><span class="lab">Situação</span>
      ${chip("open","Em negociação",ps.filter(p=>p.status==="open"||p.status==="countered").length)}${chip("accepted","Aceitas",ps.filter(p=>p.status==="accepted").length)}${chip("declined","Recusadas",ps.filter(p=>p.status==="declined").length)}${chip("all","Todas",ps.length)}</div></div>
    <div style="margin-top:clamp(24px,3vw,40px);margin-bottom:clamp(72px,10vw,140px)">${ledger(list.map(propRow),"Nenhuma proposta aqui.","Mude o filtro para ver o histórico.")}</div>
  </div>`};
}

function vVendas(u){
  const os=S.ordersForArtist(u.id);
  const gross=os.reduce((s,o)=>s+o.amount,0),cust=os.filter(o=>o.stage<3).reduce((s,o)=>s+o.amount*.85,0),done=os.filter(o=>o.stage===3).reduce((s,o)=>s+o.amount*.85,0);
  return {title:"PONCI — Vendas",html:`<div class="wrap">
    ${pageHead("Vendas","Custódia e repasse","O pagamento do colecionador fica retido pela PONCI até a entrega. O repasse, já descontada a comissão de 15%, acontece em até 7 dias.",`${os.length} ${os.length===1?"venda":"vendas"}`)}
    <div class="stats" style="--n:4">
      <div><span class="lab">Vendido (bruto)</span><b class="money">${brl(gross)}</b></div>
      <div><span class="lab">Comissão PONCI</span><b class="money">${brl(gross*.15)}</b></div>
      <div><span class="lab">Em custódia</span><b class="money ok-c">${brl(cust)}</b></div>
      <div><span class="lab">Repassado</span><b class="money">${brl(done)}</b></div>
    </div>
    <div style="margin:clamp(28px,4vw,48px) 0 clamp(72px,10vw,140px);border-top:var(--b)">${os.length?os.map(o=>orderBlock(o)).join(""):`<div class="empty sm" style="border-top:0"><p>Nenhuma venda ainda.</p><p style="color:var(--muted)">Quando você aceitar uma proposta ou alguém reservar pelo preço, a venda aparece aqui.</p></div>`}</div>
  </div>`};
}

function vPerfil(u){
  return {title:"PONCI — Perfil",html:`<div class="wrap">
    ${pageHead("Perfil","Artista membro","O perfil aparece para colecionadores ao lado das suas obras. Dados bancários e documentos ficam fora deste protótipo.",`${esc(u.id)}<br>Membro desde ${u.since}`)}
    <section class="acq" aria-labelledby="pf-t" style="margin-top:clamp(36px,5vw,64px)">
      <div class="acq-aside"><p class="lab">Membro</p><h2 id="pf-t">${esc(u.name)}</h2><p>${esc(u.practice)} · ${esc(u.city)}</p>
        <p class="notice">${icon("shield")}<span>Identidade verificada pela PONCI. Para mudar o nome artístico, fale com a curadoria.</span></p>
        <button class="linkbtn" type="button" data-act="reset" style="align-self:flex-start">Restaurar dados de demonstração</button></div>
      <div class="acq-main"><form class="form" id="prof-f" novalidate>
        <div class="two">${field({name:"city",label:"Cidade / UF",value:u.city})}${field({name:"practice",label:"Linguagem",value:u.practice})}</div>
        ${field({name:"email",label:"E-mail",type:"email",value:u.email})}
        ${field({name:"bio",label:"Sobre a sua prática",type:"textarea",value:u.bio,rows:5})}
        <p class="form-status" role="alert"></p>
        <div class="form-actions"><button class="btn" type="submit">Salvar perfil ${icon("check")}</button></div>
      </form></div>
    </section></div>`,after(){
      const f=$("#prof-f");const val=bindValidation(f,{city:V.req("Informe sua cidade."),practice:V.req("Informe sua linguagem."),email:V.email,bio:V.min(20,n=>`Escreva pelo menos 20 caracteres (${n} até agora).`)});
      f.addEventListener("submit",e=>{e.preventDefault();if(!val.check())return;S.saveProfile(u.id,val.values());toast("Perfil salvo.");render(false);});
    }};
}
function vNF(){return {title:"PONCI",html:`<div class="wrap nf"><p class="lab">404</p><h1>Esta página não existe.</h1><a class="btn" href="#painel">Voltar ao ateliê ${icon("right")}</a></div>`};}

/* ---------- Roteamento ---------- */
const NAV=u=>{const n=S.proposalsForArtist(u.id).filter(p=>p.status==="open").length;
  return [["#painel","Ateliê"],["#obras","Obras"],["#nova","Nova obra"],["#propostas","Propostas",n||""],["#vendas","Vendas"],["#perfil","Perfil"]];};
function current(){const h=location.hash.slice(1)||"painel";return "#"+(h.startsWith("obra-")?"obras":h);}
const render=router({
  chrome(){
    const u=me();
    chrome({nav:u?NAV(u):[["index.html","A rede"],["comprador.html","Sou colecionador"]],current:current(),home:"index.html",
      user:u?{name:u.name,role:"Artista"}:null,tagText:"Área do artista",band:u?["Área do artista · "+u.name,"Conta de demonstração"]:null});
  },
  resolve(h){
    const u=me();
    if(!u)return gate({title:"Artistas",label:"Área do artista",intro:"Seu ateliê dentro da rede: cadastre obras, acompanhe a curadoria, responda propostas e veja seus repasses.",
      heading:"Ateliê <em>privado.</em>",sub:"Entre com o e-mail cadastrado e o código de convite que você recebeu da curadoria.",
      art:S.work("campo-de-anil-i"),demo:{id:"helena-vasques",name:"Helena Vasques"},onEnter(id){S.login("artist",id);toast("Bem-vinda ao seu ateliê.");if(location.hash&&location.hash!=="#painel")render(true);else location.hash="painel";}});
    if(!h||h==="painel")return vPainel(u);
    if(h==="obras")return vObras(u);
    if(h.startsWith("obra-"))return vObra(u,h.slice(5));
    if(h==="nova")return vNova(u);
    if(h==="propostas")return vPropostas(u);
    if(h==="vendas")return vVendas(u);
    if(h==="perfil")return vPerfil(u);
    return vNF();
  }
});

/* ---------- Eventos ---------- */
document.addEventListener("click",e=>{
  const t=e.target.closest("[data-act],[data-wf],[data-pf],[data-logout],.stats a[data-f]");if(!t)return;
  if(t.hasAttribute("data-logout")){S.logout("artist");P.closeMenu(false);ui.draft=null;history.replaceState(null,"",location.pathname);render(true);toast("Você saiu da área do artista.");return;}
  if(t.dataset.wf){ui.filter=t.dataset.wf;render(false);return;}
  if(t.dataset.pf){ui.pfilter=t.dataset.pf;render(false);return;}
  if(t.dataset.f){ui.filter=t.dataset.f;return;}
  const act=t.dataset.act,pid=t.dataset.p;
  if(act==="ask-accept"){ui.confirm=pid;ui.counter=null;render(false);$(`[data-act=accept][data-p="${pid}"]`)?.focus();return;}
  if(act==="accept"){ui.confirm=null;const o=S.respond(pid,"artist","accept");toast(o?"Proposta aceita. A obra foi reservada.":"Não foi possível reservar: a obra não está mais disponível.");render(false);return;}
  if(act==="counter"){ui.counter=pid;ui.confirm=null;render(false);$(`#cv-${pid}`)?.focus();return;}
  if(act==="cancel"){ui.counter=ui.confirm=null;render(false);return;}
  if(act==="decline"){S.respond(pid,"artist","decline",0,"");toast("Proposta recusada.");render(false);return;}
  if(act==="approve"){S.approveWork(t.dataset.w);toast("Obra aprovada e publicada na vitrine.");render(false);return;}
  if(act==="withdraw"){S.withdrawWork(t.dataset.w);toast("Obra retirada.");location.hash="obras";return;}
  if(act==="reset"){S.reset();toast("Dados de demonstração restaurados.");render(false);return;}
});
document.addEventListener("submit",e=>{
  const f=e.target.closest("[data-counter]");if(!f)return;e.preventDefault();
  const amt=parseMoney(f.elements.amount.value);if(amt<500){f.elements.amount.focus();toast("Informe um valor válido.");return;}
  S.respond(f.dataset.counter,"artist","counter",amt,f.elements.msg.value.trim());ui.counter=null;toast("Contraproposta enviada.");render(false);
});
S.onChange(()=>{if(!$("#work-f"))render(false);});
render(true);
})();
