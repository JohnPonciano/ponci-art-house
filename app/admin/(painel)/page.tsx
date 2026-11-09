import Link from "next/link";
import { counts, members, requests, reviewWorks } from "@/lib/admin";
import { PageHead, SecHead, Empty } from "@/components/ui";
import { RequestRow, MemberRow, WorkReviewRow } from "@/components/admin";
import { pad } from "@/lib/format";

export const metadata = { title: "Painel admin" };

export default async function AdminHome() {
  const [c, rs, ms, ws] = await Promise.all([counts(), requests(), members(), reviewWorks()]);
  const pr = rs.filter((r) => r.status === "pending"), pm = ms.filter((m) => m.status === "pending");
  return (
    <div className="wrap">
      <PageHead title="Curadoria" label="Painel admin" intro={<>{c.reqs + c.pend + c.review ? <><em>{c.reqs + c.pend + c.review} itens</em> aguardam a sua decisão.</> : "Nada pendente agora."}</>}
        count={<>{c.artists} artistas · {c.buyers} colecionadores<br />{c.published} obras publicadas</>} />
      <div className="stats" style={{ ["--n" as any]: 5 }}>
        <Link href="/admin/pedidos"><span className="lab">Pedidos de convite</span><b className={c.reqs ? "ok-c" : ""}>{pad(c.reqs)}</b></Link>
        <Link href="/admin/membros?f=pending"><span className="lab">Membros aguardando</span><b className={c.pend ? "ok-c" : ""}>{pad(c.pend)}</b></Link>
        <Link href="/admin/curadoria"><span className="lab">Obras em curadoria</span><b className={c.review ? "ok-c" : ""}>{pad(c.review)}</b></Link>
        <Link href="/admin/membros?role=artist"><span className="lab">Artistas ativos</span><b>{pad(c.artists)}</b></Link>
        <Link href="/admin/membros?role=buyer"><span className="lab">Colecionadores ativos</span><b>{pad(c.buyers)}</b></Link>
      </div>
      <section className="sub-sec" aria-labelledby="r-t">
        <SecHead n="01" eyebrow="Pedidos de convite" title={<>Quer <em>entrar</em></>} id="r-t" href="/admin/pedidos" linkText="Todos os pedidos" />
        {pr.length ? <div className="ledger">{pr.slice(0, 5).map((r) => <RequestRow key={r.id} r={r} />)}</div> : <Empty sm title="Nenhum pedido pendente." />}
      </section>
      <section className="sub-sec" aria-labelledby="m-t">
        <SecHead n="02" eyebrow="Membros" title={<>Aguardando <em>aprovação</em></>} id="m-t" href="/admin/membros" linkText="Todos os membros" />
        {pm.length ? <div className="ledger">{pm.slice(0, 5).map((m) => <MemberRow key={m.id} m={m} />)}</div> : <Empty sm title="Nenhum membro aguardando." body="Contas criadas com códigos de uso único entram já ativas." />}
      </section>
      <section className="sub-sec" aria-labelledby="w-t">
        <SecHead n="03" eyebrow="Curadoria" title={<>Obras <em>em análise</em></>} id="w-t" href="/admin/curadoria" linkText="Abrir curadoria" />
        {ws.length ? <div className="ledger">{ws.slice(0, 3).map((w) => <WorkReviewRow key={w.id} w={w} />)}</div> : <Empty sm title="Nenhuma obra em curadoria." />}
      </section>
    </div>
  );
}
