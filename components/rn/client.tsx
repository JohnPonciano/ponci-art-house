"use client";
import { Children, useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "../Icon";
import { useToast } from "../Toast";
import { createClient } from "@/lib/supabase/client";
import * as D from "@/app/diary-actions";
import { TOPICS, POSTABLE, type Topic, type Post } from "@/lib/community";
import { NoteCard, noteHeight } from "./Notes";

/** Grade em cascata (masonry) com ordem da esquerda para a direita, como no RedNote. */
export function Masonry({ children, heights }: { children: ReactNode; heights: number[] }) {
  const [cols, setCols] = useState(2);
  useEffect(() => {
    const f = () => setCols(innerWidth >= 1500 ? 5 : innerWidth >= 1120 ? 4 : innerWidth >= 760 ? 3 : 2);
    f(); addEventListener("resize", f); return () => removeEventListener("resize", f);
  }, []);
  const items = Children.toArray(children); const out: ReactNode[][] = Array.from({ length: cols }, () => []); const h = Array(cols).fill(0);
  items.forEach((it, i) => { const k = h.indexOf(Math.min(...h)); out[k].push(it); h[k] += heights[i] ?? 1.3; });
  return <div className="rn-grid" style={{ ["--cols" as any]: cols }}>{out.map((c, i) => <div key={i} className="rn-col">{c}</div>)}</div>;
}

/** Coração pequeno do card e grande da nota, com resposta imediata. */
export function Heart({ postId, on, count, big }: { postId: string; on: boolean; count: number; big?: boolean }) {
  const toast = useToast(); const [s, setS] = useState({ on, count }); const [pending, start] = useTransition();
  const cur = useRef(s); cur.current = s;
  useEffect(() => setS({ on, count }), [on, count]);
  const set = (want: boolean) => {
    const old = cur.current; if (old.on === want) return;
    const n = { on: want, count: old.count + (want ? 1 : -1) }; setS(n);
    start(async () => { const r = await D.toggleLike(postId, want); if (!r.ok) { setS(old); toast(r.error); } });
  };
  // toque duplo na foto curte (nunca descurte)
  useEffect(() => { if (!big) return; const f = (e: Event) => (e as CustomEvent).detail === postId && set(true); addEventListener("rn:like", f); return () => removeEventListener("rn:like", f); });
  const flip = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); set(!cur.current.on); };
  return <button type="button" className={"rn-heart" + (big ? " big" : "")} aria-pressed={s.on} disabled={pending} onClick={flip} aria-label={s.on ? "Descurtir" : "Curtir"}>
    <Icon n="heart" /><span>{s.count}</span></button>;
}
export function SaveToggle({ postId, on }: { postId: string; on: boolean }) {
  const toast = useToast(); const [s, setS] = useState(on); const [pending, start] = useTransition();
  return <button type="button" className="rn-heart big" aria-pressed={s} disabled={pending} aria-label={s ? "Remover dos salvos" : "Salvar"}
    onClick={() => { const v = !s; setS(v); start(async () => { const r = await D.toggleSave(postId, v); if (!r.ok) { setS(!v); toast(r.error); } else toast(v ? "Salva." : "Removida dos salvos."); }); }}>
    <Icon n="bookmark" /><span>{s ? "Salvo" : "Salvar"}</span></button>;
}
export function ShareBtn({ title }: { title: string }) {
  const toast = useToast(); const [can, setCan] = useState(false); useEffect(() => setCan(!!navigator.share), []);
  return <button type="button" className="rn-heart big" aria-label="Compartilhar" onClick={async () => {
    const url = location.href;
    if (can) { try { await navigator.share({ title, url }); } catch {} } else { await navigator.clipboard.writeText(url); toast("Link copiado. Só membros conseguem abrir."); }
  }}><Icon n="share" /><span>Enviar</span></button>;
}

