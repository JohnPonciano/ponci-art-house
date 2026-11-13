import { createClient } from "@/lib/supabase/server";
import { PageHead, SecHead, Empty } from "@/components/ui";
import { PostCard } from "@/components/diary";
import { ModerateBtn } from "@/components/diary-client";
import { SEL, norm } from "@/lib/diary";
import { CommentModeration } from "@/components/diary-client";
import { dateBR } from "@/lib/format";

export const metadata = { title: "Comunidade · moderação" };
const one = (x: any) => (Array.isArray(x) ? x[0] : x);

export default async function DiarioAdmin() {
  const sb = await createClient();
  const [{ data: reps }, { data: recent }, { data: coms }] = await Promise.all([
    sb.from("post_reports").select(`id,reason,created_at,resolved_at,post:posts(${SEL})`).is("resolved_at", null).order("created_at", { ascending: false }),
    sb.from("posts").select(SEL).order("created_at", { ascending: false }).limit(20),
    sb.from("post_comments").select("id,post_id,body,created_at,removed_at,removed_reason,author:profiles!post_comments_author_id_fkey(display_name,member_code,role)").order("created_at", { ascending: false }).limit(40),
  ]);
  const reports = (reps || []).map((r: any) => ({ ...r, post: norm(one(r.post)) }));
  return (
    <div className="wrap">
      <PageHead title="Comunidade" label="Moderação" intro="Publicações denunciadas, as mais recentes e os últimos comentários. Remover esconde dos membros; o autor vê o motivo." count={`${reports.length} denúncias abertas`} />
      <section className="sub-sec" aria-labelledby="dn-t">
        <SecHead n="01" eyebrow="Denúncias" title={<>Para <em>analisar</em></>} id="dn-t" />
        {reports.length ? <div style={{ display: "flex", flexDirection: "column", gap: 24, paddingTop: 20 }}>{reports.map((r: any) => (
          <div key={r.id} style={{ display: "grid", gap: 10 }}><p className="err-box">Denúncia em {dateBR(r.created_at)}: “{r.reason}”</p>
            <PostCard p={r.post} base="/admin/diario" viewer={{ id: "", role: "admin" }} /><ModerateBtn postId={r.post.id} removed={!!r.post.removed_at} /></div>))}</div>
          : <Empty sm title="Nenhuma denúncia aberta." />}
      </section>
      <section className="sub-sec" aria-labelledby="rc-t">
        <SecHead n="02" eyebrow="Recentes" title={<>Últimas <em>publicações</em></>} id="rc-t" />
        <div style={{ display: "flex", flexDirection: "column", gap: 24, paddingTop: 20 }}>{(recent || []).map(norm).map((p) => (
          <div key={p.id} style={{ display: "grid", gap: 10 }}><PostCard p={p} base="/admin/diario" viewer={{ id: "", role: "admin" }} /><ModerateBtn postId={p.id} removed={!!p.removed_at} /></div>))}</div>
      </section>
      <section className="sub-sec" aria-labelledby="cm-t">
        <SecHead n="03" eyebrow="Comentários" title={<>Últimos <em>comentários</em></>} id="cm-t" />
        {(coms || []).length ? <ul className="mod-comments">{(coms || []).map((c: any) => { const au = one(c.author); return (
          <li key={c.id} className={c.removed_at ? "removed" : ""}><p><b>{au?.display_name}</b> <span className="hint">{au?.member_code} · {dateBR(c.created_at)}</span></p>
            <p>{c.body}</p>{c.removed_at && <p className="hint">Removido{c.removed_reason ? `: ${c.removed_reason}` : ""}</p>}
            <CommentModeration id={c.id} removed={!!c.removed_at} /></li>); })}</ul>
          : <Empty sm title="Nenhum comentário ainda." />}
      </section>
      <div style={{ height: "clamp(72px,10vw,140px)" }} />
    </div>
  );
}
