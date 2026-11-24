"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "../Icon";
import { useToast } from "../Toast";
import { createClient } from "@/lib/supabase/client";
import { createStory } from "@/app/diary-actions";

async function prep(f: File) {
  const bmp = await createImageBitmap(f);
  const k = Math.min(1, 1080 / bmp.width, 1920 / bmp.height);
  const cv = document.createElement("canvas"); cv.width = Math.round(bmp.width * k); cv.height = Math.round(bmp.height * k);
  cv.getContext("2d")!.drawImage(bmp, 0, 0, cv.width, cv.height);
  const blob: Blob = await new Promise((r) => cv.toBlob((b) => r(b!), "image/jpeg", 0.86));
  return { blob, url: URL.createObjectURL(blob), w: cv.width, h: cv.height };
}

/** Publicar story: uma foto (vertical fica melhor) e uma legenda curta. Some em 24 h. */
export function StoryComposer({ userId, base, asPonci }: { userId: string; base: string; asPonci?: boolean }) {
  const router = useRouter(); const toast = useToast();
  const [shot, setShot] = useState<Awaited<ReturnType<typeof prep>> | null>(null); const [cap, setCap] = useState(""); const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const pick = async (f?: File | null) => { if (!f || !/^image\//.test(f.type)) return; setErr(""); if (shot) URL.revokeObjectURL(shot.url); setShot(await prep(f)); };
  const send = async () => {
    if (!shot) return; setBusy(true); setErr("");
    const path = `${userId}/stories/${crypto.randomUUID()}.jpg`;
    const up = await createClient().storage.from("works").upload(path, shot.blob, { contentType: "image/jpeg", cacheControl: "86400" });
    if (up.error) { setBusy(false); setErr("Falha ao enviar a foto: " + up.error.message); return; }
    const r = await createStory(path, shot.w, shot.h, cap);
    setBusy(false);
    if (!r.ok) { setErr(r.error || "Não foi possível publicar."); return; }
    toast("Story publicado. Fica no ar por 24 h."); router.replace(base || "/"); router.refresh();
  };
  return (
    <div className="sc">
      <label className={"sc-pick" + (shot ? " has" : "")}>
        <input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {shot ? <img src={shot.url} alt="Prévia do story" /> : <span><Icon n="plus" /><b>Escolher foto</b><small>Vertical fica melhor. Ateliê, obra em andamento, a parede de casa…</small></span>}
        {shot && cap && <span className="sc-cap">{cap}</span>}
      </label>
      <input className="sc-text" maxLength={140} value={cap} onChange={(e) => setCap(e.target.value)} placeholder="Legenda curta (opcional)" aria-label="Legenda" />
      <p className="hint">{asPonci ? "Sai no perfil oficial @ponci.art. " : ""}Fica no ar por 24 horas e depois some. Só membros da rede veem.</p>
      {err && <p className="err" role="alert">{err}</p>}
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <button className="btn" type="button" disabled={!shot || busy} onClick={send}>{busy ? "Publicando…" : <>Publicar story <Icon n="right" /></>}</button>
        {shot && <button type="button" className="linkbtn" onClick={() => { URL.revokeObjectURL(shot.url); setShot(null); }}>Trocar foto</button>}
      </div>
    </div>
  );
}
