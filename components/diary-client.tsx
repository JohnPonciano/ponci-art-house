"use client";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "./Icon";
import { useToast } from "./Toast";
import { createClient } from "@/lib/supabase/client";
import * as D from "@/app/diary-actions";

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

export function DeleteBtn({ postId }: { postId: string }) {
  const { run, pending } = useRun(); const [ask, setAsk] = useState(false);
  if (ask) return <span style={{ display: "inline-flex", gap: 10, alignItems: "center" }}><span className="hint">Apagar publicação?</span>
    <button className="btn sm ocre" type="button" disabled={pending} onClick={() => run(() => D.deletePost(postId), "Publicação apagada.")}>Apagar</button>
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
export function Composer({ userId, works }: { userId: string; works: { id: string; title: string }[] }) {
  const { run, pending, toast } = useRun();
  const [body, setBody] = useState(""); const [shots, setShots] = useState<Shot[]>([]); const [workId, setWorkId] = useState(""); const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
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
    setShots(next);
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
    run(() => D.createPost(body, media, workId || null), "Publicado no diário.", () => { shots.forEach((s) => URL.revokeObjectURL(s.url)); setShots([]); setBody(""); setWorkId(""); location.reload(); });
  }
  return (
    <form className="form composer" onSubmit={submit} noValidate>
      <div className="field"><label className="lab" htmlFor="i-body"><span>Nova publicação</span><span className="count">{body.length} / 2200</span></label>
        <textarea id="i-body" rows={4} maxLength={2200} placeholder="Processo, ateliê, um detalhe, uma obra em andamento…" value={body} onChange={(e) => setBody(e.target.value)} /></div>
      {shots.length > 0 && <div className="composer-shots">{shots.map((s, i) => (
        <figure key={s.url}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={s.url} alt={`Imagem ${i + 1}`} />
          <button type="button" aria-label="Remover imagem" onClick={() => { URL.revokeObjectURL(s.url); setShots(shots.filter((x) => x !== s)); }}><Icon n="x" /></button></figure>))}</div>}
      <div className="composer-row">
        <label className="btn sm ghost" style={{ cursor: "pointer" }}><input type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => { add(e.target.files); e.target.value = ""; }} />
          <Icon n="upload" /> Fotos ({shots.length}/6)</label>
        {works.length > 0 && <select value={workId} onChange={(e) => setWorkId(e.target.value)} aria-label="Ligar a uma obra" className="composer-select">
          <option value="">Sem obra ligada</option>{works.map((w) => <option key={w.id} value={w.id}>{w.title}</option>)}</select>}
        <button className="btn sm" type="submit" disabled={busy || pending}>{busy || pending ? "Publicando…" : <>Publicar <Icon n="right" /></>}</button>
      </div>
      {err && <p className="err">{err}</p>}
    </form>
  );
}
