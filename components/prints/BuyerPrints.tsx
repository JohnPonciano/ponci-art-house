"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";
import { Icon } from "@/components/Icon";
import { buyPrint } from "@/app/print-actions";
import { brlCents, cm } from "@/lib/format";
import type { PrintOption } from "@/lib/prints";

/** Escolha de print pelo comprador: cada papel e tamanho com o seu preço, mais edição e assinatura. */
export function BuyerPrints({ options, artist, shipTo, canBuy = true, demo = false }: { options: PrintOption[]; artist: string; shipTo: string | null; canBuy?: boolean; demo?: boolean }) {
  const [sel, setSel] = useState(0); const [ask, setAsk] = useState(false);
  const toast = useToast(); const router = useRouter(); const [pending, start] = useTransition();
  const buy = () => start(async () => {
    const r = await buyPrint(cur.offer_id, cur.product_id, cur.size_id);
    if (!r.ok) { toast(r.error || "Não deu certo. Tente de novo."); return; }
    toast(`Pedido ${r.data!.ref} feito. As instruções de pagamento chegam no seu e-mail.`); router.push("/colecionador/aquisicoes#prints");
  });
  const o = options[0], cur = options[sel];
  const edition = o.edition === "limited"
    ? `Edição limitada de ${o.edition_max}${o.remaining != null ? ` · ${o.remaining === 1 ? "resta 1" : `restam ${o.remaining}`}` : ""}`
    : "Edição aberta";
  return (
    <section className="ob-prints" aria-label="Print fine art">
      <p className="obp-what">Reprodução impressa, autorizada por {artist}. Não é a obra original.</p>
      <p className="obp-ed"><b>{edition}</b>{o.signed ? (o.numbered ? `Assinado e numerado por ${artist}` : `Assinado por ${artist}`) : "Sem assinatura"}</p>
      <ul className="obp-list" role="radiogroup" aria-label="Papel e tamanho">{options.map((x, i) => (
        <li key={x.product_id + x.size_id}><label className={"obp-opt" + (i === sel ? " on" : "")}>
          <input type="radio" name="obp" checked={i === sel} onChange={() => { setSel(i); setAsk(false); }} />
          <span><b>{x.label}</b> {cm(x.w_cm)} × {cm(x.h_cm)} cm<small>{x.product_name}{x.finish ? ` · ${x.finish}` : ""}</small></span>
          <span className="obp-price">{brlCents(x.price_cents)}</span></label></li>))}</ul>
      <p className="ob-price">{brlCents(cur.price_cents)}<small>{cur.label} · {cur.product_name} · produzido sob demanda</small></p>
      <p className="hint">Impressa por gráfica homologada pela PONCI depois do pagamento confirmado. Envio com rastreio.</p>
      {demo && !canBuy && <p className="obp-demo"><b>Exemplo.</b> Esta obra é de um artista de demonstração: o print mostra como a compra funciona, mas não pode ser comprado.</p>}
      {!canBuy ? null : !shipTo ? <p className="hint">Para comprar, <Link href="/conta">complete seu cadastro com o endereço de entrega</Link>.</p>
        : !ask ? <button type="button" className="btn" onClick={() => setAsk(true)}>Comprar print · {brlCents(cur.price_cents)} <Icon n="right" /></button>
        : <div className="obp-confirm">
            <p><b>{cur.label} · {cur.product_name}</b> por <b>{brlCents(cur.price_cents)}</b> + frete</p>
            <p className="hint">Entrega em: {shipTo}. Para mudar, atualize o endereço em Conta.</p>
            <p className="hint">Depois de confirmar, você recebe por e-mail as instruções de pagamento. {o.edition === "limited" ? "Seu exemplar fica guardado por 48 h." : ""} A produção começa quando o pagamento é confirmado.</p>
            <span className="pr-acts"><button type="button" className="btn" disabled={pending} onClick={buy}>{pending ? "Fazendo o pedido…" : <>Confirmar pedido <Icon n="check" /></>}</button>
              <button type="button" className="linkbtn" onClick={() => setAsk(false)}>Voltar</button></span>
          </div>}
    </section>
  );
}
