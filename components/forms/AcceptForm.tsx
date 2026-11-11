"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "../Icon";
import { acceptDocuments } from "@/app/actions";

export function AcceptForm({ ids, next }: { ids: string[]; next: string }) {
  const router = useRouter(); const [ok, setOk] = useState(false); const [err, setErr] = useState(""); const [pending, start] = useTransition();
  return (
    <form className="form" onSubmit={(e) => { e.preventDefault(); if (!ok) { setErr("Marque a caixa para confirmar a leitura e o aceite."); return; }
      start(async () => { const r = await acceptDocuments(ids); if (!r.ok) { setErr(r.error!); return; } router.replace(next); router.refresh(); }); }}>
      <label className="check"><input type="checkbox" checked={ok} onChange={(e) => { setOk(e.target.checked); setErr(""); }} />
        <span>Li e aceito as versões acima. Sei que o aceite é registrado com data, hora, IP, navegador e a impressão digital de cada documento.</span></label>
      {err && <p className="err">{err}</p>}
      <div className="form-actions"><button className="btn" type="submit" disabled={pending}>{pending ? "Registrando…" : <>Aceitar e continuar <Icon n="right" /></>}</button></div>
    </form>
  );
}
