import Link from "next/link";
import { requireMember } from "@/lib/supabase/server";
import { artists, catalogue, favoriteIds } from "@/lib/data";
import { PageHead, Empty } from "@/components/ui";
import { WorkCard } from "@/components/area";
import { SortSelect } from "@/components/SortSelect";
import { Icon } from "@/components/Icon";
import { brl, CAT, firstName } from "@/lib/format";

export const metadata = { title: "Acervo" };
const PRICE: Record<string, [string, number, number]> = { all: ["Todas", 0, Infinity], a: ["Até R$ 20 mil", 0, 20000], b: ["R$ 20 mil a 60 mil", 20000, 60000], c: ["Acima de R$ 60 mil", 60000, Infinity] };

export default async function Acervo({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const me = await requireMember("buyer");
  const sp = await searchParams;
  const f = { cat: sp.cat || "all", artist: sp.artist || "all", price: PRICE[sp.price] ? sp.price : "all", sort: sp.sort || "new" };
  const [all, arts, favs] = await Promise.all([catalogue(), artists(), favoriteIds(me.id)]);
  const [, lo, hi] = PRICE[f.price];
  const by: Record<string, (x: any, y: any) => number> = { new: (x, y) => y.created_at.localeCompare(x.created_at), low: (x, y) => x.price - y.price, high: (x, y) => y.price - x.price };
  const list = all.filter((a) => (f.cat === "all" || a.cat === f.cat) && (f.artist === "all" || a.artist_id === f.artist) && a.price >= lo && a.price < hi)
    .sort((x, y) => (x.status === "published" ? 0 : 1) - (y.status === "published" ? 0 : 1) || (by[f.sort] || by.new)(x, y));
  const href = (k: string, v: string) => { const q = new URLSearchParams({ ...f, [k]: v } as any); [...q.keys()].forEach((x) => (q.get(x) === "all" || (x === "sort" && q.get(x) === "new")) && q.delete(x)); const s = q.toString(); return "/colecionador" + (s ? "?" + s : ""); };
  const chip = (k: keyof typeof f, v: string, l: string) => <Link key={v} className="chip" href={href(k, v)} scroll={false} aria-current={f[k] === v ? "true" : undefined}>{l}</Link>;
  const any = f.cat !== "all" || f.artist !== "all" || f.price !== "all";
  return (
    <div className="wrap">
      <PageHead title="Acervo" label="Somente membros" intro={`Olá, ${firstName(me.full_name)}. Estas obras só estão disponíveis dentro da rede. Reserve pelo preço ou envie uma proposta diretamente à artista.`}
        count={<>{all.filter((a) => a.status === "published").length} disponíveis<br />{arts.length} artistas</>} />
      <div className="filters" role="region" aria-label="Filtros">
        <div className="frow" role="group" aria-label="Categoria"><span className="lab">Categoria</span>{chip("cat", "all", "Todas")}{Object.keys(CAT).map((k) => chip("cat", k, CAT[k]))}</div>
        <div className="frow" role="group" aria-label="Artista"><span className="lab">Artista</span>{chip("artist", "all", "Todos")}{arts.map((a: any) => chip("artist", a.id, a.display_name))}</div>
        <div className="frow" role="group" aria-label="Preço"><span className="lab">Preço</span>{Object.keys(PRICE).map((k) => chip("price", k, PRICE[k][0]))}</div>
        <div className="frow"><label className="lab" htmlFor="sort">Ordenar</label><div className="sortwrap"><SortSelect value={f.sort} /></div></div>
      </div>
      <div className="results-meta" aria-live="polite"><span>{list.length} {list.length === 1 ? "obra" : "obras"}</span>{any && <Link href={f.sort === "new" ? "/colecionador" : `/colecionador?sort=${f.sort}`} scroll={false} className="linkbtn">Limpar filtros</Link>}</div>
      {list.length ? <div className="board cat">{list.map((a) => <WorkCard key={a.id} a={a} href={`/colecionador/obras/${a.slug}`} sub={a.artist?.display_name} fav={favs.includes(a.id)}
          foot={<><span className="price">{brl(a.price)}<small>{a.status === "published" ? "Disponível" : "Indisponível no momento"}</small></span><span className="go">Ver <Icon n="right" /></span></>} />)}</div>
        : <Empty title="Nenhuma obra com esses filtros." body="Experimente outra categoria, artista ou faixa de preço."><Link className="btn ghost" href="/colecionador">Limpar filtros <Icon n="x" /></Link></Empty>}
    </div>
  );
}
