import Link from "next/link";
import { notFound } from "next/navigation";
import { rnCtx } from "@/lib/rn";
import { memberByCode, postsByAuthor, myLikes, myFollows, likedBy, personName, personLine } from "@/lib/diary";
import { NoteGrid } from "@/components/rn/Notes";
import { FollowBtn, ShowNameToggle } from "@/components/diary-client";
import { initials } from "@/lib/format";

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }) {
  const m = await memberByCode((await params).code); return { title: m ? personName(m) : "Perfil" };
}

export default async function Perfil({ params, searchParams }: { params: Promise<{ code: string }>; searchParams: Promise<{ aba?: string }> }) {
  const { me, base, main } = await rnCtx();
  const m = await memberByCode((await params).code); if (!m) notFound();
  const aba = (await searchParams).aba === "curtidas" && m.id === me.id ? "curtidas" : "notas";
  const [posts, likes, follows] = await Promise.all([aba === "curtidas" ? likedBy(me.id) : postsByAuthor(m.id), myLikes(me.id), myFollows(me.id)]);
  const mine = m.id === me.id; const href = `${base}/u/${m.member_code}`;
  return (
    <div className="rn-wrap">
      <header className="rn-profile">
        <span className={"rn-av xl" + (m.role === "buyer" ? " av-buyer" : "")} aria-hidden="true">{m.role === "artist" || m.show_name ? initials(m.display_name) : "C"}</span>
        <div className="rn-profile-main">
          <h1>{personName(m)}</h1>
          <p className="rn-profile-line">{personLine(m)} · {m.member_code}</p>
          {m.role === "artist" && m.bio && <p className="rn-bio">{m.bio}</p>}
          <dl className="rn-stats"><div><dt>Notas</dt><dd>{m.posts}</dd></div><div><dt>Curtidas recebidas</dt><dd>{m.likes}</dd></div></dl>
          <div className="rn-profile-acts">
            {!mine && m.role === "artist" && <FollowBtn artistId={m.id} on={follows.has(m.id)} />}
            {!mine && m.role === "artist" && me.role === "buyer" && <a className="btn sm ghost" href={`${main}/colecionador/artistas/${m.member_code}`}>Obras no acervo</a>}
            {mine && <Link className="btn sm" href={`${base}/novo`}>Publicar nota</Link>}
            {mine && <Link className="btn sm ghost" href={`${base}/salvos`}>Salvos</Link>}
          </div>
          {mine && me.role === "buyer" && <ShowNameToggle initial={!!me.show_name} code={me.member_code} />}
        </div>
      </header>
      {mine && <nav className="rn-feedtabs" aria-label="Perfil"><Link href={href} aria-current={aba === "notas" ? "page" : undefined}>Notas</Link><Link href={`${href}?aba=curtidas`} aria-current={aba === "curtidas" ? "page" : undefined}>Curtidas</Link></nav>}
      {posts.length ? <NoteGrid posts={posts} base={base} likes={likes} />
        : <div className="rn-empty"><b>{aba === "curtidas" ? "Você ainda não curtiu nenhuma nota." : mine ? "Você ainda não publicou." : "Nenhuma nota ainda."}</b>{mine && aba === "notas" && <Link className="btn sm" href={`${base}/novo`}>Publicar a primeira</Link>}</div>}
    </div>
  );
}
