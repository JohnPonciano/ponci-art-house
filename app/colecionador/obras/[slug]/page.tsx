import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMember, isAdminView } from "@/lib/supabase/server";
import { catalogue, favoriteIds, ordersForBuyer, proposalsForBuyer, workBySlug } from "@/lib/data";
import { Slab, Notice } from "@/components/ui";
import { GalleryCard, Room } from "@/components/Gallery";
import { Scale } from "@/components/Scale";
import { FollowBtn } from "@/components/diary-client";
import { myFollows } from "@/lib/diary";
import { initials } from "@/lib/format";
import { ActButton, FavButton, OfferForm } from "@/components/area-client";
import { Icon } from "@/components/Icon";
import { Zoomable } from "@/components/Lightbox";
import { SwipeNav, StickyBuy } from "@/components/Explore";
import { brl, catNo, CAT, dateBR, dims, dimsIn, EVENT_LABEL, firstName, PSTATUS, STATUS } from "@/lib/format";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const a = await workBySlug((await params).slug); return { title: a?.title || "Obra" };
}

export default async function ObraColecionador({ params }: { params: Promise<{ slug: string }> }) {
  const me = await requireMember("buyer");
  const a = await workBySlug((await params).slug);
  if (!a || a.status === "review") notFound();
  const [ps, os, favs, cat, follows] = await Promise.all([proposalsForBuyer(me.id), ordersForBuyer(me.id), favoriteIds(me.id), catalogue(), myFollows(me.id)]);
  const mine = ps.find((p) => p.work.id === a.id && (p.status === "open" || p.status === "countered"));
  const myOrder = os.find((o) => o.work.id === a.id);
  const ar = a.artist!; const adm = isAdminView(me);
  const i = cat.findIndex((x) => x.id === a.id);
  const prev = i >= 0 && cat.length > 1 ? cat[(i - 1 + cat.length) % cat.length] : null, next = i >= 0 && cat.length > 1 ? cat[(i + 1) % cat.length] : null;
  const rel = [...cat.filter((x) => x.artist_id === a.artist_id && x.id !== a.id), ...cat.filter((x) => x.artist_id !== a.artist_id && x.cat === a.cat && x.id !== a.id)].slice(0, 8);
  return (
    <div className="wrap gallery">
      <Link className="backlink" href="/colecionador"><Icon n="left" />Acervo</Link>
      <nav className="crumbs" aria-label="Trilha"><Link href="/colecionador">Acervo</Link><span aria-hidden="true">/</span><Link href={`/colecionador/artistas/${ar.member_code}`}>{ar.display_name}</Link><span aria-hidden="true">/</span><span aria-current="page">{a.title}</span></nav>
      <article className="detail">
        <div className="detail-media"><SwipeNav prev={prev ? `/colecionador/obras/${prev.slug}` : undefined} next={next ? `/colecionador/obras/${next.slug}` : undefined}>
          <Zoomable a={a} caption={`${a.title} · ${ar.display_name} · ${a.year}`}><Slab a={a} label={a.status === "published" ? "Disponível na rede" : STATUS[a.status][0]} /></Zoomable></SwipeNav></div>
        <div className="detail-info ob">
          <div className="d-no"><span>{catNo(a.no)} · {CAT[a.cat]}</span>{!adm && <FavButton variant="link" workId={a.id} on={favs.includes(a.id)} title={a.title} />}</div>
          <header className="ob-head">
            <h1 className="d-title">{a.title}</h1>
            <p className="ob-by"><Link href={`/colecionador/artistas/${ar.member_code}`}>{ar.display_name}</Link>, {a.year}</p>
            <p className="ob-line">{a.medium} · {dims(a)}</p>
          </header>
          <section className="ob-buy" aria-label="Aquisição">
          {adm ? <div className="d-buy"><p className="ob-price">{brl(a.price)}<small>{STATUS[a.status][0]} · {ar.accepts_offers ? "aceita propostas" : "preço fixo"}</small></p><Notice icon="shield">Você está vendo como admin. Reserva, propostas e favoritos ficam com os membros.</Notice><a className="btn ghost" href={`/admin/curadoria`}>Abrir na curadoria <Icon n="right" /></a></div>
            : myOrder ? <div className="d-buy"><span className="price">{brl(myOrder.amount)}<small>Reservada para você · {myOrder.ref}</small></span><Link className="btn" href="/colecionador/aquisicoes">Acompanhar aquisição <Icon n="right" /></Link></div>
            : a.status !== "published" ? <div className="d-buy"><span className="price">{brl(a.price)}<small>{STATUS[a.status][0]} por outro membro</small></span><Notice>Salve nos favoritos: se a reserva cair, você vê a obra voltar à vitrine.</Notice></div>
            : <>
              <StickyBuy price={brl(a.price)} />
              <div className="d-buy" id="comprar">
                <p className="ob-price">{brl(a.price)}<small>Preço definido pela artista{ar.accepts_offers ? " · aceita propostas" : " · preço fixo"}</small></p>
                <ActButton action="reserveWork" args={[a.id]} ok="Obra reservada para você." go="/colecionador/aquisicoes"
                  confirm={<>Reservar <b>{a.title}</b> por {brl(a.price)}? A obra sai da vitrine e você tem 48 h para concluir o pagamento em custódia.</>}>Reservar pelo preço <Icon n="right" /></ActButton>
              </div>
              {ar.accepts_offers || mine ? <div className="offer" id="oferta">
                <p className="lab" style={{ color: "var(--ink)" }}>{mine ? `Negociação ${mine.ref} · ${PSTATUS[mine.status][0]}` : "Ou faça uma proposta"}</p>
                {mine && <ul className="thread">{mine.events.map((h) => <li key={h.id}><span>{h.actor === "artist" ? firstName(ar.display_name) : h.actor === "system" ? "Sistema" : "Você"}<br />{dateBR(h.created_at)}</span>
                  <div>{h.amount != null && <><b>{brl(h.amount)}</b> · </>}<span className="lab">{EVENT_LABEL[h.kind]}</span>{h.msg && <p>{h.msg}</p>}</div></li>)}</ul>}
                {ar.accepts_offers ? <><OfferForm workId={a.id} price={a.price} label={mine ? "Nova proposta" : "Sua proposta"} />
                <p className="hint">A artista vê seu código de membro ({me.member_code}) e sua cidade. Seu nome só é revelado se a venda for fechada.</p></>
                  : <p className="hint">A artista passou a trabalhar com preço fixo. Novas propostas não são aceitas.</p>}
              </div> : null}
            </>}
            <ul className="ob-trust">
              <li><Icon n="lock" /><span><b>Pagamento em custódia</b>O valor só é repassado à artista depois da entrega.</span></li>
              <li><Icon n="shield" /><span><b>Certificado PONCI</b>Autenticidade e procedência registradas na rede.</span></li>
              <li><Icon n="swap" /><span><b>7 dias para desistir</b>Depois de receber a obra, conforme o CDC.</span></li>
            </ul>
          </section>
          {a.description?.length > 0 && <div className="d-desc">{a.description.map((p, k) => <p key={k}>{p}</p>)}</div>}
          <section className="ob-label" aria-label="Ficha técnica">
            <p className="lab">Ficha técnica</p>
            <dl className="spec">
              <dt>Ano</dt><dd>{a.year}</dd><dt>Técnica</dt><dd>{a.medium}</dd>
              <dt>Dimensões</dt><dd>{dims(a)}<small>{dimsIn(a)}</small></dd>
              <dt>Edição</dt><dd>{a.edition || "Obra única"}</dd>
              <dt>Procedência</dt><dd>Direto do ateliê<small>{ar.city}</small></dd>
            </dl>
          </section>
          <section className="ob-scale" aria-label="Em escala">
            <p className="lab">Em escala</p>
            <Scale a={a} />
          </section>
          <section className="ob-artist" aria-label="Sobre a artista">
            <span className="ob-av" aria-hidden="true">{initials(ar.display_name)}</span>
            <div><p className="lab">Sobre a artista</p><h2>{ar.display_name}</h2><p className="ob-line">{ar.practice} · {ar.city}</p>
              {ar.bio && <p className="ob-bio">{ar.bio}</p>}
              <div className="ob-artist-acts">{!adm && <FollowBtn artistId={ar.id} on={follows.has(ar.id)} compact />}<Link className="linkbtn" href={`/colecionador/artistas/${ar.member_code}`}>Perfil e outras obras</Link></div></div>
          </section>
        </div>
      </article>
      {prev && next && <nav className="pager" aria-label="Acervo">
        <Link href={`/colecionador/obras/${prev.slug}`}><span><Icon n="left" /> Anterior</span><strong>{prev.title}</strong></Link>
        <Link href={`/colecionador/obras/${next.slug}`}><span>Próxima <Icon n="right" /></span><strong>{next.title}</strong></Link></nav>}
      {rel.length > 0 && <Room n="Continue olhando" title={<>Outras <em>obras</em></>} href="/colecionador" linkText="Voltar ao acervo">{rel.map((x) => <GalleryCard key={x.id} a={x} fav={adm ? undefined : favs.includes(x.id)} />)}</Room>}
      <div style={{ height: "clamp(56px,8vw,120px)" }} />
    </div>
  );
}
