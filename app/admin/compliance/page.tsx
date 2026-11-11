import Link from "next/link";
import { compliance } from "@/lib/admin";
import { PageHead, Empty, Notice } from "@/components/ui";
import { brl, dateBR, STAGES } from "@/lib/format";

export const metadata = { title: "Compliance" };
const fmtDoc = (d: string) => (d?.length === 11 ? d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4") : d?.replace(/(\w{2})(\w{3})(\w{3})(\w{4})(\d{2})/, "$1.$2.$3/$4-$5")) || "—";

export default async function Compliance() {
  const rows = await compliance(10000);
  const pep = rows.filter((r) => r.buyer_pep || r.artist_pep).length;
  return (
    <div className="wrap">
      <PageHead title="Compliance" label="Lei 9.613/98 · IPHAN" intro="Operações a partir de R$ 10 mil, com a identificação das partes. Guarde estes registros por 5 anos." count={<>{rows.length} operações<br />{pep} com PEP</>} />
      <div style={{ margin: "clamp(24px,3vw,40px) 0 16px", display: "grid", gap: 12 }}>
        <Notice icon="shield">Obrigações do setor de arte (confirme com seu advogado): cadastro da empresa no CNART/IPHAN; identificação de clientes; registro das operações; comunicação ao COAF, pelo SISCOAF, das operações exigidas e das suspeitas, sem avisar o cliente; e, nos anos sem comunicações, a declaração de não ocorrência dentro do prazo.</Notice>
        <div><a className="btn sm" href="/admin/compliance/csv" download>Exportar CSV</a></div>
      </div>
      <div style={{ marginBottom: "clamp(72px,10vw,140px)" }}>
        {rows.length ? <div className="ledger">{rows.map((r) => (
          <div className="arow" key={r.order_ref}>
            <span>{r.order_ref}<small>{dateBR(r.created_at)}</small><b style={{ fontSize: 13 }}>{brl(r.amount)}</b>{(r.buyer_pep || r.artist_pep) && <span className="tag t-declined">PEP</span>}</span>
            <span className="who-b"><b>{r.work_title}</b><span>{STAGES[r.stage]?.[0]} · {r.via === "direct" ? "reserva pelo preço" : "proposta"}</span>
              {r.contract_ref && <span><Link href={`/contrato/${r.contract_ref}`} style={{ textDecoration: "underline" }}>{r.contract_ref}</Link> · {r.signatures}/2 assinaturas</span>}</span>
            <span className="det">
              <span><b style={{ color: "var(--ink)" }}>Comprador:</b> {r.buyer_name || "sem cadastro"} · {fmtDoc(r.buyer_doc)} · {r.buyer_city}/{r.buyer_uf} · {r.buyer_code}{r.buyer_pep ? " · PEP" : ""}</span>
              <span><b style={{ color: "var(--ink)" }}>Vendedor:</b> {r.artist_name || "sem cadastro"} · {fmtDoc(r.artist_doc)} · {r.artist_code}{r.artist_pep ? " · PEP" : ""}</span>
            </span>
            <span className="act" />
          </div>))}</div> : <Empty sm title="Nenhuma operação a partir de R$ 10 mil." />}
      </div>
    </div>
  );
}
