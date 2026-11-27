import { PageHead, Empty } from "@/components/ui";
import { adminPrintOrders } from "@/lib/prints";
import { AdminPrintOrder } from "@/components/prints/AdminPrintOrders";
import { PedidosTabs } from "@/components/admin-tabs";

export const metadata = { title: "Pedidos · Prints" };

export default async function PedidosPrints() {
  const orders = await adminPrintOrders();
  const act = orders.filter((o) => o.status === "awaiting_payment" || (o.status === "in_production" && !o.sent_to_supplier_at)).length;
  return (
    <div className="wrap">
      <PageHead title="Pedidos" label="Prints" count={act ? `${act} pedem ação` : `${orders.length} pedidos`}
        intro="Cada print pago vira uma ordem pronta pra mandar à gráfica. Depois é registrar o despacho e o repasse." />
      <PedidosTabs cur="prints" />
      {orders.length ? <ol className="ig-list">{orders.map((o) => <AdminPrintOrder key={o.id} o={o} />)}</ol>
        : <div style={{ margin: "24px 0" }}><Empty sm title="Nenhum pedido de print ainda." body="Quando alguém comprar um print, ele aparece aqui com o próximo passo." /></div>}
      <div style={{ height: "clamp(72px,10vw,140px)" }} />
    </div>
  );
}
