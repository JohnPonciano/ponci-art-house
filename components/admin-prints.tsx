"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "./Toast";
import { Icon } from "./Icon";
import { brlCents, parseCents, cm } from "@/lib/format";
import * as P from "@/app/print-actions";
import type { PrintSupplier, PrintProduct, PrintSize, PrintCost } from "@/lib/prints";

function useRun() {
  const toast = useToast(); const router = useRouter(); const [pending, start] = useTransition();
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, ok: string, after?: () => void) => start(async () => {
    const r = await fn(); toast(r.ok ? ok : r.error || "Erro."); if (r.ok) { after?.(); router.refresh(); }
  });
  return { run, pending };
}
const Txt = ({ label, v, on, ph, w }: { label: string; v: string; on: (s: string) => void; ph?: string; w?: number }) =>
  <label className="field" style={w ? { maxWidth: w } : undefined}><span className="lab">{label}</span><input value={v} placeholder={ph} onChange={(e) => on(e.target.value)} /></label>;

/* ---------- fornecedores ---------- */
export function SupplierForm({ s, onDone }: { s?: PrintSupplier; onDone?: () => void }) {
  const { run, pending } = useRun();
  const [v, setV] = useState({ name: s?.name || "", city: s?.city || "", contact: s?.contact || "", notes: s?.notes || "", active: s?.active ?? true });
  return (
    <form className="pa-form" onSubmit={(e) => { e.preventDefault(); run(() => P.adminSupplierSave({ id: s?.id, ...v }), s ? "Fornecedor atualizado." : "Fornecedor cadastrado.", () => { if (!s) setV({ name: "", city: "", contact: "", notes: "", active: true }); onDone?.(); }); }}>
      <Txt label="Gráfica" v={v.name} on={(name) => setV({ ...v, name })} ph="Nome da gráfica homologada" />
      <Txt label="Cidade" v={v.city} on={(city) => setV({ ...v, city })} w={220} />
      <Txt label="Contato" v={v.contact} on={(contact) => setV({ ...v, contact })} ph="Pessoa, e-mail ou telefone" />
      <Txt label="Observações" v={v.notes} on={(notes) => setV({ ...v, notes })} ph="Prazo, padrão de cor, homologação…" />
      <label className="check"><input type="checkbox" checked={v.active} onChange={(e) => setV({ ...v, active: e.target.checked })} /><span>Ativo (homologado)</span></label>
      <span className="pa-acts"><button className="btn sm" disabled={pending || v.name.trim().length < 2}>{s ? "Salvar" : "Cadastrar"}</button>{onDone && <button type="button" className="linkbtn" onClick={onDone}>Cancelar</button>}</span>
    </form>);
}

/* ---------- papéis ---------- */
export function ProductForm({ p, onDone }: { p?: PrintProduct; onDone?: () => void }) {
  const { run, pending } = useRun();
  const [v, setV] = useState({ name: p?.name || "", paper: p?.paper || "", finish: p?.finish || "", description: p?.description || "", dpi: p ? String(p.min_dpi) : "", active: p?.active ?? true });
  const dpi = +v.dpi;
  return (
    <form className="pa-form" onSubmit={(e) => { e.preventDefault(); run(() => P.adminProductSave({ id: p?.id, name: v.name, paper: v.paper, finish: v.finish, description: v.description, min_dpi: dpi, active: v.active }),
      p ? "Papel atualizado." : "Papel cadastrado.", () => { if (!p) setV({ name: "", paper: "", finish: "", description: "", dpi: "", active: true }); onDone?.(); }); }}>
      <Txt label="Nome comercial" v={v.name} on={(name) => setV({ ...v, name })} ph="Como o comprador vai ver" />
      <Txt label="Papel" v={v.paper} on={(paper) => setV({ ...v, paper })} ph="Composição e gramatura" />
      <Txt label="Acabamento" v={v.finish} on={(finish) => setV({ ...v, finish })} w={220} />
      <Txt label="Resolução mínima (dpi)" v={v.dpi} on={(d) => setV({ ...v, dpi: d.replace(/\D/g, "").slice(0, 3) })} ph="Exigida do arquivo-mestre" w={220} />
      <Txt label="Descrição para o comprador" v={v.description} on={(description) => setV({ ...v, description })} />
      <label className="check"><input type="checkbox" checked={v.active} onChange={(e) => setV({ ...v, active: e.target.checked })} /><span>Ativo</span></label>
      <span className="pa-acts"><button className="btn sm" disabled={pending || v.name.trim().length < 2 || !(dpi >= 72 && dpi <= 600)}>{p ? "Salvar" : "Cadastrar"}</button>{onDone && <button type="button" className="linkbtn" onClick={onDone}>Cancelar</button>}</span>
    </form>);
}

