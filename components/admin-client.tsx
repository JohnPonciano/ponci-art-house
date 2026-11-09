"use client";
import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "./Icon";
import { useToast } from "./Toast";
import { Field } from "./forms/Field";
import { createClient } from "@/lib/supabase/client";
import * as A from "@/app/admin/actions";

export function AdminButton({ action, args, ok, className = "btn sm", confirm, children, go }: {
  action: keyof typeof A; args: any[]; ok: string; className?: string; confirm?: ReactNode; children: ReactNode; go?: string;
}) {
  const toast = useToast(); const router = useRouter(); const [pending, start] = useTransition(); const [ask, setAsk] = useState(false);
  const fire = () => start(async () => { const r = await (A[action] as any)(...args); toast(r.ok ? ok : r.error); setAsk(false); if (r.ok && go) router.push(go); else router.refresh(); });
  if (confirm && ask) return (<>
    <span className="hint">{confirm}</span>
    <button type="button" className="btn sm ocre" disabled={pending} onClick={fire}>{pending ? "Aguarde…" : <>Confirmar <Icon n="check" /></>}</button>
    <button type="button" className="linkbtn" onClick={() => setAsk(false)}>Cancelar</button></>);
  return <button type="button" className={className} disabled={pending} onClick={() => (confirm ? setAsk(true) : fire())}>{pending ? "Aguarde…" : children}</button>;
}

export function inviteMessage(name: string, code: string, role: string, origin = "https://ponci.art") {
  const perfil = role === "artist" ? "artista" : "colecionador";
  return `Olá, ${name.split(" ")[0]}.\n\nSeu acesso à PONCI, rede privada de arte, foi aprovado.\n\nCódigo de convite: ${code}\nCrie sua conta em: ${origin}/cadastro?perfil=${perfil}&codigo=${encodeURIComponent(code)}\n\nO código é pessoal e vale para um cadastro.\n\nPONCI`;
}

export function InviteShare({ name, email, code, role }: { name: string; email?: string; code: string; role: string }) {
  const toast = useToast();
  const msg = inviteMessage(name, code, role, typeof window !== "undefined" ? location.origin : "https://ponci.art");
  return (<>
    <code className="code-tag">{code}</code>
    <button type="button" className="btn sm ghost" onClick={async () => { try { await navigator.clipboard.writeText(msg); toast("Mensagem de convite copiada."); } catch { toast("Não foi possível copiar."); } }}>Copiar convite</button>
    {email && <a className="linkbtn" href={`mailto:${email}?subject=${encodeURIComponent("Seu convite para a PONCI")}&body=${encodeURIComponent(msg)}`}>Enviar por e-mail</a>}
  </>);
}

export function NewInviteForm() {
  const toast = useToast(); const router = useRouter(); const [pending, start] = useTransition();
  const [v, setV] = useState({ role: "artist", uses: "1", note: "", auto: true }); const [code, setCode] = useState<{ code: string; role: string; note: string } | null>(null);
  return (
    <>
      <form className="form" noValidate onSubmit={(e) => { e.preventDefault(); const n = +v.uses; if (!(n >= 1 && n <= 500)) { toast("Usos entre 1 e 500."); return; }
        start(async () => { const r = await A.createInvite(v.role as any, n, v.note, v.auto); if (!r.ok) { toast(r.error!); return; } setCode({ code: r.data, role: v.role, note: v.note }); toast("Convite criado."); router.refresh(); }); }}>
        <div className="field"><span className="lab">Perfil</span><div className="seg" role="group" aria-label="Perfil">
          <button type="button" aria-pressed={v.role === "artist"} onClick={() => setV({ ...v, role: "artist" })}>Artista</button>
          <button type="button" aria-pressed={v.role === "buyer"} onClick={() => setV({ ...v, role: "buyer" })}>Colecionador</button></div></div>
        <div className="two">
          <Field name="uses" label="Usos" type="number" min={1} max={500} inputMode="numeric" value={v.uses} onChange={(e: any) => setV({ ...v, uses: e.target.value })} />
          <Field name="note" label="Para quem (nota interna)" placeholder="Ex.: Ana Lima, indicada por Helena" value={v.note} onChange={(e: any) => setV({ ...v, note: e.target.value })} />
        </div>
        <label className="notice" style={{ cursor: "pointer" }}><input type="checkbox" checked={v.auto} onChange={(e) => setV({ ...v, auto: e.target.checked })} style={{ marginTop: 3 }} />
          <span>Ativar a conta direto no cadastro. Desmarcado, o membro fica aguardando a sua aprovação.</span></label>
        <div className="form-actions"><button className="btn" type="submit" disabled={pending}>{pending ? "Gerando…" : <>Gerar código <Icon n="plus" /></>}</button></div>
      </form>
      {code && <div className="ok-box" style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", marginTop: 16 }}>
        <span>Novo código:</span><InviteShare name={code.note || "membro"} code={code.code} role={code.role} /></div>}
    </>
  );
}

export function PasswordForm() {
  const toast = useToast(); const [pending, start] = useTransition(); const [p1, setP1] = useState(""); const [p2, setP2] = useState(""); const [err, setErr] = useState("");
  return (
    <form className="form" noValidate onSubmit={(e) => { e.preventDefault();
      if (p1.length < 10) return setErr("Use pelo menos 10 caracteres."); if (p1 !== p2) return setErr("As senhas não conferem."); setErr("");
      start(async () => { const { error } = await createClient().auth.updateUser({ password: p1 }); toast(error ? error.message : "Senha alterada."); if (!error) { setP1(""); setP2(""); } }); }}>
      <Field name="p1" label="Nova senha" type="password" autoComplete="new-password" value={p1} onChange={(e: any) => setP1(e.target.value)} aside="10+ caracteres" />
      <Field name="p2" label="Repita a nova senha" type="password" autoComplete="new-password" value={p2} onChange={(e: any) => setP2(e.target.value)} error={err} />
      <div className="form-actions"><button className="btn" type="submit" disabled={pending}>{pending ? "Salvando…" : <>Trocar senha <Icon n="check" /></>}</button></div>
    </form>
  );
}

export function AdminLoginForm() {
  const router = useRouter(); const [email, setEmail] = useState(""); const [pass, setPass] = useState(""); const [status, setStatus] = useState(""); const [busy, setBusy] = useState(false);
  return (
    <form className="form" noValidate onSubmit={async (e) => {
      e.preventDefault(); setBusy(true); setStatus("");
      const sb = createClient();
      const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password: pass });
      if (error) { setBusy(false); setStatus(error.message === "Invalid login credentials" ? "E-mail ou senha incorretos." : error.message); return; }
      const { data } = await sb.rpc("is_admin");
      if (data !== true) { await sb.auth.signOut(); setBusy(false); setStatus("Esta conta não tem acesso ao painel."); return; }
      router.replace("/admin"); router.refresh();
    }}>
      <Field name="email" label="E-mail" type="email" autoComplete="email" value={email} onChange={(e: any) => setEmail(e.target.value)} />
      <Field name="password" label="Senha" type="password" autoComplete="current-password" value={pass} onChange={(e: any) => setPass(e.target.value)} />
      <p className="form-status" role="alert">{status}</p>
      <div className="form-actions"><button className="btn" type="submit" disabled={busy}>{busy ? "Entrando…" : <>Entrar no painel <Icon n="right" /></>}</button></div>
    </form>
  );
}
