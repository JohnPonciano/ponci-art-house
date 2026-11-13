"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "../Icon";
import { useToast } from "../Toast";

type Factor = { id: string; friendly_name?: string; status: string; created_at: string };
const msg = (e: any) => /invalid|incorrect|expired/i.test(e?.message || "") ? "Código incorreto ou expirado. Confira o relógio do celular e tente o código atual." : e?.message || "Erro inesperado.";

/** Cadastro e gestão do aplicativo autenticador (TOTP). */
export function MfaManager({ after }: { after?: string }) {
  const router = useRouter(); const toast = useToast(); const sb = createClient();
  const [factors, setFactors] = useState<Factor[] | null>(null);
  const [enroll, setEnroll] = useState<{ id: string; qr: string; secret: string } | null>(null);
  const [code, setCode] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const load = async () => { const { data } = await sb.auth.mfa.listFactors(); setFactors(((data?.all || []) as any[]).filter((f) => f.factor_type === "totp")); };
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function start() {
    setErr(""); setBusy(true);
    for (const f of factors || []) if (f.status !== "verified") await sb.auth.mfa.unenroll({ factorId: f.id });
    const { data, error } = await sb.auth.mfa.enroll({ factorType: "totp", friendlyName: `Autenticador ${new Date().toLocaleDateString("pt-BR")} ${Math.random().toString(36).slice(2, 6)}` });
    setBusy(false);
    if (error) { setErr(msg(error)); return; }
    setEnroll({ id: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
  }
  async function confirm(e: React.FormEvent) {
    e.preventDefault(); if (!enroll) return; setBusy(true); setErr("");
    const { error } = await sb.auth.mfa.challengeAndVerify({ factorId: enroll.id, code: code.replace(/\D/g, "") });
    setBusy(false);
    if (error) { setErr(msg(error)); return; }
    toast("Verificação em duas etapas ativada."); setEnroll(null); setCode("");
    if (after) { router.replace(after); router.refresh(); } else { await load(); router.refresh(); }
  }
  async function remove(id: string) {
    setBusy(true); setErr("");
    const { error } = await sb.auth.mfa.unenroll({ factorId: id });
    setBusy(false);
    if (error) { setErr(/aal2/i.test(error.message) ? "Para remover, entre de novo usando o código do autenticador." : error.message); return; }
    toast("Autenticador removido."); await load(); router.refresh();
  }
  const verified = (factors || []).filter((f) => f.status === "verified");
  if (factors === null) return <p className="hint">Carregando…</p>;
  return (
    <div className="form">
      {verified.length > 0 && <ul className="sig-list">{verified.map((f) => (
        <li key={f.id} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div><b>{f.friendly_name || "Autenticador"}</b><br /><span>Ativo desde {new Date(f.created_at).toLocaleDateString("pt-BR")}</span></div>
          <button type="button" className="linkbtn" disabled={busy} onClick={() => remove(f.id)}>Remover</button></li>))}</ul>}
      {!enroll ? (
        <div className="form-actions"><button type="button" className="btn" disabled={busy} onClick={start}>{verified.length ? "Adicionar outro aparelho" : "Ativar autenticador"} <Icon n="shield" /></button></div>
      ) : (
        <form onSubmit={confirm} className="form" noValidate>
          <ol className="md-ul" style={{ paddingLeft: 18, margin: 0, fontSize: 15 }}>
            <li>Abra o aplicativo autenticador no celular (Google Authenticator, 1Password, Authy…).</li>
            <li>Leia o QR code abaixo, ou digite a chave manualmente.</li>
            <li>Digite o código de 6 dígitos que aparecer.</li>
          </ol>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <div className="qr"><img src={enroll.qr} alt="QR code para o aplicativo autenticador" /></div>
          <p className="hint">Chave: <code style={{ userSelect: "all", wordBreak: "break-all" }}>{enroll.secret}</code></p>
          <div className="field"><label className="lab" htmlFor="otp">Código de 6 dígitos</label>
            <input id="otp" className="otp" inputMode="numeric" autoComplete="one-time-code" maxLength={7} value={code} onChange={(e) => setCode(e.target.value)} autoFocus
              style={{ border: "var(--b)", padding: "12px 14px", background: "var(--paper)" }} /></div>
          <div className="form-actions"><button className="btn" type="submit" disabled={busy || code.replace(/\D/g, "").length !== 6}>{busy ? "Verificando…" : <>Confirmar <Icon n="check" /></>}</button>
            <button type="button" className="linkbtn" onClick={() => setEnroll(null)}>Cancelar</button></div>
        </form>
      )}
      {err && <p className="err-box" role="alert">{err}</p>}
    </div>
  );
}

/** Desafio do segundo fator depois da senha. */
export function MfaChallenge({ next }: { next: string }) {
  const router = useRouter(); const sb = createClient();
  const [code, setCode] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr("");
    const { data } = await sb.auth.mfa.listFactors();
    const f = (data?.totp || []).find((x) => x.status === "verified");
    if (!f) { setBusy(false); setErr("Nenhum autenticador ativo nesta conta."); return; }
    const { error } = await sb.auth.mfa.challengeAndVerify({ factorId: f.id, code: code.replace(/\D/g, "") });
    if (error) { setBusy(false); setErr(msg(error)); setCode(""); return; }
    if (/^https?:\/\//.test(next)) location.assign(next); else { router.replace(next); router.refresh(); }
  }
  return (
    <form className="form" onSubmit={submit} noValidate>
      <div className="field"><label className="lab" htmlFor="otp">Código do aplicativo autenticador</label>
        <input id="otp" className="otp" inputMode="numeric" autoComplete="one-time-code" maxLength={7} value={code} onChange={(e) => setCode(e.target.value)} autoFocus
          style={{ border: "var(--b)", padding: "12px 14px", background: "var(--paper)" }} /></div>
      {err && <p className="err-box" role="alert">{err}</p>}
      <div className="form-actions"><button className="btn" type="submit" disabled={busy || code.replace(/\D/g, "").length !== 6}>{busy ? "Verificando…" : <>Entrar <Icon n="right" /></>}</button>
        <button type="button" className="linkbtn" onClick={async () => { await sb.auth.signOut(); router.replace("/entrar"); }}>Usar outra conta</button></div>
    </form>
  );
}
