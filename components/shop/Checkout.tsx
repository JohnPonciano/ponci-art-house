"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";
import { Icon } from "@/components/Icon";
import { brlCents } from "@/lib/format";
import * as S from "@/app/shop-actions";
import type { CartItem } from "@/lib/shop";

const img = (p: string | null) => (p ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/works/${p.replace(/\.jpg$/, /\/(diario|obras-gen)\//.test(p) ? "-t.jpg" : ".jpg")}` : null);

/** Sacola + checkout numa página só: itens, entrega, pagamento e total. */
export function Checkout({ items, shipTo, ready, mp }: { items: CartItem[]; shipTo: string | null; ready: boolean; mp: boolean }) {
  const toast = useToast(); const router = useRouter(); const [pending, start] = useTransition(); const [step, setStep] = useState("");
  const total = items.filter((i) => i.available).reduce((s, i) => s + i.price_cents, 0);
  const blocked = items.some((i) => !i.available);
  const hasOriginal = items.some((i) => i.kind === "original");
  const remove = (id: string) => start(async () => { const r = await S.cartRemove(id); if (!r.ok) toast(r.error!); router.refresh(); });
  const finish = () => start(async () => {
    setStep("Criando seu pedido…");
    const r = await S.checkoutCreate();
    if (!r.ok) { setStep(""); toast(r.error!); router.refresh(); return; }
    const { id, ref, mp } = r.data!;
    if (!mp) { router.push(`/colecionador/pedido/${ref}`); return; }
    setStep("Abrindo o pagamento seguro do Mercado Pago…");
    for (let i = 0; i < 25; i++) {
      await new Promise((ok) => setTimeout(ok, 1200));
      const s = await S.checkoutStatus(id);
      if (s.ok && s.data.pay_link) { window.location.href = s.data.pay_link; return; }
      if (s.ok && s.data.pay_error) break;
    }
    router.push(`/colecionador/pedido/${ref}`);
  });

  if (!items.length) return (
    <div className="ck-empty"><p className="lab">Sua sacola está vazia</p><h2>Que tal começar pelo <em>acervo?</em></h2>
      <Link className="btn" href="/colecionador">Ver obras <Icon n="right" /></Link></div>);

  return (
    <div className="ck">
      <section className="ck-items" aria-label="Itens">
        <ul>{items.map((i) => (
          <li key={i.id} className={i.available ? "" : "off"}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <Link href={`/colecionador/obras/${i.slug}`} className="ck-img">{img(i.image_path) ? <img src={img(i.image_path)!} alt="" /> : null}</Link>
            <div className="ck-info">
              <span className={"tag " + (i.kind === "original" ? "t-orig" : "t-print")}>{i.kind === "original" ? "Original" : "Print"}</span>
              <Link href={`/colecionador/obras/${i.slug}`}><b>{i.title}</b></Link>
              <span>{i.artist_name}</span><span className="ck-label">{i.label}</span>
              {i.note && <span className={i.available ? "hint" : "err"}>{i.note}</span>}
              <button type="button" className="linkbtn" disabled={pending} onClick={() => remove(i.id)}>Remover</button>
            </div>
            <b className="ck-price">{i.available ? brlCents(i.price_cents) : "Indisponível"}</b>
          </li>))}</ul>
      </section>

      <aside className="ck-sum" aria-label="Resumo">
        <p className="lab">Resumo do pedido</p>
        <dl>
          <dt>Subtotal ({items.filter((i) => i.available).length} {items.length === 1 ? "item" : "itens"})</dt><dd>{brlCents(total)}</dd>
          <dt>Frete</dt><dd className="ok-c">Grátis</dd>
          <dt className="ck-total">Total</dt><dd className="ck-total">{brlCents(total)}</dd>
        </dl>
        <div className="ck-block"><p className="lab">Entrega</p>
          {shipTo ? <p>{shipTo}</p> : <p className="err">Falta o endereço de entrega.</p>}
          <Link className="linkbtn" href="/conta#identificacao">{shipTo ? "Alterar endereço" : "Completar cadastro"}</Link></div>
        <div className="ck-block"><p className="lab">Pagamento</p>
          <p>{mp ? "Pix ou cartão em até 12x, no ambiente seguro do Mercado Pago." : "Depois de finalizar, as instruções de pagamento chegam no seu e-mail."}</p></div>
        {hasOriginal && <p className="hint">Obra original fica guardada pra você por 3 dias até o pagamento. Pagou, o contrato de compra já está assinado e a artista prepara o envio.</p>}
        {blocked && <p className="err">Tire da sacola os itens indisponíveis para continuar.</p>}
        <button type="button" className="btn ck-go" disabled={pending || blocked || !shipTo || !ready || !total} onClick={finish}>
          {pending ? step || "Um instante…" : <>Finalizar compra · {brlCents(total)} <Icon n="lock" /></>}</button>
        {!ready && <p className="hint">Para comprar, complete seu cadastro de identificação em <Link href="/conta">Conta</Link>.</p>}
        <p className="ck-trust"><Icon n="lock" /> Pagamento em custódia: o valor só vai para a artista depois que você recebe.</p>
      </aside>
    </div>
  );
}
