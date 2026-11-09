import { reviewWorks } from "@/lib/admin";
import { PageHead, Empty } from "@/components/ui";
import { WorkReviewRow } from "@/components/admin";

export const metadata = { title: "Curadoria" };

export default async function Curadoria() {
  const ws = await reviewWorks();
  return (
    <div className="wrap">
      <PageHead title="Obras" label="Curadoria" intro="Obras enviadas pelas artistas. Aprovadas, entram na vitrine fechada da rede; recusadas, são apagadas." count={`${ws.length} em análise`} />
      <div style={{ margin: "clamp(24px,3vw,40px) 0 clamp(72px,10vw,140px)" }}>
        {ws.length ? <div className="ledger">{ws.map((w) => <WorkReviewRow key={w.id} w={w} />)}</div> : <Empty sm title="Nenhuma obra em curadoria." />}
      </div>
    </div>
  );
}
