/* PONCI · Rede privada — Área do colecionador */
(function(){
"use strict";
const {icon,esc,$,$$,pad,brl,dims,dimsIn,dateBR,parseMoney,CAT,STATUS,PSTATUS,STAGES,tag,
  artImg,hydrate,fit,slab,secHead,pageHead,field,V,bindValidation,toast,chrome,router,gate}=P;
const S=Store;
const ui={cat:"all",artist:"all",price:"all",sort:"new",confirmBuy:null,confirmCounter:null};
const me=()=>{const id=S.session().buyer;return id?S.buyer(id):null;};
const PRICE={all:["Todas",0,Infinity],a:["Até R$ 20 mil",0,20000],b:["R$ 20 mil a 60 mil",20000,60000],c:["Acima de R$ 60 mil",60000,Infinity]};

/* ---------- Peças ---------- */
function card(u,a){
  const ar=S.artist(a.artist),fav=S.favs(u.id).includes(a.id);
  return `<article class="card"><a class="card-link" href="#obra-${a.id}">
    <div class="card-top"><span>${a.no}</span><span>${a.year}</span></div>
    <div class="card-img">${artImg(a)}</div>
    <div class="card-cap">
      <h3 class="card-title">${esc(a.title)}</h3>
      <p class="card-en">${esc(ar.name)}</p>
      <p class="card-meta first">${esc(a.medium)}</p>
      <p class="card-meta">${dims(a)}${a.ed?" · "+esc(a.ed):""}</p>
      ${a.status!=="published"?tag(STATUS,a.status):""}
    </div>
    <div class="card-foot"><span class="price">${brl(a.price)}<small>${a.status==="published"?"Disponível":"Indisponível no momento"}</small></span><span class="go">Ver ${icon("right")}</span></div>
  </a><button type="button" class="fav" data-fav="${a.id}" aria-pressed="${fav}" aria-label="${fav?"Remover dos":"Salvar nos"} favoritos: ${esc(a.title)}">${icon("bookmark")}</button></article>`;
}
function propRow(u,p){
  const a=S.work(p.workId);if(!a)return "";
  const ar=S.artist(a.artist),cur=S.current(p),last=S.last(p);
  let act;
  if(p.status==="countered"){
    act=ui.confirmCounter===p.id
      ?`<span class="hint">Aceitar ${brl(cur)}? A obra fica reservada para você.</span><button class="btn sm ocre" type="button" data-act="accept-counter" data-p="${p.id}">Confirmar ${icon("check")}</button><button class="linkbtn" type="button" data-act="cancel">Cancelar</button>`
      :`${tag(PSTATUS,"countered")}<button class="btn sm" type="button" data-act="ask-counter" data-p="${p.id}">Aceitar ${brl(cur)}</button><a class="btn sm ghost" href="#obra-${a.id}">Nova proposta</a><button class="linkbtn" type="button" data-act="decline-counter" data-p="${p.id}">Recusar</button>`;
  }else if(p.status==="open"){
    act=`${tag(PSTATUS,"open")}<button class="linkbtn" type="button" data-act="withdraw" data-p="${p.id}">Retirar proposta</button>`;
  }else act=tag(PSTATUS,p.status)+(p.status==="accepted"?`<a class="linkbtn" href="#aquisicoes">Ver aquisição</a>`:"");
  return `<div class="lrow">
    <span class="l-ref">${p.id}<small>${dateBR(p.createdAt)}</small></span>
    <a class="l-thumb" href="#obra-${a.id}" aria-hidden="true" tabindex="-1">${artImg(a)}</a>
    <span class="l-main"><a href="#obra-${a.id}"><b>${esc(a.title)}</b></a><span>${esc(ar.name)}</span><span>${last.by==="artist"?"Artista respondeu":last.by==="system"?"Sistema":"Você"} · ${dateBR(last.at)}</span></span>
    <span class="l-msg">${last.msg?`“${esc(last.msg)}”`:""}</span>
    <span class="l-val">${brl(cur)}<small>${last.by==="artist"?"Contraproposta":"Sua oferta"}</small><small>Preço: ${brl(a.price)}</small></span>
    <span class="l-act">${act}</span>
  </div>`;
}
function ledger(rows,t,b){
  if(!rows.length)return `<div class="empty sm"><p>${t}</p><p style="color:var(--muted)">${b}</p></div>`;
  return `<div class="ledger"><div class="lrow head"><span>Ref.</span><span>Obra</span><span></span><span>Mensagem</span><span>Valor</span><span>Situação</span></div>${rows.join("")}</div>`;
}
function orderBlock(o){
  const a=S.work(o.workId);if(!a)return "";const ar=S.artist(a.artist);
  return `<article class="order" id="${o.id}">
    <div class="order-art">${slab(a,null,false)}</div>
    <div class="order-info">
      <div class="top"><div><b>${esc(a.title)}</b><span>${esc(ar.name)} · ${a.year} · ${dims(a)}</span><span>${o.id} · ${dateBR(o.createdAt)} · ${o.via==="direct"?"Reserva pelo preço":"Proposta aceita"}</span></div>
        <div class="price" style="text-align:right">${brl(o.amount)}<small>${o.stage===0?"Aguardando pagamento":o.stage<3?"Em custódia":"Concluída"}</small></div></div>
      <ol class="track">${STAGES.map((s,i)=>`<li class="${i<o.stage||o.stage===3?"done":""} ${i===o.stage&&o.stage<3?"now":""}"><i>${pad(i+1)}</i><b>${s[0]}</b><span class="hint" style="color:inherit;opacity:.8">${s[1]}</span></li>`).join("")}</ol>
      <div class="acts">${o.stage<3
        ?`<button class="btn sm" type="button" data-act="advance" data-o="${o.id}">${["Pagar em custódia","Confirmar envio","Confirmar recebimento"][o.stage]} ${icon("right")}</button><span class="hint">Simulação do protótipo: avança uma etapa.</span>`
        :`<span class="tag t-accepted">Certificado PNC-CA-${o.id.slice(4)}</span><span class="hint">Procedência registrada na rede.</span>`}</div>
    </div>
  </article>`;
}

/* ---------- Views ---------- */
function filtered(){
  const [,lo,hi]=PRICE[ui.price];
  let l=S.catalogue().filter(a=>(ui.cat==="all"||a.cat===ui.cat)&&(ui.artist==="all"||a.artist===ui.artist)&&a.price>=lo&&a.price<hi);
  const by={new:(x,y)=>y.date.localeCompare(x.date),low:(x,y)=>x.price-y.price,high:(x,y)=>y.price-x.price}[ui.sort];
  return l.sort((x,y)=>(x.status==="published"?0:1)-(y.status==="published"?0:1)||by(x,y));
}
function vAcervo(u){
  const all=S.catalogue(),list=filtered(),first=u.name.split(" ")[0];
  const chip=(k,v,l)=>`<button type="button" class="chip" data-k="${k}" data-v="${v}" aria-pressed="${ui[k]===v}">${l}</button>`;
  const any=ui.cat!=="all"||ui.artist!=="all"||ui.price!=="all";
  return {title:"PONCI — Acervo",html:`<div class="wrap">
    ${pageHead("Acervo","Somente membros",`Olá, ${esc(first)}. Estas obras só estão disponíveis dentro da rede. Reserve pelo preço ou envie uma proposta diretamente à artista.`,`${all.filter(a=>a.status==="published").length} disponíveis<br>${S.artists.length} artistas`)}
    <div class="filters" role="region" aria-label="Filtros">
      <div class="frow" role="group" aria-label="Categoria"><span class="lab">Categoria</span>${chip("cat","all","Todas")}${Object.keys(CAT).map(k=>chip("cat",k,CAT[k])).join("")}</div>
      <div class="frow" role="group" aria-label="Artista"><span class="lab">Artista</span>${chip("artist","all","Todos")}${S.artists.map(a=>chip("artist",a.id,esc(a.name))).join("")}</div>
      <div class="frow" role="group" aria-label="Preço"><span class="lab">Preço</span>${Object.keys(PRICE).map(k=>chip("price",k,PRICE[k][0])).join("")}</div>
      <div class="frow"><label class="lab" for="sort">Ordenar</label><div class="sortwrap"><select id="sort">${[["new","Mais recentes"],["low","Menor preço"],["high","Maior preço"]].map(([v,l])=>`<option value="${v}"${ui.sort===v?" selected":""}>${l}</option>`).join("")}</select></div></div>
    </div>
    <div class="results-meta" aria-live="polite"><span>${list.length} ${list.length===1?"obra":"obras"}</span>${any?`<button type="button" data-act="clear">Limpar filtros</button>`:""}</div>
    ${list.length?`<div class="board cat">${list.map(a=>card(u,a)).join("")}</div>`:`<div class="empty"><p>Nenhuma obra com esses filtros.</p><p style="color:var(--muted)">Experimente outra categoria, artista ou faixa de preço.</p><button class="btn ghost" type="button" data-act="clear">Limpar filtros ${icon("x")}</button></div>`}
  </div>`,after(){$("#sort").addEventListener("change",e=>{ui.sort=e.target.value;render(false);});}};
}

function vObra(u,id){
  const a=S.work(id);if(!a||a.status==="review")return vNF();
  const ar=S.artist(a.artist),fav=S.favs(u.id).includes(a.id);
  const mine=S.proposalsForBuyer(u.id).find(p=>p.workId===a.id&&(p.status==="open"||p.status==="countered"));
  const myOrder=S.ordersForBuyer(u.id).find(o=>o.workId===a.id);
  const cat=S.catalogue(),i=cat.findIndex(x=>x.id===a.id);
  const prev=cat[(i-1+cat.length)%cat.length],next=cat[(i+1)%cat.length];
  const rel=cat.filter(x=>x.artist===a.artist&&x.id!==a.id).concat(cat.filter(x=>x.artist!==a.artist&&x.cat===a.cat&&x.id!==a.id)).slice(0,3);
  let buy;
  if(myOrder)buy=`<div class="d-buy"><span class="price">${brl(myOrder.amount)}<small>Reservada para você · ${myOrder.id}</small></span><a class="btn" href="#aquisicoes">Acompanhar aquisição ${icon("right")}</a></div>`;
  else if(a.status!=="published")buy=`<div class="d-buy"><span class="price">${brl(a.price)}<small>${STATUS[a.status][0]} por outro membro</small></span><p class="notice">${icon("info")}<span>Salve nos favoritos: se a reserva cair, você vê a obra voltar à vitrine.</span></p></div>`;
  else{
    const thread=mine?`<ul class="thread">${mine.history.map(h=>`<li><span>${h.by==="artist"?esc(ar.name.split(" ")[0]):h.by==="system"?"Sistema":"Você"}<br>${dateBR(h.at)}</span><div>${h.amount?`<b>${brl(h.amount)}</b> · `:""}<span class="lab">${{offer:"Proposta",counter:"Contraproposta",decline:"Recusa",accept:"Aceite",close:"Encerrada",withdraw:"Retirada"}[h.type]}</span>${h.msg?`<p>${esc(h.msg)}</p>`:""}</div></li>`).join("")}</ul>`:"";
    buy=`<div class="d-buy">
        <span class="price">${brl(a.price)}<small>Preço da artista · transação em custódia</small></span>
        ${ui.confirmBuy===a.id
          ?`<p class="hint">Reservar <b>${esc(a.title)}</b> por ${brl(a.price)}? A obra sai da vitrine e você tem 48 h para concluir o pagamento em custódia.</p>
            <button class="btn ocre" type="button" data-act="buy" data-w="${a.id}">Confirmar reserva ${icon("check")}</button><button class="linkbtn" type="button" data-act="cancel" style="align-self:flex-start">Cancelar</button>`
          :`<button class="btn" type="button" data-act="ask-buy" data-w="${a.id}">Reservar pelo preço ${icon("right")}</button>`}
      </div>
      <form class="offer" id="offer-f" novalidate>
        <p class="lab" style="color:var(--ink)">${mine?`Negociação ${mine.id} · ${PSTATUS[mine.status][0]}`:"Ou faça uma proposta"}</p>
        ${thread}
        <div class="row">${field({name:"amount",label:mine?"Nova proposta":"Sua proposta",ph:brl(Math.round(a.price*.9/500)*500),attrs:'inputmode="numeric"'})}<button class="btn ghost" type="submit">Enviar</button></div>
        ${field({name:"msg",label:"Mensagem para a artista",type:"textarea",rows:3,req:false,ph:"Onde a obra vai viver, dúvidas sobre moldura, transporte…"})}
        <p class="hint">A artista vê seu código de membro (${u.id}) e sua cidade. Seu nome só é revelado se a venda for fechada.</p>
      </form>`;
  }
  return {title:`${a.title} — PONCI`,html:`<div class="wrap">
    <nav class="crumbs" aria-label="Trilha"><a href="#acervo">Acervo</a><span aria-hidden="true">/</span><span>${esc(ar.name)}</span><span aria-hidden="true">/</span><span aria-current="page">${esc(a.title)}</span></nav>
    <article class="detail">
      <div class="detail-media">${slab(a,null,true,a.status==="published"?"Disponível na rede":STATUS[a.status][0])}</div>
      <div class="detail-info">
        <div class="d-no"><span>${a.no}</span><button type="button" class="linkbtn" data-fav="${a.id}" aria-pressed="${fav}">${fav?"Salva nos favoritos":"Salvar nos favoritos"}</button></div>
        <div><h1 class="d-title">${esc(a.title)}</h1></div>
        <div class="d-artist"><strong>${esc(ar.name)}</strong><span>${esc(ar.practice)} · ${esc(ar.city)} · Artista membro</span></div>
        <dl class="spec">
          <dt>Ano</dt><dd>${a.year}</dd>
          <dt>Técnica</dt><dd>${esc(a.medium)}</dd>
          <dt>Dimensões</dt><dd>${dims(a)}<small>${dimsIn(a)}</small></dd>
          <dt>Edição</dt><dd>${a.ed?esc(a.ed):"Obra única"}</dd>
          <dt>Categoria</dt><dd>${CAT[a.cat]}</dd>
          <dt>Procedência</dt><dd>Direto do ateliê<small>Certificado PONCI na entrega</small></dd>
        </dl>
        ${a.d&&a.d.length?`<div class="d-desc">${a.d.map(p=>`<p>${esc(p)}</p>`).join("")}</div>`:""}
        ${buy}
        <p class="notice">${icon("info")}<span>Obra e artista de demonstração. Nenhuma transação real acontece neste protótipo.</span></p>
      </div>
    </article>
    ${cat.length>1?`<nav class="pager" aria-label="Acervo">
      <a href="#obra-${prev.id}"><span>${icon("left")} Anterior</span><strong>${esc(prev.title)}</strong></a>
      <a href="#obra-${next.id}"><span>Próxima ${icon("right")}</span><strong>${esc(next.title)}</strong></a></nav>`:""}
    ${rel.length?`<section class="sec" aria-labelledby="rel-t">${secHead("—","Relacionadas",esc(ar.name),"rel-t","#acervo","Ver acervo")}<div class="board rel">${rel.map(x=>card(u,x)).join("")}</div></section>`:`<div style="height:clamp(72px,10vw,140px)"></div>`}
  </div>`,after(){
    const f=$("#offer-f");if(!f)return;
    const val=bindValidation(f,{amount:v=>{const n=parseMoney(v);if(n<Math.round(a.price*.5))return `Propostas abaixo de 50% do preço (${brl(a.price*.5)}) não são enviadas.`;if(n>=a.price)return "Para pagar o preço cheio, use “Reservar pelo preço”.";return "";}});
    f.elements.amount.addEventListener("blur",e=>{const n=parseMoney(e.target.value);if(n)e.target.value=brl(n);});
    f.addEventListener("submit",e=>{e.preventDefault();if(!val.check())return;const v=val.values();
      S.propose(u.id,a.id,parseMoney(v.amount),v.msg.trim());toast("Proposta enviada à artista.");render(false);});
  }};
}

function vFavoritos(u){
  const ids=S.favs(u.id),list=ids.map(S.work).filter(a=>a&&a.status!=="review");
  return {title:"PONCI — Favoritos",html:`<div class="wrap">
    ${pageHead("Favoritos","Lista de interesse","Obras que você guardou. Se uma reserva cair ou o preço mudar, elas continuam aqui.",`${list.length} ${list.length===1?"obra":"obras"}`)}
    <div style="margin-top:clamp(28px,4vw,48px)">${list.length?`<div class="board cat">${list.map(a=>card(u,a)).join("")}</div>`:`<div class="empty"><p>Nenhuma obra salva.</p><p style="color:var(--muted)">Use o marcador no canto de cada obra do acervo.</p><a class="btn" href="#acervo">Ir ao acervo ${icon("right")}</a></div>`}</div>
  </div>`};
}
function vPropostas(u){
  const ps=S.proposalsForBuyer(u.id);
  return {title:"PONCI — Propostas",html:`<div class="wrap">
    ${pageHead("Propostas","Negociação privada","Acompanhe o que você ofereceu e responda às contrapropostas das artistas.",`${ps.filter(p=>p.status==="countered").length} contrapropostas<br>${ps.filter(p=>p.status==="open").length} aguardando`)}
    <div style="margin:clamp(28px,4vw,48px) 0 clamp(72px,10vw,140px)">${ledger(ps.map(p=>propRow(u,p)),"Nenhuma proposta ainda.","Abra uma obra do acervo para fazer a primeira.")}</div>
  </div>`};
}
function vAquisicoes(u){
  const os=S.ordersForBuyer(u.id);
  return {title:"PONCI — Aquisições",html:`<div class="wrap">
    ${pageHead("Aquisições","Custódia e entrega","O pagamento fica com a PONCI até você confirmar o recebimento. Cada obra chega com certificado de autenticidade numerado.",`${os.length} ${os.length===1?"obra":"obras"}`)}
    <div style="margin:clamp(28px,4vw,48px) 0 clamp(72px,10vw,140px);border-top:var(--b)">${os.length?os.map(orderBlock).join(""):`<div class="empty sm" style="border-top:0"><p>Nenhuma aquisição ainda.</p><a class="btn" href="#acervo">Explorar o acervo ${icon("right")}</a></div>`}</div>
  </div>`};
}
function vNF(){return {title:"PONCI",html:`<div class="wrap nf"><p class="lab">404</p><h1>Obra indisponível ou inexistente.</h1><a class="btn" href="#acervo">Voltar ao acervo ${icon("right")}</a></div>`};}

/* ---------- Roteamento ---------- */
const NAV=u=>{const c=S.proposalsForBuyer(u.id).filter(p=>p.status==="countered").length,f=S.favs(u.id).length;
  return [["#acervo","Acervo"],["#favoritos","Favoritos",f||""],["#propostas","Propostas",c||""],["#aquisicoes","Aquisições"]];};
function current(){const h=location.hash.slice(1)||"acervo";return "#"+(h.startsWith("obra-")?"acervo":h);}
const render=router({
  chrome(){
    const u=me();
    chrome({nav:u?NAV(u):[["index.html","A rede"],["artista.html","Sou artista"]],current:current(),home:"index.html",
      user:u?{name:u.name,role:u.id}:null,tagText:"Área do colecionador",band:u?["Área do colecionador · "+u.name+" · "+u.id,"Conta de demonstração"]:null});
  },
  resolve(h){
    const u=me();
    if(!u)return gate({title:"Colecionadores",label:"Área do colecionador",intro:"O acervo fechado da rede: preços visíveis, propostas diretas às artistas e aquisição em custódia.",
      heading:"Acervo <em>fechado.</em>",sub:"Entre com o e-mail verificado e o código de convite de colecionador.",
      art:S.work("a-espera-do-meio-dia"),demo:{id:"COL-0147",name:"Marina Alves"},onEnter(id){S.login("buyer",id);toast("Bem-vinda ao acervo da rede.");render(true);}});
    if(!h||h==="acervo")return vAcervo(u);
    if(h.startsWith("obra-"))return vObra(u,h.slice(5));
    if(h==="favoritos")return vFavoritos(u);
    if(h==="propostas")return vPropostas(u);
    if(h==="aquisicoes")return vAquisicoes(u);
    return vNF();
  }
});

/* ---------- Eventos ---------- */
document.addEventListener("click",e=>{
  const t=e.target.closest("[data-act],[data-k],[data-fav],[data-logout]");if(!t)return;
  const u=me();
  if(t.hasAttribute("data-logout")){S.logout("buyer");P.closeMenu(false);history.replaceState(null,"",location.pathname);render(true);toast("Você saiu da área do colecionador.");return;}
  if(!u)return;
  if(t.dataset.fav){e.preventDefault();const on=S.toggleFav(u.id,t.dataset.fav);toast(on?"Salva nos favoritos.":"Removida dos favoritos.");render(false);return;}
  if(t.dataset.k){ui[t.dataset.k]=t.dataset.v;render(false);return;}
  const act=t.dataset.act;
  if(act==="clear"){ui.cat=ui.artist=ui.price="all";render(false);return;}
  if(act==="cancel"){ui.confirmBuy=ui.confirmCounter=null;render(false);return;}
  if(act==="ask-buy"){ui.confirmBuy=t.dataset.w;render(false);$("[data-act=buy]")?.focus();return;}
  if(act==="buy"){ui.confirmBuy=null;const o=S.reserve(t.dataset.w,u.id,S.work(t.dataset.w).price,"direct");
    if(o){toast("Obra reservada para você.");location.hash="aquisicoes";}else{toast("A obra não está mais disponível.");render(false);}return;}
  if(act==="ask-counter"){ui.confirmCounter=t.dataset.p;render(false);return;}
  if(act==="accept-counter"){ui.confirmCounter=null;const o=S.respond(t.dataset.p,"buyer","accept");toast(o?"Contraproposta aceita. Obra reservada.":"A obra não está mais disponível.");if(o)location.hash="aquisicoes";else render(false);return;}
  if(act==="decline-counter"){S.respond(t.dataset.p,"buyer","decline",0,"");toast("Contraproposta recusada.");render(false);return;}
  if(act==="withdraw"){S.respond(t.dataset.p,"buyer","withdraw",0,"");toast("Proposta retirada.");render(false);return;}
  if(act==="advance"){S.advance(t.dataset.o);toast("Etapa atualizada.");render(false);return;}
});
S.onChange(()=>{const f=$("#offer-f");if(f&&f.contains(document.activeElement))return;render(false);});
render(true);
})();
