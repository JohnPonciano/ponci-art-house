import Link from "next/link";
import { redirect } from "next/navigation";
import { rnCtx } from "@/lib/rn";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/Icon";
import { ago, noteTitle } from "@/lib/community";

export const metadata = { title: "Perfil" };

/** Membro: vai para o próprio perfil. Admin: página de moderação da comunidade. */
export default async function Eu() {
  const { me, base, main, isAdmin } = await rnCtx();
  if (!isAdmin) redirect(`${base}/u/${me.handle || me.member_code}`);
  const sb = await createClient();
  const [reps, removed, coms] = await Promise.all([
    sb.from("post_reports").select("id,reason,created_at,post:posts(id,title,body,kind,work_id,removed_at)").is("resolved_at", null).order("created_at", { ascending: false }).limit(40),
    sb.from("posts").select("id,title,body,kind,removed_at,removed_reason").not("removed_at", "is", null).order("removed_at", { ascending: false }).limit(20),
    sb.from("post_comments").select("id,body,post_id,removed_at,removed_reason").not("removed_at", "is", null).order("removed_at", { ascending: false }).limit(20),
  ]);
  const one = (x: any) => (Array.isArray(x) ? x[0] : x);
  const t = (p: any) => (p ? noteTitle({ title: p.title || "", body: p.body || "", work: null, kind: p.kind }) : "Nota apagada");
  const R = (reps.data as any[]) || [], X = (removed.data as any[]) || [], C = (coms.data as any[]) || [];
  return (
    <div className="ig-profile">
      <header className="ig-ph">
        <span className="ig-pav ig-pav-admin" aria-hidden="true"><Icon n="shield" /></span>
        <div className="ig-pinfo">
          <div className="ig-prow"><h1>PONCI · Admin</h1><a className="btn sm ghost" href={`${main}/admin/diario`}>Abrir no painel</a></div>
          <dl className="ig-pstats"><div><dd>{R.length}</dd><dt>{R.length === 1 ? "denúncia aberta" : "denúncias abertas"}</dt></div><div><dd>{X.length}</dd><dt>notas removidas</dt></div></dl>
          <p className="ig-pbio">Abra uma nota para remover ou restaurar com motivo, remover comentários ou chegar ao perfil do autor para suspender a conta.</p>
        </div>
      </header>
      <section className="adm-sec"><h2 className="rn-h2">Denúncias abertas</h2>
        {R.length ? <ul className="adm-list">{R.map((r) => { const p = one(r.post); return (
          <li key={r.id}><Link href={p ? `${base}/p/${p.id}` : "#"}><b>{t(p)}</b><span>“{r.reason}”</span><small>{ago(r.created_at)}{p?.removed_at ? " · já removida" : ""}</small></Link><Icon n="right" /></li>); })}</ul>
          : <p className="hint">Nenhuma denúncia aberta.</p>}
      </section>
      <section className="adm-sec"><h2 className="rn-h2">Notas removidas</h2>
        {X.length ? <ul className="adm-list">{X.map((p) => (
          <li key={p.id}><Link href={`${base}/p/${p.id}`}><b>{t(p)}</b><span>{p.removed_reason || "Sem motivo informado"}</span><small>{ago(p.removed_at)} · abra para restaurar</small></Link><Icon n="right" /></li>))}</ul>
          : <p className="hint">Nenhuma nota removida.</p>}
      </section>
      <section className="adm-sec"><h2 className="rn-h2">Comentários removidos</h2>
        {C.length ? <ul className="adm-list">{C.map((c) => (
          <li key={c.id}><Link href={`${base}/p/${c.post_id}`}><b>“{c.body.slice(0, 90)}{c.body.length > 90 ? "…" : ""}”</b><span>{c.removed_reason || "Removido pela moderação"}</span><small>{ago(c.removed_at)}</small></Link><Icon n="right" /></li>))}</ul>
          : <p className="hint">Nenhum comentário removido. Para restaurar um comentário, use o painel.</p>}
      </section>
    </div>
  );
}
