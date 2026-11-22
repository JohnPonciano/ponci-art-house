import { redirect } from "next/navigation";
import { rnCtx } from "@/lib/rn";
import { worksByArtist } from "@/lib/data";
import { officialId } from "@/lib/diary";
import { NoteComposer } from "@/components/rn/client";
import { TOPICS, type Topic } from "@/lib/diary";

export const metadata = { title: "Publicar" };
export default async function Novo({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { me, base, isAdmin } = await rnCtx(); const t = (await searchParams).t;
  if (isAdmin) {
    const official = await officialId();
    if (!official) redirect(base || "/");
    return (
      <div className="rn-wrap rn-narrow">
        <h1 className="rn-h1">Publicar como PONCI</h1>
        <p className="hint" style={{ marginBottom: 16 }}>A nota sai no perfil oficial @ponci.art, com o selo de oficial. Use para tutoriais, avisos e novidades da rede.</p>
        <NoteComposer userId={official} role="admin" base={base} works={[]} topic={t && t in TOPICS ? (t as Topic) : null} />
      </div>);
  }
  const works = me.role === "artist" ? (await worksByArtist(me.id)).filter((w) => w.status === "published") : [];
  return (
    <div className="rn-wrap rn-narrow">
      <h1 className="rn-h1">Nova nota</h1>
      <NoteComposer userId={me.id} role={me.role} base={base} works={works.map((w) => ({ id: w.id, title: w.title }))} topic={t && t in TOPICS ? (t as Topic) : null} />
    </div>
  );
}
