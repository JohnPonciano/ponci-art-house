import { requireMember } from "@/lib/supabase/server";
import { ordersForArtist } from "@/lib/data";
import { PageHead, Empty } from "@/components/ui";
import { OrderBlock } from "@/components/area";
import { brl, COMMISSION } from "@/lib/format";

export const metadata = { title: "Vendas" };

export default async function Vendas() {
  const me = await requireMember("artist");
  const os = await ordersForArtist(me.id);
  const gross = os.reduce((s, o) => s + o.amount, 0);
  const net = (l: typeof os) => l.reduce((s, o) => s + o.amount * (1 - COMMISSION), 0);
  return (
    <div className="wrap">
      <PageHead title="Vendas" label="Custódia e repasse" intro="O pagamento do colecionador fica retido pela PONCI até a entrega. O repasse, já descontada a comissão de 15%, acontece em até 7 dias." count={`${os.length} ${os.length === 1 ? "venda" : "vendas"}`} />
      <div className="stats" style={{ ["--n" as any]: 4 }}>
        <div><span className="lab">Vendido (bruto)</span><b className="money">{brl(gross)}</b></div>
        <div><span className="lab">Comissão PONCI</span><b className="money">{brl(gross * COMMISSION)}</b></div>
        <div><span className="lab">Em custódia</span><b className="money ok-c">{brl(net(os.filter((o) => o.stage < 3)))}</b></div>
        <div><span className="lab">Repassado</span><b className="money">{brl(net(os.filter((o) => o.stage === 3)))}</b></div>
      </div>
      <div style={{ margin: "clamp(28px,4vw,48px) 0 clamp(72px,10vw,140px)", borderTop: "var(--b)" }}>
        {os.length ? os.map((o) => <OrderBlock key={o.id} o={o} side="artist" />) : <Empty sm title="Nenhuma venda ainda." body="Quando você aceitar uma proposta ou alguém reservar pelo preço, a venda aparece aqui." />}
      </div>
    </div>
  );
}
