import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMember } from "@/lib/supabase/server";
import { ordersForArtist, proposalsForArtist, workBySlug } from "@/lib/data";
import { SecHead, Slab, Tag, Notice } from "@/components/ui";
import { Ledger, ArtistProposalRow } from "@/components/area";
import { ActButton, PriceForm } from "@/components/area-client";
import { Icon } from "@/components/Icon";
import { brl, catNo, CAT, dateBR, dims, dimsIn, STATUS } from "@/lib/format";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const a = await workBySlug((await params).slug); return { title: a?.title || "Obra" };
}

export default async function ObraArtista({ params }: { params: Promise<{ slug: string }> }) {
  const me = await requireMember("artist");
  const a = await workBySlug((await params).slug);
  if (!a || a.artist_id !== me.id) notFound();
  const [ps, os] = await Promise.all([proposalsForArtist(me.id), ordersForArtist(me.id)]);
  const props = ps.filter((p) => p.work.id === a.id), o = os.find((x) => x.work.id === a.id);
  return (
    <div className="wrap">
      <nav className="crumbs" aria-label="Trilha"><Link href="/artista">Ateliê</Link><span aria-hidden="true">/</span><Link href="/artista/obras">Obras</Link><span aria-hidden="true">/</span><span aria-current="page">{a.title}</span></nav>
      <article className="detail">
        <div className="detail-media"><Slab a={a} label={STATUS[a.status][0]} /></div>
        <div className="detail-info">
          <div className="d-no"><span>{catNo(a.no)}</span><Tag s={a.status} /></div>
          <div><h1 className="d-title">{a.title}</h1></div>
          <dl className="spec">
            <dt>Ano</dt><dd>{a.year}</dd><dt>Técnica</dt><dd>{a.medium}</dd>
            <dt>Dimensões</dt><dd>{dims(a)}<small>{dimsIn(a)}</small></dd>
            <dt>Edição</dt><dd>{a.edition || "Obra única"}</dd><dt>Categoria</dt><dd>{CAT[a.cat]}</dd><dt>Cadastro</dt><dd>{dateBR(a.created_at)}</dd>
          </dl>
          {a.description?.length > 0 && <div className="d-desc">{a.description.map((p, i) => <p key={i}>{p}</p>)}</div>}
          {a.status === "review" && <div className="d-buy">
            <span className="price">{brl(a.price)}<small>Preço proposto</small></span>
            <Notice>A curadoria revisa documentação e imagem em até 3 dias úteis. Até lá, a obra não aparece para colecionadores.</Notice>
            {me.email.endsWith("@demo.ponci.art") && <ActButton action="approveWorkDemo" args={[a.id]} ok="Obra aprovada e publicada na vitrine.">Simular aprovação da curadoria <Icon n="check" /></ActButton>}
            <ActButton action="withdrawWork" args={[a.id]} ok="Envio retirado." className="linkbtn" go="/artista/obras" confirm="Retirar o envio? A obra será apagada.">Retirar envio</ActButton>
          </div>}
          {a.status === "published" && <PriceForm workId={a.id} price={a.price} />}
          {(a.status === "reserved" || a.status === "sold") && <div className="d-buy">
            <span className="price">{brl(o ? o.amount : a.price)}<small>{STATUS[a.status][0]}{o ? " · " + o.ref : ""}</small></span>
            {o && <Link className="btn ghost" href="/artista/vendas">Acompanhar venda <Icon n="right" /></Link>}</div>}
        </div>
      </article>
      <section className="sub-sec" aria-labelledby="op-t">
        <SecHead n="—" eyebrow="Propostas para esta obra" title={props.length ? `${props.length} ${props.length === 1 ? "proposta" : "propostas"}` : <>Nenhuma <em>ainda</em></>} id="op-t" href="/artista/propostas" linkText="Todas as propostas" />
        {props.length > 0 && <Ledger empty={["", ""]}>{props.map((p) => <ArtistProposalRow key={p.id} p={p} />)}</Ledger>}
      </section>
    </div>
  );
}
