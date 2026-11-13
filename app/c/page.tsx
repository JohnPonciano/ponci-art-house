import Link from "next/link";
import { rnCtx } from "@/lib/rn";
import { feed, myLikes, myFollows, TOPICS, type Topic } from "@/lib/diary";
import { NoteGrid } from "@/components/rn/Notes";

export const metadata = { title: "Descobrir" };

export default async function Descobrir({ searchParams }: { searchParams: Promise<{ aba?: string; t?: string; antes?: string }> }) {
  const { me, base } = await rnCtx(); const sp = await searchParams;
  const seguindo = sp.aba === "seguindo"; const topic = (sp.t && sp.t in TOPICS ? sp.t : null) as Topic | null;
  const [f, likes, follows] = await Promise.all([feed(me.id, seguindo ? "seguindo" : "tudo", topic, sp.antes, undefined, 30), myLikes(me.id), myFollows(me.id)]);
  const q = (o: Record<string, string | undefined>) => { const u = new URLSearchParams(); const v = { aba: seguindo ? "seguindo" : undefined, t: topic || undefined, ...o };
    Object.entries(v).forEach(([k, x]) => x && u.set(k, x)); const s = u.toString(); return (base || "/") + (s ? "?" + s : ""); };
  const last = f.posts[f.posts.length - 1];
  return (
    <div className="rn-wrap">
      <nav className="rn-feedtabs" aria-label="Feed">
        <Link href={q({ aba: undefined })} aria-current={!seguindo ? "page" : undefined}>Descobrir</Link>
        <Link href={q({ aba: "seguindo" })} aria-current={seguindo ? "page" : undefined}>Seguindo</Link>
      </nav>
      <nav className="rn-chips" aria-label="Espaços">
        <Link href={q({ t: undefined })} aria-current={!topic ? "true" : undefined}>Para você</Link>
        {(Object.keys(TOPICS) as Topic[]).map((t) => <Link key={t} href={q({ t })} aria-current={topic === t ? "true" : undefined}>{TOPICS[t][0]}</Link>)}
      </nav>
      {topic && <p className="rn-space">{TOPICS[topic][1]}</p>}
      {seguindo && follows.size === 0 && <div className="rn-empty"><b>Siga artistas para montar seu feed.</b><span>Abra uma nota e toque em Seguir no perfil da artista.</span></div>}
      {f.posts.length ? <NoteGrid posts={f.posts} base={base} likes={likes} />
        : !(seguindo && follows.size === 0) && <div className="rn-empty"><b>Nada por aqui ainda.</b><span>Que tal publicar a primeira nota deste espaço?</span><Link className="btn sm" href={`${base}/novo${topic ? `?t=${topic}` : ""}`}>Publicar</Link></div>}
      {f.more && last && <div className="rn-more"><Link className="btn ghost" href={q({ antes: last.created_at })}>Ver mais notas</Link></div>}
    </div>
  );
}