/** Carrossel da nota com pontos (como no RedNote). */
export function Carousel({ children, count, likeId }: { children: ReactNode; count: number; likeId?: string }) {
  const ref = useRef<HTMLDivElement>(null); const [i, setI] = useState(0); const [burst, setBurst] = useState(0); const last = useRef(0);
  const tap = () => { const t = Date.now(); if (likeId && t - last.current < 300) { dispatchEvent(new CustomEvent("rn:like", { detail: likeId })); setBurst(t); } last.current = t; };
  return (
    <div className="rn-carousel" onClick={tap}>
      {burst > 0 && <span key={burst} className="rn-burst" aria-hidden="true"><Icon n="heart" /></span>}
      <div className="rn-slides" ref={ref} onScroll={(e) => { const el = e.currentTarget; setI(Math.round(el.scrollLeft / el.clientWidth)); }}>{children}</div>
      {count > 1 && <>
        <div className="rn-dots" aria-hidden="true">{Array.from({ length: count }, (_, k) => <i key={k} className={k === i ? "on" : ""} />)}</div>
        <span className="rn-count">{i + 1}/{count}</span>
        {i > 0 && <button type="button" className="rn-nav l" aria-label="Anterior" onClick={() => ref.current?.scrollBy({ left: -ref.current.clientWidth, behavior: "smooth" })}><Icon n="left" /></button>}
        {i < count - 1 && <button type="button" className="rn-nav r" aria-label="Próxima" onClick={() => ref.current?.scrollBy({ left: ref.current.clientWidth, behavior: "smooth" })}><Icon n="right" /></button>}
      </>}
    </div>
  );
}

/** Leva o foco para o campo de comentário. */
export function CommentPill() {
  return <button type="button" className="rn-pill" onClick={() => { const t = document.querySelector<HTMLTextAreaElement>("#comentar textarea"); t?.scrollIntoView({ behavior: "smooth", block: "center" }); setTimeout(() => t?.focus(), 350); }}>
    <Icon n="edit" />Diga algo…</button>;
}

