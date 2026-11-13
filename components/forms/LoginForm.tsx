"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Field, isEmail } from "./Field";
import { Icon } from "../Icon";
import { DEMO, DEMO_PASSWORD } from "@/lib/format";
import { safeNext, go as goTo } from "@/lib/site";

export function LoginForm({ perfil, next }: { perfil: "artista" | "colecionador"; next?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState(""); const [pass, setPass] = useState("");
  const [err, setErr] = useState<Record<string, string>>({}); const [status, setStatus] = useState(""); const [busy, setBusy] = useState(false);
  const demo = DEMO[perfil];

  async function signIn(e: string, p: string) {
    setBusy(true); setStatus("");
    const sb = createClient();
    const { data, error } = await sb.auth.signInWithPassword({ email: e.trim(), password: p });
    if (error) { setBusy(false); setStatus(error.message === "Invalid login credentials" ? "E-mail ou senha incorretos." : error.message === "Email not confirmed" ? "Confirme seu e-mail pelo link que enviamos antes de entrar." : error.message); return; }
    const { data: admin } = await sb.rpc("admin_email");
    const { data: prof } = await sb.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
    const home = admin === true ? "/admin" : prof?.role === "artist" ? "/artista" : "/colecionador";
    const sn = safeNext(next);
    const onCommunity = location.hostname.startsWith("comunidade.");
    const dest = sn && (onCommunity || sn.startsWith(home) || /^https:\/\/comunidade\./.test(sn) || sn.startsWith("/c")) ? sn : onCommunity ? "/" : home;
    const { data: aal } = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
    const go = aal?.currentLevel === "aal1" && aal?.nextLevel === "aal2" ? `/entrar/verificacao?next=${encodeURIComponent(dest)}` : admin === true ? "/admin" : dest;
    goTo(go, router);
  }
  function submit(ev: React.FormEvent) {
    ev.preventDefault();
    const e: Record<string, string> = {};
    if (!isEmail(email)) e.email = "Informe um e-mail válido, como nome@dominio.com.";
    if (pass.length < 6) e.password = "Informe sua senha (mínimo de 6 caracteres).";
    setErr(e); if (Object.keys(e).length) { setStatus("Alguns campos precisam de atenção."); return; }
    signIn(email, pass);
  }
  return (
    <>
      <form className="form" onSubmit={submit} noValidate>
        <Field name="email" label="E-mail" type="email" autoComplete="email" inputMode="email" placeholder="nome@dominio.com" value={email} onChange={(e: any) => setEmail(e.target.value)} error={err.email} />
        <Field name="password" label="Senha" type="password" autoComplete="current-password" value={pass} onChange={(e: any) => setPass(e.target.value)} error={err.password} />
        <p className="form-status" role="alert">{status}</p>
        <div className="form-actions"><button className="btn" type="submit" disabled={busy}>{busy ? "Entrando…" : <>Entrar <Icon n="right" /></>}</button>
          <span className="auth-links"><Link className="linkbtn" href="/senha">Esqueci a senha</Link><Link className="linkbtn" href={`/cadastro?perfil=${perfil}`}>Tenho um convite</Link><Link className="linkbtn" href="/#acesso">Não tenho convite</Link></span></div>
      </form>
      <div className="demo-box">
        <p className="lab" style={{ color: "var(--ink)" }}>Protótipo</p>
        <p className="hint">Conta de demonstração compartilhada: <code>{demo.email}</code> / <code>{DEMO_PASSWORD}</code>. Os dados ficam no Supabase e são vistos por todos que usam a demo.</p>
        <button className="btn ghost" type="button" disabled={busy} onClick={() => signIn(demo.email, DEMO_PASSWORD)}>Entrar como {demo.name} <Icon n="right" /></button>
      </div>
    </>
  );
}
