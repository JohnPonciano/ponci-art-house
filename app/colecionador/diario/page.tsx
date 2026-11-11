import Link from "next/link";
import { requireMember } from "@/lib/supabase/server";
import { feed, mySaves, myFollows, myInterests, artistsDirectory } from "@/lib/diary";
import { PageHead } from "@/components/ui";
import { PostCard } from "@/components/diary";
import { FollowBtn } from "@/components/diary-client";

export const metadata = { title: "Diário de ateliê" };
type Aba = "seguindo" | "rede" | "salvos";

export default async function Diario({ searchParams }: { searchParams: Promise<{ aba?: string; antes?: string }> }) {
  const me = await requireMember("buyer");
  const sp = await searchParams;
  const aba: Aba = sp.aba === "rede" || sp.aba === "salvos" ? sp.aba : "seguindo";
  const [f, saves, follows, interests, artists] = await Promise.all([feed(me.id, aba, sp.antes), mySaves(me.id), myFollows(me.id), myInterests(me.id), artistsDirectory()]);
  const last = f.posts[f.posts.length - 1];
  const tab = (a: Aba, l: string) => <Link href={a === "seguindo" ? "/colecionador/diario" : `/colecionador/diario?aba=${a}`} aria-current={aba === a ? "page" : undefined}>{l}</Link>;
  return (
    <div className="wrap">
      <PageHead title="Diário" label="Diário de ateliê" intro={<>Processo, ateliê e obras novas, direto de quem faz. Em ordem cronológica, <em>sem algoritmo</em>.</>} count={<>{follows.size} {follows.size === 1 ? "artista seguida" : "artistas seguidas"}</>} />
      <div className="diary">
        <div className="diary-feed">
          <nav className="tabs" aria-label="Feed">{tab("seguindo", "Seguindo")}{tab("rede", "Toda a rede")}{tab("salvos", "Salvos")}</nav>
          {aba === "seguindo" && follows.size === 0 && <div className="uptodate"><b>Comece seguindo artistas.</b><span>O feed mostra só quem você segue. Escolha na lista de artistas, ou veja toda a rede.</span><Link href="/colecionador/diario?aba=rede">Ver toda a rede</Link></div>}
          {f.posts.map((p) => <PostCard key={p.id} p={p} viewer={{ id: me.id, role: "buyer" }} saved={saves.has(p.id)} interested={interests.has(p.id)} artistHref={`/colecionador/artistas/${p.artist.member_code}`} />)}
          {(f.posts.length > 0 || aba !== "seguindo" || follows.size > 0) && (f.more && last
            ? <div className="uptodate"><b>Você viu as mais recentes.</b><span>Quer continuar? As anteriores ficam a um clique, sem rolagem infinita.</span>
                <Link href={`/colecionador/diario?${aba !== "seguindo" ? `aba=${aba}&` : ""}antes=${encodeURIComponent(last.created_at)}`}>Ver anteriores</Link></div>
            : <div className="uptodate"><b>Você está em dia.</b><span>{aba === "salvos" ? (f.posts.length ? "Essas são todas as publicações que você salvou." : "Nada salvo ainda. Use “Salvar” nas publicações.") : "Não há mais publicações por agora. Volte depois."}</span>
                {sp.antes && <Link href={aba === "seguindo" ? "/colecionador/diario" : `/colecionador/diario?aba=${aba}`}>Voltar ao início</Link>}</div>)}
        </div>
        <aside className="diary-side" aria-label="Artistas">
          <p className="lab" style={{ color: "var(--ink)" }}>Artistas da rede</p>
          <ul className="side-list">{artists.map((a: any) => (
            <li key={a.id}><Link href={`/colecionador/artistas/${a.member_code}`}><b>{a.display_name}</b><span>{a.practice} · {a.city}</span></Link><FollowBtn artistId={a.id} on={follows.has(a.id)} compact /></li>))}</ul>
          <p className="hint">Seguir só monta o seu feed. A artista não vê quem a segue, só o total.</p>
        </aside>
      </div>
    </div>
  );
}