type Shot = { blob: Blob; url: string; w: number; h: number };
/** Publicar uma nota: fotos primeiro, depois título, texto e espaço. */
export function NoteComposer({ userId, role, base, works = [], topic: t0 }: { userId: string; role: "artist" | "buyer"; base: string; works?: { id: string; title: string }[]; topic?: Topic | null }) {
  const router = useRouter(); const toast = useToast();
  const [shots, setShots] = useState<Shot[]>([]); const [title, setTitle] = useState(""); const [body, setBody] = useState("");
  const [topic, setTopic] = useState<Topic>(t0 && POSTABLE.includes(t0) ? t0 : role === "artist" ? "processo" : "geral"); const [workId, setWorkId] = useState("");
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  async function add(files: FileList | null) {
    if (!files) return; const next = [...shots];
    for (const f of Array.from(files)) {
      if (next.length >= 9) { toast("Até 9 fotos por nota."); break; }
      if (!/^image\//.test(f.type)) continue;
      const bmp = await createImageBitmap(f); const k = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
      const cv = document.createElement("canvas"); cv.width = Math.round(bmp.width * k); cv.height = Math.round(bmp.height * k);
      cv.getContext("2d")!.drawImage(bmp, 0, 0, cv.width, cv.height);
      const blob: Blob = await new Promise((r) => cv.toBlob((b) => r(b!), "image/jpeg", 0.85));
      next.push({ blob, url: URL.createObjectURL(blob), w: cv.width, h: cv.height });
    }
    setShots(next);
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    if (!title.trim() && !body.trim() && !shots.length) { setErr("Adicione uma foto ou escreva algo."); return; }
    setBusy(true);
    const sb = createClient(); const media: { path: string; w: number; h: number }[] = [];
    for (const s of shots) {
      const path = `${userId}/diario/${crypto.randomUUID()}.jpg`;
      const { error } = await sb.storage.from("works").upload(path, s.blob, { contentType: "image/jpeg" });
      if (error) { setBusy(false); setErr("Falha ao enviar foto: " + error.message); return; }
      media.push({ path, w: s.w, h: s.h });
    }
    const r = await D.createPost(body || title, media, workId || null, topic, title);
    setBusy(false);
    if (!r.ok) { setErr(r.error || "Não foi possível publicar."); return; }
    shots.forEach((s) => URL.revokeObjectURL(s.url)); toast("Nota publicada.");
    router.replace(`${base}/p/${r.data}`); router.refresh();
  }
  return (
    <form className="rn-compose" onSubmit={submit} noValidate>
      <div className="rn-shots">
        {shots.map((s, i) => (
          <figure key={s.url}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={s.url} alt={`Foto ${i + 1}`} />{i === 0 && <span>Capa</span>}
            <button type="button" aria-label="Remover foto" onClick={() => { URL.revokeObjectURL(s.url); setShots(shots.filter((x) => x !== s)); }}><Icon n="x" /></button></figure>))}
        {shots.length < 9 && <label className="rn-add"><input type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => { add(e.target.files); e.target.value = ""; }} />
          <Icon n="plus" /><span>{shots.length ? "Mais fotos" : "Fotos"}</span></label>}
      </div>
      <p className="hint">{shots.length ? "A primeira foto é a capa. " : ""}Até 9 fotos. Sem foto, a nota vira um cartão de texto.</p>
      <input className="rn-title" maxLength={90} placeholder="Título da nota" value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Título" />
      <textarea className="rn-body" rows={6} maxLength={2200} placeholder={role === "artist" ? "Conte o processo, a técnica, a história da obra…" : "Uma pergunta, uma visita, como a obra ficou em casa…"} value={body} onChange={(e) => setBody(e.target.value)} aria-label="Texto" />
      <p className="lab" style={{ marginTop: 6 }}>Espaço</p>
      <div className="rn-topics" role="radiogroup" aria-label="Espaço">{POSTABLE.map((k) => <button key={k} type="button" role="radio" aria-checked={topic === k} onClick={() => setTopic(k)}>#{TOPICS[k][0]}</button>)}</div>
      {role === "artist" && works.length > 0 && <label className="rn-work"><span className="lab">Ligar a uma obra</span>
        <select value={workId} onChange={(e) => setWorkId(e.target.value)}><option value="">Nenhuma</option>{works.map((w) => <option key={w.id} value={w.id}>{w.title}</option>)}</select></label>}
      {err && <p className="err">{err}</p>}
      <div className="rn-compose-foot"><button className="btn" type="submit" disabled={busy}>{busy ? "Publicando…" : <>Publicar nota <Icon n="right" /></>}</button></div>
    </form>
  );
}

/** Feed com rolagem infinita: carrega mais notas quando o fim da grade se aproxima. */
export function InfiniteNotes({ initial, more: more0, base, liked, mode, topic }: { initial: Post[]; more: boolean; base: string; liked: string[]; mode: "tudo" | "seguindo"; topic: Topic | null }) {
  const [posts, setPosts] = useState(initial); const [likes, setLikes] = useState(new Set(liked)); const [more, setMore] = useState(more0); const [busy, setBusy] = useState(false);
  const sent = useRef<HTMLDivElement>(null);
  useEffect(() => { setPosts(initial); setMore(more0); setLikes(new Set(liked)); }, [initial, more0, liked]);
  useEffect(() => {
    if (!more || !sent.current) return;
    const io = new IntersectionObserver(async ([e]) => {
      if (!e.isIntersecting || busy) return; setBusy(true);
      const last = posts[posts.length - 1]; const r = await D.loadNotes(mode, topic, last?.created_at);
      if (r.ok && r.data) { setPosts((p) => [...p, ...r.data!.posts.filter((x) => !p.some((y) => y.id === x.id))]); setMore(r.data.more); setLikes((l) => new Set([...l, ...r.data!.liked])); }
      else setMore(false);
      setBusy(false);
    }, { rootMargin: "900px 0px" });
    io.observe(sent.current); return () => io.disconnect();
  }, [more, busy, posts, mode, topic]);
  return (
    <>
      <Masonry heights={posts.map(noteHeight)}>{posts.map((p) => <NoteCard key={p.id} p={p} base={base} liked={likes.has(p.id)} />)}</Masonry>
      {more && <div ref={sent} className="rn-loading" aria-live="polite">{busy ? "Carregando mais notas…" : ""}</div>}
      {!more && posts.length > 8 && <p className="rn-end">Você viu todas as notas por aqui.</p>}
    </>
  );
}
