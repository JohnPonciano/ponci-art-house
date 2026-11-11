import { members, kycStatus } from "@/lib/admin";
import { PageHead, Empty } from "@/components/ui";
import { MemberRow, Chips } from "@/components/admin";

export const metadata = { title: "Membros" };

export default async function Membros({ searchParams }: { searchParams: Promise<{ f?: string; role?: string }> }) {
  const sp = await searchParams; const f = sp.f || "all"; const role = sp.role || "all";
  const [ms, ks] = await Promise.all([members(), kycStatus()]);
  const byRole = ms.filter((m) => role === "all" || m.role === role);
  const list = byRole.filter((m) => f === "all" || m.status === f);
  const n = (s: string) => byRole.filter((m) => m.status === s).length;
  const rb = role === "all" ? "/admin/membros" : `/admin/membros?role=${role}`;
  const fb = f === "all" ? "/admin/membros" : `/admin/membros?f=${f}`;
  return (
    <div className="wrap">
      <PageHead title="Membros" label="Artistas e colecionadores" intro="Aprove novos cadastros, suspenda ou reative membros. Membros aguardando ou suspensos não veem obras, preços nem negociações." count={`${ms.length} contas`} />
      <div className="filters">
        <div className="frow" role="group" aria-label="Situação"><span className="lab">Situação</span>
          <Chips base={rb} cur={f} items={[["all", "Todos", byRole.length], ["pending", "Aguardando", n("pending")], ["active", "Ativos", n("active")], ["suspended", "Suspensos", n("suspended")]]} /></div>
        <div className="frow" role="group" aria-label="Perfil"><span className="lab">Perfil</span>
          <Chips base={fb} k="role" cur={role} items={[["all", "Todos"], ["artist", "Artistas"], ["buyer", "Colecionadores"]]} /></div>
      </div>
      <div style={{ margin: "clamp(24px,3vw,40px) 0 clamp(72px,10vw,140px)" }}>
        {list.length ? <div className="ledger">{list.map((m) => <MemberRow key={m.id} m={m} kyc={ks[m.id]} />)}</div> : <Empty sm title="Nenhum membro com esse filtro." />}
      </div>
    </div>
  );
}
