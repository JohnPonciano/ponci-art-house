"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";
import { Icon } from "@/components/Icon";
import { brlCents, cm, dateBR } from "@/lib/format";
import * as P from "@/app/print-actions";
import type { PrintOrder } from "@/lib/prints";

const STEPS: [string, string][] = [["Pedido feito", "Aguardando pagamento"], ["Pagamento", "Confirmado pela PONCI"], ["Em produção", "Na gráfica"], ["A caminho", "Com rastreio"], ["Recebido", "Na sua parede"]];
const stepOf = (o: PrintOrder) => (o.status === "awaiting_payment" ? 0 : o.status === "in_production" ? 2 : o.status === "shipped" ? 3 : o.status === "delivered" ? 5 : 0);
const CARRIERS = ["Correios", "Jadlog", "Loggi", "Azul Cargo", "Transportadora", "Outra"];

function useRun() {
  const toast = useToast(); const router = useRouter(); const [pending, start] = useTransition();
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, ok: string, after?: () => void) => start(async () => {
    const r = await fn(); toast(r.ok ? ok : r.error || "Erro."); if (r.ok) { after?.(); router.refresh(); }
  });
  return { run, pending };
}

/** Linha do tempo + ações de um pedido de print, para quem comprou ou para a artista. */
export function PrintOrderCard({ o, side }: { o: PrintOrder & { buyer_city?: string }; side: "buyer" | "artist" }) {
  const { run, pending } = useRun(); const [ask, setAsk] = useState(false);
  const st = stepOf(o), off = o.status === "cancelled";
  const ex = o.edition === "limited" ? (o.edition_no ? `Exemplar ${o.edition_no}/${o.edition_max}` : `Edição limitada de ${o.edition_max}`) : "Edição aberta";
  return (
    <article className="po" id={o.ref}>
      <div className="po-top">
        <div>
          <p className="po-tags"><span className="tag t-print">Print</span>{o.signed && <span className="tag t-pub">{o.numbered ? "Assinado e numerado" : "Assinado"}</span>}</p>
          <b className="po-t">{o.work?.slug && side === "buyer" ? <Link href={`/colecionador/obras/${o.work.slug}`}>{o.work.title}</Link> : o.work?.title || "Obra"}</b>
          <span className="po-m">{side === "buyer" && o.work?.artist ? `${o.work.artist.display_name} · ` : ""}{o.product_name} · {o.size_label} ({cm(o.w_cm)} × {cm(o.h_cm)} cm) · {ex}</span>
          <span className="po-m">{o.ref} · {dateBR(o.created_at)}{side === "artist" && o.buyer_city ? ` · comprador de ${o.buyer_city}` : ""}</span>
        </div>
        <div className="price" style={{ textAlign: "right" }}>{side === "buyer" ? brlCents(o.price_cents) : brlCents(o.artist_fee_cents)}
          <small>{side === "buyer" ? "+ frete" : o.payout_at ? `Repassado em ${dateBR(o.payout_at)}` : "Seu valor, depois da entrega"}</small></div>
      </div>
      {off ? <p className="sale-alert off"><Icon n="info" />Pedido cancelado{o.cancel_reason ? `: ${o.cancel_reason}` : "."}</p>
        : <ol className="track po-track">{STEPS.map((s, i) => (
          <li key={s[0]} className={`${i < st || (i === 1 && st >= 2) ? "done" : ""} ${i === st ? "now" : ""}`}><i>{String(i + 1).padStart(2, "0")}</i><b>{s[0]}</b><span className="hint" style={{ color: "inherit", opacity: 0.8 }}>{s[1]}</span></li>))}</ol>}
      {o.tracking_code && <p className="po-ship"><Icon n="truck" /> {o.carrier} · <b>{o.tracking_code}</b>{o.carrier === "Correios" && <> · <a href={`https://rastreamento.correios.com.br/app/index.php?objeto=${o.tracking_code}`} target="_blank" rel="noreferrer">rastrear</a></>}</p>}

      {side === "buyer" && !off && <div className="po-acts">
        {o.status === "awaiting_payment" && <>
          <span className="hint">As instruções de pagamento chegam no seu e-mail{o.edition === "limited" ? `; seu exemplar fica guardado até ${dateBR(o.expires_at)}` : ""}. A produção começa quando o pagamento é confirmado.</span>
          {ask ? <span className="pr-acts"><button type="button" className="btn sm ocre" disabled={pending} onClick={() => run(() => P.cancelPrintOrder(o.id), "Pedido cancelado.")}>Cancelar pedido</button><button type="button" className="linkbtn" onClick={() => setAsk(false)}>Voltar</button></span>
            : <button type="button" className="linkbtn" onClick={() => setAsk(true)}>Cancelar pedido</button>}</>}
        {o.status === "in_production" && <span className="hint">{o.signed ? "Impressão em andamento. Depois, a artista assina e despacha pra você." : "Impressão em andamento. A gráfica despacha direto pra você."}</span>}
        {o.status === "shipped" && <button type="button" className="btn sm" disabled={pending} onClick={() => run(() => P.confirmPrintReceived(o.id), "Recebimento confirmado. Aproveite o print!")}>Recebi o print <Icon n="check" /></button>}
      </div>}

      {side === "artist" && !off && <div className="po-acts">
        {o.status === "awaiting_payment" && <span className="hint">Aguardando o pagamento do comprador. Nada a fazer por enquanto.</span>}
        {o.status === "in_production" && !o.signed && <span className="hint">A gráfica imprime e envia direto ao comprador. Nada a fazer.</span>}
        {o.status === "in_production" && o.signed && <ArtistShip o={o} />}
        {o.status === "shipped" && <span className="hint">A caminho do comprador.</span>}
        {o.status === "delivered" && !o.payout_at && <span className="hint">Entregue. O repasse sai nos próximos dias.</span>}
      </div>}
    </article>
  );
}

function ArtistShip({ o }: { o: PrintOrder }) {
  const { run, pending } = useRun(); const [c, setC] = useState(""); const [code, setCode] = useState("");
  const a = o.ship_to || {};
  return (
    <form className="ship-form" onSubmit={(e) => { e.preventDefault(); run(() => P.artistShipPrint(o.id, c, code), "Envio registrado. O comprador já vê o rastreio."); }}>
      <p className="ship-t"><b>Quando o print chegar da gráfica:</b> assine{o.numbered && o.edition_no ? ` e numere como ${o.edition_no}/${o.edition_max}` : ""}, embale no tubo e envie para:</p>
      <p className="po-addr">{a.name}<br />{a.street}, {a.number || "s/n"}{a.complement ? ` · ${a.complement}` : ""}<br />{a.district ? `${a.district} · ` : ""}{a.city}/{a.uf} · CEP {a.cep}{a.phone ? <><br />Tel. {a.phone}</> : null}</p>
      <div className="ship-row">
        <label className="field"><span className="lab">Forma de envio</span><select value={c} onChange={(e) => setC(e.target.value)} required><option value="">Escolha…</option>{CARRIERS.map((x) => <option key={x}>{x}</option>)}</select></label>
        <label className="field"><span className="lab">Código de rastreio</span><input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Ex.: AB123456789BR" maxLength={60} /></label>
        <button className="btn sm" type="submit" disabled={pending || !c || code.trim().length < 4}>{pending ? "Registrando…" : <>Confirmar envio <Icon n="right" /></>}</button>
      </div>
    </form>
  );
}
