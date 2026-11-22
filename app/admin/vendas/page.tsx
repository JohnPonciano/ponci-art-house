import Link from "next/link";
import { adminSales, saleState, type Sale } from "@/lib/admin";
import { PageHead, Empty, Reprod } from "@/components/ui";
import { Chips } from "@/components/admin";
import { SaleActions } from "@/components/admin-client";
import { ArtImage } from "@/components/ArtImage";
import { Icon } from "@/components/Icon";
import { brl, dateBR, COMMISSION } from "@/lib/format";

export const metadata = { title: "Vendas" };

const FILTERS: [string, string][] = [
  ["attention", "Precisa de atenção"], ["awaiting", "Aguardando pagamento"], ["toship", "Para despachar"], ["transit", "Em transporte"],
  ["payout", "Repasse pendente"], ["done", "Repassadas"], ["cancelled", "Canceladas"], ["all", "Todas"],
];

/* Colunas do quadro: uma por etapa real do pedido. */
const COLS: { k: string; t: string; hint: string }[] = [
  { k: "awaiting", t: "Aguardando pagamento", hint: "Prazo: 48 h após a reserva" },
  { k: "toship", t: "Para despachar", hint: "Prazo: 5 dias úteis após o pagamento" },
  { k: "transit", t: "Em transporte", hint: "Até a colecionadora confirmar" },
  { k: "grace", t: "Em arrependimento", hint: "7 dias depois da entrega" },
  { k: "release", t: "Repasse liberado", hint: "Pagar a artista e registrar" },
  { k: "done", t: "Repassadas", hint: "Concluídas" },
];
const colOf = (o: Sale & { st: ReturnType<typeof saleState> }) =>
  o.cancelled_at ? "cancelled" : o.stage === 0 ? "awaiting" : o.stage === 1 ? "toship" : o.stage === 2 ? "transit"
    : o.payout_at ? "done" : o.st.label === "Repasse liberado" ? "release" : "grace";
/** Desde quando a venda está na etapa atual. */
const since = (o: Sale) => (o.stage === 0 ? o.created_at : o.stage === 1 ? o.paid_at || o.created_at : o.stage === 2 ? o.shipped_at : o.payout_at || o.delivered_at) || o.created_at;
const daysAgo = (d: string) => { const n = Math.floor((Date.now() - new Date(d).getTime()) / 864e5); return n <= 0 ? "hoje" : n === 1 ? "há 1 dia" : `há ${n} dias`; };

