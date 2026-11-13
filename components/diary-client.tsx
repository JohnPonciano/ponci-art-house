"use client";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "./Icon";
import { useToast } from "./Toast";
import { createClient } from "@/lib/supabase/client";
import * as D from "@/app/diary-actions";
import { personName, ago, TOPICS, POSTABLE, type Comment, type Topic } from "@/lib/community";
import { initials } from "@/lib/format";

function useRun() {
  const toast = useToast(); const router = useRouter(); const [pending, start] = useTransition();
  const run = (fn: () => Promise<any>, ok?: string, after?: (d: any) => void) => start(async () => {
    const r = await fn(); if (!r.ok) { toast(r.error); return; } if (ok) toast(ok); after ? after(r.data) : router.refresh();
  });
  return { run, pending, router, toast };
}

export function SaveBtn({ postId, on }: { postId: string; on: boolean }) {
  const { run, pending } = useRun();
  return <button type="button" className="post-icon" aria-pressed={on} disabled={pending} onClick={() => run(() => D.toggleSave(postId, !on), on ? "Removida dos salvos." : "Salva.")}
    aria-label={on ? "Remover dos salvos" : "Salvar publicação"}><Icon n="bookmark" /><span>{on ? "Salvo" : "Salvar"}</span></button>;
}

export function InterestBtn({ postId, done, hasWork }: { postId: string; done: boolean; hasWork: boolean }) {
  const { run, pending, router } = useRun();
  if (done) return <span className="tag t-accepted">Interesse enviado</span>;
  return <button type="button" className="btn sm" disabled={pending} onClick={() => run(() => D.registerInterest(postId), hasWork ? undefined : "A artista foi avisada do seu interesse.",
    (slug) => slug ? router.push(`/colecionador/obras/${slug}#oferta`) : router.refresh())}>Tenho interesse <Icon n="right" /></button>;
}

export function FollowBtn({ artistId, on, compact }: { artistId: string; on: boolean; compact?: boolean }) {
  const { run, pending } = useRun();
  return <button type="button" className={on ? "btn sm ghost" : "btn sm"} disabled={pending} onClick={() => run(() => D.toggleFollow(artistId, !on), on ? "Você deixou de seguir." : "Agora você segue esta artista.")}>
    {on ? (compact ? "Seguindo" : "Seguindo ✓") : "Seguir"}</button>;
}

export function ReportBtn({ postId }: { postId: string }) {
  const { run, pending } = useRun(); const [open, setOpen] = useState(false); const [reason, setReason] = useState("");
  if (!open) return <button type="button" className="linkbtn post-report" onClick={() => setOpen(true)}>Denunciar</button>;
  return (
    <form className="inline-form" style={{ width: "100%" }} onSubmit={(e) => { e.preventDefault(); if (reason.trim().length < 3) return; run(() => D.reportPost(postId, reason), "Denúncia enviada à administração.", () => setOpen(false)); }}>
      <input placeholder="O que há de errado com esta publicação?" value={reason} onChange={(e) => setReason(e.target.value)} aria-label="Motivo" autoFocus />
      <span style={{ display: "flex", gap: 12 }}><button className="btn sm" type="submit" disabled={pending}>Enviar</button><button type="button" className="linkbtn" onClick={() => setOpen(false)}>Cancelar</button></span>
    </form>
  );
}

export function DeleteBtn({ postId, after }: { postId: string; after?: string }) {
  const { run, pending, router } = useRun(); const [ask, setAsk] = useState(false);
  if (ask) return <span style={{ display: "inline-flex", gap: 10, alignItems: "center" }}><span className="hint">Apagar publicação?</span>
    <button className="btn sm ocre" type="button" disabled={pending} onClick={() => run(() => D.deletePost(postId), "Publicação apagada.", after ? () => router.replace(after) : undefined)}>Apagar</button>
    <button type="button" className="linkbtn" onClick={() => setAsk(false)}>Cancelar</button></span>;
  return <button type="button" className="linkbtn" onClick={() => setAsk(true)}>Apagar</button>;
}

export function MarkSeen({ count }: { count: number }) {
  const router = useRouter();
  useEffect(() => { if (count > 0) { const t = setTimeout(() => D.markInterestsSeen().then(() => router.refresh()), 2500); return () => clearTimeout(t); } }, [count, router]);
  return null;
}

