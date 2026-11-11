import { createClient } from "@/lib/supabase/server";
import { PageHead, SecHead, Empty } from "@/components/ui";
import { PostCard } from "@/components/diary";
import { ModerateBtn } from "@/components/diary-client";
import type { Post } from "@/lib/diary";
import { dateBR } from "@/lib/format";

export const metadata = { title: "Diário · moderação" };
const SEL = "id,kind,body,created_at,removed_at,removed_reason,artist:profiles!posts_artist_id_fkey(id,display_name,city,practice,member_code),media:post_media(id,position,path,gen,w,h),work:works(id,slug,title,year,price,status,h,w,gen,image_path,img_w,img_h,medium,no)";
const one = (x: any) => (Array.isArray(x) ? x[0] : x);
const norm = (p: any): Post => ({ ...p, artist: one(p.artist), work: one(p.work) || null, media: (p.media || []).sort((a: any, b: any) => a.position - b.position) });

export default async function DiarioAdmin() {
  const sb = await createClient();
  const [{ data: reps }, { data: recent }] = await Promise.all([
    sb.from("post_reports").select(`id,reason,created_at,resolved_at,post:posts(${SEL})`).is("resolved_at", null).order("created_at", { ascending: false }),
    sb.from("posts").select(SEL).order("created_at", { ascending: false }).limit(20),
  ]);
  const reports = (reps || []).map((r: any) => ({ ...r, post: norm(one(r.post)) }));
  return (
    <div className="wrap">
      <PageHead title="Diário" label="Moderação" intro="Publicações denunciadas e as mais recentes. Remover esconde a publicação dos membros; a artista vê o motivo." count={`${reports.length} denúncias abertas`} />
      <section className="sub-sec" aria-labelledby="dn-t">
        <SecHead n="01" eyebrow="Denúncias" title={<>Para <em>analisar</em></>} id="dn-t" />
        {reports.length ? <div style={{ display: "flex", flexDirection: "column", gap: 24, paddingTop: 20 }}>{reports.map((r: any) => (
          <div key={r.id} style={{ display: "grid", gap: 10 }}><p className="err-box">Denúncia em {dateBR(r.created_at)}: “{r.reason}”</p>
            <PostCard p={r.post} viewer={{ id: "", role: "admin" }} /><ModerateBtn postId={r.post.id} removed={!!r.post.removed_at} /></div>))}</div>
          : <Empty sm title="Nenhuma denúncia aberta." />}
      </section>
      <section className="sub-sec" aria-labelledby="rc-t">
        <SecHead n="02" eyebrow="Recentes" title={<>Últimas <em>publicações</em></>} id="rc-t" />
        <div style={{ display: "flex", flexDirection: "column", gap: 24, paddingTop: 20 }}>{(recent || []).map(norm).map((p) => (
          <div key={p.id} style={{ display: "grid", gap: 10 }}><PostCard p={p} viewer={{ id: "", role: "admin" }} /><ModerateBtn postId={p.id} removed={!!p.removed_at} /></div>))}</div>
      </section>
      <div style={{ height: "clamp(72px,10vw,140px)" }} />
    </div>
  );
}