export default async function Vendas({ searchParams }: { searchParams: Promise<{ f?: string; v?: string }> }) {
  const all = (await adminSales()).map((o) => ({ ...o, st: saleState(o) }));
  const att = all.filter((o) => o.st.alert);
  const sp = await searchParams; const f = sp.f || "all"; const board = sp.v !== "lista";
  // alertas primeiro, depois as mais recentes
  const list = (f === "all" ? all : f === "attention" ? att : all.filter((o) => o.st.key === f)).slice().sort((x, y) => Number(!!y.st.alert) - Number(!!x.st.alert));
  const live = all.filter((o) => !o.cancelled_at);
  const sum = (l: Sale[]) => l.reduce((s, o) => s + o.amount, 0);
  const n = (k: string) => (k === "all" ? all.length : k === "attention" ? att.length : all.filter((o) => o.st.key === k).length);
  return (
    <div className="wrap">
      <PageHead title="Vendas" label="Pedidos e repasses" intro="Cada venda, do contrato ao repasse. Os alertas seguem os prazos do contrato: pagamento em 48 h, envio em 5 dias úteis, 7 dias de arrependimento depois da entrega."
        count={`${live.length} ${live.length === 1 ? "venda" : "vendas"}${att.length ? ` · ${att.length} com alerta` : ""}`} />
      <div className="stats" style={{ ["--n" as any]: 5 }}>
        <div><span className="lab">Vendido (bruto)</span><b className="money">{brl(sum(live))}</b></div>
        <div><span className="lab">Comissão PONCI</span><b className="money">{brl(sum(live.filter((o) => o.stage === 3)) * COMMISSION)}</b></div>
        <div><span className="lab">Em custódia</span><b className="money ok-c">{brl(sum(live.filter((o) => o.stage === 1 || o.stage === 2)))}</b></div>
        <div><span className="lab">Aguardando pagamento</span><b className="money">{brl(sum(live.filter((o) => o.stage === 0)))}</b></div>
        <div><span className="lab">Repasses pendentes</span><b className="money">{brl(sum(live.filter((o) => o.stage === 3 && !o.payout_at)) * (1 - COMMISSION))}</b></div>
      </div>
      <div className="kb-switch" role="group" aria-label="Visualização">
        <Link className="chip" href="/admin/vendas" aria-current={board ? "true" : undefined} scroll={false}><Icon n="grid" /> Quadro</Link>
        <Link className="chip" href="/admin/vendas?v=lista" aria-current={!board ? "true" : undefined} scroll={false}><Icon n="list" /> Lista</Link>
        {att.length > 0 && <span className="kb-att"><Icon n="info" /> {att.length} {att.length === 1 ? "venda pede" : "vendas pedem"} atenção</span>}
      </div>
      {board ? <Board all={all} /> : <>
      <div className="filters"><div className="frow" role="group" aria-label="Situação"><span className="lab">Situação</span>
        <Chips base="/admin/vendas?v=lista" cur={f} items={FILTERS.map(([k, l]) => [k, l, n(k)] as [string, string, number])} /></div></div>
      <div style={{ margin: "clamp(24px,3vw,40px) 0 clamp(72px,10vw,140px)" }}>
        {list.length ? <div className="sales">{list.map((o) => <SaleRow key={o.id} o={o} st={o.st} />)}</div>
          : <Empty sm title={f === "attention" ? "Nada pedindo atenção." : "Nenhuma venda aqui."} body="Quando um colecionador reserva uma obra ou uma proposta é aceita, a venda aparece nesta lista." />}
      </div></>}
    </div>
  );
}

type SaleSt = Sale & { st: ReturnType<typeof saleState> };
function Board({ all }: { all: SaleSt[] }) {
  const cancelled = all.filter((o) => o.cancelled_at);
  return (<>
    <div className="kb" role="list" aria-label="Vendas por etapa">{COLS.map((c) => {
      const items = all.filter((o) => colOf(o) === c.k).sort((x, y) => Number(!!y.st.alert) - Number(!!x.st.alert) || +new Date(since(x)) - +new Date(since(y)));
      const total = items.reduce((s, o) => s + o.amount, 0);
      return (
        <section className={"kb-col" + (items.some((o) => o.st.alert) ? " hot" : "")} key={c.k} role="listitem" aria-labelledby={"kb-" + c.k}>
          <header><h2 id={"kb-" + c.k}>{c.t} <span className="count">{items.length}</span></h2><p>{items.length ? `${brl(total)} · ` : ""}{c.hint}</p></header>
          <div className="kb-cards">{items.length ? items.map((o) => <KbCard key={o.id} o={o} col={c.k} />) : <p className="kb-empty">Nada aqui.</p>}</div>
        </section>);
    })}</div>
    {cancelled.length > 0 && <p className="kb-off"><Link href="/admin/vendas?v=lista&f=cancelled" style={{ textDecoration: "underline" }}>{cancelled.length} {cancelled.length === 1 ? "venda cancelada" : "vendas canceladas"}</Link> fora do quadro.</p>}
  </>);
}
function KbCard({ o, col }: { o: SaleSt; col: string }) {
  const a = o.work; const net = o.amount * (1 - COMMISSION);
  return (
    <article className={"kb-card" + (o.st.alert ? " alert" : "")}>
      <Link href={`/admin/vendas?v=lista#${o.ref}`} className="kb-link">
        <span className="kb-thumb"><ArtImage a={a} max={160} /></span>
        <span className="kb-body">
          <span className="kb-ref">{o.ref} · {daysAgo(since(o))}</span>
          <b>{a.title}</b>
          <span className="kb-who">{a.artist?.display_name} → {o.buyer?.name?.split(" ")[0] || o.buyer?.member_code}</span>
          <span className="kb-money">{brl(o.amount)}{a.reproduction ? " · REPROD" : ""}</span>
        </span>
      </Link>
      {o.st.alert && <p className="kb-alert"><Icon n="info" />{o.st.alert}</p>}
      {o.carrier && col === "transit" && <p className="kb-ship">{o.carrier}{o.tracking_code ? ` · ${o.tracking_code}` : ""}</p>}
      {(col === "release" || (col === "awaiting" && o.st.alert)) && <div className="kb-acts">
        <SaleActions id={o.id} code={o.ref} canCancel={col === "awaiting"} canPayout={col === "release"} net={brl(net)} /></div>}
    </article>
  );
}

