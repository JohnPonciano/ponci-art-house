"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Field } from "./Field";
import { Icon } from "../Icon";
import { useToast } from "../Toast";
import { createRequest } from "@/app/actions";

export const REQUEST_KINDS: Record<string, string> = {
  acesso: "Acesso aos meus dados", correcao: "Correção de dados", portabilidade: "Portabilidade", exclusao: "Exclusão da conta e dos dados",
  revogacao: "Revogação de consentimento", outro: "Outro assunto", arrependimento: "Arrependimento de compra", problema: "Problema com a compra",
};

export function RequestForm({ orderId, kinds = ["acesso", "correcao", "portabilidade", "exclusao", "revogacao", "outro"], compact }: { orderId?: string; kinds?: string[]; compact?: boolean }) {
  const router = useRouter(); const toast = useToast(); const [pending, start] = useTransition();
  const [kind, setKind] = useState(kinds[0]); const [details, setDetails] = useState(""); const [err, setErr] = useState("");
  return (
    <form className="form" noValidate onSubmit={(e) => { e.preventDefault(); if (details.trim().length < 10 && kind !== "acesso" && kind !== "portabilidade") { setErr("Descreva o pedido em pelo menos 10 caracteres."); return; }
      setErr(""); start(async () => { const r = await createRequest(kind, details, orderId); if (!r.ok) { setErr(r.error!); return; } toast(`Solicitação ${r.data} registrada.`); setDetails(""); router.refresh(); }); }}>
      {kinds.length > 1 && <Field as="select" name="kind" label="Tipo de solicitação" value={kind} onChange={(e: any) => setKind(e.target.value)}>{kinds.map((k) => <option key={k} value={k}>{REQUEST_KINDS[k]}</option>)}</Field>}
      <Field as="textarea" name="details" rows={compact ? 3 : 4} label="Detalhes" value={details} onChange={(e: any) => setDetails(e.target.value)} error={err}
        placeholder={kind === "exclusao" ? "Conte por que deseja sair. Dados de operações são guardados pelo prazo legal (5 anos) e ficam bloqueados." : kind === "arrependimento" ? "Motivo (opcional, mas ajuda a organizar a devolução)." : "Explique o que você precisa."} />
      <div className="form-actions"><button className="btn sm" type="submit" disabled={pending}>{pending ? "Enviando…" : <>Enviar solicitação <Icon n="right" /></>}</button></div>
    </form>
  );
}
