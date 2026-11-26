import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMember } from "@/lib/supabase/server";
import { checkoutByRef, paymentsReady } from "@/lib/shop";
import { Icon } from "@/components/Icon";
import { OrderStatus } from "@/components/shop/OrderStatus";
import { brlCents, dateBR } from "@/lib/format";

export const metadata = { title: "Pedido" };
export const dynamic = "force-dynamic";
const img = (p: string | null) => (p ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/works/${p.replace(/\.jpg$/, /\/(diario|obras-gen)\//.test(p) ? "-t.jpg" : ".jpg")}` : null);
const hour = (d: string) => new Date(d).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });

export default async function Pedido({ params, searchParams }: { params: Promise<{ ref: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  await requireMember("buyer");
  const [{ ref }, sp] = await Promise.all([params, searchParams]);
  const [c, mp] = await Promise.all([checkoutByRef(ref), paymentsReady()]);
  if (!c) notFound();
  const head = {
    awaiting_payment: ["Pedido recebido", <>Falta só o <em>pagamento.</em></>, `Pague até ${dateBR(c.pay_until)} às ${hour(c.pay_until)}. Depois disso o pedido cai e as obras voltam para a galeria.`],
    paid: ["Pagamento aprovado", <>Obrigado! Sua compra <em>está confirmada.</em></>, "Os originais vão para a artista embalar e enviar; os prints entram em produção na gráfica. O rastreio aparece em Meus pedidos."],
    expired: ["Pedido vencido", <>O prazo de pagamento <em>acabou.</em></>, "As obras voltaram para a galeria. Se ainda quiser, é só adicionar à sacola de novo."],
    cancelled: ["Pedido cancelado", <>Este pedido foi <em>cancelado.</em></>, ""],
    problem: ["Em análise", <>Recebemos o pagamento <em>e vamos resolver.</em></>, "O pagamento chegou depois do prazo. A PONCI entra em contato para devolver o valor ou reativar o pedido."],
  }[c.status];
  return (
    <div className="wrap od">
      <header className="od-head">
        <p className="lab">{head[0]} · {c.ref}</p>
        <h1 className="acq-title">{head[1]}</h1>
        {head[2] && <p className="od-sub">{head[2]}</p>}
        <OrderStatus id={c.id} status={c.status} payLink={c.mp_init_point} paymentId={sp.payment_id || sp.collection_id} mpStatus={sp.status || sp.collection_status} mp={mp} />
      </header>
      <section className="od-items" aria-label="Itens">
        <ul>{c.items.map((i) => (
          <li key={i.ref}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <span className="ck-img">{img(i.image) ? <img src={img(i.image)!} alt="" /> : null}</span>
            <div className="ck-info"><span className={"tag " + (i.kind === "original" ? "t-orig" : "t-print")}>{i.kind === "original" ? "Original" : "Print"}</span><b>{i.title}</b><span className="ck-label">{i.label} · {i.ref}</span></div>
            <b className="ck-price">{brlCents(i.price_cents)}</b>
          </li>))}</ul>
        <dl className="od-total"><dt>Frete</dt><dd className="ok-c">Grátis</dd><dt>Total</dt><dd>{brlCents(c.total_cents)}</dd></dl>
      </section>
      <p style={{ margin: "24px 0 clamp(72px,10vw,140px)" }}><Link className="btn ghost" href="/colecionador/aquisicoes">Ver meus pedidos <Icon n="right" /></Link></p>
    </div>
  );
}