function SaleRow({ o, st }: { o: Sale; st: ReturnType<typeof saleState> }) {
  const a = o.work; const net = o.amount * (1 - COMMISSION);
  const signed = (p: string) => o.contract?.signatures?.some((s) => s.party === p);
  const steps: [string, string | null | undefined][] = [["Reserva", o.created_at], ["Pagamento", o.paid_at], ["Envio", o.shipped_at], ["Entrega", o.delivered_at], ["Repasse", o.payout_at]];
  const canPayout = o.stage === 3 && !o.payout_at && !o.cancelled_at && st.label === "Repasse liberado";
  return (
    <article className={"sale" + (st.alert ? " alert" : "") + (o.cancelled_at ? " off" : "")} id={o.ref}>
      <div className="sale-art"><ArtImage a={a} max={240} /></div>
      <div className="sale-main">
        <div className="sale-top">
          <div>
            <p className="sale-ref"><b>{o.ref}</b> · {dateBR(o.created_at)} · {o.via === "direct" ? "Compra pelo preço" : "Proposta aceita"}</p>
            <h3>{a.title} <Reprod a={a} /></h3>
            <p className="sale-who"><span>Artista: <b>{a.artist?.display_name}</b> ({a.artist?.member_code})</span>
              <span>Colecionador: <b>{o.buyer?.name || "—"}</b> ({o.buyer?.member_code}) · {o.buyer?.city}</span></p>
          </div>
          <div className="sale-money"><b>{brl(o.amount)}</b><small>Comissão {brl(o.amount * COMMISSION)} · Artista {brl(net)}</small>
            <span className={"tag " + ({ cancelled: "t-declined", awaiting: "t-rev", toship: "t-countered", transit: "t-open", payout: "t-res", done: "t-pub" } as Record<string, string>)[st.key]}>{st.label}</span></div>
        </div>
        {st.alert && <p className="sale-alert" role="note"><Icon n="info" />{st.alert}</p>}
        {o.cancelled_at && <p className="sale-alert off">Cancelada em {dateBR(o.cancelled_at)}: {o.cancel_reason}</p>}
        <ol className="sale-steps">{steps.map(([l, d]) => <li key={l} className={d ? "done" : ""}><b>{l}</b><span>{d ? dateBR(d) : "—"}</span></li>)}</ol>
        <div className="sale-meta">
          {o.contract ? <span>Contrato <Link href={`/contrato/${o.contract.ref}`} style={{ textDecoration: "underline" }}>{o.contract.ref}</Link> · comprador {signed("comprador") ? "assinou" : "não assinou"} · artista {signed("artista") ? "assinou" : "não assinou"}</span> : <span>Sem contrato</span>}
          {o.carrier && <span>Envio: <b>{o.carrier}</b>{o.tracking_code && <> · <code>{o.tracking_code}</code></>}</span>}
          {o.payout_at && <span>Repasse em {dateBR(o.payout_at)}{o.payout_note ? ` · ${o.payout_note}` : ""}</span>}
          {o.reqs.map((r) => <span key={r.id}><Link href="/admin/solicitacoes" style={{ textDecoration: "underline" }}>{r.ref}</Link> · {r.kind} · {r.status}</span>)}
        </div>
        {!o.cancelled_at && (o.stage <= 1 || canPayout) && <div className="sale-acts"><SaleActions id={o.id} code={o.ref} canCancel={o.stage <= 1} canPayout={canPayout} net={brl(net)} /></div>}
      </div>
    </article>
  );
}
