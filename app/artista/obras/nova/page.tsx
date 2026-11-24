import { requireMember } from "@/lib/supabase/server";
import { NewWorkForm } from "@/components/forms/NewWorkForm";
import { currentCommissionPct } from "@/lib/data";
import { fmtPct } from "@/lib/format";

export const metadata = { title: "Nova obra" };

export default async function Nova() {
  const [me, pct] = await Promise.all([requireMember("artist"), currentCommissionPct()]);
  return (
    <div className="wrap">
      <header className="page-head">
        <p className="lab" style={{ color: "var(--ink)" }}>Ateliê / Nova obra</p>
        <h1 className="acq-title">Cadastrar <em>nova obra.</em></h1>
        <div className="page-strip" style={{ marginTop: "clamp(24px,3vw,40px)" }}><p className="lab">Curadoria</p><p className="intro">Preencha como uma galeria documentaria a obra. Ela vai para a curadoria e, aprovada, aparece na vitrine fechada da rede.</p><p className="count">Comissão {fmtPct(pct)}%<br />Sem taxa de cadastro</p></div>
      </header>
      <NewWorkForm userId={me.id} pct={pct} />
    </div>
  );
}
