import { createClient } from "@/lib/supabase/server";
import { PageHead, Empty } from "@/components/ui";
import { RegrasForm } from "@/components/admin-regras";
import { dateBR, fmtPct } from "@/lib/format";

export const metadata = { title: "Regras comerciais" };

const pct = (v: number | string | null) => (v == null ? "—" : `${fmtPct(Number(v))}%`);

export default async function Regras() {
  const sb = await createClient();
  const { data, error } = await sb.from("commerce_settings").select("*").order("id", { ascending: false }).limit(50);
  if (error) return (
    <div className="wrap"><PageHead title="Regras comerciais" label="Comissões e taxas" intro="As regras comerciais ainda não foram ativadas no banco." count="" />
      <div style={{ margin: "32px 0 120px" }}><Empty sm title="Falta rodar a migração de regras comerciais." body="Depois do SQL, esta tela mostra a regra vigente e o histórico de mudanças." /></div></div>);
  const rows = (data as any[]) || []; const cur = rows[0] || null;
  return (
    <div className="wrap">
      <PageHead title="Regras comerciais" label="Comissões e taxas" count={cur ? `Versão ${cur.id}` : ""}
        intro="Cada mudança cria uma versão nova e fica no histórico. Toda venda guarda a comissão do dia em que foi feita: mudar aqui não altera vendas nem contratos anteriores." />
      <div className="stats" style={{ ["--n" as any]: 4, marginTop: "clamp(24px,3vw,40px)" }}>
        <div><span className="lab">Original</span><b>{pct(cur?.original_commission_pct)}</b></div>
        <div><span className="lab">Prints</span><b>{pct(cur?.print_commission_pct)}</b></div>
        <div><span className="lab">Pagamento</span><b>{pct(cur?.payment_fee_pct)}</b></div>
        <div><span className="lab">Impostos</span><b>{pct(cur?.tax_pct)}</b></div>
      </div>
      <section className="acq" aria-labelledby="rg-t" style={{ marginTop: "clamp(28px,4vw,48px)" }}>
        <div className="acq-aside"><p className="lab">Nova versão</p><h2 id="rg-t">Mudar <em>as regras.</em></h2>
          <p>No print, o preço final sai de: (custos de produção + remuneração do artista) ÷ (1 − comissão − taxa de pagamento − impostos). Cada custo entra uma vez só.</p>
          <p className="hint">Os custos de produção vêm da tabela de fornecedores (próxima etapa). Nenhum valor é preenchido automaticamente.</p></div>
        <div className="acq-main"><RegrasForm cur={cur} /></div>
      </section>
      <h2 className="lab" style={{ margin: "clamp(28px,4vw,48px) 0 12px" }}>Histórico</h2>
      <ol className="ig-list">{rows.map((r) => (
        <li key={r.id} className="ig-item" style={{ display: "block" }}>
          <p className="ig-meta"><b>Versão {r.id}</b><span>{dateBR(r.created_at)}</span><span>{r.created_by || "—"}</span></p>
          <p>Original {pct(r.original_commission_pct)} · Prints {pct(r.print_commission_pct)} · Pagamento {pct(r.payment_fee_pct)} · Impostos {pct(r.tax_pct)}</p>
          {r.note && <p className="hint">{r.note}</p>}
        </li>))}</ol>
      <div style={{ height: "clamp(72px,10vw,140px)" }} />
    </div>
  );
}
