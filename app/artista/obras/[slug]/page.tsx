import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMember } from "@/lib/supabase/server";
import { ordersForArtist, workBySlug, currentCommissionPct } from "@/lib/data";
import { SecHead, Slab, Tag, Notice, Reprod } from "@/components/ui";
import { EditWorkForm } from "@/components/forms/EditWorkForm";
import { ActButton, PriceForm } from "@/components/area-client";
import { Icon } from "@/components/Icon";
import { Zoomable } from "@/components/Lightbox";
import { ArtistPrints } from "@/components/prints/ArtistPrints";
import { printCatalog, myPrintOffer } from "@/lib/prints";
import { brl, catNo, CAT, dateBR, dims, dimsIn, STATUS } from "@/lib/format";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const a = await workBySlug((await params).slug); return { title: a?.title || "Obra" };
}

export default async function ObraArtista({ params }: { params: Promise<{ slug: string }> }) {
  const me = await requireMember("artist");
  const a = await workBySlug((await params).slug);
  if (!a || a.artist_id !== me.id) notFound();
  const [os, pct, cat, pr] = await Promise.all([ordersForArtist(me.id), currentCommissionPct(), printCatalog(), myPrintOffer(a.id)]);
  const o = os.find((x) => x.work.id === a.id);
  return (
    <div className="wrap">
      <nav className="crumbs" aria-label="Trilha"><Link href="/artista">Ateliê</Link><span aria-hidden="true">/</span><Link href="/artista/obras">Obras</Link><span aria-hidden="true">/</span><span aria-current="page">{a.title}</span></nav>
      <article className="detail">
        <div className="detail-media"><Zoomable a={a}><Slab a={a} label={STATUS[a.status][0]} /></Zoomable></div>
        <div className="detail-info">
          <div className="d-no"><span>{catNo(a.no)}</span><span className="g-tags"><Reprod a={a} />{a.changes_requested_at ? <span className="tag t-countered">Ajustes pedidos</span> : <Tag s={a.status} />}</span></div>
          <div><h1 className="d-title">{a.title}</h1></div>
          <dl className="spec">
            <dt>Ano</dt><dd>{a.year}</dd><dt>Técnica</dt><dd>{a.medium}</dd>
            <dt>Dimensões</dt><dd>{dims(a)}<small>{dimsIn(a)}</small></dd>
            <dt>Edição</dt><dd>{a.edition || (a.reproduction ? "Reprodução" : "Obra única")}</dd><dt>Categoria</dt><dd>{CAT[a.cat]}</dd><dt>Cadastro</dt><dd>{dateBR(a.created_at)}</dd>
          </dl>
          {a.description?.length > 0 && <div className="d-desc">{a.description.map((p, i) => <p key={i}>{p}</p>)}</div>}
          {a.status === "review" && <div className="d-buy">
            <span className="price">{brl(a.price)}<small>Preço proposto</small></span>
            {a.changes_requested_at
              ? <div className="curate-ask"><p className="lab">A curadoria pediu ajustes · {dateBR(a.changes_requested_at)}</p><p>“{a.curation_note}”</p></div>
              : <Notice>A curadoria revisa documentação e imagem em até 3 dias úteis. Até lá, a obra não aparece para colecionadores.</Notice>}
            <EditWorkForm a={a} open={!!a.changes_requested_at} />
            {me.email.endsWith("@demo.ponci.art") && <ActButton action="approveWorkDemo" args={[a.id]} ok="Obra aprovada e publicada na vitrine.">Simular aprovação da curadoria <Icon n="check" /></ActButton>}
            <ActButton action="withdrawWork" args={[a.id]} ok="Envio retirado." className="linkbtn" go="/artista/obras" confirm="Retirar o envio? A obra será apagada.">Retirar envio</ActButton>
          </div>}
          {a.status === "published" && <PriceForm workId={a.id} price={a.price} pct={pct} />}
          {(a.status === "reserved" || a.status === "sold") && <div className="d-buy">
            <span className="price">{brl(o ? o.amount : a.price)}<small>{STATUS[a.status][0]}{o ? " · " + o.ref : ""}</small></span>
            {o && <Link className="btn ghost" href="/artista/vendas">Acompanhar venda <Icon n="right" /></Link>}</div>}
        </div>
      </article>
      {a.status !== "review" && !a.reproduction && cat.ready && <section className="sub-sec" aria-labelledby="pr-t">
        <SecHead n="—" eyebrow="Reproduções autorizadas" title={<>Prints <em>{pr?.offer.status === "active" ? "à venda" : "sob demanda"}</em></>} id="pr-t" />
        <ArtistPrints workId={a.id} userId={me.id} products={cat.products} sizes={cat.sizes} rulesReady={cat.rulesReady} saved={pr}
          prefill={a.print_master_path && a.print_master_w && a.print_master_h ? { path: a.print_master_path, w: a.print_master_w, h: a.print_master_h } : null} wanted={!!a.prints_wanted} />
      </section>}
    </div>
  );
}
