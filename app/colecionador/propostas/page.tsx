import { getMe } from "@/lib/supabase/server";
import { proposalsForBuyer } from "@/lib/data";
import { PageHead } from "@/components/ui";
import { Ledger, BuyerProposalRow } from "@/components/area";

export const metadata = { title: "Propostas" };

export default async function Propostas() {
  const me = (await getMe())!;
  const ps = await proposalsForBuyer(me.id);
  return (
    <div className="wrap">
      <PageHead title="Propostas" label="Negociação privada" intro="Acompanhe o que você ofereceu e responda às contrapropostas das artistas."
        count={<>{ps.filter((p) => p.status === "countered").length} contrapropostas<br />{ps.filter((p) => p.status === "open").length} aguardando</>} />
      <div style={{ margin: "clamp(28px,4vw,48px) 0 clamp(72px,10vw,140px)" }}>
        <Ledger empty={["Nenhuma proposta ainda.", "Abra uma obra do acervo para fazer a primeira."]}>{ps.map((p) => <BuyerProposalRow key={p.id} p={p} />)}</Ledger>
      </div>
    </div>
  );
}
