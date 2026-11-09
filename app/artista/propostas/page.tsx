import Link from "next/link";
import { requireMember } from "@/lib/supabase/server";
import { proposalsForArtist } from "@/lib/data";
import { PageHead } from "@/components/ui";
import { Ledger, ArtistProposalRow } from "@/components/area";

export const metadata = { title: "Propostas" };

export default async function Propostas({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  const me = await requireMember("artist");
  const f = (await searchParams).f || "open";
  const ps = await proposalsForArtist(me.id);
  const inNeg = (s: string) => s === "open" || s === "countered";
  const list = ps.filter((p) => f === "all" || (f === "open" ? inNeg(p.status) : p.status === f));
  const chip = (v: string, l: string, n: number) => <Link className="chip" href={`/artista/propostas?f=${v}`} scroll={false} aria-current={f === v ? "true" : undefined}>{l} <span className="count">{n}</span></Link>;
  return (
    <div className="wrap">
      <PageHead title="Propostas" label="Negociação privada" intro="Os colecionadores aparecem pelo código de membro verificado. O nome é revelado às duas partes quando a venda é fechada." count={`${ps.filter((p) => p.status === "open").length} aguardando você`} />
      <div className="filters"><div className="frow" role="group" aria-label="Situação"><span className="lab">Situação</span>
        {chip("open", "Em negociação", ps.filter((p) => inNeg(p.status)).length)}{chip("accepted", "Aceitas", ps.filter((p) => p.status === "accepted").length)}
        {chip("declined", "Recusadas", ps.filter((p) => p.status === "declined").length)}{chip("all", "Todas", ps.length)}</div></div>
      <div style={{ margin: "clamp(24px,3vw,40px) 0 clamp(72px,10vw,140px)" }}>
        <Ledger empty={["Nenhuma proposta aqui.", "Mude o filtro para ver o histórico."]}>{list.map((p) => <ArtistProposalRow key={p.id} p={p} />)}</Ledger>
      </div>
    </div>
  );
}
