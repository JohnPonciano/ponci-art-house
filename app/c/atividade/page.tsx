import Link from "next/link";
import { rnCtx } from "@/lib/rn";
import { activity, personName, ago } from "@/lib/diary";
import { Icon } from "@/components/Icon";
import { MarkActivitySeen } from "@/components/diary-client";

export const metadata = { title: "Atividade" };
const ACT: Record<string, string> = { comment: "comentou na sua nota", reply: "respondeu ao seu comentário", like: "curtiu sua nota" };

export default async function Atividade() {
  const { base } = await rnCtx(); const act = await activity();
  return (
    <div className="rn-wrap rn-narrow">
      <h1 className="rn-h1">Atividade</h1>
      <MarkActivitySeen count={act.unseen} />
      {act.items.length ? <ul className="activity">{act.items.map((i, k) => (
        <li key={k} className={i.fresh ? "fresh" : ""}><Link href={`${base}/p/${i.post_id}`}>
          <span className={"av sm" + (i.role === "buyer" ? " av-buyer" : "")} aria-hidden="true"><Icon n={i.kind === "like" ? "heart" : i.kind === "reply" ? "reply" : "chat"} /></span>
          <span><b>{personName({ role: i.role as any, display_name: i.name || "", member_code: i.member_code, show_name: !!i.name })}</b> {ACT[i.kind]}
            {i.body && <em>“{i.body}”</em>}<time dateTime={i.created_at}>{ago(i.created_at)}</time></span></Link></li>))}</ul>
        : <div className="rn-empty"><b>Nada por aqui ainda.</b><span>Quando alguém curtir, comentar ou responder você, aparece aqui.</span></div>}
    </div>
  );
}
