import Link from "next/link";
import { requireMember } from "@/lib/supabase/server";
import { postsByArtist, interestsForArtist, diaryStats } from "@/lib/diary";
import { worksByArtist } from "@/lib/data";
import { PageHead, SecHead, Empty, Notice } from "@/components/ui";
import { PostCard } from "@/components/diary";
import { Composer, MarkSeen } from "@/components/diary-client";
import { dateBR } from "@/lib/format";

export const metadata = { title: "Diário de ateliê" };

export default async function DiarioArtista() {
  const me = await requireMember("artist");
  const [posts, interests, st, works] = await Promise.all([postsByArtist(me.id, true), interestsForArtist(me.id), diaryStats(), worksByArtist(me.id)]);
  const pub = works.filter((w) => w.status === "published");
  return (
    <div className="wrap">
      <PageHead title="Diário" label="Diário de ateliê" intro={<>Mostre processo, ateliê e obras em andamento para os colecionadores da rede. Obras aprovadas pela curadoria entram aqui sozinhas como <em>Obra nova</em>.</>}
        count={<>{st.posts} {st.posts === 1 ? "publicação" : "publicações"}</>} />
      <div className="stats" style={{ ["--n" as any]: 3 }}>
        <div><span className="lab">Seguidores</span><b>{String(st.followers).padStart(2, "0")}</b></div>
        <div><span className="lab">Salvamentos</span><b>{String(st.saves).padStart(2, "0")}</b></div>
        <div><span className="lab">Interesses {st.unseen ? `· ${st.unseen} novos` : ""}</span><b className={st.unseen ? "ok-c" : ""}>{String(st.interests).padStart(2, "0")}</b></div>
      </div>
      <p className="hint" style={{ padding: "10px 0" }}>Números privados: só você vê. Colecionadores não veem contagens.</p>
      <div className="diary">
        <div className="diary-feed">
          <Composer userId={me.id} works={pub.map((w) => ({ id: w.id, title: w.title }))} />
          {posts.length ? posts.map((p) => <PostCard key={p.id} p={p} viewer={{ id: me.id, role: "artist" }} />)
            : <Empty sm title="Seu diário está vazio." body="Comece com uma foto do ateliê ou de uma obra em andamento." />}
        </div>
        <aside className="diary-side" aria-label="Interesses">
          <p className="lab" style={{ color: "var(--ink)" }}>Interesses recebidos</p>
          <MarkSeen count={st.unseen} />
          {interests.length ? <ul className="side-list">{interests.map((i: any) => (
            <li key={i.id} style={!i.seen_at ? { background: "var(--slab-lt)" } : undefined}><span><b style={{ font: "500 12px var(--mono)" }}>{i.buyer?.member_code} · {i.buyer?.city}</b>
              <span>{dateBR(i.created_at)} · {i.work ? <Link href={`/artista/obras/${i.work.slug}`} style={{ textDecoration: "underline" }}>{i.work.title}</Link> : `“${(i.post?.body || "publicação").slice(0, 40)}…”`}</span></span>
              {!i.seen_at && <span className="tag t-open">Novo</span>}</li>))}</ul>
            : <p className="hint">Quando um colecionador tocar em “Tenho interesse”, ele aparece aqui pelo código de membro.</p>}
          <Notice>O interesse não é uma proposta. Se a publicação estiver ligada a uma obra, o colecionador segue para ela e pode reservar ou propor um valor.</Notice>
        </aside>
      </div>
    </div>
  );
}
