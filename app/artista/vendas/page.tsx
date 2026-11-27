import { requireMember } from "@/lib/supabase/server";
import { ordersForArtist, currentCommissionPct } from "@/lib/data";
import { PageHead, Empty } from "@/components/ui";
import { OrderBlock } from "@/components/area";
import { brl, brlCents, commissionOf, netOf, fmtPct } from "@/lib/format";
import { artistPrintOrders } from "@/lib/prints";
import { PrintOrderCard } from "@/components/prints/PrintOrders";

export const metadata = { title: "Vendas" };

export default async function Vendas() {
  const me = await requireMember("artist");
  const [os, pct, prs] = await Promise.all([ordersForArtist(me.id), currentCommissionPct(), artistPrintOrders()]);
  const gross = os.filter((o) => !o.cancelled_at).reduce((s, o) => s + o.amount, 0);
  const net = (l: typeof os) => l.reduce((s, o) => s + netOf(o), 0);
  return (
    <div className="wrap">
      <PageHead title="Vendas" label="Custódia e repasse" intro={`O pagamento do colecionador fica retido pela PONCI até a entrega. O repasse, já descontada a comissão (hoje ${fmtPct(pct)}%; cada venda guarda a do dia em que foi feita), é liberado depois dos 7 dias de arrependimento do comprador.`} count={`${os.length} ${os.length === 1 ? "venda" : "vendas"}`} />
      <div className="stats" style={{ ["--n" as any]: 5 }}>
        <div><span className="lab">Vendido (bruto)</span><b className="money">{brl(gross)}</b></div>
        <div><span className="lab">Comissão PONCI</span><b className="money">{brl(os.filter((o) => !o.cancelled_at).reduce((s, o) => s + commissionOf(o), 0))}</b></div>
        <div><span className="lab">Em custódia</span><b className="money ok-c">{brl(net(os.filter((o) => !o.cancelled_at && (o.stage === 1 || o.stage === 2))))}</b></div>
        <div><span className="lab">A receber</span><b className="money">{brl(net(os.filter((o) => !o.cancelled_at && o.stage === 3 && !o.payout_at)))}</b></div>
        <div><span className="lab">Repassado</span><b className="money">{brl(net(os.filter((o) => !o.cancelled_at && !!o.payout_at)))}</b></div>
      </div>
      <div style={{ margin: "clamp(28px,4vw,48px) 0 clamp(72px,10vw,140px)", borderTop: "var(--b)" }}>
        {os.length ? os.map((o) => <OrderBlock key={o.id} o={o} side="artist" />) : <Empty sm title="Nenhuma venda ainda." body="Quando alguém comprar uma obra sua, a venda aparece aqui com o passo a passo do envio." />}
      </div>
      {prs.length > 0 && <section className="po-sec" aria-labelledby="av-pr">
        <h2 className="lab" id="av-pr">Prints vendidos · {brlCents(prs.filter((p) => p.status !== "awaiting_payment").reduce((t, p) => t + p.artist_fee_cents, 0))} para você</h2>
        {prs.map((o) => <PrintOrderCard key={o.id} o={o} side="artist" />)}</section>}
    </div>
  );
}
