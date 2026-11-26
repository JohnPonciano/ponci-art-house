"use client";
import { useEffect, useState } from "react";
import { setScalePaper } from "@/components/ScaleLive";
import { BuyButtons } from "@/components/shop/BuyButtons";
import { brlCents, cm } from "@/lib/format";
import type { PrintOption } from "@/lib/prints";

/** Escolha de print pelo comprador: cada papel e tamanho com o seu preço, mais edição e assinatura. */
export function BuyerPrints({ options, artist, workId, canBuy = true, demo = false }: { options: PrintOption[]; artist: string; workId: string; canBuy?: boolean; demo?: boolean }) {
  const [sel, setSel] = useState(0);
  const o = options[0], cur = options[sel];
  // o boneco de escala da página acompanha o tamanho escolhido; ao sair do print, volta para a obra original
  useEffect(() => { setScalePaper({ w: cur.w_cm, h: cur.h_cm, label: cur.label }); }, [cur.w_cm, cur.h_cm, cur.label]);
  useEffect(() => () => setScalePaper(null), []);
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
      {demo && !canBuy && <p className="obp-demo"><b>Exemplo.</b> Esta obra é de um artista de demonstração: o print mostra como a compra funciona, mas não pode ser comprado.</p>}
      {canBuy && <BuyButtons kind="print" work={workId} product={cur.product_id} size={cur.size_id} price={brlCents(cur.price_cents)} title={`Print ${cur.label}`} />}
      <p className="hint">Frete grátis. Produzido sob demanda depois do pagamento e enviado com rastreio.</p>
    </section>
  );
}