export function ModerateBtn({ postId, removed }: { postId: string; removed: boolean }) {
  const { run, pending } = useRun(); const [reason, setReason] = useState("");
  if (removed) return <button type="button" className="btn sm ghost" disabled={pending} onClick={() => run(() => D.moderatePost(postId, false, ""), "Publicação restaurada.")}>Restaurar</button>;
  return (
    <form className="inline-form" onSubmit={(e) => { e.preventDefault(); run(() => D.moderatePost(postId, true, reason), "Publicação removida."); }}>
      <input placeholder="Motivo da remoção (visível para a artista)" value={reason} onChange={(e) => setReason(e.target.value)} aria-label="Motivo" />
      <button className="btn sm ocre" type="submit" disabled={pending}>Remover</button>
    </form>
  );
}

type Shot = { blob: Blob; url: string; w: number; h: number };
/** Nova publicação: fechada vira uma linha "Compartilhe com a rede…"; abre ao tocar. */
export function Composer({ userId, works = [], role, topic: initialTopic }: { userId: string; works?: { id: string; title: string }[]; role: "artist" | "buyer"; topic?: Topic | null }) {
  const { run, pending, toast } = useRun();
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState(""); const [shots, setShots] = useState<Shot[]>([]); const [workId, setWorkId] = useState(""); const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const [topic, setTopic] = useState<Topic>(initialTopic && POSTABLE.includes(initialTopic) ? initialTopic : role === "artist" ? "processo" : "geral");
  async function add(files: FileList | null) {
    if (!files) return;
    const next = [...shots];
    for (const f of Array.from(files)) {
      if (next.length >= 6) { toast("Até 6 imagens por publicação."); break; }
      if (!/^image\//.test(f.type)) continue;
      const bmp = await createImageBitmap(f); const k = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
      const cv = document.createElement("canvas"); cv.width = Math.round(bmp.width * k); cv.height = Math.round(bmp.height * k);
      cv.getContext("2d")!.drawImage(bmp, 0, 0, cv.width, cv.height);
      const blob: Blob = await new Promise((r) => cv.toBlob((b) => r(b!), "image/jpeg", 0.85));
      next.push({ blob, url: URL.createObjectURL(blob), w: cv.width, h: cv.height });
    }
    setShots(next); setOpen(true);
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    if (!body.trim() && !shots.length) { setErr("Escreva algo ou adicione uma imagem."); return; }
    setBusy(true);
    const sb = createClient(); const media: { path: string; w: number; h: number }[] = [];
    for (const s of shots) {
      const path = `${userId}/diario/${crypto.randomUUID()}.jpg`;
      const { error } = await sb.storage.from("works").upload(path, s.blob, { contentType: "image/jpeg" });
      if (error) { setBusy(false); setErr("Falha ao enviar imagem: " + error.message); return; }
      media.push({ path, w: s.w, h: s.h });
    }
    setBusy(false);
    run(() => D.createPost(body, media, workId || null, topic), "Publicado na comunidade.", () => { shots.forEach((s) => URL.revokeObjectURL(s.url)); setShots([]); setBody(""); setWorkId(""); setOpen(false); location.reload(); });
  }
  const photo = <label className="btn sm ghost" style={{ cursor: "pointer" }}><input type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => { add(e.target.files); e.target.value = ""; }} />
    <Icon n="upload" /> Fotos{shots.length ? ` (${shots.length}/6)` : ""}</label>;
  if (!open) return (
    <div className="composer closed">
      <button type="button" className="composer-open" onClick={() => setOpen(true)}><Icon n="edit" />{role === "artist" ? "Mostre o ateliê, um processo, uma novidade…" : "Compartilhe com a rede: uma pergunta, uma visita, sua coleção…"}</button>
      {photo}
    </div>);
  return (
    <form className="form composer" onSubmit={submit} noValidate>
      <div className="field"><label className="lab" htmlFor="i-body"><span>Nova publicação</span><span className="count">{body.length} / 2200</span></label>
        <textarea id="i-body" rows={4} maxLength={2200} autoFocus placeholder={role === "artist" ? "Processo, ateliê, um detalhe, uma obra em andamento…" : "Uma pergunta, uma exposição que você viu, como a obra ficou em casa…"} value={body} onChange={(e) => setBody(e.target.value)} /></div>
      <div className="composer-topics" role="radiogroup" aria-label="Espaço">
        {POSTABLE.map((t) => <button key={t} type="button" role="radio" aria-checked={topic === t} className="chip" onClick={() => setTopic(t)}>{TOPICS[t][0]}</button>)}
      </div>
      {shots.length > 0 && <div className="composer-shots">{shots.map((s, i) => (
        <figure key={s.url}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={s.url} alt={`Imagem ${i + 1}`} />
          <button type="button" aria-label="Remover imagem" onClick={() => { URL.revokeObjectURL(s.url); setShots(shots.filter((x) => x !== s)); }}><Icon n="x" /></button></figure>))}</div>}
      <div className="composer-row">
        {photo}
        {role === "artist" && works.length > 0 && <select value={workId} onChange={(e) => setWorkId(e.target.value)} aria-label="Ligar a uma obra" className="composer-select">
          <option value="">Sem obra ligada</option>{works.map((w) => <option key={w.id} value={w.id}>{w.title}</option>)}</select>}
        <span style={{ flex: 1 }} />
        <button type="button" className="linkbtn" onClick={() => { setOpen(false); setErr(""); }}>Cancelar</button>
        <button className="btn sm" type="submit" disabled={busy || pending}>{busy || pending ? "Publicando…" : <>Publicar <Icon n="right" /></>}</button>
      </div>
      {err && <p className="err">{err}</p>}
    </form>
  );
}

