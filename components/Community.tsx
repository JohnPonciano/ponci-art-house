import Link from "next/link";
import { notFound } from "next/navigation";
import type { Me } from "@/lib/supabase/server";
import { feed, postById, commentsFor, mySaves, myLikes, myFollows, myInterests, artistsDirectory, activity, interestsForArtist, diaryStats, personName, TOPICS, type FeedMode, type Topic } from "@/lib/diary";
import { worksByArtist } from "@/lib/data";
import { PageHead, Notice } from "./ui";
import { Icon } from "./Icon";
import { PostCard } from "./diary";
import { Composer, FollowBtn, MarkActivitySeen, MarkSeen, ShowNameToggle } from "./diary-client";
import { ago } from "@/lib/community";
import { dateBR } from "@/lib/format";

type SP = { aba?: string; t?: string; antes?: string };
const ACT: Record<string, string> = { comment: "comentou na sua publicação", reply: "respondeu ao seu comentário", like: "curtiu sua publicação" };

/** Feed da Comunidade, igual para artistas e colecionadores (muda só o que cada um pode fazer). */
export async function CommunityFeed({ me, base, sp }: { me: Me; base: string; sp: SP }) {
  const role = me.role;
  const aba = (["seguindo", "salvos", "atividade"].includes(sp.aba || "") ? sp.aba : "tudo") as FeedMode | "atividade";
  const topic = (sp.t && sp.t in TOPICS ? sp.t : null) as Topic | null;
  const [f, act, saves, likes, follows, interests, artists, works, intr, st] = await Promise.all([
    aba === "atividade" ? Promise.resolve({ posts: [], more: false }) : feed(me.id, aba, topic, sp.antes),
    activity(), mySaves(me.id), myLikes(me.id), myFollows(me.id),
    role === "buyer" ? myInterests(me.id) : Promise.resolve(new Set<string>()),
    artistsDirectory(),
    role === "artist" ? worksByArtist(me.id) : Promise.resolve([]),
    role === "artist" ? interestsForArtist(me.id) : Promise.resolve([]),
    role === "artist" ? diaryStats() : Promise.resolve(null),
  ]);
  const cs = await commentsFor(f.posts.filter((p) => p.comments > 0).map((p) => p.id));
  const last = f.posts[f.posts.length - 1];
  const q = (o: Partial<SP>) => { const u = new URLSearchParams(); const a = o.aba ?? (aba === "tudo" ? "" : aba); const t = "t" in o ? o.t : topic || "";
    if (a) u.set("aba", a); if (t && a !== "atividade") u.set("t", t); if (o.antes) u.set("antes", o.antes); const s = u.toString(); return base + (s ? "?" + s : ""); };
  const tab = (a: string, l: React.ReactNode) => <Link href={q({ aba: a === "tudo" ? "" : a, t: a === "atividade" ? "" : undefined })} aria-current={aba === a ? "page" : undefined}>{l}</Link>;
  const others = artists.filter((a: any) => a.id !== me.id);
  return (
    <div className="wrap">
      <PageHead title="Comunidade" label="Rede PONCI · só membros"
        intro={<>Artistas e colecionadores conversando: processo, agenda, coleção e dúvidas. Em ordem cronológica, <em>sem algoritmo</em>.</>}
        count={<>{follows.size} {follows.size === 1 ? "artista seguida" : "artistas seguidas"}{act.unseen ? <><br />{act.unseen} {act.unseen === 1 ? "novidade" : "novidades"} para você</> : null}</>} />
      <div className="diary">
        <div className="diary-feed">
          <nav className="tabs" aria-label="Feed">{tab("tudo", "Tudo")}{tab("seguindo", "Seguindo")}{tab("salvos", "Salvos")}
            {tab("atividade", <>Atividade{act.unseen ? <i className="badge-n">{act.unseen}</i> : null}</>)}</nav>
          {aba !== "atividade" && <nav className="spaces" aria-label="Espaços">
            <Link href={q({ t: "" })} aria-current={!topic ? "true" : undefined} className="chip">Todos os espaços</Link>
            {(Object.keys(TOPICS) as Topic[]).map((t) => <Link key={t} href={q({ t })} aria-current={topic === t ? "true" : undefined} className="chip">{TOPICS[t][0]}</Link>)}
          </nav>}
          {topic && aba !== "atividade" && <p className="space-intro"><b>{TOPICS[topic][0]}</b> · {TOPICS[topic][1]}</p>}

          {aba === "atividade" ? <>
            <MarkActivitySeen count={act.unseen} />
            {act.items.length ? <ul className="activity">{act.items.map((i, k) => (
              <li key={k} className={i.fresh ? "fresh" : ""}><Link href={`${base}/${i.post_id}`}>
                <span className={"av sm" + (i.role === "buyer" ? " av-buyer" : "")} aria-hidden="true"><Icon n={i.kind === "like" ? "heart" : i.kind === "reply" ? "reply" : "chat"} /></span>
                <span><b>{personName({ role: i.role as any, display_name: i.name || "", member_code: i.member_code, show_name: !!i.name })}</b> {ACT[i.kind]}
                  {i.body && <em>“{i.body}”</em>}<time dateTime={i.created_at}>{ago(i.created_at)}</time></span></Link></li>))}</ul>
              : <div className="uptodate"><b>Nada por aqui ainda.</b><span>Quando alguém curtir, comentar ou responder você, aparece aqui.</span></div>}
          </> : <>
            {aba !== "salvos" && <Composer userId={me.id} role={role} topic={topic} works={(works as any[]).filter((w) => w.status === "published").map((w) => ({ id: w.id, title: w.title }))} />}
            {aba === "seguindo" && follows.size === 0 && <div className="uptodate"><b>Comece seguindo artistas.</b><span>“Seguindo” mostra as suas publicações e as das artistas que você segue.</span><Link href={q({ aba: "" })}>Ver tudo</Link></div>}
            {f.posts.map((p) => <PostCard key={p.id} p={p} base={base} viewer={{ id: me.id, role }} saved={saves.has(p.id)} liked={likes.has(p.id)} interested={interests.has(p.id)} comments={cs[p.id] || []} />)}
            {f.more && last
              ? <div className="uptodate"><b>Você viu as mais recentes.</b><span>As anteriores ficam a um toque, sem rolagem infinita.</span><Link href={q({ antes: last.created_at })}>Ver anteriores</Link></div>
              : <div className="uptodate"><b>Você está em dia.</b><span>{aba === "salvos" ? (f.posts.length ? "Essas são todas as publicações que você salvou." : "Nada salvo ainda. Use “Salvar” nas publicações.") : f.posts.length ? "Não há mais publicações por agora." : "Ninguém publicou aqui ainda. Que tal começar?"}</span>
                  {sp.antes && <Link href={q({})}>Voltar ao início</Link>}</div>}
          </>}
        </div>
        <aside className="diary-side" aria-label="Comunidade">
          {role === "buyer" && <ShowNameToggle initial={!!(me as any).show_name} code={me.member_code} />}
          {role === "artist" && st && <>
            <p className="lab" style={{ color: "var(--ink)" }}>Seus números (privados)</p>
            <dl className="side-stats"><div><dt>Seguidores</dt><dd>{st.followers}</dd></div><div><dt>Salvamentos</dt><dd>{st.saves}</dd></div><div><dt>Interesses</dt><dd className={st.unseen ? "ok-c" : ""}>{st.interests}</dd></div></dl>
            <MarkSeen count={st.unseen} />
            {(intr as any[]).length > 0 && <><p className="lab" style={{ color: "var(--ink)" }}>Interesses recebidos</p>
              <ul className="side-list">{(intr as any[]).slice(0, 6).map((i) => (
                <li key={i.id} style={!i.seen_at ? { background: "var(--slab-lt)" } : undefined}><span><b style={{ font: "500 12px var(--mono)" }}>{i.buyer?.member_code} · {i.buyer?.city}</b>
                  <span>{dateBR(i.created_at)} · {i.work ? <Link href={`/artista/obras/${i.work.slug}`} style={{ textDecoration: "underline" }}>{i.work.title}</Link> : `“${(i.post?.body || "publicação").slice(0, 40)}…”`}</span></span>
                  {!i.seen_at && <span className="tag t-open">Novo</span>}</li>))}</ul></>}
          </>}
          <p className="lab" style={{ color: "var(--ink)" }}>Artistas da rede</p>
          <ul className="side-list">{others.map((a: any) => (
            <li key={a.id}>{role === "buyer" ? <Link href={`/colecionador/artistas/${a.member_code}`}><b>{a.display_name}</b><span>{a.practice} · {a.city}</span></Link>
              : <span><b>{a.display_name}</b><span>{a.practice} · {a.city}</span></span>}<FollowBtn artistId={a.id} on={follows.has(a.id)} compact /></li>))}</ul>
          <Notice>Comunidade só de membros verificados. Respeito e boa-fé: publicações e comentários podem ser denunciados e são revisados pela PONCI.</Notice>
        </aside>
      </div>
    </div>
  );
}

/** Página de uma publicação com a conversa inteira. */
export async function CommunityPost({ me, base, id }: { me: Me; base: string; id: string }) {
  const p = await postById(id);
  if (!p || (p.removed_at && p.author.id !== me.id)) notFound();
  const [cs, saves, likes, interests] = await Promise.all([commentsFor([p.id]), mySaves(me.id), myLikes(me.id), me.role === "buyer" ? myInterests(me.id) : Promise.resolve(new Set<string>())]);
  return (
    <div className="wrap post-page">
      <Link className="backlink always" href={base}><Icon n="left" />Comunidade</Link>
      <PostCard full p={p} base={base} viewer={{ id: me.id, role: me.role }} saved={saves.has(p.id)} liked={likes.has(p.id)} interested={interests.has(p.id)} comments={cs[p.id] || []} />
      <div style={{ height: "clamp(72px,10vw,140px)" }} />
    </div>
  );
}
