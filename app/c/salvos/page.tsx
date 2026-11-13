import { rnCtx } from "@/lib/rn";
import { feed, myLikes } from "@/lib/diary";
import { NoteGrid } from "@/components/rn/Notes";

export const metadata = { title: "Salvos" };
export default async function Salvos() {
  const { me, base } = await rnCtx();
  const [f, likes] = await Promise.all([feed(me.id, "salvos", null, undefined, undefined, 60), myLikes(me.id)]);
  return (
    <div className="rn-wrap">
      <h1 className="rn-h1">Salvos</h1>
      {f.posts.length ? <NoteGrid posts={f.posts} base={base} likes={likes} /> : <div className="rn-empty"><b>Nada salvo ainda.</b><span>Toque em Salvar numa nota para guardar aqui.</span></div>}
    </div>
  );
}
