import { PageHead, Empty } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { adminCheckouts } from "@/lib/shop";
import { MpConnect, MarkPaid } from "@/components/admin-pay";
import { brlCents, dateBR } from "@/lib/format";
import { PedidosTabs } from "@/components/admin-tabs";

export const metadata = { title: "Pedidos" };
const ST: Record<string, [string, string]> = { awaiting_payment: ["Aguardando pagamento", "t-rev"], paid: ["Pago", "t-pub"], expired: ["Vencido", "t-closed"], cancelled: ["Cancelado", "t-declined"], problem: ["Problema", "t-declined"] };
const ago = (iso: string) => { const m = Math.round((Date.now() - new Date(iso).getTime()) / 6e4); return m < 1 ? "agora" : m < 60 ? `há ${m} min` : m < 1440 ? `há ${Math.round(m / 60)} h` : `há ${Math.round(m / 1440)} dias`; };

export default async function Pagamentos() {
  const d = await adminCheckouts();
  if (!d.ready) return <div className="wrap"><PageHead title="Pagamentos" label="Mercado Pago" intro="Os pagamentos ainda não foram ativados no banco." count="" /></div>;
  const s = d.settings; const connected = !!s?.connected_at;
  const waiting = d.checkouts.filter((c) => c.status === "awaiting_payment"), problems = d.checkouts.filter((c) => c.status === "problem");
  return (
    <div className="wrap">
      <PageHead title="Pedidos" label="Pagamentos" count={`${waiting.length} aguardando · ${problems.length} com problema`}
        intro="Cada compra vira um pedido PED-. O comprador paga com Pix ou cartão no Mercado Pago; o pagamento é conferido na API (valor e pedido) antes de liberar as obras." />
      <PedidosTabs cur="pagamentos" />
      <section className="ig-status" aria-label="Conexão">
        <div>
          <p className="lab">Conexão</p>
          {connected ? <p><b>{s.account_label || "Mercado Pago"}</b> · conectado {ago(s.connected_at)}{s.sandbox && <> · <span className="warn">modo teste</span></>}</p>
            : <p className="warn">Mercado Pago não conectado. Até conectar, o comprador finaliza o pedido e recebe as instruções por e-mail; você marca como pago aqui.</p>}
          <p className="hint">{s?.last_tick_at ? `Conferência automática ativa · último ciclo ${ago(s.last_tick_at)}` : "A conferência automática ainda não rodou."}</p>
          <p className="hint">Aviso de pagamento (webhook): https://ponci.art/api/mp/webhook. Ele já vai em cada pedido; não precisa cadastrar no painel do Mercado Pago.</p>
        </div>
        <MpConnect connected={connected} />
      </section>
      {problems.length > 0 && <p className="sale-alert" style={{ marginTop: 20 }}><Icon n="info" />{problems.length} pedido(s) pago(s) depois do prazo: devolva o valor no Mercado Pago ou fale com o comprador.</p>}
      <h2 className="lab" style={{ margin: "clamp(28px,4vw,48px) 0 12px" }}>Pedidos</h2>
      {d.checkouts.length ? <ol className="ig-list">{d.checkouts.map((c) => (
        <li key={c.id} className="ig-item" style={{ display: "block" }}>
          <p className="ig-meta"><span className={"tag " + ST[c.status][1]}>{ST[c.status][0]}</span><b>{c.ref}</b><span>{brlCents(c.total_cents)}</span><span>{dateBR(c.created_at)}</span>
            <span>{c.buyer?.member_code} · {c.buyer?.full_name} · {c.buyer?.email}</span>{c.mp_payment_id && <span>pagamento {c.mp_payment_id}</span>}</p>
          <p className="hint">{(c.items as any[]).map((i) => `${i.kind === "original" ? "Original" : "Print"}: ${i.title} (${i.ref})`).join(" · ")}</p>
          {c.mp_error && <p className="sale-alert"><Icon n="info" />{c.mp_error}</p>}
          {c.status === "awaiting_payment" && <span className="pa-acts"><span className="hint">Vence {dateBR(c.pay_until)}</span><MarkPaid id={c.id} /></span>}
        </li>))}</ol> : <Empty sm title="Nenhum pedido ainda." body="Quando alguém finalizar uma compra, o pedido aparece aqui." />}
      <div style={{ height: "clamp(72px,10vw,140px)" }} />
    </div>
  );
}
