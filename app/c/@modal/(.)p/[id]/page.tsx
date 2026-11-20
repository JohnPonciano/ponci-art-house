import { notFound } from "next/navigation";
import { rnCtx } from "@/lib/rn";
import { postById, commentsFor, mySaves, myLikes, myFollows, myInterests } from "@/lib/diary";
import { NoteView } from "@/components/rn/Notes";
import { NoteModal } from "@/components/rn/client";

/** Nota aberta por cima do feed (como no Instagram): fecha e o feed continua onde estava. */
export default async function NotaModal({ params }: { params: Promise<{ id: string }> }) {
  const { me, base, main, isAdmin } = await rnCtx();
  const p = await postById((await params).id);
  if (!p || (p.removed_at && p.author.id !== me.id && !isAdmin)) notFound();
  const [cs, saves, likes, follows, ints] = await Promise.all([commentsFor([p.id]), mySaves(me.id), myLikes(me.id), myFollows(me.id),
    me.role === "buyer" ? myInterests(me.id) : Promise.resolve(new Set<string>())]);
  return (
    <NoteModal>
      <NoteView p={p} base={base} main={main} viewer={{ id: me.id, role: me.role }} liked={likes.has(p.id)} saved={saves.has(p.id)} following={follows.has(p.author.id)} interested={ints.has(p.id)} comments={cs[p.id] || []} modal />
    </NoteModal>
  );
}
