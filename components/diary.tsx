import Link from "next/link";
import { ArtImage } from "./ArtImage";
import { initials, brl, dateBR, catNo } from "@/lib/format";
import type { Post } from "@/lib/diary";
import { SaveBtn, InterestBtn, ReportBtn, DeleteBtn } from "./diary-client";

const ago = (iso: string) => {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 3600) return `há ${Math.max(1, Math.round(s / 60))} min`;
  if (s < 86400) return `há ${Math.round(s / 3600)} h`;
  if (s < 7 * 86400) return `há ${Math.round(s / 86400)} ${Math.round(s / 86400) === 1 ? "dia" : "dias"}`;
  return dateBR(iso);
};

export function PostCard({ p, viewer, saved, interested, artistHref }: {
  p: Post; viewer: { id: string; role: "artist" | "buyer" | "admin" }; saved?: boolean; interested?: boolean; artistHref?: string;
}) {
  const mine = viewer.id === p.artist.id;
  const workHref = p.work ? (viewer.role === "artist" ? (mine ? `/artista/obras/${p.work.slug}` : null) : `/colecionador/obras/${p.work.slug}`) : null;
  const media = p.media.length ? p.media : p.kind === "obra_nova" && p.work ? [{ id: "w", position: 0, path: p.work.image_path, gen: p.work.gen, w: p.work.img_w || p.work.w, h: p.work.img_h || p.work.h }] : [];
  return (
    <article className={"post" + (p.removed_at ? " removed" : "")} id={`post-${p.id}`}>
      <header className="post-head">
        <span className="av" aria-hidden="true">{initials(p.artist.display_name)}</span>
        <span className="post-who">{artistHref ? <Link href={artistHref}><b>{p.artist.display_name}</b></Link> : <b>{p.artist.display_name}</b>}
          <span>{p.artist.practice} · {p.artist.city}</span></span>
        <span className="post-when">{p.kind === "obra_nova" && <span className="tag t-pub">Obra nova</span>}<time dateTime={p.created_at}>{ago(p.created_at)}</time></span>
      </header>
      {media.length > 0 && (
        <div className="post-media" data-count={media.length}>
          {media.map((m, i) => (
            <figure key={m.id} className="post-shot">
              <ArtImage a={{ title: p.work?.title || `Diário de ${p.artist.display_name}`, year: new Date(p.created_at).getFullYear(), h: m.h, w: m.w, gen: m.gen, image_path: m.path, img_w: m.path ? m.w : null, img_h: m.path ? m.h : null }} />
              {media.length > 1 && <figcaption>{i + 1} / {media.length}</figcaption>}
            </figure>))}
        </div>)}
      {p.body && <p className="post-body">{p.body}</p>}
      {p.work && (
        <div className="post-work">
          <span className="lab">{catNo(p.work.no)} · {p.work.year}</span>
          {workHref ? <Link href={workHref}><b>{p.work.title}</b></Link> : <b>{p.work.title}</b>}
          <span className="hint">{p.work.medium}{viewer.role !== "artist" || mine ? ` · ${brl(p.work.price)}` : ""}{p.work.status !== "published" ? " · indisponível" : ""}</span>
        </div>)}
      {p.removed_at && <p className="err-box" style={{ margin: "0 16px 16px" }}>Removida pela administração{p.removed_reason ? `: ${p.removed_reason}` : "."}</p>}
      <footer className="post-actions">
        {viewer.role !== "admin" && !mine && <SaveBtn postId={p.id} on={!!saved} />}
        {viewer.role === "buyer" && <InterestBtn postId={p.id} done={!!interested} hasWork={!!p.work && p.work.status === "published"} />}
        <span style={{ flex: 1 }} />
        {mine ? <DeleteBtn postId={p.id} /> : viewer.role !== "admin" && <ReportBtn postId={p.id} />}
      </footer>
    </article>
  );
}
