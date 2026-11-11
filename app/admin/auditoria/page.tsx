import { audit } from "@/lib/admin";
import { PageHead, Empty } from "@/components/ui";
import { Chips } from "@/components/admin";

export const metadata = { title: "Auditoria" };
const TABLES: [string, string][] = [["all", "Tudo"], ["orders", "Pedidos"], ["contracts", "Contratos"], ["contract_signatures", "Assinaturas"], ["proposals", "Propostas"],
  ["works", "Obras"], ["profiles", "Membros"], ["kyc", "Cadastro"], ["acceptances", "Aceites"], ["member_requests", "Solicitações"], ["legal_documents", "Documentos"], ["invites", "Convites"]];
const ACT: Record<string, string> = { insert: "criou", update: "alterou", delete: "apagou" };

export default async function Auditoria({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const t = (await searchParams).t || "all";
  const rows = await audit(t === "all" ? undefined : t, 300);
  return (
    <div className="wrap">
      <PageHead title="Auditoria" label="Trilha imutável" intro="Quem criou, alterou ou apagou o quê, e quando. Registros não podem ser editados nem apagados. Dados sensíveis (documento, endereço, telefone) são omitidos." count={`Últimos ${rows.length}`} />
      <div className="filters"><div className="frow" role="group" aria-label="Tabela"><span className="lab">Registro</span><Chips base="/admin/auditoria" k="t" cur={t} items={TABLES} /></div></div>
      <div style={{ margin: "clamp(24px,3vw,40px) 0 clamp(72px,10vw,140px)" }}>
        {rows.length ? <div className="ledger">{rows.map((r) => (
          <div className="arow" key={r.id}>
            <span>{new Date(r.at).toLocaleString("pt-BR")}<small>#{r.id}</small></span>
            <span className="who-b"><b>{r.actor_email || "sistema"}</b><span>{ACT[r.action]} · {TABLES.find(([k]) => k === r.table_name)?.[1] || r.table_name}</span><span>{r.row_id}</span></span>
            <span className="det"><code style={{ font: "400 11.5px/1.5 var(--mono)", whiteSpace: "pre-wrap", wordBreak: "break-word", color: "var(--muted)" }}>{summarize(r)}</code></span>
            <span className="act" />
          </div>))}</div> : <Empty sm title="Nada registrado ainda." />}
      </div>
    </div>
  );
}
function summarize(r: any) {
  const c = r.changes || {};
  if (r.action === "update") return Object.entries(c).map(([k, v]: any) => `${k}: ${short(v?.de)} → ${short(v?.para)}`).join("\n");
  const keys = ["status", "stage", "amount", "price", "title", "ref", "party", "kind", "version", "doc_slug", "role", "member_code"].filter((k) => k in c);
  return keys.map((k) => `${k}: ${short(c[k])}`).join("\n") || "—";
}
const short = (v: unknown) => { const s = typeof v === "string" ? v : JSON.stringify(v); return s && s.length > 80 ? s.slice(0, 77) + "…" : s; };
