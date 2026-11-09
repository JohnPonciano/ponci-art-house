import Link from "next/link";
import { requireMember } from "@/lib/supabase/server";
import { ordersForArtist, proposalsForArtist, worksByArtist } from "@/lib/data";
import { PageHead, SecHead, Empty } from "@/components/ui";
import { Ledger, ArtistProposalRow, WorkCard } from "@/components/area";
import { Icon } from "@/components/Icon";
import { brl, pad, firstName, COMMISSION } from "@/lib/format";

export const metadata = { title: "Ateliê" };

export default async function Painel() {
  const me = await requireMember("artist");
  const [ws, ps, os] = await Promise.all([worksByArtist(me.id), proposalsForArtist(me.id), ordersForArtist(me.id)]);
  const open = ps.filter((p) => p.status === "open");
  const net = (list: typeof os) => list.reduce((s, o) => s + o.amount * (1 - COMMISSION), 0);
  const c = (k: string) => ws.filter((a) => a.status === k).length;
  return (
    <div className="wrap">
      <PageHead title="Ateliê" label="Área do artista"
        intro={<>Olá, {firstName(me.display_name)}. {open.length ? <><em>{open.length === 1 ? "Uma proposta aguarda" : `${open.length} propostas aguardam`}</em> a sua resposta.</> : "Nenhuma proposta pendente no momento."}</>}
        count={<>{me.city}<br />{me.member_code} · desde {new Date(me.created_at).getFullYear()}</>} />
      <div className="stats" style={{ ["--n" as any]: 5 }}>
        <Link href="/artista/obras?status=published"><span className="lab">Publicadas</span><b>{pad(c("published"))}</b></Link>
        <Link href="/artista/obras?status=review"><span className="lab">Em curadoria</span><b>{pad(c("review"))}</b></Link>
        <Link href="/artista/propostas"><span className="lab">Propostas abertas</span><b className={open.length ? "ok-c" : ""}>{pad(open.length)}</b></Link>
        <Link href="/artista/vendas"><span className="lab">Em custódia</span><b className="money">{brl(net(os.filter((o) => o.stage < 3)))}</b></Link>
        <Link href="/artista/vendas"><span className="lab">Recebido (líquido)</span><b className="money">{brl(net(os.filter((o) => o.stage === 3)))}</b></Link>
      </div>
      <section className="sub-sec" aria-labelledby="p-t">
        <SecHead n="01" eyebrow="Propostas" title={<>Aguardando <em>sua resposta</em></>} id="p-t" href="/artista/propostas" linkText="Todas as propostas" />
        <Ledger empty={["Nada pendente.", "Quando um colecionador fizer uma proposta, ela aparece aqui."]}>{open.slice(0, 4).map((p) => <ArtistProposalRow key={p.id} p={p} />)}</Ledger>
      </section>
      <section className="sub-sec" aria-labelledby="w-t">
        <SecHead n="02" eyebrow="Obras" title={<>No seu <em>ateliê</em></>} id="w-t" href="/artista/obras/nova" linkText="Cadastrar nova obra" />
        {ws.length ? <div className="board">{ws.slice(0, 6).map((a) => <WorkCard key={a.id} a={a} href={`/artista/obras/${a.slug}`} foot={<><span className="price">{brl(a.price)}<small>Seu preço</small></span><span className="go">Gerenciar <Icon n="right" /></span></>} />)}</div>
          : <Empty sm title="Nenhuma obra ainda."><Link className="btn" href="/artista/obras/nova">Cadastrar primeira obra <Icon n="plus" /></Link></Empty>}
      </section>
    </div>
  );
}
