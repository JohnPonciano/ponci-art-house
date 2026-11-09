import { requests } from "@/lib/admin";
import { PageHead, Empty } from "@/components/ui";
import { RequestRow, Chips } from "@/components/admin";

export const metadata = { title: "Pedidos de convite" };

export default async function Pedidos({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  const f = (await searchParams).f || "pending";
  const rs = await requests();
  const list = rs.filter((r) => f === "all" || r.status === f);
  const n = (s: string) => rs.filter((r) => r.status === s).length;
  return (
    <div className="wrap">
      <PageHead title="Pedidos" label="Pedidos de convite" intro="Quem preencheu o formulário da página principal. Ao aprovar, um código de uso único é gerado; a conta criada com ele entra já ativa." count={`${n("pending")} pendentes`} />
      <div className="filters"><div className="frow" role="group" aria-label="Situação"><span className="lab">Situação</span>
        <Chips base="/admin/pedidos" cur={f} items={[["pending", "Pendentes", n("pending")], ["approved", "Aprovados", n("approved")], ["rejected", "Recusados", n("rejected")], ["all", "Todos", rs.length]]} /></div></div>
      <div style={{ margin: "clamp(24px,3vw,40px) 0 clamp(72px,10vw,140px)" }}>
        {list.length ? <div className="ledger">{list.map((r) => <RequestRow key={r.id} r={r} />)}</div> : <Empty sm title="Nada aqui." body="Os pedidos chegam pelo formulário “Solicitar acesso” da página principal." />}
      </div>
    </div>
  );
}
