"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";
import { Icon } from "@/components/Icon";
import { brlCents, cm, dateBR } from "@/lib/format";
import * as P from "@/app/print-actions";

const ST: Record<string, [string, string]> = { awaiting_payment: ["Aguardando pagamento", "t-open"], in_production: ["Em produção", "t-accepted"], shipped: ["A caminho", "t-countered"], delivered: ["Entregue", "t-pub"], cancelled: ["Cancelado", "t-closed"] };
const addr = (a: any) => a ? `${a.name || a.legal_name}\n${a.street}, ${a.number || "s/n"}${a.complement ? ` · ${a.complement}` : ""}\n${a.district ? a.district + " · " : ""}${a.city}/${a.uf} · CEP ${a.cep}${a.phone ? `\nTel. ${a.phone}` : ""}` : "(endereço não cadastrado)";

/** Um pedido de print no admin: mostra só o próximo passo. */
export function AdminPrintOrder({ o }: { o: any }) {
  const toast = useToast(); const router = useRouter(); const [pending, start] = useTransition();
  const [f, setF] = useState({ ref: "", carrier: "", code: "", note: "", cancel: false, reason: "" });
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, ok: string) => start(async () => { const r = await fn(); toast(r.ok ? ok : r.error || "Erro."); if (r.ok) router.refresh(); });
  const dest = o.signed ? { label: `Artista (${o.artist.display_name}) para assinar`, text: addr(o.artist.address) } : { label: "Comprador", text: addr(o.ship_to) };
  const ordem = [`Pedido PONCI ${o.ref}`, `Papel: ${o.product_name}`, `Tamanho: ${o.size_label} (${cm(o.w_cm)} × ${cm(o.h_cm)} cm) · 1 cópia, sem moldura, sem cortes`,
    o.offer ? `Arquivo (${o.offer.master_w} × ${o.offer.master_h} px): ${o.master_url || "gere de novo abrindo esta tela"}` : "",
    `Enviar para — ${dest.label}:\n${dest.text}`, "Embalagem neutra, sem nota de preço. Certificado PONCI vai junto."].filter(Boolean).join("\n\n");
  const pay = `mailto:${o.buyer.email}?subject=${encodeURIComponent(`Pagamento do pedido ${o.ref}`)}&body=${encodeURIComponent(`Olá! Para o pedido ${o.ref} (${o.work?.title}, ${o.product_name} ${o.size_label}), o valor é ${brlCents(o.price_cents)} + frete.\n\n[dados de pagamento]\n\nAssim que o pagamento cair, o print entra em produção.\n\nPONCI`)}`;
  return (
    <li className="ig-item pa-order" style={{ display: "block" }}>
      <p className="ig-meta"><span className={"tag " + ST[o.status][1]}>{ST[o.status][0]}</span><b>{o.ref}</b><span>{o.work?.title}</span><span>{o.product_name} · {o.size_label}</span>
        <span>{brlCents(o.price_cents)} · artista {brlCents(o.artist_fee_cents)}</span><span>{dateBR(o.created_at)}</span>
        {o.edition_no && <span>Exemplar {o.edition_no}/{o.edition_max}</span>}{o.signed && <span>Assinado</span>}</p>
      <p className="hint">Comprador {o.buyer.member_code} · {o.buyer.name} · {o.buyer.email} — artista {o.artist.display_name}{o.supplier ? ` — gráfica ${o.supplier.name}` : ""}</p>
      {o.cancel_reason && <p className="hint">Cancelado: {o.cancel_reason}</p>}

      <div className="pa-acts" style={{ marginTop: 10 }}>
        {o.status === "awaiting_payment" && <>
          <a className="btn sm ghost" href={pay}>Enviar dados de pagamento <Icon n="right" /></a>
          <button type="button" className="btn sm" disabled={pending} onClick={() => run(() => P.adminConfirmPrintPayment(o.id), "Pagamento confirmado. Numeração e avisos feitos.")}>Confirmar pagamento <Icon n="check" /></button>
          {new Date(o.expires_at) < new Date() && <span className="hint">Prazo de 48 h vencido.</span>}</>}

        {o.status === "in_production" && <div className="pa-ordem">
          <p className="lab">Ordem para a gráfica {o.sent_to_supplier_at ? `· enviada em ${dateBR(o.sent_to_supplier_at)}${o.supplier_ref ? ` (${o.supplier_ref})` : ""}` : ""}</p>
          <pre>{ordem}</pre>
          <span className="pa-acts">
            <button type="button" className="btn sm ghost" onClick={() => { navigator.clipboard?.writeText(ordem); toast("Ordem copiada. Cole no WhatsApp ou e-mail da gráfica."); }}>Copiar ordem</button>
            {!o.sent_to_supplier_at && <><input value={f.ref} onChange={(e) => setF({ ...f, ref: e.target.value })} placeholder="Nº do pedido na gráfica (opcional)" style={{ minWidth: 220 }} />
              <button type="button" className="btn sm" disabled={pending} onClick={() => run(() => P.adminPrintOrderAction(o.id, "supplier", undefined, undefined, f.ref), "Marcado como enviado à gráfica.")}>Enviei à gráfica</button></>}
          </span>
          {!o.signed ? <span className="pa-acts">
            <select value={f.carrier} onChange={(e) => setF({ ...f, carrier: e.target.value })}><option value="">Transportadora…</option>{["Correios", "Jadlog", "Loggi", "Azul Cargo", "Transportadora"].map((c) => <option key={c}>{c}</option>)}</select>
            <input value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })} placeholder="Rastreio da gráfica" />
            <button type="button" className="btn sm" disabled={pending || !f.carrier || f.code.length < 4} onClick={() => run(() => P.adminPrintOrderAction(o.id, "shipped", f.carrier, f.code), "Despacho registrado. Comprador avisado.")}>Gráfica despachou</button></span>
            : <p className="hint">Print assinado: a artista registra o envio depois de assinar.</p>}
        </div>}

        {o.status === "shipped" && <><span className="hint">{o.carrier} · {o.tracking_code}</span>
          <button type="button" className="btn sm ghost" disabled={pending} onClick={() => run(() => P.adminPrintOrderAction(o.id, "delivered"), "Marcado como entregue.")}>Marcar entregue</button></>}

        {o.status === "delivered" && (o.payout_at ? <span className="hint">Repassado em {dateBR(o.payout_at)}</span> : <>
          <input value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder="Como foi pago (ex.: PIX 26/11)" />
          <button type="button" className="btn sm" disabled={pending} onClick={() => run(() => P.adminPrintOrderAction(o.id, "payout", undefined, undefined, f.note), "Repasse registrado.")}>Registrar repasse de {brlCents(o.artist_fee_cents)}</button></>)}

        {!["delivered", "cancelled"].includes(o.status) && (f.cancel ? <span className="pa-acts">
          <input value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} placeholder="Motivo (o comprador vê)" style={{ minWidth: 220 }} />
          <button type="button" className="btn sm ocre" disabled={pending || f.reason.trim().length < 5} onClick={() => run(() => P.adminPrintOrderAction(o.id, "cancel", undefined, undefined, f.reason), "Pedido cancelado.")}>Cancelar pedido</button>
          <button type="button" className="linkbtn" onClick={() => setF({ ...f, cancel: false })}>Voltar</button></span>
          : <button type="button" className="linkbtn" onClick={() => setF({ ...f, cancel: true })}>Cancelar</button>)}
      </div>
    </li>
  );
}
