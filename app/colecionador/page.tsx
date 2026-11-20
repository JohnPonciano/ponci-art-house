import Link from "next/link";
import { Suspense } from "react";
import { requireMember, isAdminView } from "@/lib/supabase/server";
import { artists, catalogue, favoriteIds } from "@/lib/data";
import { Empty } from "@/components/ui";
import { GalleryCard, Room, Feature } from "@/components/Gallery";
import { GalleryFilters } from "@/components/GalleryClient";
import { Icon } from "@/components/Icon";
import { CAT, firstName } from "@/lib/format";

export const metadata = { title: "Acervo" };
const PRICE: Record<string, [string, number, number]> = { all: ["Todas", 0, Infinity], a: ["Até R$ 20 mil", 0, 20000], b: ["R$ 20 mil a 60 mil", 20000, 60000], c: ["Acima de R$ 60 mil", 60000, Infinity] };
const SORT: Record<string, string> = { new: "Mais recentes", low: "Menor preço", high: "Maior preço" };

export default async function Acervo({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const me = await requireMember("buyer");
  const sp = await searchParams;
  const f = { cat: sp.cat || "all", artist: sp.artist || "all", price: PRICE[sp.price] ? sp.price : "all", sort: SORT[sp.sort] ? sp.sort : "new" };
  const [all, arts, favs] = await Promise.all([catalogue(), artists(), favoriteIds(me.id)]);
  const [, lo, hi] = PRICE[f.price];
  const by: Record<string, (x: any, y: any) => number> = { new: (x, y) => y.created_at.localeCompare(x.created_at), low: (x, y) => x.price - y.price, high: (x, y) => y.price - x.price };
  const avail = (x: any) => (x.status === "published" ? 0 : 1);
  const list = all.filter((a) => (f.cat === "all" || a.cat === f.cat) && (f.artist === "all" || a.artist_id === f.artist) && a.price >= lo && a.price < hi)
    .sort((x, y) => avail(x) - avail(y) || by[f.sort](x, y));
  const filtering = sp.ver === "todas" || f.cat !== "all" || f.artist !== "all" || f.price !== "all" || f.sort !== "new";
  const adm = isAdminView(me);
  const fav = (id: string) => (adm ? undefined : favs.includes(id)) as boolean;
  const pub = all.filter((a) => a.status === "published");
  const featured = [...pub].sort((x, y) => y.created_at.localeCompare(x.created_at))[0];
  const withWorks = arts.filter((a: any) => all.some((w) => w.artist_id === a.id));
  const cats = Object.keys(CAT).filter((k) => all.some((w) => w.cat === k));
  const cards = (ws: typeof all) => ws.map((a) => <GalleryCard key={a.id} a={a} fav={fav(a.id)} />);
  const label = [f.cat !== "all" && CAT[f.cat], f.artist !== "all" && arts.find((a: any) => a.id === f.artist)?.display_name, f.price !== "all" && PRICE[f.price][0]].filter(Boolean).join(" · ");
  return (
    <div className="wrap gallery">
      <header className="g-head">
        <div><span className="lab">Acervo · somente membros</span><h1>Acervo</h1></div>
        <p>{adm ? "Visualizando como admin. " : `Olá, ${firstName(me.full_name)}. `}{pub.length} obras disponíveis de {withWorks.length} artistas, só dentro da rede.</p>
      </header>
      <Suspense>
        <GalleryFilters total={list.length}
          cats={[["all", "Todas"], ...cats.map((k) => [k, CAT[k]] as [string, string])]}
          artists={[["all", "Todos"], ...withWorks.map((a: any) => [a.id, a.display_name] as [string, string])]}
          prices={Object.keys(PRICE).map((k) => [k, PRICE[k][0]] as [string, string])}
          sorts={Object.keys(SORT).map((k) => [k, SORT[k]] as [string, string])} />
      </Suspense>

      {filtering ? <>
        <div className="results-meta" aria-live="polite"><span>{list.length} {list.length === 1 ? "obra" : "obras"}{label ? ` · ${label}` : ""}</span><Link href="/colecionador" scroll={false} className="linkbtn">Voltar às salas</Link></div>
        {list.length ? <div className="g-grid">{cards(list)}</div>
          : <Empty title="Nenhuma obra com esses filtros." body="Experimente outra técnica, artista ou faixa de preço."><Link className="btn ghost" href="/colecionador">Limpar filtros <Icon n="x" /></Link></Empty>}
      </> : <>
        {featured && <Feature a={featured} fav={fav(featured.id)} />}
        <Room n="Sala 01" title={<>Recém-<em>chegadas</em></>} sub="Aprovadas pela curadoria nas últimas semanas." href="/colecionador?ver=todas" linkText="Ver todas as obras">
          {cards([...all].sort((x, y) => avail(x) - avail(y) || by.new(x, y)).filter((a) => a.id !== featured?.id).slice(0, 10))}</Room>
        {withWorks.map((ar: any, i: number) => {
          const ws = all.filter((w) => w.artist_id === ar.id).sort((x, y) => avail(x) - avail(y) || by.new(x, y)); const a0 = ws[0];
          return <Room key={ar.id} n={`Sala ${String(i + 2).padStart(2, "0")}`} title={ar.display_name} sub={a0?.artist ? `${a0.artist.practice} · ${a0.artist.city} · ${ws.length} ${ws.length === 1 ? "obra" : "obras"}` : undefined}
            href={a0?.artist?.member_code ? `/colecionador/artistas/${a0.artist.member_code}` : `/colecionador?artist=${ar.id}`} linkText="Perfil da artista">{cards(ws)}</Room>;
        })}
        {all.some((a) => a.price < 20000 && a.status === "published") && <Room n="Para começar" title={<>Até <em>R$ 20 mil</em></>} sub="Obras de entrada para uma primeira aquisição." href="/colecionador?price=a">{cards(all.filter((a) => a.price < 20000).sort((x, y) => avail(x) - avail(y) || x.price - y.price))}</Room>}
        {cats.filter((k) => all.filter((w) => w.cat === k).length >= 2).map((k) => (
          <Room key={k} n="Técnica" title={CAT[k]} href={`/colecionador?cat=${k}`}>{cards(all.filter((w) => w.cat === k).sort((x, y) => avail(x) - avail(y) || by.new(x, y)))}</Room>))}
      </>}
      <div style={{ height: "clamp(56px,8vw,120px)" }} />
    </div>
  );
}
