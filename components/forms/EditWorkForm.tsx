"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "../Icon";
import { useToast } from "../Toast";
import { Field } from "./Field";
import { brl, parseMoney } from "@/lib/format";
import { updateWorkReview } from "@/app/actions";
import type { Work } from "@/lib/data";

/** Artista ajusta a obra enquanto ela está em curadoria e reenvia. */
export function EditWorkForm({ a, open: open0 = false }: { a: Work; open?: boolean }) {
  const toast = useToast(); const router = useRouter(); const [pending, start] = useTransition();
  const [open, setOpen] = useState(open0); const [err, setErr] = useState("");
  const [v, setV] = useState({
    title: a.title, year: String(a.year), medium: a.medium, h: String(a.h), w: String(a.w), edition: a.edition || "",
    price: brl(a.price), desc: (a.description || []).join("\n\n"), repro: !!a.reproduction,
  });
  const on = (k: keyof typeof v) => (e: any) => setV({ ...v, [k]: e.target.value });
  const asked = !!a.changes_requested_at;
  if (!open) return <button type="button" className={asked ? "btn" : "btn ghost sm"} onClick={() => setOpen(true)}>{asked ? "Ajustar e reenviar" : "Editar informações"} <Icon n="edit" /></button>;
  const submit = (e: React.FormEvent) => {
    e.preventDefault(); setErr("");
    const price = parseMoney(v.price);
    start(async () => {
      const r = await updateWorkReview(a.id, { title: v.title, year: +v.year, medium: v.medium, h: +v.h, w: +v.w, edition: v.edition, price, description: v.desc, reproduction: v.repro });
      if (!r.ok) { setErr(r.error); return; }
      toast(asked ? "Obra reenviada para a curadoria." : "Informações atualizadas."); setOpen(false); router.refresh();
    });
  };
  return (
    <form className="form edit-work" onSubmit={submit} noValidate>
      <Field name="title" label="Título" value={v.title} onChange={on("title")} />
      <div className="two">
        <Field name="year" label="Ano" type="number" inputMode="numeric" value={v.year} onChange={on("year")} />
        <Field name="medium" label="Técnica" value={v.medium} onChange={on("medium")} />
      </div>
      <div className="three">
        <Field name="h" label="Altura (cm)" type="number" inputMode="decimal" value={v.h} onChange={on("h")} />
        <Field name="w" label="Largura (cm)" type="number" inputMode="decimal" value={v.w} onChange={on("w")} />
        <Field name="edition" label="Edição" placeholder="Obra única" value={v.edition} onChange={on("edition")} />
      </div>
      <label className="check"><input type="checkbox" checked={v.repro} onChange={(e) => setV({ ...v, repro: e.target.checked })} />
        <span><b>É uma reprodução</b> (impressão, fine art, pôster).</span></label>
      <Field name="price" label="Preço" inputMode="numeric" value={v.price} onChange={on("price")} onBlur={() => { const n = parseMoney(v.price); if (n) setV({ ...v, price: brl(n) }); }} />
      <Field as="textarea" name="desc" rows={5} label="Descrição" aside={`${v.desc.trim().length} / 40+`} value={v.desc} onChange={on("desc")} />
      {err && <p className="err" role="alert">{err}</p>}
      <div className="form-actions" style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <button className="btn" type="submit" disabled={pending}>{pending ? "Enviando…" : asked ? <>Reenviar para a curadoria <Icon n="right" /></> : <>Salvar <Icon n="check" /></>}</button>
        <button type="button" className="linkbtn" onClick={() => setOpen(false)}>Cancelar</button>
      </div>
      <p className="hint">Para trocar a fotografia, retire este envio e cadastre a obra de novo.</p>
    </form>
  );
}