/* ---------- tamanhos ---------- */
export function SizeForm({ z, onDone }: { z?: PrintSize; onDone?: () => void }) {
  const { run, pending } = useRun();
  const [v, setV] = useState({ label: z?.label || "", w: z ? cm(z.w_cm) : "", h: z ? cm(z.h_cm) : "", active: z?.active ?? true });
  const n = (s: string) => Number(s.replace(",", "."));
  return (
    <form className="pa-form" onSubmit={(e) => { e.preventDefault(); run(() => P.adminSizeSave({ id: z?.id, label: v.label, w: n(v.w), h: n(v.h), active: v.active }),
      z ? "Tamanho atualizado." : "Tamanho cadastrado.", () => { if (!z) setV({ label: "", w: "", h: "", active: true }); onDone?.(); }); }}>
      <Txt label="Nome" v={v.label} on={(label) => setV({ ...v, label })} ph="Ex.: A3" w={160} />
      {!z && <><Txt label="Largura (cm)" v={v.w} on={(w) => setV({ ...v, w })} w={140} /><Txt label="Altura (cm)" v={v.h} on={(h) => setV({ ...v, h })} w={140} /></>}
      {z && <p className="hint">Medidas não mudam depois de cadastradas ({cm(z.w_cm)} × {cm(z.h_cm)} cm).</p>}
      <label className="check"><input type="checkbox" checked={v.active} onChange={(e) => setV({ ...v, active: e.target.checked })} /><span>Ativo</span></label>
      <span className="pa-acts"><button className="btn sm" disabled={pending || !v.label.trim() || (!z && !(n(v.w) > 0 && n(v.h) > 0))}>{z ? "Salvar" : "Cadastrar"}</button>{onDone && <button type="button" className="linkbtn" onClick={onDone}>Cancelar</button>}</span>
    </form>);
}

/* ---------- custos ---------- */
export function CostForm({ suppliers, products, sizes }: { suppliers: PrintSupplier[]; products: PrintProduct[]; sizes: PrintSize[] }) {
  const { run, pending } = useRun();
  const blank = { supplier: "", product: "", size: "", print: "", prep: "", packaging: "", shipping: "", signed: "", from: "", note: "" };
  const [v, setV] = useState(blank);
  const c = (s: string) => parseCents(s) ?? 0;
  const total = c(v.print) + c(v.prep) + c(v.packaging) + c(v.shipping);
  const sel = (k: "supplier" | "product" | "size", label: string, opts: [string, string][]) =>
    <label className="field"><span className="lab">{label}</span><select value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value })}><option value="">Escolha…</option>{opts.map(([id, t]) => <option key={id} value={id}>{t}</option>)}</select></label>;
  return (
    <form className="pa-form" onSubmit={(e) => { e.preventDefault(); run(() => P.adminCostAdd({ supplier: v.supplier, product: v.product, size: v.size, print: c(v.print), prep: c(v.prep), packaging: c(v.packaging), shipping: c(v.shipping), signed: c(v.signed), from: v.from || null, note: v.note }),
      "Custo cadastrado. A linha anterior da mesma combinação foi encerrada.", () => setV(blank)); }}>
      <div className="pa-grid">
        {sel("supplier", "Gráfica", suppliers.filter((s) => s.active).map((s) => [s.id, s.name]))}
        {sel("product", "Papel", products.filter((p) => p.active).map((p) => [p.id, p.name]))}
        {sel("size", "Tamanho", sizes.filter((z) => z.active).map((z) => [z.id, `${z.label} · ${cm(z.w_cm)} × ${cm(z.h_cm)} cm`]))}
      </div>
      <div className="pa-grid">
        <Txt label="Impressão (R$)" v={v.print} on={(print) => setV({ ...v, print })} ph="Do orçamento da gráfica" />
        <Txt label="Preparo / prova (R$)" v={v.prep} on={(prep) => setV({ ...v, prep })} ph="0 se não houver" />
        <Txt label="Embalagem (R$)" v={v.packaging} on={(packaging) => setV({ ...v, packaging })} />
        <Txt label="Frete-base embutido (R$)" v={v.shipping} on={(shipping) => setV({ ...v, shipping })} ph="0 se o frete for à parte" />
        <Txt label="Extra quando assinado (R$)" v={v.signed} on={(signed) => setV({ ...v, signed })} ph="Envio gráfica → artista" />
        <label className="field"><span className="lab">Vale a partir de</span><input type="date" value={v.from} onChange={(e) => setV({ ...v, from: e.target.value })} /></label>
      </div>
      <Txt label="Referência" v={v.note} on={(note) => setV({ ...v, note })} ph="Nº do orçamento, data, contato" />
      <p className="hint">Custo fixo por exemplar: <b>{brlCents(total)}</b> (sem assinatura). Valores gravados não mudam: um novo custo para a mesma gráfica, papel e tamanho encerra o anterior. Prints já publicados mantêm o preço até o artista republicar.</p>
      <span className="pa-acts"><button className="btn sm" disabled={pending || !v.supplier || !v.product || !v.size || parseCents(v.print) == null}>Cadastrar custo</button></span>
    </form>);
}

