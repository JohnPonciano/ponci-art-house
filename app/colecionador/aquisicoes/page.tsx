import Link from "next/link";
import { requireMember } from "@/lib/supabase/server";
import { ordersForBuyer } from "@/lib/data";
import { PageHead, Empty } from "@/components/ui";
import { OrderBlock } from "@/components/area";
import { Icon } from "@/components/Icon";

export const metadata = { title: "Aquisições" };

export default async function Aquisicoes() {
  const me = await requireMember("buyer");
  const os = await ordersForBuyer(me.id);
  return (
    <div className="wrap">
      <PageHead title="Aquisições" label="Custódia e entrega" intro="O pagamento fica com a PONCI até você confirmar o recebimento. Cada obra chega com certificado de autenticidade numerado." count={`${os.length} ${os.length === 1 ? "obra" : "obras"}`} />
      <div style={{ margin: "clamp(28px,4vw,48px) 0 clamp(72px,10vw,140px)", borderTop: "var(--b)" }}>
        {os.length ? os.map((o) => <OrderBlock key={o.id} o={o} side="buyer" />) : <Empty sm title="Nenhuma aquisição ainda."><Link className="btn" href="/colecionador">Explorar o acervo <Icon n="right" /></Link></Empty>}
      </div>
    </div>
  );
}
