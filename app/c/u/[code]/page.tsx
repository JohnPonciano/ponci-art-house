import Link from "next/link";
import { notFound } from "next/navigation";
import { rnCtx } from "@/lib/rn";
import { memberByCode, postsByAuthor, myLikes, myFollows, likedBy, feed, personName, personLine } from "@/lib/diary";
import { FollowBtn, ShowNameToggle } from "@/components/diary-client";
import { ProfileGrid } from "@/components/rn/Notes";
import { Icon } from "@/components/Icon";
import { initials } from "@/lib/format";
import { AdminMemberTools } from "@/components/rn/AdminTools";

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }) {
  const m = await memberByCode((await params).code); return { title: m ? personName(m) : "Perfil" };
}

export default async function Perfil({ params, searchParams }: { params: Promise<{ code: string }>; searchParams: Promise<{ aba?: string }> }) {
  const { me, base, main, isAdmin } = await rnCtx();
  const m = await memberByCode((await params).code); if (!m) notFound();
  const mine = m.id === me.id; const ab = (await searchParams).aba;
  const aba = mine && (ab === "curtidas" || ab === "salvos") ? ab : "notas";
  const [posts, likes, follows] = await Promise.all([
    aba === "curtidas" ? likedBy(me.id) : aba === "salvos" ? feed(me.id, "salvos", null, undefined, undefined, 60).then((f) => f.posts) : postsByAuthor(m.id),
    myLikes(me.id), myFollows(me.id)]);
  const href = `${base}/u/${m.member_code}`;
  const name = personName(m);
  return (
    <div className="ig-profile">
      <header className="ig-ph">
        <span className={"ig-pav" + (m.role === "buyer" ? " av-buyer" : "")} aria-hidden="true">{m.role === "artist" || m.show_name ? initials(m.display_name) : "C"}</span>
        <div className="ig-pinfo">
          <div className="ig-prow"><h1>{name}</h1>
            {!mine && !isAdmin && m.role === "artist" && <FollowBtn artistId={m.id} on={follows.has(m.id)} compact />}
            {mine && <Link className="btn sm ghost" href={`${base}/novo`}>Publicar</Link>}
          </div>
          <dl className="ig-pstats"><div><dd>{m.posts}</dd><dt>{m.posts === 1 ? "nota" : "notas"}</dt></div><div><dd>{m.likes}</dd><dt>curtidas</dt></div></dl>
          <p className="ig-pline">{personLine(m)} · {m.member_code}</p>
          {m.role === "artist" && m.bio && <p className="ig-pbio">{m.bio}</p>}
          {!mine && m.role === "artist" && me.role === "buyer" && <a className="ig-plink" href={`${main}/colecionador/artistas/${m.member_code}`}><Icon n="grid" />Obras no acervo</a>}
        </div>
      </header>
      {isAdmin && <AdminMemberTools id={m.id} status={m.status} name={name} adminHref={`${main}/admin/membros`} />}
      {mine && me.role === "buyer" && <div className="ig-ptoggle"><ShowNameToggle initial={!!me.show_name} code={me.member_code} /></div>}
      <nav className="ig-ptabs" aria-label="Perfil">
        <Link href={href} aria-current={aba === "notas" ? "page" : undefined}><Icon n="grid" />Notas</Link>
        {mine && <Link href={`${href}?aba=curtidas`} aria-current={aba === "curtidas" ? "page" : undefined}><Icon n="heart" />Curtidas</Link>}
        {mine && <Link href={`${href}?aba=salvos`} aria-current={aba === "salvos" ? "page" : undefined}><Icon n="bookmark" />Salvos</Link>}
      </nav>
      {posts.length ? <ProfileGrid posts={posts} base={base} likes={likes} />
        : <div className="rn-empty"><b>{aba === "curtidas" ? "Nenhuma curtida ainda." : aba === "salvos" ? "Nada salvo ainda." : mine ? "Você ainda não publicou." : "Nenhuma nota ainda."}</b>
            {mine && aba === "notas" && <Link className="btn sm" href={`${base}/novo`}>Publicar a primeira</Link>}</div>}
    </div>
  );
}
