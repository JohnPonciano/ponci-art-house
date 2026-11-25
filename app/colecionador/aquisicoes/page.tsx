import Link from "next/link";
import { requireMember } from "@/lib/supabase/server";
import { ordersForBuyer } from "@/lib/data";
import { PageHead, Empty } from "@/components/ui";
import { OrderBlock } from "@/components/area";
import { Icon } from "@/components/Icon";
import { myPrintOrders } from "@/lib/prints";
import { PrintOrderCard } from "@/components/prints/PrintOrders";

export const metadata = { title: "Aquisições" };

export default async function Aquisicoes() {
  const me = await requireMember("buyer");
  const [os, prs] = await Promise.all([ordersForBuyer(me.id), myPrintOrders(me.id)]);
  return (
    <div className="wrap">
      <PageHead title="Aquisições" label="Custódia e entrega" intro="O pagamento fica com a PONCI até você confirmar o recebimento. Cada obra chega com certificado de autenticidade numerado." count={`${os.length} ${os.length === 1 ? "obra" : "obras"}${prs.length ? ` · ${prs.filter((p) => p.status !== "cancelled").length} prints` : ""}`} />
      <div style={{ margin: "clamp(28px,4vw,48px) 0 clamp(72px,10vw,140px)", borderTop: "var(--b)" }}>
        {os.length ? os.map((o) => <OrderBlock key={o.id} o={o} side="buyer" />) : !prs.length && <Empty sm title="Nenhuma aquisição ainda."><Link className="btn" href="/colecionador">Explorar o acervo <Icon n="right" /></Link></Empty>}
      </div>
      {prs.length > 0 && <section id="prints" className="po-sec" aria-labelledby="aq-pr"><h2 className="lab" id="aq-pr">Prints</h2>{prs.map((o) => <PrintOrderCard key={o.id} o={o} side="buyer" />)}</section>}
    </div>
  );
}
