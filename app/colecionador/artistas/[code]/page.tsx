import { notFound } from "next/navigation";
import { requireMember } from "@/lib/supabase/server";
import { artistByCode, postsByArtist, mySaves, myFollows, myInterests } from "@/lib/diary";
import { catalogue, favoriteIds } from "@/lib/data";
import { PageHead, SecHead, Empty } from "@/components/ui";
import { PostCard } from "@/components/diary";
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
  const [posts, saves, follows, interests, cat, favs] = await Promise.all([postsByArtist(a.id), mySaves(me.id), myFollows(me.id), myInterests(me.id), catalogue(), favoriteIds(me.id)]);
  const works = cat.filter((w) => w.artist_id === a.id);
  return (
    <div className="wrap">
      <PageHead title={a.display_name.split(" ")[0]} label={`${a.display_name} · ${a.member_code}`} intro={a.bio || `${a.practice}.`} count={<>{a.practice}<br />{a.city}</>} />
      <div style={{ display: "flex", gap: 12, alignItems: "center", padding: "16px 0", borderBottom: "var(--b)" }}><FollowBtn artistId={a.id} on={follows.has(a.id)} />
        <span className="hint">{follows.has(a.id) ? "As publicações aparecem no seu Diário." : "Siga para ver as publicações no seu Diário."}</span></div>
      {works.length > 0 && <section className="sub-sec" aria-labelledby="ob-t">
        <SecHead n="01" eyebrow="Obras na rede" title={<>No <em>acervo</em></>} id="ob-t" href={`/colecionador?artist=${a.id}`} linkText="Ver no acervo" />
        <div className="board">{works.slice(0, 3).map((w) => <WorkCard key={w.id} a={w} href={`/colecionador/obras/${w.slug}`} fav={favs.includes(w.id)}
          foot={<><span className="price">{brl(w.price)}<small>{w.status === "published" ? "Disponível" : "Indisponível"}</small></span><span className="go">Ver <Icon n="right" /></span></>} />)}</div>
      </section>}
      <section className="sub-sec" aria-labelledby="di-t">
        <SecHead n={works.length ? "02" : "01"} eyebrow="Diário de ateliê" title={<>Do <em>ateliê</em></>} id="di-t" />
        <div style={{ display: "flex", flexDirection: "column", gap: 28, paddingTop: 24 }}>
          {posts.length ? posts.map((p) => <PostCard key={p.id} p={p} viewer={{ id: me.id, role: "buyer" }} saved={saves.has(p.id)} interested={interests.has(p.id)} />)
            : <Empty sm title="Nenhuma publicação ainda." />}
        </div>
      </section>
      <div style={{ height: "clamp(72px,10vw,140px)" }} />
    </div>
  );
}
