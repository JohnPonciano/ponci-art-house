/* PONCI · Rede privada — página principal (LP) */
(function(){
"use strict";
const {icon,esc,$,$$,pad,brl,dims,CAT,slab,secHead,field,V,bindValidation,artImg,hydrate,fit,chrome}=P;
const S=Store;
let role="artist",done=null;
try{const q=new URLSearchParams(location.search).get("perfil");if(q==="colecionador")role="buyer";}catch(e){}

function lockedCard(a,cls=""){
  const ar=S.artist(a.artist);
  return `<article class="card ${cls}"><a class="card-link" href="comprador.html#obra-${a.id}">
    <div class="card-top"><span>${a.no}</span><span>${a.year}</span></div>
    <div class="card-img veil">${artImg(a)}</div>
    <div class="card-cap">
      <h3 class="card-title">${esc(a.title)}</h3>
      <p class="card-en">${esc(ar.name)}</p>
      <p class="card-meta first">${esc(a.medium)}</p>
      <p class="card-meta">${dims(a)}${a.ed?" · "+esc(a.ed):""}</p>
    </div>
    <div class="card-foot"><span class="locked-p">${icon("lock")} Preço para membros</span><span class="go">Ver ${icon("right")}</span></div>
  </a></article>`;
}

function formHTML(){
  if(done)return `<div class="success" role="status" tabindex="-1" id="success">
    <span class="mark">${icon("check")}</span>
    <h2>Pedido recebido.</h2>
    <p>${done.role==="artist"?"A curadoria da PONCI analisa cada portfólio pessoalmente. Em uma versão real, você receberia a resposta e, se aprovada, o seu convite em até 10 dias.":"Em uma versão real, verificaríamos sua identidade e a indicação, e o convite de colecionador chegaria em até 5 dias."}</p>
    <dl class="spec"><dt>Referência</dt><dd>${done.ref}</dd><dt>Perfil</dt><dd>${done.role==="artist"?"Artista":"Colecionador"}</dd><dt>Nome</dt><dd>${esc(done.name)}</dd><dt>E-mail</dt><dd>${esc(done.email)}</dd></dl>
    <p class="notice">${icon("info")}<span>Protótipo: nada foi enviado. Para explorar a rede agora, use o código de demonstração <b>${S.CODE}</b> nas áreas restritas.</span></p>
    <div style="display:flex;flex-wrap:wrap;gap:10px"><a class="btn" href="${done.role==="artist"?"artista.html":"comprador.html"}">Ver a área ${done.role==="artist"?"do artista":"do colecionador"} ${icon("right")}</a><button type="button" class="btn ghost" id="again">Novo pedido ${icon("right")}</button></div>
  </div>`;
  const A=role==="artist";
  return `<form class="form" id="req" novalidate>
    <div class="field"><span class="lab">Eu sou</span><div class="seg" role="group" aria-label="Perfil">
      <button type="button" data-role="artist" aria-pressed="${A}">Artista</button><button type="button" data-role="buyer" aria-pressed="${!A}">Colecionador</button></div></div>
    <div class="two">
      ${field({name:"name",label:"Nome",ph:"Seu nome completo",attrs:'autocomplete="name"'})}
      ${field({name:"email",label:"E-mail",type:"email",ph:"nome@dominio.com",attrs:'autocomplete="email" inputmode="email"'})}
    </div>
    <div class="two">
      ${field({name:"city",label:"Cidade / UF",ph:"São Paulo, SP",attrs:'autocomplete="address-level2"'})}
      ${A?field({name:"link",label:"Portfólio ou Instagram",ph:"https://… ou @seu.perfil"})
         :field({name:"link",label:"Indicação",ph:"Nome ou código de um membro (opcional)",req:false})}
    </div>
    ${A?field({name:"practice",label:"Linguagem principal",type:"select",options:`<option value="">Selecione</option>${["Pintura","Escultura e objeto","Obra sobre papel","Fotografia","Gravura e edição","Técnica mista"].map(o=>`<option>${o}</option>`).join("")}`})
       :field({name:"practice",label:"Faixa de investimento por obra",type:"select",options:`<option value="">Selecione</option>${["Até R$ 20 mil","R$ 20 mil a R$ 60 mil","R$ 60 mil a R$ 150 mil","Acima de R$ 150 mil"].map(o=>`<option>${o}</option>`).join("")}`})}
    ${field({name:"msg",label:A?"Sobre a sua prática":"O que você coleciona",type:"textarea",aside:"0 / 20+",ph:A?"Materiais, séries em andamento, onde já expôs…":"Artistas, linguagens, formatos, o espaço onde as obras vão viver…"})}
    <p class="form-status" role="alert"></p>
    <div class="form-actions"><button class="btn" type="submit" id="submit">Solicitar convite ${icon("right")}</button><p>Protótipo: este formulário valida apenas no seu navegador. Nada é enviado.</p></div>
  </form>`;
}

function bindForm(){
  $("#again")?.addEventListener("click",()=>{done=null;refreshForm();$("#i-name")?.focus();});
  const f=$("#req");if(!f)return;
  $$("[data-role]",f).forEach(b=>b.addEventListener("click",()=>{if(role===b.dataset.role)return;role=b.dataset.role;refreshForm();$(`[data-role="${role}"]`).focus();}));
  const rules={name:V.name,email:V.email,city:V.req("Informe sua cidade."),practice:V.req("Selecione uma opção."),
    msg:V.min(20,n=>`Escreva pelo menos 20 caracteres (${n} até agora).`)};
  if(role==="artist")rules.link=V.req("Informe um link para o seu trabalho.");
  const val=bindValidation(f,rules,e=>{if(e.target.name==="msg")$("#c-msg").textContent=`${e.target.value.trim().length} / 20+`;});
  f.addEventListener("submit",e=>{
    e.preventDefault();if(!val.check())return;
    const b=$("#submit");b.disabled=true;b.textContent="Enviando…";
    setTimeout(()=>{done=S.request({role,...val.values()});refreshForm();const s=$("#success");s?.scrollIntoView({block:"center"});s?.focus({preventScroll:true});},800);
  });
}
function refreshForm(){$("#acq-main").innerHTML=formHTML();bindForm();}

function render(){
  chrome({nav:[["#rede","A rede"],["#artistas","Artistas"],["#colecionadores","Colecionadores"],["#processo","Como funciona"]],
    current:null,enter:true,home:"#top"});
  const st=S.stats(),cat=S.catalogue().filter(a=>a.status==="published");
  const hero=S.work("gesto-n3"),ar=S.work("campo-de-anil-i"),co=S.work("a-espera-do-meio-dia"),side=S.work("porta-para-o-mar-seco");
  const sel=["arquitetura-do-intervalo","ocre-profundo","linha-de-prumo","sedimento","porta-para-o-mar-seco","rumor"].map(S.work).filter(Boolean);
  $("#main").innerHTML=`
  <section class="hero wrap" id="top" aria-labelledby="hero-t">
    <h1 class="fit mega" id="hero-t"><span>PONCI</span></h1>
    <div class="strip"><span>Rede privada de arte</span><span>Somente por convite</span><span>${st.artists} artistas membros</span><span>${st.published} obras na vitrine</span><span>Brasil · 2026</span></div>
    <div class="hero-body">
      <div class="hero-text">
        <p class="hero-quote">“Entre quem cria e quem coleciona, <em style="color:var(--ocre)">nada</em> além da obra.”</p>
        <p class="hero-sub">Uma rede fechada onde artistas e colecionadores verificados negociam obras diretamente, com curadoria, privacidade e pagamento em custódia.</p>
        <div class="hero-ctas">
          <a class="btn" href="#acesso" data-pick="artist">Sou artista — solicitar convite ${icon("right")}</a>
          <a class="btn ghost" href="#acesso" data-pick="buyer">Sou colecionador — solicitar acesso ${icon("right")}</a>
        </div>
      </div>
      <div class="hero-art"><a href="#vitrine" aria-label="Ver a vitrine">${slab(hero,null,true,"Na rede · Preço para membros")}</a></div>
    </div>
  </section>

  <section class="sec wrap" id="entrar" aria-labelledby="doors-t">
    ${secHead("01","Duas portas","Uma rede, <em>duas portas de entrada</em>","doors-t")}
    <div class="doors">
      <article class="door" id="artistas">
        <div class="door-head"><span>Porta A</span><span>Artistas</span></div>
        ${slab(ar,null,false)}
        <div class="door-body">
          <h3>Para <em>artistas</em></h3>
          <p>Publique obras para um público pequeno e qualificado. Você define o preço, recebe propostas e decide com quem negociar.</p>
          <ul class="ticks">
            <li><span>01</span><div><b>Ateliê digital</b><small>Cadastre obras com técnica, dimensões, edição e preço.</small></div></li>
            <li><span>02</span><div><b>Curadoria antes da vitrine</b><small>Cada obra é revisada antes de aparecer para os colecionadores.</small></div></li>
            <li><span>03</span><div><b>Propostas e contrapropostas</b><small>Aceite, recuse ou responda com outro valor, tudo registrado.</small></div></li>
            <li><span>04</span><div><b>Repasse garantido</b><small>O pagamento fica em custódia e é liberado na entrega.</small></div></li>
          </ul>
          <a class="btn" href="artista.html">Entrar na área do artista ${icon("right")}</a>
        </div>
      </article>
      <article class="door dark" id="colecionadores">
        <div class="door-head"><span>Porta B</span><span>Colecionadores</span></div>
        ${slab(co,null,false)}
        <div class="door-body">
          <h3>Para <em>colecionadores</em></h3>
          <p>Acesse obras que não estão em nenhuma outra vitrine, com preço visível, documentação completa e contato direto com quem fez.</p>
          <ul class="ticks">
            <li><span>01</span><div><b>Acervo fechado</b><small>Somente membros veem preços e disponibilidade.</small></div></li>
            <li><span>02</span><div><b>Compra direta ou proposta</b><small>Reserve pelo preço ou envie uma proposta à artista.</small></div></li>
            <li><span>03</span><div><b>Lista de interesse</b><small>Guarde obras e acompanhe mudanças de status.</small></div></li>
            <li><span>04</span><div><b>Procedência</b><small>Certificado de autenticidade emitido pela rede.</small></div></li>
          </ul>
          <a class="btn inv" href="comprador.html">Entrar na área do colecionador ${icon("right")}</a>
        </div>
      </article>
    </div>
  </section>

  <section class="sec wrap" id="vitrine" aria-labelledby="vit-t" style="padding-top:0">
    ${secHead("02","Vitrine","Na rede <em>agora</em>","vit-t","comprador.html","Ver acervo completo")}
    <div class="board">${sel.map(a=>lockedCard(a)).join("")}</div>
    <p class="notice" style="margin-top:16px">${icon("lock")}<span>Preços, disponibilidade e propostas ficam visíveis apenas para membros. ${cat.length} obras publicadas por ${st.artists} artistas.</span></p>
  </section>

  <section class="manifesto" id="rede" aria-labelledby="man-t"><div class="wrap">
    <div class="man-head"><span>03 — A rede</span><span>PONCI</span></div>
    <h2 class="fit man-title" id="man-t"><span>Fechada por princípio.</span></h2>
    <div class="man-grid">
      <ul class="man-terms">${["Curadoria","Confiança","Privacidade","Procedência"].map((w,i)=>`<li><span>${pad(i+1)}</span>${w}</li>`).join("")}</ul>
      <div class="man-body">
        <p>Uma rede pequena, onde cada membro foi convidado e cada obra foi vista antes de chegar à vitrine.</p>
        <p>Artistas não disputam atenção com milhares de anúncios. Colecionadores não precisam adivinhar preço, procedência ou disponibilidade. A identidade de quem compra só é revelada à artista quando a negociação é concluída.</p>
        <p>A PONCI fica no meio apenas onde é necessário: na curadoria, na custódia do pagamento, no transporte e no certificado.</p>
      </div>
    </div>
  </div></section>

  <section class="sec wrap" id="processo" aria-labelledby="proc-t">
    ${secHead("04","Como funciona","Do convite <em>à parede</em>","proc-t","#acesso","Solicitar acesso")}
    <ol class="steps" style="margin-top:0;border-top:0">${[
      ["Convite","Artistas enviam portfólio; colecionadores entram por indicação ou verificação. Todo membro é aprovado pela PONCI."],
      ["Curadoria","A artista cadastra a obra com preço. A curadoria revisa documentação e imagens antes de publicar."],
      ["Negociação privada","O colecionador reserva pelo preço ou envia uma proposta. A artista aceita, recusa ou faz contraproposta."],
      ["Custódia e entrega","O pagamento fica retido até a entrega. A obra viaja com seguro e chega com certificado de autenticidade."]
    ].map((s,i)=>`<li><span class="n">${i+1}</span><h3>${s[0]}</h3><p>${s[1]}</p></li>`).join("")}</ol>
    <div class="rules" style="margin-top:clamp(36px,5vw,64px);border-top:var(--b)">
      <div><b>15<small>%</small></b><h3>Comissão única</h3><p>Cobrada da venda concluída. Sem mensalidade para artistas.</p></div>
      <div><b>0</b><h3>Taxa de entrada</h3><p>Ser membro não custa nada. A rede só ganha quando a obra é vendida.</p></div>
      <div><b>7<small>d</small></b><h3>Liberação</h3><p>Repasse à artista até 7 dias após a confirmação de entrega.</p></div>
      <div><b>1:1</b><h3>Certificado</h3><p>Cada obra vendida recebe um certificado numerado com procedência.</p></div>
    </div>
  </section>

  <section class="sec wrap" id="perguntas" aria-labelledby="faq-t" style="padding-top:0">
    ${secHead("05","Perguntas","Antes de <em>entrar</em>","faq-t")}
    <div class="faq">${[
      ["Por que a rede é fechada?","Porque confiança não escala com anúncios abertos. Uma rede menor permite verificar quem vende, quem compra e o que é vendido, e dá a cada obra atenção real."],
      ["Quem pode ser artista na PONCI?","Artistas com produção consistente, de qualquer estágio de carreira. A curadoria olha o trabalho, não o currículo. O convite é por portfólio."],
      ["Como um colecionador entra?","Por indicação de um membro ou por verificação direta de identidade. Depois disso, o acervo completo, os preços e as propostas ficam disponíveis."],
      ["A artista sabe quem está fazendo a proposta?","Durante a negociação, o colecionador aparece por um código verificado (ex.: COL-0147) e pela cidade. O nome é revelado às duas partes quando a venda é concluída."],
      ["Como funciona o pagamento?","O colecionador paga à PONCI, que retém o valor em custódia. Com a entrega confirmada, o valor, menos a comissão, é repassado à artista."]
    ].map((q,i)=>`<details><summary><span>${pad(i+1)}</span><b>${q[0]}</b>${icon("plus")}</summary><p class="ans">${q[1]}</p></details>`).join("")}</div>
  </section>

  <div class="wrap" id="acesso">
    <section class="acq" aria-labelledby="form-t" style="margin-top:0">
      <div class="acq-aside"><p class="lab">06 — Solicitar acesso</p><h2 id="form-t">Peça o seu convite.</h2>
        <p>Conte quem você é. Cada pedido é lido pessoalmente pela curadoria da PONCI.</p>
        <p class="notice">${icon("info")}<span>Para explorar agora, entre nas áreas restritas com o código de demonstração <b>${S.CODE}</b>.</span></p>
        <div aria-hidden="true">${slab(side,null,false)}</div></div>
      <div class="acq-main" id="acq-main">${formHTML()}</div>
    </section>
  </div>

  <section class="closing" aria-labelledby="close-t"><div class="wrap">
    <h2 id="close-t">A arte merece <em>espaço.</em></h2>
    <div class="act"><a class="btn" href="artista.html">Área do artista ${icon("right")}</a><a class="btn ghost" href="comprador.html">Área do colecionador ${icon("right")}</a><p>Membros entram com e-mail e código de convite.</p></div>
  </div></section>`;
  bindForm();hydrate($("#main"));fit();
}

document.addEventListener("click",e=>{
  const t=e.target.closest("[data-pick]");if(!t)return;
  if(role!==t.dataset.pick){role=t.dataset.pick;done=null;refreshForm();}
});
render();
if(location.hash){const el=document.getElementById(location.hash.slice(1));el&&setTimeout(()=>el.scrollIntoView(),50);}
})();