export function CostEnd({ id }: { id: string }) {
  const { run, pending } = useRun(); const [ask, setAsk] = useState(false);
  return ask ? <span className="pa-acts"><button type="button" className="btn sm ocre" disabled={pending} onClick={() => run(() => P.adminCostEnd(id), "Custo encerrado.")}>Encerrar</button><button type="button" className="linkbtn" onClick={() => setAsk(false)}>Voltar</button></span>
    : <button type="button" className="linkbtn" onClick={() => setAsk(true)}>Encerrar</button>;
}

/** Editar em linha (fornecedor, papel ou tamanho). */
export function EditToggle({ kind, item }: { kind: "supplier" | "product" | "size"; item: any }) {
  const [on, setOn] = useState(false);
  if (!on) return <button type="button" className="linkbtn" onClick={() => setOn(true)}>Editar <Icon n="edit" /></button>;
  const done = () => setOn(false);
  return kind === "supplier" ? <SupplierForm s={item} onDone={done} /> : kind === "product" ? <ProductForm p={item} onDone={done} /> : <SizeForm z={item} onDone={done} />;
}

export function NewToggle({ kind, label }: { kind: "supplier" | "product" | "size"; label: string }) {
  const [on, setOn] = useState(false);
  if (!on) return <button type="button" className="btn sm ghost" onClick={() => setOn(true)}>{label} <Icon n="plus" /></button>;
  const done = () => setOn(false);
  return <div className="pa-new">{kind === "supplier" ? <SupplierForm onDone={done} /> : kind === "product" ? <ProductForm onDone={done} /> : <SizeForm onDone={done} />}</div>;
}

/* ---------- ofertas ---------- */
export function OfferModeration({ id, status, reason }: { id: string; status: string; reason: string | null }) {
  const { run, pending } = useRun(); const [ask, setAsk] = useState(false); const [r, setR] = useState("");
  if (reason) return <button type="button" className="btn sm ghost" disabled={pending} onClick={() => run(() => P.adminReleaseOffer(id), "Liberada. O artista pode publicar de novo.")}>Liberar</button>;
  if (status !== "active") return null;
  return ask ? (
    <form className="pa-acts" onSubmit={(e) => { e.preventDefault(); run(() => P.adminPauseOffer(id, r), "Prints pausados. O artista vê o motivo.", () => setAsk(false)); }}>
      <input value={r} onChange={(e) => setR(e.target.value)} placeholder="Motivo (o artista vê)" style={{ minWidth: 240 }} />
      <button className="btn sm ocre" disabled={pending || r.trim().length < 5}>Pausar</button><button type="button" className="linkbtn" onClick={() => setAsk(false)}>Voltar</button></form>)
    : <button type="button" className="linkbtn" onClick={() => setAsk(true)}>Pausar</button>;
}
