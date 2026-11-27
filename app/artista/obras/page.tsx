import Link from "next/link";
import { requireMember } from "@/lib/supabase/server";
import { worksByArtist, curationLog, ordersForArtist } from "@/lib/data";
import { artistPrintOrders } from "@/lib/prints";
import { PageHead, Empty } from "@/components/ui";
import { WorkCard } from "@/components/area";
import { Icon } from "@/components/Icon";
import { brl, brlCents, dateBR, firstName, netOf, pad, STATUS } from "@/lib/format";

export const metadata = { title: "Minhas obras" };

export default async function Obras({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const me = await requireMember("artist");
  const f = (await searchParams).status || "all";
  const [ws, log, os, prs] = await Promise.all([worksByArtist(me.id), curationLog(me.id), ordersForArtist(me.id), artistPrintOrders()]);
  const toShip = os.filter((o) => !o.cancelled_at && o.stage === 1).length + prs.filter((p) => p.signed && p.status === "in_production").length;
  const due = os.filter((o) => !o.cancelled_at && o.stage >= 1 && !o.payout_at).reduce((s, o) => s + netOf(o) * 100, 0) + prs.filter((p) => p.status !== "awaiting_payment" && !p.payout_at).reduce((s, p) => s + p.artist_fee_cents, 0);
  const asked = ws.filter((a) => a.changes_requested_at);
  const list = ws.filter((a) => f === "all" || a.status === f);
  const chip = (v: string, l: string) => (
    <Link className="chip" href={v === "all" ? "/artista/obras" : `/artista/obras?status=${v}`} aria-current={f === v ? "true" : undefined} scroll={false}>
      {l} <span className="count">{v === "all" ? ws.length : ws.filter((a) => a.status === v).length}</span></Link>);
  return (
    <div className="wrap">
      <PageHead title="Obras" label={`Olá, ${firstName(me.display_name)}`} intro="Cadastre, acompanhe a curadoria e libere prints. Toda obra passa pela curadoria antes de entrar na galeria." count={`${ws.length} obras`} />
      <div className="stats" style={{ ["--n" as any]: 4 }}>
        <Link href="/artista/obras?status=published"><span className="lab">Na galeria</span><b>{pad(ws.filter((a) => a.status === "published").length)}</b></Link>
        <Link href="/artista/obras?status=review"><span className="lab">Em curadoria</span><b>{pad(ws.filter((a) => a.status === "review").length)}</b></Link>
        <Link href="/artista/vendas"><span className="lab">Para enviar</span><b className={toShip ? "ok-c" : ""}>{pad(toShip)}</b></Link>
        <Link href="/artista/vendas"><span className="lab">A receber</span><b className="money">{brlCents(due)}</b></Link>
      </div>
      <div className="filters"><div className="frow" role="group" aria-label="Status"><span className="lab">Status</span>{chip("all", "Todas")}{Object.keys(STATUS).map((k) => <span key={k} style={{ display: "contents" }}>{chip(k, STATUS[k][0])}</span>)}</div></div>
      {asked.length > 0 && <div className="curate-ask" style={{ marginTop: 20 }}><p className="lab">A curadoria pediu ajustes</p>
        <p>{asked.map((a, i) => <span key={a.id}>{i > 0 && ", "}<Link href={`/artista/obras/${a.slug}`} style={{ textDecoration: "underline" }}>{a.title}</Link></span>)}. Abra a obra, ajuste e reenvie.</p></div>}
      <div className="results-meta"><span>{list.length} {list.length === 1 ? "obra" : "obras"}</span><Link className="btn sm" href="/artista/obras/nova">Nova obra <Icon n="plus" /></Link></div>
      {list.length ? <div className="board cat">{list.map((a) => <WorkCard key={a.id} a={a} href={`/artista/obras/${a.slug}`} foot={<><span className="price">{brl(a.price)}<small>Seu preço</small></span><span className="go">Gerenciar <Icon n="right" /></span></>} />)}</div>
        : <Empty title="Nenhuma obra com este status."><Link className="btn ghost" href="/artista/obras">Ver todas <Icon n="x" /></Link></Empty>}
      {log.length > 0 && <section className="sub-sec" aria-labelledby="cl-t">
        <h2 id="cl-t" className="lab" style={{ marginBottom: 12 }}>Histórico da curadoria</h2>
        <ul className="curate-log">{log.map((e) => <li key={e.id}>
          <span className={"tag " + ({ aprovada: "t-pub", ajustes: "t-countered", recusada: "t-declined", reenviada: "t-rev" } as const)[e.decision]}>{({ aprovada: "Aprovada", ajustes: "Ajustes pedidos", recusada: "Recusada", reenviada: "Reenviada" } as const)[e.decision]}</span>
          <span><b>{e.title}</b>{e.note && <q>{e.note}</q>}</span><small>{dateBR(e.created_at)}</small></li>)}</ul>
      </section>}
    </div>
  );
}
