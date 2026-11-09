"use client";
import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Field, isEmail } from "./Field";
import { Icon } from "../Icon";
import { requestAccess } from "@/app/actions";

const PRACTICE = ["Pintura", "Escultura e objeto", "Obra sobre papel", "Fotografia", "Gravura e edição", "Técnica mista"];
const BUDGET = ["Até R$ 20 mil", "R$ 20 mil a R$ 60 mil", "R$ 60 mil a R$ 150 mil", "Acima de R$ 150 mil"];
const empty = { name: "", email: "", city: "", link: "", practice: "", msg: "" };

export function AccessForm() {
  const [role, setRole] = useState<"artist" | "buyer">("artist");
  const [v, setV] = useState(empty); const [err, setErr] = useState<Record<string, string>>({});
  const [status, setStatus] = useState(""); const [done, setDone] = useState<{ ref: string; role: string; name: string; email: string } | null>(null);
  const [pending, start] = useTransition();
  useEffect(() => {
    const pick = (e: Event) => { const r = (e as CustomEvent).detail; if (r === "artist" || r === "buyer") { setRole(r); setDone(null); } };
    window.addEventListener("ponci:pick", pick); return () => window.removeEventListener("ponci:pick", pick);
  }, []);
  const on = (k: string) => (e: any) => setV({ ...v, [k]: e.target.value });
  const A = role === "artist";
  function submit(ev: React.FormEvent) {
    ev.preventDefault();
    const e: Record<string, string> = {};
    if (v.name.trim().length < 2) e.name = "Informe seu nome.";
    if (!isEmail(v.email)) e.email = "Informe um e-mail válido, como nome@dominio.com.";
    if (!v.city.trim()) e.city = "Informe sua cidade.";
    if (A && !v.link.trim()) e.link = "Informe um link para o seu trabalho.";
    if (!v.practice) e.practice = "Selecione uma opção.";
    if (v.msg.trim().length < 20) e.msg = `Escreva pelo menos 20 caracteres (${v.msg.trim().length} até agora).`;
    setErr(e);
    if (Object.keys(e).length) { setStatus("Alguns campos precisam de atenção antes do envio."); document.getElementById("i-" + Object.keys(e)[0])?.focus(); return; }
    setStatus("");
    start(async () => {
      const r = await requestAccess({ role, ...v });
      if (!r.ok) { setStatus(r.error); return; }
      setDone({ ref: r.data!.ref, role, name: v.name, email: v.email }); setV(empty);
    });
  }
  if (done) return (
    <div className="success" role="status">
      <span className="mark"><Icon n="check" /></span>
      <h2>Pedido recebido.</h2>
      <p>{done.role === "artist" ? "A curadoria da PONCI analisa cada portfólio pessoalmente. Se aprovado, o seu código de convite chega por e-mail." : "Vamos verificar sua identidade e a indicação. Se aprovado, o convite de colecionador chega por e-mail."}</p>
      <dl className="spec"><dt>Referência</dt><dd>{done.ref}</dd><dt>Perfil</dt><dd>{done.role === "artist" ? "Artista" : "Colecionador"}</dd><dt>Nome</dt><dd>{done.name}</dd><dt>E-mail</dt><dd>{done.email}</dd></dl>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        <Link className="btn" href={`/cadastro?perfil=${done.role === "artist" ? "artista" : "colecionador"}`}>Já tenho um código <Icon n="right" /></Link>
        <button type="button" className="btn ghost" onClick={() => setDone(null)}>Novo pedido <Icon n="right" /></button>
      </div>
    </div>
  );
  return (
    <form className="form" onSubmit={submit} noValidate>
      <div className="field"><span className="lab">Eu sou</span><div className="seg" role="group" aria-label="Perfil">
        <button type="button" aria-pressed={A} onClick={() => { setRole("artist"); setErr({}); }}>Artista</button>
        <button type="button" aria-pressed={!A} onClick={() => { setRole("buyer"); setErr({}); }}>Colecionador</button></div></div>
      <div className="two">
        <Field name="name" label="Nome" placeholder="Seu nome completo" autoComplete="name" value={v.name} onChange={on("name")} error={err.name} />
        <Field name="email" label="E-mail" type="email" inputMode="email" autoComplete="email" placeholder="nome@dominio.com" value={v.email} onChange={on("email")} error={err.email} />
      </div>
      <div className="two">
        <Field name="city" label="Cidade / UF" placeholder="São Paulo, SP" value={v.city} onChange={on("city")} error={err.city} />
        <Field name="link" label={A ? "Portfólio ou Instagram" : "Indicação"} placeholder={A ? "https://… ou @seu.perfil" : "Nome ou código de um membro (opcional)"} value={v.link} onChange={on("link")} error={err.link} />
      </div>
      <Field as="select" name="practice" label={A ? "Linguagem principal" : "Faixa de investimento por obra"} value={v.practice} onChange={on("practice")} error={err.practice}>
        <option value="">Selecione</option>{(A ? PRACTICE : BUDGET).map((o) => <option key={o}>{o}</option>)}
      </Field>
      <Field as="textarea" name="msg" rows={5} label={A ? "Sobre a sua prática" : "O que você coleciona"} aside={`${v.msg.trim().length} / 20+`}
        placeholder={A ? "Materiais, séries em andamento, onde já expôs…" : "Artistas, linguagens, formatos, o espaço onde as obras vão viver…"} value={v.msg} onChange={on("msg")} error={err.msg} />
      <p className="form-status" role="alert">{status}</p>
      <div className="form-actions"><button className="btn" type="submit" disabled={pending}>{pending ? "Enviando…" : <>Solicitar convite <Icon n="right" /></>}</button>
        <p>O pedido fica registrado para a curadoria. Nenhum convite é enviado automaticamente.</p></div>
    </form>
  );
}

export function PickRole({ role, className, children }: { role: "artist" | "buyer"; className?: string; children: React.ReactNode }) {
  return <a className={className} href="#acesso" onClick={() => window.dispatchEvent(new CustomEvent("ponci:pick", { detail: role }))}>{children}</a>;
}
