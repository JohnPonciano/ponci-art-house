"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Field } from "./Field";
import { Icon } from "../Icon";
import { useToast } from "../Toast";
import { saveKyc } from "@/app/actions";
import { cpfValid, cnpjValid, maskCpf, maskCnpj, maskPhone, maskCep, UFS } from "@/lib/br";
import type { Kyc } from "@/lib/supabase/server";

export function KycForm({ kyc, artist }: { kyc: Kyc | null; artist: boolean }) {
  const router = useRouter(); const toast = useToast(); const [pending, start] = useTransition();
  const [v, setV] = useState({
    person_type: kyc?.person_type || "pf", legal_name: kyc?.legal_name || "",
    doc_number: kyc ? (kyc.person_type === "pj" ? maskCnpj(kyc.doc_number) : maskCpf(kyc.doc_number)) : "",
    birth_date: kyc?.birth_date || "", phone: maskPhone(kyc?.phone || ""), cep: maskCep(kyc?.cep || ""), street: kyc?.street || "", number: kyc?.number || "",
    complement: kyc?.complement || "", district: kyc?.district || "", city: kyc?.city || "", uf: kyc?.uf || "", occupation: kyc?.occupation || "",
    pep: !!kyc?.pep, payout_info: kyc?.payout_info || "",
  });
  const [err, setErr] = useState<Record<string, string>>({}); const [status, setStatus] = useState("");
  const pf = v.person_type === "pf";
  const set = (k: string, val: any) => setV((o) => ({ ...o, [k]: val }));
  const on = (k: string, mask?: (s: string) => string) => (e: any) => set(k, mask ? mask(e.target.value) : e.target.value);

  async function lookupCep(cep: string) {
    const d = cep.replace(/\D/g, ""); if (d.length !== 8) return;
    try {
      const r = await fetch(`https://viacep.com.br/ws/${d}/json/`); const j = await r.json();
      if (!j.erro) setV((o) => ({ ...o, street: o.street || j.logradouro || "", district: o.district || j.bairro || "", city: j.localidade || o.city, uf: j.uf || o.uf }));
    } catch { /* preenchimento manual */ }
  }
  function submit(e: React.FormEvent) {
    e.preventDefault();
    const x: Record<string, string> = {}; const doc = v.doc_number.replace(/\D/g, "");
    if (v.legal_name.trim().length < 3) x.legal_name = pf ? "Informe seu nome completo." : "Informe a razão social.";
    if (pf ? !cpfValid(doc) : !cnpjValid(v.doc_number)) x.doc_number = pf ? "CPF inválido." : "CNPJ inválido.";
    if (pf && !v.birth_date) x.birth_date = "Informe a data de nascimento.";
    if (v.phone.replace(/\D/g, "").length < 10) x.phone = "Telefone com DDD.";
    if (v.cep.replace(/\D/g, "").length !== 8) x.cep = "CEP com 8 dígitos.";
    ["street", "number", "district", "city"].forEach((k) => { if (!String((v as any)[k]).trim()) x[k] = "Obrigatório."; });
    if (!v.uf) x.uf = "Selecione.";
    setErr(x);
    if (Object.keys(x).length) { setStatus("Alguns campos precisam de atenção."); document.getElementById("i-" + Object.keys(x)[0])?.focus(); return; }
    setStatus("");
    start(async () => {
      const r = await saveKyc({ ...v, phone: "+55" + v.phone.replace(/\D/g, "") });
      if (!r.ok) { setStatus(r.error!); return; }
      toast("Cadastro salvo."); router.refresh();
    });
  }
  return (
    <form className="form" onSubmit={submit} noValidate>
      <div className="field"><span className="lab">Tipo</span><div className="seg" role="group" aria-label="Tipo de pessoa">
        <button type="button" aria-pressed={pf} onClick={() => set("person_type", "pf")}>Pessoa física</button>
        <button type="button" aria-pressed={!pf} onClick={() => set("person_type", "pj")}>Pessoa jurídica</button></div></div>
      <div className="two">
        <Field name="legal_name" label={pf ? "Nome completo" : "Razão social"} autoComplete={pf ? "name" : "organization"} value={v.legal_name} onChange={on("legal_name")} error={err.legal_name} />
        <Field name="doc_number" label={pf ? "CPF" : "CNPJ"} inputMode={pf ? "numeric" : "text"} placeholder={pf ? "000.000.000-00" : "00.000.000/0000-00"} value={v.doc_number} onChange={on("doc_number", pf ? maskCpf : maskCnpj)} error={err.doc_number} />
      </div>
      <div className="two">
        {pf ? <Field name="birth_date" label="Data de nascimento" type="date" autoComplete="bday" value={v.birth_date} onChange={on("birth_date")} error={err.birth_date} />
          : <Field name="occupation" label="Atividade principal" value={v.occupation} onChange={on("occupation")} />}
        <Field name="phone" label="Telefone (com DDD)" type="tel" inputMode="tel" autoComplete="tel-national" placeholder="(11) 91234-5678" value={v.phone} onChange={on("phone", maskPhone)} error={err.phone} />
      </div>
      {pf && <Field name="occupation" label="Profissão / ocupação" value={v.occupation} onChange={on("occupation")} />}
      <div className="three">
        <Field name="cep" label="CEP" inputMode="numeric" autoComplete="postal-code" placeholder="00000-000" value={v.cep} onChange={(e: any) => { const m = maskCep(e.target.value); set("cep", m); lookupCep(m); }} error={err.cep} />
        <Field name="city" label="Cidade" autoComplete="address-level2" value={v.city} onChange={on("city")} error={err.city} />
        <Field as="select" name="uf" label="UF" value={v.uf} onChange={on("uf")} error={err.uf}><option value="">—</option>{UFS.map((u) => <option key={u}>{u}</option>)}</Field>
      </div>
      <div className="two">
        <Field name="street" label="Logradouro" autoComplete="address-line1" value={v.street} onChange={on("street")} error={err.street} />
        <div className="two" style={{ gap: "0 12px" }}>
          <Field name="number" label="Número" value={v.number} onChange={on("number")} error={err.number} />
          <Field name="complement" label="Complemento" value={v.complement} onChange={on("complement")} />
        </div>
      </div>
      <Field name="district" label="Bairro" value={v.district} onChange={on("district")} error={err.district} />
      {artist && <Field name="payout_info" label="Chave Pix para repasses" placeholder="CPF, e-mail, telefone ou chave aleatória" value={v.payout_info} onChange={on("payout_info")} />}
      <label className="check"><input type="checkbox" checked={v.pep} onChange={(e) => set("pep", e.target.checked)} />
        <span>Sou <b>pessoa politicamente exposta</b> (ocupo ou ocupei cargo público relevante nos últimos 5 anos) ou sou familiar ou colaborador próximo de uma.</span></label>
      <p className="form-status" role="alert">{status}</p>
      <div className="form-actions"><button className="btn" type="submit" disabled={pending}>{pending ? "Salvando…" : <>Salvar cadastro <Icon n="check" /></>}</button>
        <p>Dados exigidos pela Lei 9.613/98 para operações com obras de arte. Só você e a administração da PONCI veem.</p></div>
    </form>
  );
}
