"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "./Toast";
import * as A from "@/app/admin/actions";

type Cur = { original_commission_pct: number | string; print_commission_pct: number | string | null; payment_fee_pct: number | string | null; tax_pct: number | string | null } | null;
const str = (v: number | string | null | undefined) => (v == null ? "" : String(Number(v)).replace(".", ","));
const num = (s: string) => { const t = s.trim().replace(",", "."); return t === "" ? null : Number(t); };

/** Formulário das regras comerciais. Cada salvamento cria uma versão nova; vendas já feitas não mudam. */
export function RegrasForm({ cur }: { cur: Cur }) {
  const toast = useToast(); const router = useRouter(); const [pending, start] = useTransition();
  const [v, setV] = useState({ original: str(cur?.original_commission_pct), print: str(cur?.print_commission_pct), fee: str(cur?.payment_fee_pct), tax: str(cur?.tax_pct), note: "" });
  const vals = { original: num(v.original), print: num(v.print), fee: num(v.fee), tax: num(v.tax) };
  const bad = Object.values(vals).some((x) => x != null && (Number.isNaN(x) || x < 0 || x > 100));
  const share = (vals.print ?? 0) + (vals.fee ?? 0) + (vals.tax ?? 0);
  const F = (k: keyof typeof v, label: string, hint: string) => (
    <label className="field"><span className="lab">{label}</span>
      <span style={{ display: "flex", alignItems: "center", gap: 8 }}><input inputMode="decimal" value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value })} style={{ maxWidth: 120 }} placeholder="—" /><b>%</b></span>
      <span className="hint">{hint}</span></label>);
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (vals.original == null) { toast("Informe a comissão do original."); return; }
      start(async () => { const r = await A.setCommerce({ ...vals, original: vals.original!, note: v.note }); toast(r.ok ? "Nova regra em vigor." : r.error); if (r.ok) { setV({ ...v, note: "" }); router.refresh(); } }); }}>
      {F("original", "Comissão sobre o original", "Descontada do artista no repasse. Vale para vendas criadas a partir de agora.")}
      {F("print", "Comissão sobre prints", "Embutida no preço final do print. Vazio: prints não podem ser publicados.")}
      {F("fee", "Taxa de pagamento", "Percentual cobrado pelo meio de pagamento sobre o preço final. Vazio = não definido.")}
      {F("tax", "Impostos sobre o print", "Percentual sobre o preço final. Vazio = não definido.")}
      {share >= 90 && <p className="err">Comissão, taxa e imposto somados não podem chegar a 90%.</p>}
      <label className="field"><span className="lab">Motivo da mudança</span><input value={v.note} onChange={(e) => setV({ ...v, note: e.target.value })} maxLength={500} placeholder="Ex.: taxa do gateway contratado" /></label>
      <button className="btn" type="submit" disabled={pending || bad || share >= 90}>{pending ? "Salvando…" : "Salvar nova versão"}</button>
    </form>
  );
}
