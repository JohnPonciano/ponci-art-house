import Link from "next/link";
import { requireMember } from "@/lib/supabase/server";
import { ordersForBuyer } from "@/lib/data";
import { PageHead, Empty } from "@/components/ui";
import { OrderBlock } from "@/components/area";
import { Icon } from "@/components/Icon";
import { myPrintOrders } from "@/lib/prints";
import { myCheckouts } from "@/lib/shop";
import { PrintOrderCard } from "@/components/prints/PrintOrders";
import { brlCents, dateBR } from "@/lib/format";

export const metadata = { title: "Meus pedidos" };
const ST: Record<string, [string, string]> = { awaiting_payment: ["Aguardando pagamento", "t-rev"], paid: ["Pago", "t-pub"], expired: ["Vencido", "t-closed"], cancelled: ["Cancelado", "t-declined"], problem: ["Em análise", "t-countered"] };
const img = (p: string | null) => (p ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/works/${p.replace(/\.jpg$/, /\/(diario|obras-gen)\//.test(p) ? "-t.jpg" : ".jpg")}` : null);

export default async function MeusPedidos() {
  const me = await requireMember("buyer");
  const [os, prs, cks] = await Promise.all([ordersForBuyer(me.id), myPrintOrders(me.id), myCheckouts(me.id)]);
  const nothing = !os.length && !prs.length && !cks.length;
  return (
    <div className="wrap">
      <PageHead title="Meus pedidos" label="Compras e entregas" intro="Seus pedidos, o pagamento e o caminho de cada obra até você. O valor fica em custódia com a PONCI até você confirmar o recebimento."
        count={`${cks.length} ${cks.length === 1 ? "pedido" : "pedidos"}`} />
      {nothing && <div style={{ margin: "32px 0 120px" }}><Empty sm title="Nenhum pedido ainda."><Link className="btn" href="/colecionador">Explorar o acervo <Icon n="right" /></Link></Empty></div>}

      {cks.length > 0 && <section className="mp-sec" aria-labelledby="mp-t"><h2 className="lab" id="mp-t">Pedidos</h2>
        <ul className="mp-list">{cks.map((c) => (
          <li key={c.id}>
            <Link href={`/colecionador/pedido/${c.ref}`} className="mp-card">
              <span className="mp-thumbs">{c.items.slice(0, 4).map((i) => /* eslint-disable-next-line @next/next/no-img-element */ img(i.image) ? <img key={i.ref} src={img(i.image)!} alt="" /> : null)}</span>
              <span className="mp-info"><b>{c.ref}</b><span>{dateBR(c.created_at)} · {c.items.length} {c.items.length === 1 ? "item" : "itens"} · {c.items.map((i) => i.title).join(", ")}</span></span>
              <span className={"tag " + ST[c.status][1]}>{ST[c.status][0]}</span>
              <b className="mp-total">{brlCents(c.total_cents)}</b>
              <span className="mp-go">{c.status === "awaiting_payment" ? "Pagar" : "Ver pedido"} <Icon n="right" /></span>
            </Link>
          </li>))}</ul>
      </section>}

      {os.length > 0 && <section className="mp-sec" aria-labelledby="mp-o"><h2 className="lab" id="mp-o">Obras originais · acompanhar entrega</h2>
        <div style={{ borderTop: "var(--b)" }}>{os.map((o) => <OrderBlock key={o.id} o={o} side="buyer" />)}</div></section>}
      {prs.length > 0 && <section id="prints" className="po-sec" aria-labelledby="aq-pr"><h2 className="lab" id="aq-pr">Prints · acompanhar entrega</h2>{prs.map((o) => <PrintOrderCard key={o.id} o={o} side="buyer" />)}</section>}
      <div style={{ height: "clamp(48px,8vw,100px)" }} />
    </div>
  );
}
