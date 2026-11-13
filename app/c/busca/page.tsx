import { rnCtx } from "@/lib/rn";
import { feed, myLikes } from "@/lib/diary";
import Link from "next/link";
import { NoteGrid } from "@/components/rn/Notes";
import { SearchBox } from "@/components/rn/Shell";
import { TOPICS, type Topic } from "@/lib/diary";

export const metadata = { title: "Busca" };

export default async function Busca({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { me, base } = await rnCtx(); const q = ((await searchParams).q || "").trim();
  const [f, likes] = await Promise.all([q ? feed(me.id, "tudo", null, undefined, q, 40) : Promise.resolve({ posts: [], more: false }), myLikes(me.id)]);
  return (
    <div className="rn-wrap">
      <SearchBox base={base} q={q} />
      {!q && <><p className="lab rn-pad" style={{ margin: "18px 0 10px" }}>Explorar por espaço</p>
        <nav className="rn-chips wrap-chips" aria-label="Espaços">{(Object.keys(TOPICS) as Topic[]).map((t) => <Link key={t} href={`${base}/?t=${t}`}>{TOPICS[t][0]}</Link>)}</nav></>}
      {q && <h1 className="rn-h1">Resultados para <em>“{q}”</em></h1>}
      {f.posts.length ? <NoteGrid posts={f.posts} base={base} likes={likes} />
        : q ? <div className="rn-empty"><b>Nenhuma nota encontrada.</b><span>Tente o nome de uma técnica, de uma obra ou de uma cidade.</span></div> : null}
    </div>
  );
}
