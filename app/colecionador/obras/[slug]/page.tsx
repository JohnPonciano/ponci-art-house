import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMember } from "@/lib/supabase/server";
import { catalogue, favoriteIds, ordersForBuyer, proposalsForBuyer, workBySlug } from "@/lib/data";
import { SecHead, Slab, Notice } from "@/components/ui";
import { WorkCard } from "@/components/area";
import { ActButton, FavButton, OfferForm } from "@/components/area-client";
import { Icon } from "@/components/Icon";
import { brl, catNo, CAT, dateBR, dims, dimsIn, EVENT_LABEL, firstName, PSTATUS, STATUS } from "@/lib/format";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const a = await workBySlug((await params).slug); return { title: a?.title || "Obra" };
}

export default async function ObraColecionador({ params }: { params: Promise<{ slug: string }> }) {
  const me = await requireMember("buyer");
  const a = await workBySlug((await params).slug);
  if (!a || a.status === "review") notFound();
  const [ps, os, favs, cat] = await Promise.all([proposalsForBuyer(me.id), ordersForBuyer(me.id), favoriteIds(me.id), catalogue()]);
  const mine = ps.find((p) => p.work.id === a.id && (p.status === "open" || p.status === "countered"));
  const myOrder = os.find((o) => o.work.id === a.id);
  const ar = a.artist!;
  const i = cat.findIndex((x) => x.id === a.id);
  const prev = i >= 0 && cat.length > 1 ? cat[(i - 1 + cat.length) % cat.length] : null, next = i >= 0 && cat.length > 1 ? cat[(i + 1) % cat.length] : null;
  const rel = [...cat.filter((x) => x.artist_id === a.artist_id && x.id !== a.id), ...cat.filter((x) => x.artist_id !== a.artist_id && x.cat === a.cat && x.id !== a.id)].slice(0, 3);
  return (
    <div className="wrap">
      <nav className="crumbs" aria-label="Trilha"><Link href="/colecionador">Acervo</Link><span aria-hidden="true">/</span><Link href={`/colecionador/artistas/${ar.member_code}`}>{ar.display_name}</Link><span aria-hidden="true">/</span><span aria-current="page">{a.title}</span></nav>
      <article className="detail">
        <div className="detail-media"><Slab a={a} label={a.status === "published" ? "Disponível na rede" : STATUS[a.status][0]} /></div>
        <div className="detail-info">
          <div className="d-no"><span>{catNo(a.no)}</span><FavButton variant="link" workId={a.id} on={favs.includes(a.id)} title={a.title} /></div>
          <div><h1 className="d-title">{a.title}</h1></div>
          <div className="d-artist"><strong>{ar.display_name}</strong><span>{ar.practice} · {ar.city} · Artista membro</span></div>
          <dl className="spec">
            <dt>Ano</dt><dd>{a.year}</dd><dt>Técnica</dt><dd>{a.medium}</dd>
            <dt>Dimensões</dt><dd>{dims(a)}<small>{dimsIn(a)}</small></dd>
            <dt>Edição</dt><dd>{a.edition || "Obra única"}</dd><dt>Categoria</dt><dd>{CAT[a.cat]}</dd>
            <dt>Procedência</dt><dd>Direto do ateliê<small>Certificado PONCI na entrega</small></dd>
          </dl>
          {a.description?.length > 0 && <div className="d-desc">{a.description.map((p, k) => <p key={k}>{p}</p>)}</div>}
          {myOrder ? <div className="d-buy"><span className="price">{brl(myOrder.amount)}<small>Reservada para você · {myOrder.ref}</small></span><Link className="btn" href="/colecionador/aquisicoes">Acompanhar aquisição <Icon n="right" /></Link></div>
            : a.status !== "published" ? <div className="d-buy"><span className="price">{brl(a.price)}<small>{STATUS[a.status][0]} por outro membro</small></span><Notice>Salve nos favoritos: se a reserva cair, você vê a obra voltar à vitrine.</Notice></div>
            : <>
              <div className="d-buy">
                <span className="price">{brl(a.price)}<small>Preço da artista · transação em custódia</small></span>
                <ActButton action="reserveWork" args={[a.id]} ok="Obra reservada para você." go="/colecionador/aquisicoes"
                  confirm={<>Reservar <b>{a.title}</b> por {brl(a.price)}? A obra sai da vitrine e você tem 48 h para concluir o pagamento em custódia.</>}>Reservar pelo preço <Icon n="right" /></ActButton>
              </div>
              <div className="offer" id="oferta">
                <p className="lab" style={{ color: "var(--ink)" }}>{mine ? `Negociação ${mine.ref} · ${PSTATUS[mine.status][0]}` : "Ou faça uma proposta"}</p>
                {mine && <ul className="thread">{mine.events.map((h) => <li key={h.id}><span>{h.actor === "artist" ? firstName(ar.display_name) : h.actor === "system" ? "Sistema" : "Você"}<br />{dateBR(h.created_at)}</span>
                  <div>{h.amount != null && <><b>{brl(h.amount)}</b> · </>}<span className="lab">{EVENT_LABEL[h.kind]}</span>{h.msg && <p>{h.msg}</p>}</div></li>)}</ul>}
                <OfferForm workId={a.id} price={a.price} label={mine ? "Nova proposta" : "Sua proposta"} />
                <p className="hint">A artista vê seu código de membro ({me.member_code}) e sua cidade. Seu nome só é revelado se a venda for fechada.</p>
              </div>
            </>}
        </div>
      </article>
      {prev && next && <nav className="pager" aria-label="Acervo">
        <Link href={`/colecionador/obras/${prev.slug}`}><span><Icon n="left" /> Anterior</span><strong>{prev.title}</strong></Link>
        <Link href={`/colecionador/obras/${next.slug}`}><span>Próxima <Icon n="right" /></span><strong>{next.title}</strong></Link></nav>}
      {rel.length ? <section className="sec" aria-labelledby="rel-t"><SecHead n="—" eyebrow="Relacionadas" title={ar.display_name} id="rel-t" href="/colecionador" linkText="Ver acervo" />
        <div className="board rel">{rel.map((x) => <WorkCard key={x.id} a={x} href={`/colecionador/obras/${x.slug}`} sub={x.artist?.display_name} fav={favs.includes(x.id)}
          foot={<><span className="price">{brl(x.price)}<small>{x.status === "published" ? "Disponível" : "Indisponível"}</small></span><span className="go">Ver <Icon n="right" /></span></>} />)}</div></section>
        : <div style={{ height: "clamp(72px,10vw,140px)" }} />}
    </div>
  );
}
