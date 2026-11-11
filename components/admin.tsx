import Link from "next/link";
import { ArtImage } from "./ArtImage";
import { Icon } from "./Icon";
import { AdminButton, InviteShare } from "./admin-client";
import { brl, CAT, dateBR, dims } from "@/lib/format";
import type { Req, Member, Invite } from "@/lib/admin";
import type { Work } from "@/lib/data";

const ROLE = { artist: "Artista", buyer: "Colecionador" };
const RSTATUS: Record<string, [string, string]> = { pending: ["Pendente", "t-open"], approved: ["Aprovado", "t-accepted"], rejected: ["Recusado", "t-declined"] };
const MSTATUS: Record<string, [string, string]> = { pending: ["Aguardando", "t-open"], active: ["Ativo", "t-pub"], suspended: ["Suspenso", "t-declined"] };
const T = ({ m, k }: { m: Record<string, [string, string]>; k: string }) => <span className={"tag " + m[k][1]}>{m[k][0]}</span>;

export function RequestRow({ r }: { r: Req }) {
  const link = r.link?.trim();
  const href = link ? (/^https?:\/\//.test(link) ? link : link.startsWith("@") ? `https://instagram.com/${link.slice(1)}` : null) : null;
  return (
    <div className="arow" id={r.ref}>
      <span>{r.ref}<small>{dateBR(r.created_at)}</small><T m={RSTATUS} k={r.status} /></span>
      <span className="who-b"><b>{r.name}</b><span>{ROLE[r.role]} · {r.city || "—"}</span><span>{r.email}</span></span>
      <span className="det">
        <span>{r.practice}{link ? <> · {href ? <a href={href} target="_blank" rel="noopener noreferrer">{link}</a> : link}</> : null}</span>
        {r.msg && <q>{r.msg}</q>}
      </span>
      <span className="act">
        {r.status === "pending" && <>
          <AdminButton action="approveRequest" args={[r.id]} ok="Pedido aprovado. Copie ou envie o convite." go={`/admin/pedidos?f=approved#${r.ref}`}>Aprovar e gerar convite <Icon n="check" /></AdminButton>
          <AdminButton action="rejectRequest" args={[r.id]} ok="Pedido recusado." className="linkbtn" confirm={`Recusar o pedido de ${r.name}?`}>Recusar</AdminButton></>}
        {r.status === "approved" && r.invite_code && <>
          <InviteShare name={r.name} email={r.email} code={r.invite_code} role={r.role} />
          <AdminButton action="resendInvite" args={[r.id]} ok="Convite reenviado por e-mail." className="linkbtn">Reenviar convite por e-mail</AdminButton></>}
        {r.status === "rejected" && <span className="hint">Recusado em {dateBR(r.reviewed_at!)}</span>}
      </span>
    </div>
  );
}

export function MemberRow({ m, kyc }: { m: Member; kyc?: { done: boolean; pep: boolean } }) {
  return (
    <div className="arow">
      <span>{m.member_code}<small>desde {dateBR(m.created_at)}</small><T m={MSTATUS} k={m.status} /></span>
      <span className="who-b"><b>{m.full_name || m.display_name}</b><span>{ROLE[m.role]}{m.role === "artist" && m.display_name !== m.full_name ? ` · nome artístico: ${m.display_name}` : ""}</span><span>{m.email}</span></span>
      <span className="det"><span>{m.city || "—"}{m.practice ? " · " + m.practice : ""}</span>
        <span>{kyc?.done ? "Cadastro de identificação completo" : "Cadastro de identificação pendente"}{kyc?.pep ? " · pessoa politicamente exposta" : ""}</span></span>
      <span className="act">
        {m.status === "pending" && <AdminButton action="setMemberStatus" args={[m.id, "active"]} ok="Membro aprovado.">Aprovar membro <Icon n="check" /></AdminButton>}
        {m.status === "active" && <AdminButton action="setMemberStatus" args={[m.id, "suspended"]} ok="Membro suspenso." className="btn sm ghost" confirm={`Suspender ${m.full_name || m.display_name}? Ele perde acesso à rede.`}>Suspender</AdminButton>}
        {m.status === "suspended" && <AdminButton action="setMemberStatus" args={[m.id, "active"]} ok="Membro reativado." className="btn sm ghost">Reativar</AdminButton>}
        {m.status === "pending" && <AdminButton action="setMemberStatus" args={[m.id, "suspended"]} ok="Cadastro recusado." className="linkbtn" confirm="Recusar este cadastro? A conta fica suspensa.">Recusar</AdminButton>}
      </span>
    </div>
  );
}

export function WorkReviewRow({ w }: { w: Work }) {
  return (
    <div className="arow thumb">
      <span>{dateBR(w.created_at)}<small>{w.slug}</small><span className="tag t-rev">Em curadoria</span></span>
      <span className="l-thumb"><ArtImage a={w} /></span>
      <span className="det">
        <span className="who-b"><b>{w.title}</b><span>{w.artist?.display_name} · {w.year} · {CAT[w.cat]}</span><span>{w.medium} · {dims(w)}{w.edition ? " · " + w.edition : ""}</span></span>
        {w.description?.[0] && <q>{w.description.join(" ")}</q>}
        <span>Preço pedido: <b style={{ color: "var(--ink)" }}>{brl(w.price)}</b>{w.image_path ? " · com fotografia" : " · sem fotografia (composição gerada)"}</span>
      </span>
      <span className="act">
        <AdminButton action="reviewWork" args={[w.id, true]} ok="Obra aprovada e publicada.">Aprovar e publicar <Icon n="check" /></AdminButton>
        <AdminButton action="reviewWork" args={[w.id, false]} ok="Obra recusada." className="linkbtn" confirm={`Recusar “${w.title}”? O envio é apagado.`}>Recusar</AdminButton>
      </span>
    </div>
  );
}

export function InviteRow({ i }: { i: Invite }) {
  return (
    <div className="arow">
      <span>{dateBR(i.created_at)}<small>{i.request_id ? "Gerado por pedido" : "Manual"}</small>{i.uses_left > 0 ? <span className="tag t-pub">Ativo</span> : <span className="tag t-closed">Esgotado</span>}</span>
      <span className="who-b"><b>{i.code}</b><span>{ROLE[i.role]} · {i.uses_left} {i.uses_left === 1 ? "uso restante" : "usos restantes"}</span></span>
      <span className="det"><span>{i.auto_approve ? "Conta entra ativa" : "Conta aguarda aprovação"}</span>{i.note && <span>{i.note}</span>}</span>
      <span className="act">
        {i.uses_left > 0 && <>
          <InviteShare name={i.note || "membro"} code={i.code} role={i.role} />
          <AdminButton action="revokeInvite" args={[i.code]} ok="Convite revogado." className="linkbtn" confirm="Revogar este código? Ninguém mais consegue usá-lo.">Revogar</AdminButton></>}
      </span>
    </div>
  );
}

export function Chips({ base, cur, items, k = "f" }: { base: string; cur: string; items: [string, string, number?][]; k?: string }) {
  return <>{items.map(([v, l, n]) => <Link key={v} className="chip" href={v === "all" ? base : `${base}${base.includes("?") ? "&" : "?"}${k}=${v}`} scroll={false} aria-current={cur === v ? "true" : undefined}>{l}{n != null && <> <span className="count">{n}</span></>}</Link>)}</>;
}
