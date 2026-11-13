import Link from "next/link";
import { ArtImage } from "./ArtImage";
import { Icon } from "./Icon";
import { initials, brl, catNo } from "@/lib/format";
import { TOPICS, personName, personLine, ago, type Post, type Comment } from "@/lib/community";
export { ago };
import { SaveBtn, InterestBtn, ReportBtn, DeleteBtn, LikeBtn, Thread } from "./diary-client";

export type Viewer = { id: string; role: "artist" | "buyer" | "admin" };

/** Publicação da comunidade. No feed mostra os últimos comentários; na página da publicação, a conversa inteira. */
export function PostCard({ p, viewer, saved, liked, interested, base, comments = [], full }: {
  p: Post; viewer: Viewer; saved?: boolean; liked?: boolean; interested?: boolean; base: string; comments?: Comment[]; full?: boolean;
}) {
  const mine = viewer.id === p.author.id;
  const href = `${base}/${p.id}`;
  const authorHref = p.author.role === "artist" && viewer.role === "buyer" ? `/colecionador/artistas/${p.author.member_code}` : null;
  const workHref = p.work ? (viewer.role === "buyer" ? `/colecionador/obras/${p.work.slug}` : mine ? `/artista/obras/${p.work.slug}` : null) : null;
  const media = p.media.length ? p.media : p.kind === "obra_nova" && p.work ? [{ id: "w", position: 0, path: p.work.image_path, gen: p.work.gen, w: p.work.img_w || p.work.w, h: p.work.img_h || p.work.h }] : [];
  const name = personName(p.author);
  const shown = full ? comments : comments.filter((c) => !c.parent_id).slice(-2);
  return (
    <article className={"post" + (p.removed_at ? " removed" : "") + (full ? " full" : "")} id={`post-${p.id}`}>
      <header className="post-head">
        <span className={"av" + (p.author.role === "buyer" ? " av-buyer" : "")} aria-hidden="true">{p.author.role === "artist" || p.author.show_name ? initials(p.author.display_name) : "C"}</span>
        <span className="post-who">{authorHref ? <Link href={authorHref}><b>{name}</b></Link> : <b>{name}</b>}
          <span>{personLine(p.author)}</span></span>
        <span className="post-when"><span className={"topic t-" + p.topic}>{TOPICS[p.topic]?.[0] || "Conversa"}</span>
          {full ? <time dateTime={p.created_at}>{ago(p.created_at)}</time> : <Link href={href} className="post-time"><time dateTime={p.created_at}>{ago(p.created_at)}</time></Link>}</span>
      </header>
      {media.length > 0 && (
        <div className="post-media" data-count={media.length}>
          {media.map((m, i) => (
            <figure key={m.id} className="post-shot">
              <ArtImage a={{ title: p.work?.title || `Publicação de ${name}`, year: new Date(p.created_at).getFullYear(), h: m.h, w: m.w, gen: m.gen, image_path: m.path, img_w: m.path ? m.w : null, img_h: m.path ? m.h : null }} />
              {media.length > 1 && <figcaption>{i + 1} / {media.length}</figcaption>}
            </figure>))}
        </div>)}
      {p.body && <p className={"post-body" + (!full && p.body.length > 420 ? " clamp" : "")}>{p.body}</p>}
      {!full && p.body.length > 420 && <Link href={href} className="post-more">Ler tudo</Link>}
      {p.work && (
        <div className="post-work">
          <span className="lab">{catNo(p.work.no)} · {p.work.year}</span>
          {workHref ? <Link href={workHref}><b>{p.work.title}</b></Link> : <b>{p.work.title}</b>}
          <span className="hint">{p.work.medium}{viewer.role !== "artist" || mine ? ` · ${brl(p.work.price)}` : ""}{p.work.status !== "published" ? " · indisponível" : ""}</span>
        </div>)}
      {p.removed_at && <p className="err-box" style={{ margin: "0 16px 16px" }}>Removida pela administração{p.removed_reason ? `: ${p.removed_reason}` : "."}</p>}
      <footer className="post-actions">
        {viewer.role !== "admin" ? <LikeBtn postId={p.id} on={!!liked} count={p.likes} /> : <span className="post-icon static"><Icon n="heart" /><span>{p.likes}</span></span>}
        {full ? <span className="post-icon static"><Icon n="chat" /><span>{p.comments}</span></span>
          : <Link className="post-icon" href={`${href}#comentar`} aria-label={`Comentar (${p.comments} comentários)`}><Icon n="chat" /><span>{p.comments || "Comentar"}</span></Link>}
        {viewer.role !== "admin" && !mine && <SaveBtn postId={p.id} on={!!saved} />}
        {viewer.role === "buyer" && p.author.role === "artist" && <InterestBtn postId={p.id} done={!!interested} hasWork={!!p.work && p.work.status === "published"} />}
        <span style={{ flex: 1 }} />
        {mine ? <DeleteBtn postId={p.id} after={full ? base : undefined} /> : viewer.role !== "admin" && <ReportBtn postId={p.id} />}
      </footer>
      {(full || shown.length > 0) && (
        <div className="post-thread">
          {!full && p.comments > shown.length && <Link href={href} className="thread-more">Ver {p.comments === 1 ? "o comentário" : `os ${p.comments} comentários`}</Link>}
          <Thread postId={p.id} postAuthorId={p.author.id} viewer={viewer} comments={shown} full={!!full} />
        </div>)}
    </article>
  );
}
