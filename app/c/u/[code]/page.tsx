import Link from "next/link";
import { notFound } from "next/navigation";
import { rnCtx } from "@/lib/rn";
import { memberByCode, postsByAuthor, myLikes, myFollows, likedBy, feed, personName, personLine } from "@/lib/diary";
import { FollowBtn, ShowNameToggle } from "@/components/diary-client";
import { ProfileGrid } from "@/components/rn/Notes";
import { Icon } from "@/components/Icon";
import { Avatar, OfficialBadge } from "@/components/Avatar";
import { handleOf, isOfficial } from "@/lib/community";
import { AdminMemberTools } from "@/components/rn/AdminTools";
import { collectionOf, myCollection, type CollectionItem } from "@/lib/diary";
import { CollectionToggle } from "@/components/rn/Colecao";
import { ArtImage } from "@/components/ArtImage";

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }) {
  const m = await memberByCode((await params).code); return { title: m ? personName(m) : "Perfil" };
}

export default async function Perfil({ params, searchParams }: { params: Promise<{ code: string }>; searchParams: Promise<{ aba?: string }> }) {
  const { me, base, main, isAdmin } = await rnCtx();
  const m = await memberByCode((await params).code); if (!m) notFound();
  const mine = m.id === me.id; const ab = (await searchParams).aba;
  const isBuyer = m.role === "buyer" && !isOfficial(m);
  const colecao = isBuyer ? await collectionOf(m.id) : [];
  const aba = mine && (ab === "curtidas" || ab === "salvos") ? ab : isBuyer && ab === "colecao" && (mine || colecao.length) ? "colecao" : "notas";
  const gerir = aba === "colecao" && mine ? await myCollection(me.id) : [];
  const [posts, likes, follows] = await Promise.all([
    aba === "curtidas" ? likedBy(me.id) : aba === "salvos" ? feed(me.id, "salvos", null, undefined, undefined, 60).then((f) => f.posts) : postsByAuthor(m.id),
    myLikes(me.id), myFollows(me.id)]);
  const href = `${base}/u/${m.member_code}`;
  const name = personName(m);
  return (
    <div className="ig-profile">
      <header className="ig-ph">
        <Avatar p={m} className="ig-pav" />
        <div className="ig-pinfo">
          <div className="ig-prow"><h1>{name}<OfficialBadge p={m} /></h1>
            {!mine && !isAdmin && m.role === "artist" && <FollowBtn artistId={m.id} on={follows.has(m.id)} compact />}
            {mine && <Link className="btn sm ghost" href={`${base}/ajustes`}>Editar perfil</Link>}
            {mine && <Link className="btn sm ghost" href={`${base}/novo`}>Publicar</Link>}
            {isAdmin && isOfficial(m) && <Link className="btn sm" href={`${base}/novo`}>Publicar como PONCI</Link>}
          </div>
          {handleOf(m) && <p className="ig-phandle">{handleOf(m)}</p>}
          <dl className="ig-pstats"><div><dd>{m.posts}</dd><dt>{m.posts === 1 ? "nota" : "notas"}</dt></div><div><dd>{m.likes}</dd><dt>curtidas</dt></div></dl>
          <p className="ig-pline">{personLine(m)}{isOfficial(m) ? "" : ` · ${m.member_code}`}</p>
          {(m.role === "artist" || isOfficial(m)) && m.bio && <p className="ig-pbio">{m.bio}</p>}
          {!mine && m.role === "artist" && me.role === "buyer" && <a className="ig-plink" href={`${main}/colecionador/artistas/${m.member_code}`}><Icon n="grid" />Obras no acervo</a>}
        </div>
      </header>
      {isAdmin && <AdminMemberTools id={m.id} status={m.status} name={name} adminHref={`${main}/admin/membros`} />}
      {mine && me.role === "buyer" && <div className="ig-ptoggle"><ShowNameToggle initial={!!me.show_name} code={me.member_code} /></div>}
      <nav className="ig-ptabs" aria-label="Perfil">
        <Link href={href} aria-current={aba === "notas" ? "page" : undefined}><Icon n="grid" />Notas</Link>
        {isBuyer && (mine || colecao.length > 0) && <Link href={`${href}?aba=colecao`} aria-current={aba === "colecao" ? "page" : undefined}><Icon n="image" />Coleção{colecao.length ? ` · ${colecao.length}` : ""}</Link>}
        {mine && <Link href={`${href}?aba=curtidas`} aria-current={aba === "curtidas" ? "page" : undefined}><Icon n="heart" />Curtidas</Link>}
        {mine && <Link href={`${href}?aba=salvos`} aria-current={aba === "salvos" ? "page" : undefined}><Icon n="bookmark" />Salvos</Link>}
      </nav>
      {aba === "colecao" ? (mine ? <MyCollection items={gerir} base={base} /> : <CollectionGrid items={colecao} base={base} />)
        : posts.length ? <ProfileGrid posts={posts} base={base} likes={likes} />
        : <div className="rn-empty"><b>{aba === "curtidas" ? "Nenhuma curtida ainda." : aba === "salvos" ? "Nada salvo ainda." : mine ? "Você ainda não publicou." : "Nenhuma nota ainda."}</b>
            {mine && aba === "notas" && <Link className="btn sm" href={`${base}/novo`}>Publicar a primeira</Link>}</div>}
    </div>
  );
}

function CollectionGrid({ items, base }: { items: CollectionItem[]; base: string }) {
  const mes = (d: string) => new Date(d).toLocaleDateString("pt-BR", { month: "short", year: "numeric", timeZone: "America/Sao_Paulo" });
  return (
    <ul className="col-grid">{items.map((c) => (
      <li key={c.order_id}>
        <div className="col-art"><ArtImage a={{ title: c.title, year: c.year, h: c.h, w: c.w, gen: c.gen, image_path: c.image_path, img_w: c.img_w, img_h: c.img_h }} max={560} /></div>
        <p className="col-t"><b>{c.title}</b>{c.reproduction && <span className="tag t-repro">Reprod</span>}</p>
        <p className="col-by"><Link href={`${base}/u/${c.artist_handle || c.artist_code}`}>{c.artist_name}</Link> · {c.year}</p>
        {c.note && <p className="col-note-t">“{c.note}”</p>}
        <p className="col-when">Na coleção desde {mes(c.acquired)}</p>
      </li>))}</ul>
  );
}
function MyCollection({ items, base }: { items: Awaited<ReturnType<typeof myCollection>>; base: string }) {
  if (!items.length) return <div className="rn-empty"><b>Sua coleção aparece aqui.</b><p className="hint">Quando você receber uma obra comprada na PONCI, pode escolher mostrá-la no seu perfil. Começa sempre escondida.</p></div>;
  return (<>
    <p className="col-intro hint">Escolha o que aparece para os outros membros. Preço nunca aparece. {items.filter((i) => i.visible).length} de {items.length} visíveis.</p>
    <ul className="col-grid">{items.map((c) => (
      <li key={c.order_id} className={c.visible ? "" : "off"}>
        <div className="col-art"><ArtImage a={c.work} max={560} /></div>
        <p className="col-t"><b>{c.work.title}</b>{c.work.reproduction && <span className="tag t-repro">Reprod</span>}</p>
        <p className="col-by"><Link href={`${base}/u/${c.work.artist?.member_code}`}>{c.work.artist?.display_name}</Link> · {c.work.year}</p>
        <CollectionToggle orderId={c.order_id} visible={c.visible} note={c.note} />
      </li>))}</ul>
  </>);
}
