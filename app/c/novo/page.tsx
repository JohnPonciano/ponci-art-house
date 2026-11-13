import { rnCtx } from "@/lib/rn";
import { worksByArtist } from "@/lib/data";
import { NoteComposer } from "@/components/rn/client";
import { TOPICS, type Topic } from "@/lib/diary";

export const metadata = { title: "Publicar" };
export default async function Novo({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { me, base } = await rnCtx(); const t = (await searchParams).t;
  const works = me.role === "artist" ? (await worksByArtist(me.id)).filter((w) => w.status === "published") : [];
  return (
    <div className="rn-wrap rn-narrow">
      <h1 className="rn-h1">Nova nota</h1>
      <NoteComposer userId={me.id} role={me.role} base={base} works={works.map((w) => ({ id: w.id, title: w.title }))} topic={t && t in TOPICS ? (t as Topic) : null} />
    </div>
  );
}
