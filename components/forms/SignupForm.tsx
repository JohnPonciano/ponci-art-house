"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Field, isEmail } from "./Field";
import { Icon } from "../Icon";
import { cpfValid, maskCpf, maskPhone } from "@/lib/br";

export type Prefill = { role: "artist" | "buyer"; name?: string; email?: string; city?: string; practice?: string } | null;
type Step = "dados" | "documentos" | "acesso";

export function SignupForm({ perfil, code = "", docIds, prefill }: { perfil: "artista" | "colecionador"; code?: string; docIds: string[]; prefill?: Prefill }) {
  const router = useRouter();
  const known = !!(prefill?.name && prefill?.email);
  const role = prefill?.role ?? (perfil === "artista" ? "artist" : "buyer");
  const A = role === "artist";
  const steps: Step[] = known ? ["documentos", "acesso"] : ["dados", "documentos", "acesso"];
  const [step, setStep] = useState<Step>(steps[0]);
  const [edit, setEdit] = useState(false);
  const [v, setV] = useState({ code: code.toUpperCase(), name: prefill?.name || "", email: prefill?.email || "", city: prefill?.city || "", cpf: "", phone: "", password: "" });
  const [accept, setAccept] = useState(false); const [show, setShow] = useState(false);
  const [err, setErr] = useState<Record<string, string>>({}); const [status, setStatus] = useState(""); const [busy, setBusy] = useState(false); const [sent, setSent] = useState("");
  const on = (k: string, mask?: (x: string) => string) => (e: any) => setV({ ...v, [k]: mask ? mask(e.target.value) : e.target.value });
  const idx = steps.indexOf(step);

  const check = (s: Step) => {
    const e: Record<string, string> = {};
    if (s === "dados" || (s === "acesso" && known && edit)) {
      if (!known && !/^PONCI-[A-Z0-9-]{3,}$/i.test(v.code.trim())) e.code = "Informe o código do convite, como PONCI-XXXX.";
      if (v.name.trim().length < 3 || !/\s/.test(v.name.trim())) e.name = "Informe nome e sobrenome.";
      if (!isEmail(v.email)) e.email = "Informe um e-mail válido.";
      if (!v.city.trim()) e.city = "Informe sua cidade.";
    }
    if (s === "documentos") {
      if (!cpfValid(v.cpf)) e.cpf = "CPF inválido.";
      if (v.phone.replace(/\D/g, "").length < 10) e.phone = "Celular com DDD.";
    }
    if (s === "acesso") {
      if (v.password.length < 8) e.password = "Use pelo menos 8 caracteres.";
      if (!accept) e.accept = "É preciso aceitar os documentos para criar a conta.";
    }
    setErr(e); if (Object.keys(e).length) { document.getElementById("i-" + Object.keys(e)[0])?.focus(); return false; }
    return true;
  };
  const next = (ev: React.FormEvent) => { ev.preventDefault(); setStatus(""); if (check(step)) { if (idx < steps.length - 1) setStep(steps[idx + 1]); else submit(); } };

  async function submit() {
    setBusy(true); setStatus("");
    const sb = createClient();
    const email = v.email.trim();
    const { data, error } = await sb.auth.signUp({
      email, password: v.password,
      options: { emailRedirectTo: `${location.origin}/auth/callback`, data: { invite_code: v.code.trim().toUpperCase(), full_name: v.name.trim(), city: v.city.trim(),
        practice: prefill?.practice || "", cpf: v.cpf.replace(/\D/g, ""), phone: "55" + v.phone.replace(/\D/g, ""), accepted_documents: docIds, user_agent: navigator.userAgent.slice(0, 400) } },
    });
    if (error) {
      setBusy(false);
      setStatus(/database error/i.test(error.message) ? "Não foi possível criar a conta. Confira o código do convite e o CPF (cada CPF só pode ter uma conta)." : /registered/i.test(error.message) ? "Este e-mail já é membro. Entre com sua senha." : error.message);
      if (/database error/i.test(error.message)) setStep("documentos");
      return;
    }
    const home = A ? "/artista" : "/colecionador";
    if (data.session) { router.replace(home); router.refresh(); return; }
    // e-mail do convite já comprovado: entra direto
    const r = await sb.auth.signInWithPassword({ email, password: v.password });
    if (!r.error) { router.replace(home); router.refresh(); return; }
    setBusy(false); setSent(email);
  }

  if (sent) return (
    <div className="success" role="status">
      <span className="mark"><Icon n="check" /></span>
      <h2>Conta criada.</h2>
      <p>Enviamos um link de confirmação para <b>{sent}</b>. Depois de confirmar, você entra direto na sua área.</p>
    </div>
  );
  const label = { dados: "Seus dados", documentos: "Identificação", acesso: "Senha e termos" };
  return (
    <form className="form" onSubmit={next} noValidate>
      <ol className="stepper" aria-label="Etapas">{steps.map((s, i) => <li key={s} aria-current={s === step ? "step" : undefined} className={i < idx ? "done" : ""}><span>{i + 1}</span>{label[s]}</li>)}</ol>

      {known && step !== "dados" && (
        <div className="known">
          <p className="lab" style={{ color: "var(--ink)" }}>Convite de {A ? "artista" : "colecionador"} · {v.code}</p>
          {!edit ? <>
            <dl className="spec"><dt>Nome</dt><dd>{v.name}</dd><dt>E-mail</dt><dd>{v.email}</dd>{v.city && <><dt>Cidade</dt><dd>{v.city}</dd></>}</dl>
            <button type="button" className="linkbtn" onClick={() => setEdit(true)}>Alterar estes dados</button></>
          : <>
            <div className="two">
              <Field name="name" label={A ? "Nome completo" : "Nome completo"} autoComplete="name" value={v.name} onChange={on("name")} error={err.name} />
              <Field name="city" label="Cidade / UF" autoComplete="address-level2" value={v.city} onChange={on("city")} error={err.city} />
            </div>
            <Field name="email" label="E-mail" type="email" inputMode="email" autoComplete="email" value={v.email} onChange={on("email")} error={err.email}
              aside={prefill?.email && v.email.trim().toLowerCase() !== prefill.email.toLowerCase() ? "e-mail novo precisará de confirmação" : undefined} />
            <button type="button" className="linkbtn" onClick={() => setEdit(false)}>Pronto</button></>}
        </div>
      )}

      {step === "dados" && <>
        {!code && <Field name="code" label="Código do convite" placeholder="PONCI-XXXX" autoCapitalize="characters" spellCheck={false} value={v.code} onChange={on("code")} error={err.code} />}
        <div className="two">
          <Field name="name" label={A ? "Nome completo" : "Nome completo"} autoComplete="name" value={v.name} onChange={on("name")} error={err.name} />
          <Field name="city" label="Cidade / UF" placeholder="São Paulo, SP" autoComplete="address-level2" value={v.city} onChange={on("city")} error={err.city} />
        </div>
        <Field name="email" label="E-mail" type="email" inputMode="email" autoComplete="email" value={v.email} onChange={on("email")} error={err.email} />
      </>}

      {step === "documentos" && <div className="two">
        <Field name="cpf" label="CPF" inputMode="numeric" placeholder="000.000.000-00" value={v.cpf} onChange={on("cpf", maskCpf)} error={err.cpf} autoFocus />
        <Field name="phone" label="Celular (com DDD)" type="tel" inputMode="tel" autoComplete="tel-national" placeholder="(11) 91234-5678" value={v.phone} onChange={on("phone", maskPhone)} error={err.phone} />
      </div>}

      {step === "acesso" && <>
        <Field name="password" label="Crie uma senha" type={show ? "text" : "password"} autoComplete="new-password" aside="8+ caracteres" value={v.password} onChange={on("password")} error={err.password} autoFocus />
        <button type="button" className="linkbtn" style={{ alignSelf: "flex-start" }} onClick={() => setShow(!show)}>{show ? "Ocultar senha" : "Mostrar senha"}</button>
        <label className="check"><input type="checkbox" checked={accept} onChange={(e) => { setAccept(e.target.checked); setErr({ ...err, accept: "" }); }} />
          <span>Li e aceito os <a href="/termos" target="_blank">Termos de Uso</a>, a <a href="/privacidade" target="_blank">Política de Privacidade</a> e o {A
            ? <a href="/contratos/artista" target="_blank">Contrato de Intermediação — Artista</a> : <a href="/contratos/colecionador" target="_blank">Condições Gerais de Compra</a>}.</span></label>
        {err.accept && <p className="err">{err.accept}</p>}
      </>}

      <p className="form-status" role="alert">{status}</p>
      <div className="form-actions">
        <button className="btn" type="submit" disabled={busy}>{busy ? "Criando conta…" : idx < steps.length - 1 ? <>Continuar <Icon n="right" /></> : <>Criar conta e entrar <Icon n="right" /></>}</button>
        {idx > 0 && <button type="button" className="linkbtn" onClick={() => setStep(steps[idx - 1])}>Voltar</button>}
        <p>Passo {idx + 1} de {steps.length}</p>
      </div>
    </form>
  );
}
