import Link from "next/link";
import { ArtImage } from "../ArtImage";
import { Avatar as AvatarImg, OfficialBadge } from "../Avatar";
import { Icon } from "../Icon";
import { initials, brl, catNo } from "@/lib/format";
import { TOPICS, personName, personLine, ago, noteTitle, type Post, type Comment } from "@/lib/community";
import { Heart, Masonry, Carousel, SaveToggle, ShareBtn, CommentPill, PreviewLink, ModalBack } from "./client";
import { BackBtn } from "./Shell";
import { Thread, FollowBtn, InterestBtn, ReportBtn, DeleteBtn, ModerateBtn } from "../diary-client";

const cover = (p: Post) => p.media[0] || (p.work ? { id: "w", position: 0, path: p.work.image_path, gen: p.work.gen, w: p.work.img_w || p.work.w, h: p.work.img_h || p.work.h } : null);
const art = (p: Post, m: { h: number; w: number; gen: any; path: string | null }) =>
  ({ title: p.work?.title || noteTitle(p), year: new Date(p.created_at).getFullYear(), h: m.h, w: m.w, gen: m.gen, image_path: m.path, img_w: m.path ? m.w : null, img_h: m.path ? m.h : null });
export function Avatar({ p, sm }: { p: Post["author"]; sm?: boolean }) {
  return <AvatarImg p={p} className={"rn-av" + (sm ? " sm" : "")} />;
}

