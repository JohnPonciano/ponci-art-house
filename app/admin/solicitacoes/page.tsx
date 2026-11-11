import { memberRequests } from "@/lib/admin";
import { PageHead, Empty } from "@/components/ui";
import { Chips } from "@/components/admin";
import { RequestReply } from "@/components/admin-client";
import { REQUEST_KINDS } from "@/components/forms/RequestForm";
import { brl, dateBR } from "@/lib/format";

export const metadata = { title: "Solicitações" };
const RS: Record<string, [string, string]> = { aberta: ["Aberta", "t-open"], em_andamento: ["Em andamento", "t-countered"], concluida: ["Concluída", "t-accepted"], negada: ["Negada", "t-declined"] };

export default async function Solicitacoes({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  const f = (await searchParams).f || "abertas";
  const all = await memberRequests();
  const open = (r: any) => r.status === "aberta" || r.status === "em_andamento";
  const list = all.filter((r) => f === "todas" || (f === "abertas" ? open(r) : f === "lgpd" ? !["arrependimento", "problema"].includes(r.kind) : ["arrependimento", "problema"].includes(r.kind)));
  return (
    <div className="wrap">
      <PageHead title="Pedidos" label="Solicitações dos membros" intro="Direitos do titular (LGPD, prazo de resposta de 15 dias) e pós-venda (arrependimento em 7 dias, problemas na entrega)." count={`${all.filter(open).length} em aberto`} />
      <div className="filters"><div className="frow" role="group" aria-label="Filtro"><span className="lab">Mostrar</span>
        <Chips base="/admin/solicitacoes" cur={f} items={[["abertas", "Em aberto", all.filter(open).length], ["lgpd", "LGPD"], ["vendas", "Pós-venda"], ["todas", "Todas", all.length]]} /></div></div>
      <div style={{ margin: "clamp(24px,3vw,40px) 0 clamp(72px,10vw,140px)" }}>
        {list.length ? <div className="ledger">{list.map((r: any) => {
          const late = open(r) && Date.now() - new Date(r.created_at).getTime() > 15 * 864e5 && !["arrependimento", "problema"].includes(r.kind);
          return (
            <div className="arow" key={r.id}>
              <span>{r.ref}<small>{dateBR(r.created_at)}</small><span className={"tag " + RS[r.status][1]}>{RS[r.status][0]}</span>{late && <span className="tag t-declined">Prazo LGPD vencido</span>}</span>
              <span className="who-b"><b>{REQUEST_KINDS[r.kind]}</b><span>{r.member?.name || "—"} · {r.member?.code}</span><span>{r.member?.email}</span>
                {r.order && <span>Pedido {r.order.ref} · {brl(r.order.amount)}</span>}</span>
              <span className="det">{r.details ? <q>{r.details}</q> : <span>Sem detalhes.</span>}</span>
              <span className="act"><RequestReply id={r.id} status={r.status} response={r.response} /></span>
            </div>);
        })}</div> : <Empty sm title="Nenhuma solicitação aqui." />}
      </div>
    </div>
  );
}
