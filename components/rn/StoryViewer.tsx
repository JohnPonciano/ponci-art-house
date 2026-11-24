"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "../Icon";
import { useToast } from "../Toast";
import { imageUrl } from "../ArtImage";
import { markStorySeen, deleteStory, removeStoryAdmin } from "@/app/diary-actions";
import type { Story } from "@/lib/stories";

const DUR = 5000;
const ago = (d: string) => { const m = Math.max(1, Math.round((Date.now() - new Date(d).getTime()) / 6e4)); return m < 60 ? `${m} min` : `${Math.round(m / 60)} h`; };

/** Tela cheia: barras de progresso, toque à esquerda/direita, segura para pausar, passa sozinho a cada 5 s. */
export function StoryViewer({ stories, author, profileHref, next, base, mine, admin }: {
  stories: Story[]; author: { name: string; avatar: React.ReactNode }; profileHref: string; next: string | null; base: string; mine: boolean; admin: boolean;
}) {
  const router = useRouter(); const toast = useToast();
  const first = Math.max(0, stories.findIndex((s) => !s.seen));
  const [i, setI] = useState(first === -1 ? 0 : first); const [t, setT] = useState(0); const [paused, setPaused] = useState(false);
  const [ask, setAsk] = useState<"" | "del" | "mod">(""); const [reason, setReason] = useState("");
  const st = stories[i]; const start = useRef(0); const acc = useRef(0);
  const close = useCallback(() => router.push(base || "/"), [router, base]);
  const go = useCallback((d: number) => {
    const j = i + d;
    if (j < 0) { setT(0); acc.current = 0; start.current = performance.now(); return; }
    if (j >= stories.length) { if (next) router.push(next); else close(); return; }
    setI(j); setT(0); acc.current = 0; start.current = performance.now();
  }, [i, stories.length, next, router, close]);
  useEffect(() => { if (st && !st.seen) markStorySeen(st.id).catch(() => {}); }, [st]);
  useEffect(() => {
    if (paused || ask) { acc.current = t; return; }
    start.current = performance.now() - acc.current; let raf = 0;
    const tick = () => { const e = performance.now() - start.current; if (e >= DUR) { go(1); return; } setT(e); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, paused, ask]);
  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1); if (e.key === "Escape") close(); }; addEventListener("keydown", k); return () => removeEventListener("keydown", k); }, [go, close]);
  if (!st) return null;
  const del = async () => { const r = ask === "mod" ? await removeStoryAdmin(st.id, reason || "Removido pela moderação.") : await deleteStory(st.id); toast(r.ok ? "Story removido." : r.error!); if (r.ok) { setAsk(""); router.refresh(); if (stories.length <= 1) close(); else go(1); } };
  return (
    <div className="sv" role="dialog" aria-modal="true" aria-label={`Story de ${author.name}`}>
      <div className="sv-frame">
        <div className="sv-bars">{stories.map((s, k) => <span key={s.id}><i style={{ width: k < i ? "100%" : k > i ? "0%" : `${Math.min(100, (t / DUR) * 100)}%` }} /></span>)}</div>
        <div className="sv-head">
          <Link href={profileHref} className="sv-who">{author.avatar}<b>{author.name}</b><small>{ago(st.created_at)}</small></Link>
          <button type="button" className="sv-x" aria-label="Fechar" onClick={close}><Icon n="x" /></button>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="sv-img" src={imageUrl(st.path)} alt={st.caption || `Story de ${author.name}`} draggable={false} />
        <button type="button" className="sv-tap l" aria-label="Anterior" onClick={() => go(-1)}
          onPointerDown={() => setPaused(true)} onPointerUp={() => setPaused(false)} onPointerLeave={() => setPaused(false)} />
        <button type="button" className="sv-tap r" aria-label="Próximo" onClick={() => go(1)}
          onPointerDown={() => setPaused(true)} onPointerUp={() => setPaused(false)} onPointerLeave={() => setPaused(false)} />
        {st.caption && <p className="sv-cap">{st.caption}</p>}
        {(mine || admin) && <div className="sv-foot">
          {mine && <span className="sv-views"><Icon n="users" /> {st.views ? `Visto por ${st.views}` : "Ninguém viu ainda"}</span>}
          {ask ? <span className="sv-ask">
            {ask === "mod" && <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Motivo (o autor vê)" autoFocus />}
            <button type="button" className="btn sm ocre" onClick={del}>{ask === "mod" ? "Remover" : "Apagar"}</button>
            <button type="button" className="linkbtn" onClick={() => setAsk("")}>Cancelar</button></span>
            : <button type="button" className="linkbtn" onClick={() => setAsk(mine ? "del" : "mod")}>{mine ? "Apagar story" : "Remover (moderação)"}</button>}
        </div>}
      </div>
    </div>
  );
}
