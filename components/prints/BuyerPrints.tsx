"use client";
import { useState } from "react";
import { brlCents, cm } from "@/lib/format";
import type { PrintOption } from "@/lib/prints";

/** Escolha de print pelo comprador: cada papel e tamanho com o seu preço, mais edição e assinatura. */
export function BuyerPrints({ options, artist }: { options: PrintOption[]; artist: string }) {
  const [sel, setSel] = useState(0);
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
          <input type="radio" name="obp" checked={i === sel} onChange={() => setSel(i)} />
          <span><b>{x.label}</b> {cm(x.w_cm)} × {cm(x.h_cm)} cm<small>{x.product_name}{x.finish ? ` · ${x.finish}` : ""}</small></span>
          <span className="obp-price">{brlCents(x.price_cents)}</span></label></li>))}</ul>
      <p className="ob-price">{brlCents(cur.price_cents)}<small>{cur.label} · {cur.product_name} · produzido sob demanda</small></p>
      <p className="hint">Impressa por gráfica homologada pela PONCI depois do pagamento confirmado. Envio com rastreio.</p>
      <button type="button" className="btn ghost" disabled>Compra de prints abre em breve</button>
    </section>
  );
}