/** Curtir com resposta imediata (otimista). */
export function LikeBtn({ postId, on, count }: { postId: string; on: boolean; count: number }) {
  const { toast } = useRun(); const [state, setState] = useState({ on, count }); const [pending, start] = useTransition();
  useEffect(() => setState({ on, count }), [on, count]);
  const flip = () => {
    const next = { on: !state.on, count: state.count + (state.on ? -1 : 1) }; setState(next);
    start(async () => { const r = await D.toggleLike(postId, next.on); if (!r.ok) { setState(state); toast(r.error); } });
  };
  return <button type="button" className="post-icon like" aria-pressed={state.on} disabled={pending} onClick={flip} aria-label={state.on ? "Descurtir" : "Curtir"}>
    <Icon n="heart" /><span>{state.count || "Curtir"}</span></button>;
}

function Avatar({ p }: { p: Comment["author"] }) {
  return <span className={"av sm" + (p.role === "buyer" ? " av-buyer" : "")} aria-hidden="true">{p.role === "artist" || p.show_name ? initials(p.display_name) : "C"}</span>;
}
function CommentForm({ postId, parentId, onDone, autoFocus, placeholder }: { postId: string; parentId?: string; onDone?: () => void; autoFocus?: boolean; placeholder?: string }) {
  const { run, pending, router } = useRun(); const [v, setV] = useState("");
  return (
    <form className="c-form" onSubmit={(e) => { e.preventDefault(); if (!v.trim()) return; run(() => D.addComment(postId, v, parentId), undefined, () => { setV(""); onDone?.(); router.refresh(); }); }}>
      <textarea rows={1} maxLength={1000} value={v} autoFocus={autoFocus} onChange={(e) => { setV(e.target.value); e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }}
        placeholder={placeholder || "Escreva um comentário…"} aria-label={parentId ? "Resposta" : "Comentário"}
        onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) (e.currentTarget.form as HTMLFormElement).requestSubmit(); }} />
      <button className="btn sm" type="submit" disabled={pending || !v.trim()} aria-label="Enviar"><Icon n="right" /></button>
    </form>
  );
}

