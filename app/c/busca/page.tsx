import { rnCtx } from "@/lib/rn";
import { feed, myLikes } from "@/lib/diary";
import { NoteGrid } from "@/components/rn/Notes";

export const metadata = { title: "Busca" };

export default async function Busca({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { me, base } = await rnCtx(); const q = ((await searchParams).q || "").trim();
  const [f, likes] = await Promise.all([q ? feed(me.id, "tudo", null, undefined, q, 40) : Promise.resolve({ posts: [], more: false }), myLikes(me.id)]);
  return (
    <div className="rn-wrap">
      <h1 className="rn-h1">{q ? <>Resultados para <em>“{q}”</em></> : "Buscar na comunidade"}</h1>
      {f.posts.length ? <NoteGrid posts={f.posts} base={base} likes={likes} />
        : <div className="rn-empty"><b>{q ? "Nenhuma nota encontrada." : "Digite no campo de busca."}</b><span>Tente o nome de uma técnica, de uma obra ou de uma cidade.</span></div>}
    </div>
  );
}
