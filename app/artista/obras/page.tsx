import Link from "next/link";
import { getMe } from "@/lib/supabase/server";
import { worksByArtist } from "@/lib/data";
import { PageHead, Empty } from "@/components/ui";
import { WorkCard } from "@/components/area";
import { Icon } from "@/components/Icon";
import { brl, STATUS } from "@/lib/format";

export const metadata = { title: "Minhas obras" };

export default async function Obras({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const me = (await getMe())!;
  const f = (await searchParams).status || "all";
  const ws = await worksByArtist(me.id);
  const list = ws.filter((a) => f === "all" || a.status === f);
  const chip = (v: string, l: string) => (
    <Link className="chip" href={v === "all" ? "/artista/obras" : `/artista/obras?status=${v}`} aria-current={f === v ? "true" : undefined} scroll={false}>
      {l} <span className="count">{v === "all" ? ws.length : ws.filter((a) => a.status === v).length}</span></Link>);
  return (
    <div className="wrap">
      <PageHead title="Obras" label="Seu catálogo" intro="Toda obra passa pela curadoria antes de aparecer na vitrine da rede. Você pode ajustar o preço enquanto ela estiver publicada." count={`${ws.length} obras`} />
      <div className="filters"><div className="frow" role="group" aria-label="Status"><span className="lab">Status</span>{chip("all", "Todas")}{Object.keys(STATUS).map((k) => <span key={k} style={{ display: "contents" }}>{chip(k, STATUS[k][0])}</span>)}</div></div>
      <div className="results-meta"><span>{list.length} {list.length === 1 ? "obra" : "obras"}</span><Link className="btn sm" href="/artista/obras/nova">Nova obra <Icon n="plus" /></Link></div>
      {list.length ? <div className="board cat">{list.map((a) => <WorkCard key={a.id} a={a} href={`/artista/obras/${a.slug}`} foot={<><span className="price">{brl(a.price)}<small>Seu preço</small></span><span className="go">Gerenciar <Icon n="right" /></span></>} />)}</div>
        : <Empty title="Nenhuma obra com este status."><Link className="btn ghost" href="/artista/obras">Ver todas <Icon n="x" /></Link></Empty>}
    </div>
  );
}
