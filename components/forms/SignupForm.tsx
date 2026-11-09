"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Field, isEmail } from "./Field";
import { Icon } from "../Icon";

export function SignupForm({ perfil }: { perfil: "artista" | "colecionador" }) {
  const router = useRouter();
  const [v, setV] = useState({ code: "", name: "", email: "", city: "", password: "" });
  const [err, setErr] = useState<Record<string, string>>({}); const [status, setStatus] = useState(""); const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState("");
  const on = (k: string) => (e: any) => setV({ ...v, [k]: e.target.value });

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    const e: Record<string, string> = {};
    if (!/^PONCI-[A-Z0-9-]{3,}$/i.test(v.code.trim())) e.code = "Informe o código do convite, como PONCI-XXXX.";
    if (v.name.trim().length < 2) e.name = "Informe seu nome.";
    if (!isEmail(v.email)) e.email = "Informe um e-mail válido.";
    if (!v.city.trim()) e.city = "Informe sua cidade.";
    if (v.password.length < 8) e.password = "Use pelo menos 8 caracteres.";
    setErr(e); if (Object.keys(e).length) { setStatus("Alguns campos precisam de atenção."); return; }
    setBusy(true); setStatus("");
    const sb = createClient();
    const { data, error } = await sb.auth.signUp({
      email: v.email.trim(), password: v.password,
      options: { emailRedirectTo: `${location.origin}/auth/callback`, data: { invite_code: v.code.trim().toUpperCase(), full_name: v.name.trim(), city: v.city.trim() } },
    });
    setBusy(false);
    if (error) {
      setStatus(/database error/i.test(error.message) ? "Convite inválido ou esgotado. Confira o código recebido." : /registered/i.test(error.message) ? "Este e-mail já é membro. Entre com sua senha." : error.message);
      return;
    }
    if (data.session) { router.replace("/entrar/redirecionar"); router.refresh(); return; }
    setSent(v.email.trim());
  }
  if (sent) return (
    <div className="success" role="status">
      <span className="mark"><Icon n="check" /></span>
      <h2>Convite aceito.</h2>
      <p>Enviamos um link de confirmação para <b>{sent}</b>. Depois de confirmar, você entra direto na sua área.</p>
    </div>
  );
  return (
    <form className="form" onSubmit={submit} noValidate>
      <Field name="code" label="Código do convite" placeholder="PONCI-XXXX" autoCapitalize="characters" spellCheck={false} value={v.code} onChange={on("code")} error={err.code} />
      <div className="two">
        <Field name="name" label={perfil === "artista" ? "Nome artístico" : "Nome completo"} autoComplete="name" value={v.name} onChange={on("name")} error={err.name} />
        <Field name="city" label="Cidade / UF" placeholder="São Paulo, SP" autoComplete="address-level2" value={v.city} onChange={on("city")} error={err.city} />
      </div>
      <Field name="email" label="E-mail" type="email" inputMode="email" autoComplete="email" value={v.email} onChange={on("email")} error={err.email} />
      <Field name="password" label="Senha" type="password" autoComplete="new-password" aside="8+ caracteres" value={v.password} onChange={on("password")} error={err.password} />
      <p className="form-status" role="alert">{status}</p>
      <div className="form-actions"><button className="btn" type="submit" disabled={busy}>{busy ? "Criando conta…" : <>Criar conta de membro <Icon n="right" /></>}</button>
        <p>O código define se a conta é de artista ou de colecionador.</p></div>
    </form>
  );
}
