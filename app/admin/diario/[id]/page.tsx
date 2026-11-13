import Link from "next/link";
import { notFound } from "next/navigation";
import { postById, commentsFor } from "@/lib/diary";
import { PostCard } from "@/components/diary";
import { ModerateBtn } from "@/components/diary-client";
import { Icon } from "@/components/Icon";

export const metadata = { title: "Comunidade · publicação" };

export default async function PublicacaoAdmin({ params }: { params: Promise<{ id: string }> }) {
  const p = await postById((await params).id); if (!p) notFound();
  const cs = await commentsFor([p.id]);
  return (
    <div className="wrap post-page">
      <Link className="backlink always" href="/admin/diario"><Icon n="left" />Moderação</Link>
      <PostCard full p={p} base="/admin/diario" viewer={{ id: "", role: "admin" }} comments={cs[p.id] || []} />
      <div style={{ paddingTop: 16 }}><ModerateBtn postId={p.id} removed={!!p.removed_at} /></div>
      <div style={{ height: "clamp(72px,10vw,140px)" }} />
    </div>
  );
}
