"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Field, isEmail } from "./Field";
import { Icon } from "../Icon";

export function ForgotForm() {
  const [email, setEmail] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false); const [sent, setSent] = useState("");
  if (sent) return (
    <div className="success" role="status"><span className="mark"><Icon n="check" /></span><h2>Confira seu e-mail.</h2>
      <p>Se <b>{sent}</b> for de um membro da PONCI, você recebe em instantes um link para criar uma nova senha.</p>
      <Link className="btn ghost" href="/entrar">Voltar ao login <Icon n="right" /></Link></div>
  );
  return (
    <form className="form" noValidate onSubmit={async (e) => {
      e.preventDefault(); if (!isEmail(email)) { setErr("Informe um e-mail válido."); return; } setErr(""); setBusy(true);
      await createClient().auth.resetPasswordForEmail(email.trim(), { redirectTo: `${location.origin}/auth/callback?next=/senha/nova` });
      setBusy(false); setSent(email.trim()); // mesma resposta exista ou não a conta
    }}>
      <Field name="email" label="E-mail da conta" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e: any) => setEmail(e.target.value)} error={err} />
      <div className="form-actions"><button className="btn" type="submit" disabled={busy}>{busy ? "Enviando…" : <>Enviar link <Icon n="right" /></>}</button><Link className="linkbtn" href="/entrar">Lembrei a senha</Link></div>
    </form>
  );
}

export function NewPasswordForm() {
  const router = useRouter(); const [p1, setP1] = useState(""); const [p2, setP2] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  return (
    <form className="form" noValidate onSubmit={async (e) => {
      e.preventDefault();
      if (p1.length < 8) return setErr("Use pelo menos 8 caracteres."); if (p1 !== p2) return setErr("As senhas não conferem.");
      setErr(""); setBusy(true);
      const { error } = await createClient().auth.updateUser({ password: p1 });
      if (error) {
        setBusy(false);
        const code = (error as any).code;
        setErr(code === "same_password" || /different from the old/i.test(error.message) ? "A nova senha precisa ser diferente da anterior."
          : code === "weak_password" ? "Senha fraca. Use mais caracteres, misturando letras e números."
          : /session/i.test(error.message) ? "Sua sessão de redefinição expirou. Peça um novo link."
          : error.message);
        return;
      }
      router.replace("/entrar/redirecionar"); router.refresh();
    }}>
      <Field name="p1" label="Nova senha" type="password" autoComplete="new-password" aside="8+ caracteres" value={p1} onChange={(e: any) => setP1(e.target.value)} />
      <Field name="p2" label="Repita a nova senha" type="password" autoComplete="new-password" value={p2} onChange={(e: any) => setP2(e.target.value)} error={err} />
      <div className="form-actions"><button className="btn" type="submit" disabled={busy}>{busy ? "Salvando…" : <>Salvar e entrar <Icon n="right" /></>}</button></div>
    </form>
  );
}
