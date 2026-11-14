import { Suspense } from "react";
import { notFound } from "next/navigation";
import { rnCtx } from "@/lib/rn";
import { postById, commentsFor, mySaves, myLikes, myFollows, myInterests, feed, noteTitle } from "@/lib/diary";
import { NoteView, NoteGrid } from "@/components/rn/Notes";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const p = await postById((await params).id); return { title: p ? noteTitle(p) : "Nota" };
}

export default async function Nota({ params }: { params: Promise<{ id: string }> }) {
  const { me, base, main } = await rnCtx();
  const p = await postById((await params).id);
  if (!p || (p.removed_at && p.author.id !== me.id)) notFound();
  const [cs, saves, likes, follows, ints] = await Promise.all([commentsFor([p.id]), mySaves(me.id), myLikes(me.id), myFollows(me.id),
    me.role === "buyer" ? myInterests(me.id) : Promise.resolve(new Set<string>())]);
  return (
    <div className="rn-wrap rn-notepage">
      <NoteView p={p} base={base} main={main} viewer={{ id: me.id, role: me.role }} liked={likes.has(p.id)} saved={saves.has(p.id)} following={follows.has(p.author.id)} interested={ints.has(p.id)} comments={cs[p.id] || []} />
      <Suspense fallback={null}><Related id={p.id} topic={p.topic} meId={me.id} base={base} likes={likes} /></Suspense>
    </div>
  );
}

/** "Mais notas" chega depois, sem atrasar a abertura da nota. */
async function Related({ id, topic, meId, base, likes }: { id: string; topic: any; meId: string; base: string; likes: Set<string> }) {
  const more = await feed(meId, "tudo", topic, undefined, undefined, 13);
  const rel = more.posts.filter((x) => x.id !== id).slice(0, 12);
  return rel.length ? <section className="rn-related" aria-label="Mais notas"><h2 className="rn-h2">Mais notas</h2><NoteGrid posts={rel} base={base} likes={likes} /></section> : null;
}
