/* PONCI · Rede privada — estado compartilhado entre LP, área do artista e área do colecionador.
   Protótipo: tudo fica no localStorage do navegador. As duas áreas leem o mesmo "banco",
   então uma proposta feita pelo colecionador aparece no painel da artista (inclusive em outra aba). */
(function(){
"use strict";
const KEY="ponci-rede-v1",SKEY="ponci-rede-sessao-v1";
const DAY=864e5,NOW=Date.now();

const ARTISTS=[
  {id:"helena-vasques",name:"Helena Vasques",city:"Salvador, BA",since:2026,practice:"Pintura monocromática",
   bio:"Trabalha com campos de cor construídos em dezenas de camadas translúcidas. Interessa-se pelo tempo que o olho leva para ver.",email:"helena@demo.ponci.art"},
  {id:"rafael-toledo",name:"Rafael Toledo",city:"Belo Horizonte, MG",since:2026,practice:"Matéria e superfície",bio:"Pigmentos de terra, gesso e pó de mármore.",email:"rafael@demo.ponci.art"},
  {id:"iara-monteiro",name:"Iara Monteiro",city:"São Paulo, SP",since:2026,practice:"Geometria e edição",bio:"Grades, módulos e serigrafia.",email:"iara@demo.ponci.art"},
  {id:"caio-bernardes",name:"Caio Bernardes",city:"Curitiba, PR",since:2026,practice:"Paisagem surreal",bio:"Paisagens de luz impossível.",email:"caio@demo.ponci.art"},
  {id:"lucia-amaral",name:"Lúcia Amaral",city:"Recife, PE",since:2026,practice:"Gesto e papel",bio:"Pintura gestual e obras sobre papel.",email:"lucia@demo.ponci.art"}
];
const BUYERS=[
  {id:"COL-0147",name:"Marina Alves",city:"São Paulo, SP",since:2026,email:"marina@demo.ponci.art",interest:"Pintura contemporânea brasileira, obras de grande formato"},
  {id:"COL-0112",name:"Colecionador verificado",city:"Rio de Janeiro, RJ",since:2026},
  {id:"COL-0189",name:"Colecionador verificado",city:"Porto Alegre, RS",since:2026},
  {id:"COL-0203",name:"Colecionador verificado",city:"Brasília, DF",since:2026}
];

const w=(o)=>Object.assign({status:"published",createdAt:NOW-30*DAY},o);
const SEED_WORKS=[
 w({id:"campo-de-anil-i",title:"Campo de Anil I",artist:"helena-vasques",date:"2026-03",h:180,w:150,cat:"painting",g:"mono",seed:11,price:68000,
  p:["#2F3C57","#45577A","#1D263B"],medium:"Óleo e pigmento de anil sobre linho",
  d:["Um único campo de anil construído com dezenas de camadas finas e translúcidas.","De perto, a superfície se separa em azuis quentes e frios; à distância, assenta-se em um plano silencioso, como o barrado de uma parede caiada visto ao entardecer."],createdAt:NOW-60*DAY}),
 w({id:"estudo-para-um-silencio",title:"Estudo para um Silêncio",artist:"helena-vasques",date:"2026-06",h:120,w:100,cat:"painting",g:"mono",seed:37,price:42000,
  p:["#5A2A25","#7B3C33","#381916"],medium:"Óleo sobre tela",
  d:["Duas faixas de vermelho sangue-de-boi separadas por um registro um pouco mais escuro.","A pintura trata da borda entre elas, e do tempo que o olhar leva para encontrá-la."],createdAt:NOW-40*DAY}),
 w({id:"campo-de-anil-ii",title:"Campo de Anil II",artist:"helena-vasques",date:"2026-10",h:160,w:130,cat:"painting",g:"mono",seed:212,price:61000,status:"review",
  p:["#3E4A3A","#55654F","#262E24"],medium:"Óleo e terra verde sobre linho",
  d:["Segunda peça da série, agora em terra verde.","Enviada para a curadoria da rede."],createdAt:NOW-2*DAY}),
 w({id:"barrado",title:"Barrado",artist:"helena-vasques",date:"2025-11",h:90,w:120,cat:"painting",g:"mono",seed:303,price:36000,status:"sold",
  p:["#6B5A3E","#857152","#45392A"],medium:"Óleo sobre linho",d:["Uma faixa de cor à altura do olhar, como o barrado de uma parede."],createdAt:NOW-120*DAY}),
 w({id:"ocre-profundo",title:"Ocre Profundo",artist:"rafael-toledo",date:"2025-09",h:200,w:160,cat:"painting",g:"tex",seed:23,price:74000,
  p:["#9A7542","#B8925A","#7A5A2E","#C9A877","#5E4626"],medium:"Acrílica e pó de mármore sobre tela",
  d:["Pigmento ocre ligado a pó de mármore e arrastado sobre a tela com uma lâmina larga.","As cristas capturam a luz e a superfície muda ao longo do dia."]}),
 w({id:"sedimento",title:"Sedimento",artist:"rafael-toledo",date:"2024-11",h:90,w:90,cat:"mixed",g:"tex",seed:41,price:29000,
  p:["#D7D0C3","#BDB4A4","#E8E3D8","#8E8678","#A79D8C"],medium:"Gesso e pigmento mineral sobre painel de madeira",
  d:["Gesso e pigmento mineral aplicados em estratos, lixados e reaplicados.","O painel registra o próprio processo como uma margem de rio registra as cheias."]}),
 w({id:"arquitetura-do-intervalo",title:"Arquitetura do Intervalo",artist:"iara-monteiro",date:"2026-02",h:150,w:150,cat:"painting",g:"geo",seed:58,price:55000,
  p:["#E6E0D4","#1C1B19","#8B4A32","#B89A63","#4A5560"],medium:"Acrílica sobre tela",
  d:["Um quadrado dividido por uma grade irregular, onde os planos de cor funcionam como cômodos e as linhas como paredes.","O círculo é o único elemento que recusa a estrutura."]}),
 w({id:"modulo-7",title:"Módulo 7",artist:"iara-monteiro",date:"2025-05",h:70,w:50,cat:"edition",g:"geo",seed:64,price:9500,ed:"Edição de 12 + 2 PA",status:"reserved",
  p:["#ECE7DD","#22211F","#2F3B52","#A7A196","#7A3A2C"],medium:"Serigrafia sobre papel de algodão",
  d:["Sétima de uma série de serigrafias construídas sobre a mesma grade modular.","Cada exemplar da edição é impresso à mão em quatro cores sobre papel de algodão."]}),
 w({id:"linha-de-prumo",title:"Linha de Prumo",artist:"iara-monteiro",date:"2024-08",h:56,w:42,cat:"paper",g:"geo",seed:77,price:14000,
  p:["#EFEBE3","#2A2926","#C7B48C","#8C8F86","#5C3A2E"],medium:"Guache sobre papel",
  d:["Um estudo de equilíbrio vertical, em guache.","A composição pende de uma única linha, como um fio de prumo em um canteiro de obras."]}),
 w({id:"a-espera-do-meio-dia",title:"A Espera do Meio-Dia",artist:"caio-bernardes",date:"2026-04",h:140,w:110,cat:"painting",g:"sur",v:"sphere",seed:83,price:58000,
  p:["#A9A397","#E2D8C4","#C4A57C","#8A6A47","#A85A3C","#2B2420"],medium:"Óleo sobre linho",
  d:["Uma esfera suspensa sobre uma planície vazia na hora em que as sombras deveriam ser mais curtas.","Aqui a sombra é longa, como se a luz viesse de outro tempo."]}),
 w({id:"porta-para-o-mar-seco",title:"Porta para o Mar Seco",artist:"caio-bernardes",date:"2025-07",h:100,w:130,cat:"painting",g:"sur",v:"door",seed:91,price:49000,
  p:["#8C949B","#D9D3C5","#C9B08A","#957652","#E2DCD0","#2E3A49"],medium:"Óleo sobre tela",
  d:["Uma parede solta em uma paisagem seca se abre para um mar que não está lá.","A pintura trata o horizonte como memória, e não como lugar."]}),
 w({id:"gesto-n3",title:"Gesto Nº 3",artist:"lucia-amaral",date:"2026-05",h:210,w:170,cat:"painting",g:"gest",seed:7,price:88000,
  p:["#E7E1D4","#1E1D1B","#6E2F2A","#B08A4E","#3E4A57","#1E1D1B","#8B7562"],medium:"Óleo e carvão sobre tela",
  d:["Grandes pinceladas de óleo e carvão, cada uma feita em um único movimento do braço.","Cada correção permanece visível, e assim a imagem é também um registro de decisões."]}),
 w({id:"ruina-domestica",title:"Ruína Doméstica",artist:"rafael-toledo",date:"2025-02",h:80,w:60,cat:"mixed",g:"mix",seed:105,price:24000,
  p:["#B19878","#EDE7DA","#D5CEC0","#C9BFAE","#2A2926","#7A3329"],medium:"Papel, linha e grafite sobre placa",
  d:["Fragmentos de papel, linha de costura e anotações em grafite dispostos sobre placa.","A colagem reconstrói uma casa a partir do que costuma ser descartado."]}),
 w({id:"rumor",title:"Rumor",artist:"lucia-amaral",date:"2024-10",h:76,w:56,cat:"paper",g:"gest",seed:129,price:16500,
  p:["#EDE8DE","#2A2926","#8B7562","#A35A3C","#2A2926"],medium:"Nanquim e pigmento de terra sobre papel de algodão",
  d:["Nanquim e pigmento de terra sobre papel de algodão, trabalhados rapidamente com a folha ainda úmida.","As marcas ultrapassam as próprias bordas, como algo dito e repetido."]})
];

const SEED_PROPOSALS=[
  {id:"PRP-1041",workId:"campo-de-anil-i",buyerId:"COL-0189",status:"open",createdAt:NOW-3*DAY,
   history:[{by:"buyer",type:"offer",amount:60000,msg:"Acompanho a série desde a primeira exposição. A obra iria para uma parede de pé-direito duplo, com luz do norte.",at:NOW-3*DAY}]},
  {id:"PRP-1044",workId:"estudo-para-um-silencio",buyerId:"COL-0147",status:"open",createdAt:NOW-1*DAY,
   history:[{by:"buyer",type:"offer",amount:38000,msg:"Gostaria de ver a obra pessoalmente antes de fechar. Proposta inicial.",at:NOW-1*DAY}]},
  {id:"PRP-1032",workId:"campo-de-anil-i",buyerId:"COL-0203",status:"declined",createdAt:NOW-18*DAY,
   history:[{by:"buyer",type:"offer",amount:45000,msg:"",at:NOW-18*DAY},{by:"artist",type:"decline",msg:"Obrigada pelo interesse, mas o valor está distante do preço da obra.",at:NOW-17*DAY}]},
  {id:"PRP-1038",workId:"a-espera-do-meio-dia",buyerId:"COL-0147",status:"countered",createdAt:NOW-6*DAY,
   history:[{by:"buyer",type:"offer",amount:50000,msg:"Obra muito bonita. Consegue considerar este valor?",at:NOW-6*DAY},
            {by:"artist",type:"counter",amount:55000,msg:"Posso chegar a este valor, incluindo a moldura em caixa de freijó.",at:NOW-5*DAY}]}
];
const SEED_ORDERS=[
  {id:"ORD-2207",workId:"modulo-7",buyerId:"COL-0147",amount:9500,via:"direct",stage:1,createdAt:NOW-9*DAY},
  {id:"ORD-2189",workId:"barrado",buyerId:"COL-0112",amount:34000,via:"proposal",stage:3,createdAt:NOW-80*DAY}
];

function seed(){return{v:1,works:SEED_WORKS.map(x=>({...x})),proposals:JSON.parse(JSON.stringify(SEED_PROPOSALS)),orders:SEED_ORDERS.map(x=>({...x})),
  favorites:{"COL-0147":["a-espera-do-meio-dia","ocre-profundo","gesto-n3"]},requests:[],profiles:{},seq:1100};}

let db;
function load(){
  try{const raw=localStorage.getItem(KEY);if(raw){const d=JSON.parse(raw);if(d&&d.v===1){db=d;return;}}}catch(e){}
  db=seed();save();
}
function save(){try{localStorage.setItem(KEY,JSON.stringify(db));}catch(e){console.warn("PONCI: não foi possível salvar no navegador",e);}}
load();

const listeners=[];
window.addEventListener("storage",e=>{if(e.key===KEY){load();listeners.forEach(f=>f());}});

const nextId=prefix=>{db.seq=(db.seq||1100)+1;save();return prefix+"-"+db.seq;};
const slug=s=>s.normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"obra";
const year=a=>+String(a.date).slice(0,4);
const decorate=a=>{a.year=year(a);a.no="PNC "+String(db.works.indexOf(a)+1).padStart(3,"0");return a;};

const S={
  onChange(f){listeners.push(f);},
  reset(){db=seed();save();listeners.forEach(f=>f());},
  artists:ARTISTS,buyers:BUYERS,
  artist:id=>{const a=ARTISTS.find(x=>x.id===id);return a?Object.assign({},a,db.profiles[id]||{}):null;},
  buyer:id=>{const b=BUYERS.find(x=>x.id===id);return b?Object.assign({},b,db.profiles[id]||{}):null;},
  saveProfile(id,data){db.profiles[id]=Object.assign(db.profiles[id]||{},data);save();},
  works:()=>db.works.map(decorate),
  work:id=>{const a=db.works.find(x=>x.id===id);return a?decorate(a):null;},
  worksBy:artistId=>S.works().filter(a=>a.artist===artistId),
  catalogue:()=>S.works().filter(a=>a.status==="published"||a.status==="reserved"),
  proposals:()=>db.proposals,
  proposal:id=>db.proposals.find(p=>p.id===id),
  proposalsForArtist:aid=>db.proposals.filter(p=>{const w=S.work(p.workId);return w&&w.artist===aid;}).sort((a,b)=>b.createdAt-a.createdAt),
  proposalsForBuyer:bid=>db.proposals.filter(p=>p.buyerId===bid).sort((a,b)=>b.createdAt-a.createdAt),
  last:p=>p.history[p.history.length-1],
  current:p=>{for(let i=p.history.length-1;i>=0;i--)if(p.history[i].amount)return p.history[i].amount;return 0;},
  orders:()=>db.orders,
  ordersForBuyer:bid=>db.orders.filter(o=>o.buyerId===bid).sort((a,b)=>b.createdAt-a.createdAt),
  ordersForArtist:aid=>db.orders.filter(o=>{const w=S.work(o.workId);return w&&w.artist===aid;}).sort((a,b)=>b.createdAt-a.createdAt),
  favs:bid=>db.favorites[bid]||[],
  toggleFav(bid,wid){const f=db.favorites[bid]=db.favorites[bid]||[];const i=f.indexOf(wid);if(i>=0)f.splice(i,1);else f.push(wid);save();return i<0;},

  /* Artista */
  addWork(aid,o){
    let id=slug(o.title);while(db.works.some(x=>x.id===id))id+="-"+Math.floor(Math.random()*90+10);
    const work={id,artist:aid,status:"review",createdAt:Date.now(),...o};
    db.works.push(work);save();return work;
  },
  approveWork(id){const a=db.works.find(x=>x.id===id);if(a&&a.status==="review"){a.status="published";save();}},
  updatePrice(id,price){const a=db.works.find(x=>x.id===id);if(a){a.price=price;save();}},
  withdrawWork(id){const i=db.works.findIndex(x=>x.id===id&&(x.status==="review"||x.status==="published"));
    if(i>=0){db.works.splice(i,1);db.proposals.forEach(p=>{if(p.workId===id&&(p.status==="open"||p.status==="countered"))p.status="closed";});save();}},
  respond(pid,by,type,amount,msg){
    const p=S.proposal(pid);if(!p)return null;
    if(type==="accept"){const w=db.works.find(x=>x.id===p.workId);if(!w||w.status!=="published")return null;}
    p.history.push({by,type,amount:amount||undefined,msg:msg||"",at:Date.now()});
    if(type==="accept"){p.status="accepted";return S.reserve(p.workId,p.buyerId,S.current(p),"proposal",pid);}
    if(type==="decline")p.status="declined";
    if(type==="counter")p.status="countered";
    if(type==="offer")p.status="open";
    if(type==="withdraw")p.status="withdrawn";
    save();return p;
  },

  /* Colecionador */
  propose(bid,wid,amount,msg){
    const live=db.proposals.find(p=>p.workId===wid&&p.buyerId===bid&&(p.status==="open"||p.status==="countered"));
    if(live){live.history.push({by:"buyer",type:"offer",amount,msg,at:Date.now()});live.status="open";save();return live;}
    const p={id:nextId("PRP"),workId:wid,buyerId:bid,status:"open",createdAt:Date.now(),history:[{by:"buyer",type:"offer",amount,msg,at:Date.now()}]};
    db.proposals.push(p);save();return p;
  },
  reserve(wid,bid,amount,via,pid){
    const a=db.works.find(x=>x.id===wid);if(!a||a.status!=="published")return null;
    a.status="reserved";
    db.proposals.forEach(p=>{if(p.workId===wid&&p.id!==pid&&(p.status==="open"||p.status==="countered")){p.status="closed";p.history.push({by:"system",type:"close",msg:"Obra reservada por outro membro.",at:Date.now()});}});
    const o={id:nextId("ORD"),workId:wid,buyerId:bid,amount,via,stage:0,createdAt:Date.now()};
    db.orders.push(o);save();return o;
  },
  advance(oid){const o=db.orders.find(x=>x.id===oid);if(!o||o.stage>=3)return;o.stage++;
    if(o.stage===3){const a=db.works.find(x=>x.id===o.workId);if(a)a.status="sold";}save();},

  /* LP */
  request(data){const r={ref:"PNC-ACS-"+(1000+Math.floor(Math.random()*9000)),at:Date.now(),...data};db.requests.push(r);save();return r;},
  stats(){const ws=db.works;return{artists:ARTISTS.length,buyers:BUYERS.length,published:ws.filter(a=>a.status==="published").length,total:ws.length};},

  /* Sessão */
  session(){try{return JSON.parse(localStorage.getItem(SKEY))||{};}catch(e){return{};}},
  login(role,id){const s=S.session();s[role]=id;try{localStorage.setItem(SKEY,JSON.stringify(s));}catch(e){}},
  logout(role){const s=S.session();delete s[role];try{localStorage.setItem(SKEY,JSON.stringify(s));}catch(e){}},
  CODE:"PONCI-2026"
};
window.Store=S;
})();