/** Card da grade: capa, título, autor e curtidas. Notas sem foto viram cartão de texto. */
export function NoteCard({ p, base, liked }: { p: Post; base: string; liked: boolean }) {
  const c = cover(p);
  return (
    <article className="rn-card">
      <PreviewLink href={`${base}/p/${p.id}`} className="rn-card-link" preview={{ id: p.id, title: noteTitle(p), author: personName(p.author), line: personLine(p.author), ini: p.author.role === "artist" || p.author.show_name ? initials(p.author.display_name) : "C", buyer: p.author.role === "buyer", ratio: c ? c.w / c.h : 0.75, topic: TOPICS[p.topic]?.[0] || "" }}>
        {c ? <div className="rn-cover" style={{ aspectRatio: `${Math.max(.75, Math.min(1.34, c.w / c.h))}` }}><ArtImage a={art(p, c)} max={560} />{p.media.length > 1 && <span className="rn-multi" aria-label={`${p.media.length} fotos`}><Icon n="image" />{p.media.length}</span>}</div>
          : <div className={"rn-textcover t-" + p.topic}><span>#{TOPICS[p.topic]?.[0]}</span><p>{noteTitle(p)}</p></div>}
        <h3 className="rn-card-title">{noteTitle(p)}</h3>
      </PreviewLink>
      <div className="rn-card-foot">
        <Link href={`${base}/u/${p.author.member_code}`} prefetch={false} className="rn-author"><Avatar p={p.author} sm /><span>{personName(p.author)}<OfficialBadge p={p.author} /></span></Link>
        <Heart postId={p.id} on={liked} count={p.likes} />
      </div>
    </article>
  );
}
export const noteHeight = (p: Post) => { const c = cover(p); return (c ? 1 / Math.max(.75, Math.min(1.34, c.w / c.h)) : .9) + .32; };
export function NoteGrid({ posts, base, likes }: { posts: Post[]; base: string; likes: Set<string> }) {
  return <Masonry heights={posts.map(noteHeight)}>{posts.map((p) => <NoteCard key={p.id} p={p} base={base} liked={likes.has(p.id)} />)}</Masonry>;
}

/** Nota aberta: carrossel, autor, texto, obra ligada, conversa e barra de ações. */
export function NoteView({ p, base, viewer, liked, saved, following, interested, comments, main, modal }: {
  p: Post; base: string; viewer: { id: string; role: "artist" | "buyer" | "admin" }; liked: boolean; saved: boolean; following: boolean; interested: boolean; comments: Comment[]; main: string; modal?: boolean;
}) {
  const mine = p.author.id === viewer.id;
  const media = p.media.length ? p.media : cover(p) ? [cover(p)!] : [];
  const workHref = p.work ? (viewer.role === "buyer" ? `${main}/colecionador/obras/${p.work.slug}` : mine ? `${main}/artista/obras/${p.work.slug}` : null) : null;
  return (
    <article className={"rn-note" + (modal ? " in-modal" : "")}>
      <header className="rn-note-head rn-note-top">
        {modal ? <ModalBack /> : <BackBtn base={base} />}
        <Link href={`${base}/u/${p.author.member_code}`} className="rn-author lg"><Avatar p={p.author} /><span><b>{personName(p.author)}<OfficialBadge p={p.author} /></b><small>{personLine(p.author)}</small></span></Link>
        {!mine && p.author.role === "artist" && <FollowBtn artistId={p.author.id} on={following} compact />}
      </header>
      <div className="rn-note-media">
        {media.length ? <Carousel count={media.length} likeId={p.id}>{media.map((m) => <figure key={m.id} className="rn-slide"><ArtImage a={art(p, m)} /></figure>)}</Carousel>
          : <div className={"rn-textcover big t-" + p.topic}><span>#{TOPICS[p.topic]?.[0]}</span><p>{noteTitle(p)}</p></div>}
      </div>
      <div className="rn-note-side">
        <header className="rn-note-head">
          <Link href={`${base}/u/${p.author.member_code}`} className="rn-author lg"><Avatar p={p.author} /><span><b>{personName(p.author)}<OfficialBadge p={p.author} /></b><small>{personLine(p.author)}</small></span></Link>
          {!mine && viewer.role !== "admin" && p.author.role === "artist" && <FollowBtn artistId={p.author.id} on={following} compact />}
        </header>
        <div className="rn-note-body">
          <h1>{noteTitle(p)}</h1>
          {p.body && p.body !== p.title && <p className="rn-text">{p.body}</p>}
          <p className="rn-tags"><Link href={`${base}/?t=${p.topic}`}>#{TOPICS[p.topic]?.[0]}</Link>{p.work && <span>#{p.work.title.replace(/\s+/g, "")}</span>}</p>
          {p.work && <div className="rn-work-card">
            <span className="lab">{catNo(p.work.no)} · {p.work.year}</span>
            <b>{p.work.title}</b><span className="hint">{p.work.medium}{viewer.role === "buyer" || mine ? ` · ${brl(p.work.price)}` : ""}{p.work.status !== "published" ? " · indisponível" : ""}</span>
            {workHref && <a className="btn sm" href={workHref}>{viewer.role === "buyer" ? "Ver obra no acervo" : "Gerenciar obra"} <Icon n="right" /></a>}
          </div>}
          <p className="rn-meta"><time dateTime={p.created_at}>{ago(p.created_at)}</time> · {p.author.city}</p>
          {viewer.role === "admin" && <div className="rn-mod">
            <p className="lab"><Icon n="shield" /> Moderação{p.removed_at ? ` · removida${p.removed_reason ? `: ${p.removed_reason}` : ""}` : ""}</p>
            <ModerateBtn postId={p.id} removed={!!p.removed_at} />
            <a className="linkbtn" href={`${base}/u/${p.author.member_code}`}>Ver perfil do autor (suspender)</a>
          </div>}
          {viewer.role !== "admin" && <div className="rn-note-acts">
            {viewer.role === "buyer" && p.author.role === "artist" && <InterestBtn postId={p.id} done={interested} hasWork={!!p.work && p.work.status === "published"} />}
            <span style={{ flex: 1 }} />
            {mine ? <DeleteBtn postId={p.id} after={base || "/"} /> : <ReportBtn postId={p.id} />}
          </div>}
          <section className="rn-comments" aria-label="Comentários">
            <h2>{p.comments} {p.comments === 1 ? "comentário" : "comentários"}</h2>
            <Thread postId={p.id} postAuthorId={p.author.id} viewer={viewer} comments={comments} full />
          </section>
        </div>
        <div className="rn-bar">
          {viewer.role !== "admin" ? <><CommentPill />
          <Heart postId={p.id} on={liked} count={p.likes} big />
          {!mine && <SaveToggle postId={p.id} on={saved} />}</> : <span className="rn-pill" style={{ cursor: "default" }}><Icon n="heart" />{p.likes} curtidas · {p.comments} comentários</span>}
          <ShareBtn title={noteTitle(p)} />
        </div>
      </div>
    </article>
  );
}

/** Grade do perfil (como no Instagram): quadrados de 3 colunas, curtidas e comentários aparecem ao passar o mouse. */
export function ProfileGrid({ posts, base, likes }: { posts: Post[]; base: string; likes: Set<string> }) {
  void likes;
  return (
    <div className="ig-grid">{posts.map((p) => { const c = cover(p); return (
      <PreviewLink key={p.id} href={`${base}/p/${p.id}`} className="ig-tile" preview={{ id: p.id, title: noteTitle(p), author: personName(p.author), line: personLine(p.author), ini: p.author.role === "artist" || p.author.show_name ? initials(p.author.display_name) : "C", buyer: p.author.role === "buyer", ratio: c ? c.w / c.h : .75, topic: TOPICS[p.topic]?.[0] || "" }}>
        {c ? <ArtImage a={art(p, c)} max={560} /> : <span className={"ig-tile-text t-" + p.topic}>{noteTitle(p)}</span>}
        {p.media.length > 1 && <span className="ig-tile-multi"><Icon n="image" /></span>}
        <span className="ig-tile-hover"><span><Icon n="heart" />{p.likes}</span><span><Icon n="chat" />{p.comments}</span></span>
      </PreviewLink>); })}</div>
  );
}