/** Conversa da publicação: comentários com uma camada de respostas. */
export function Thread({ postId, postAuthorId, viewer, comments, full }: { postId: string; postAuthorId: string; viewer: { id: string; role: string }; comments: Comment[]; full: boolean }) {
  const { run, pending } = useRun(); const [replyTo, setReplyTo] = useState<string | null>(null);
  const top = comments.filter((c) => !c.parent_id);
  const kids = (id: string) => comments.filter((c) => c.parent_id === id);
  const canDel = (c: Comment) => c.author.id === viewer.id || postAuthorId === viewer.id;
  const one = (c: Comment, child = false) => (
    <li key={c.id} className={"c-item" + (child ? " child" : "") + (c.author.id === postAuthorId ? " by-author" : "")} id={`c-${c.id}`}>
      <Avatar p={c.author} />
      <div className="c-main">
        <p className="c-head"><b>{personName(c.author)}</b>{c.author.id === postAuthorId && <span className="c-badge">Autor</span>}<time dateTime={c.created_at}>{ago(c.created_at)}</time></p>
        <p className="c-body">{c.body}</p>
        {full && viewer.role !== "admin" && <p className="c-acts">
          {!child && <button type="button" className="linkbtn" onClick={() => setReplyTo(replyTo === c.id ? null : c.id)}><Icon n="reply" />Responder</button>}
          {canDel(c) && <button type="button" className="linkbtn" disabled={pending} onClick={() => run(() => D.deleteComment(c.id), "Comentário apagado.")}>Apagar</button>}</p>}
        {full && !child && (kids(c.id).length > 0 || replyTo === c.id) && <ul className="c-list">
          {kids(c.id).map((k) => one(k, true))}
          {replyTo === c.id && <li className="c-item child"><CommentForm postId={postId} parentId={c.id} autoFocus placeholder={`Responder a ${personName(c.author)}…`} onDone={() => setReplyTo(null)} /></li>}
        </ul>}
      </div>
    </li>);
  return (
    <>
      {top.length > 0 && <ul className="c-list">{top.map((c) => one(c))}</ul>}
      {full && viewer.role !== "admin" && <div id="comentar"><CommentForm postId={postId} autoFocus={typeof location !== "undefined" && location.hash === "#comentar"} /></div>}
      {full && !top.length && <p className="hint" style={{ padding: "4px 0 2px" }}>Ninguém comentou ainda. Comece a conversa.</p>}
    </>
  );
}

/** Abre a atividade e marca como vista depois de alguns segundos. */
export function MarkActivitySeen({ count }: { count: number }) {
  const router = useRouter();
  useEffect(() => { if (count > 0) { const t = setTimeout(() => D.markCommunitySeen().then(() => router.refresh()), 2500); return () => clearTimeout(t); } }, [count, router]);
  return null;
}

/** Colecionador escolhe se aparece pelo nome ou pelo código de membro. */
export function ShowNameToggle({ initial, code }: { initial: boolean; code: string }) {
  const [on, setOn] = useState(initial); const [pending, start] = useTransition(); const toast = useToast(); const router = useRouter();
  const flip = () => { const v = !on; setOn(v); start(async () => { const r = await D.setShowName(v); if (!r.ok) { setOn(!v); toast(r.error); } else { toast(v ? "Seu nome aparece na comunidade." : `Você aparece como Colecionador ${code}.`); router.refresh(); } }); };
  return (
    <div className="offers-toggle compact">
      <div><p className="ot-title">Mostrar meu nome</p><p className="hint">{on ? "Seu nome aparece nas publicações e comentários." : `Você aparece como “Colecionador ${code}”.`}</p></div>
      <button type="button" role="switch" aria-checked={on} aria-label="Mostrar meu nome na comunidade" className="switch" disabled={pending} onClick={flip}><span /></button>
    </div>
  );
}

export function CommentModeration({ id, removed }: { id: string; removed: boolean }) {
  const { run, pending } = useRun(); const [reason, setReason] = useState("");
  if (removed) return <button type="button" className="btn sm ghost" disabled={pending} onClick={() => run(() => D.moderateComment(id, false, ""), "Comentário restaurado.")}>Restaurar</button>;
  return (
    <form className="inline-form" onSubmit={(e) => { e.preventDefault(); run(() => D.moderateComment(id, true, reason), "Comentário removido."); }}>
      <input placeholder="Motivo da remoção" value={reason} onChange={(e) => setReason(e.target.value)} aria-label="Motivo" />
      <button className="btn sm ocre" type="submit" disabled={pending}>Remover</button>
    </form>
  );
}
