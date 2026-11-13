import { notFound } from "next/navigation";
import { requireMember } from "@/lib/supabase/server";
import { artistByCode, postsByArtist, myFollows, myLikes } from "@/lib/diary";
import { headers } from "next/headers";
import { communityHome } from "@/lib/site";
import { NoteGrid } from "@/components/rn/Notes";
import { catalogue, favoriteIds } from "@/lib/data";
import { PageHead, SecHead, Empty } from "@/components/ui";
import { FollowBtn } from "@/components/diary-client";
import { WorkCard } from "@/components/area";
import { Icon } from "@/components/Icon";
import { brl } from "@/lib/format";

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }) {
  const a = await artistByCode((await params).code); return { title: a?.display_name || "Artista" };
}

export default async function Artista({ params }: { params: Promise<{ code: string }> }) {
  const me = await requireMember("buyer");
  const a: any = await artistByCode((await params).code);
  if (!a) notFound();
  const [posts, likes, follows, cat, favs] = await Promise.all([postsByArtist(a.id), myLikes(me.id), myFollows(me.id), catalogue(), favoriteIds(me.id)]);
  const com = communityHome((await headers()).get("host"));
  const works = cat.filter((w) => w.artist_id === a.id);
  return (
    <div className="wrap">
      <PageHead title={a.display_name} label={`Artista · ${a.member_code}`} intro={a.bio || `${a.practice}.`} count={<>{a.practice}<br />{a.city}</>} />
      <div style={{ display: "flex", gap: 12, alignItems: "center", padding: "16px 0", borderBottom: "var(--b)" }}><FollowBtn artistId={a.id} on={follows.has(a.id)} />
        <span className="hint">{follows.has(a.id) ? "As publicações aparecem em Seguindo, na Comunidade." : "Siga para ver as publicações em Seguindo, na Comunidade."}</span></div>
      {works.length > 0 && <section className="sub-sec" aria-labelledby="ob-t">
        <SecHead n="01" eyebrow="Obras na rede" title={<>No <em>acervo</em></>} id="ob-t" href={`/colecionador?artist=${a.id}`} linkText="Ver no acervo" />
        <div className="board">{works.slice(0, 3).map((w) => <WorkCard key={w.id} a={w} href={`/colecionador/obras/${w.slug}`} fav={favs.includes(w.id)}
          foot={<><span className="price">{brl(w.price)}<small>{w.status === "published" ? "Disponível" : "Indisponível"}</small></span><span className="go">Ver <Icon n="right" /></span></>} />)}</div>
      </section>}
      <section className="sub-sec" aria-labelledby="di-t">
        <SecHead n={works.length ? "02" : "01"} eyebrow="Na comunidade" title={<>Do <em>ateliê</em></>} id="di-t" href={`${com}/u/${a.member_code}`} linkText="Ver perfil na comunidade" />
        <div style={{ paddingTop: 20 }}>{posts.length ? <NoteGrid posts={posts.slice(0, 10)} base={com === "/c" ? "/c" : com} likes={likes} /> : <Empty sm title="Nenhuma nota ainda." />}</div>
      </section>
      <div style={{ height: "clamp(72px,10vw,140px)" }} />
    </div>
  );
}
