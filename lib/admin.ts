import "server-only";
import { createClient } from "@/lib/supabase/server";
import { WORK_COLS, type Work } from "@/lib/data";

export type Req = { id: string; ref: string; role: "artist" | "buyer"; name: string; email: string; city: string; link: string; practice: string; msg: string; created_at: string; status: string; invite_code: string | null; reviewed_at: string | null };
export type Member = { id: string; role: "artist" | "buyer"; member_code: string; display_name: string; city: string; practice: string; status: string; created_at: string; full_name: string; email: string };
export type Invite = { code: string; role: "artist" | "buyer"; uses_left: number; auto_approve: boolean; note: string; created_at: string; request_id: string | null };

const one = (x: any) => (Array.isArray(x) ? x[0] : x);

export async function requests(): Promise<Req[]> {
  const sb = await createClient();
  const { data } = await sb.from("access_requests").select("*").order("created_at", { ascending: false });
  return (data as any) || [];
}
export async function members(): Promise<Member[]> {
  const sb = await createClient();
  const { data } = await sb.from("profiles").select("id,role,member_code,display_name,city,practice,status,created_at,private:profile_private(full_name,email)").order("created_at", { ascending: false });
  return ((data as any) || []).map((m: any) => { const p = one(m.private) || {}; return { ...m, full_name: p.full_name || "", email: p.email || "" }; });
}
export async function invites(): Promise<Invite[]> {
  const sb = await createClient();
  const { data } = await sb.from("invites").select("*").order("created_at", { ascending: false });
  return (data as any) || [];
}
export async function reviewWorks(): Promise<Work[]> {
  const sb = await createClient();
  const { data } = await sb.from("works").select(`${WORK_COLS},artist:profiles!works_artist_id_fkey(id,display_name,city,practice,bio)`).eq("status", "review").order("created_at");
  // quem está esperando ajustes da artista vai para o fim da fila
  return ((data as any) || []).map((w: any) => ({ ...w, artist: one(w.artist) }))
    .sort((a: any, b: any) => Number(!!a.changes_requested_at) - Number(!!b.changes_requested_at));
}
export async function counts() {
  const sb = await createClient();
  const c = async (q: any) => (await q).count || 0;
  const [reqs, pend, review, artists, buyers, published, sol] = await Promise.all([
    c(sb.from("access_requests").select("id", { count: "exact", head: true }).eq("status", "pending")),
    c(sb.from("profiles").select("id", { count: "exact", head: true }).eq("status", "pending")),
    c(sb.from("works").select("id", { count: "exact", head: true }).eq("status", "review")),
    c(sb.from("profiles").select("id", { count: "exact", head: true }).eq("role", "artist").eq("status", "active")),
    c(sb.from("profiles").select("id", { count: "exact", head: true }).eq("role", "buyer").eq("status", "active")),
    c(sb.from("works").select("id", { count: "exact", head: true }).eq("status", "published")),
    c(sb.from("member_requests").select("id", { count: "exact", head: true }).in("status", ["aberta", "em_andamento"])),
  ]);
  return { reqs, pend, review, artists, buyers, published, sol };
}

export async function docs() {
  const sb = await createClient();
  const { data } = await sb.from("legal_documents").select("id,slug,version,title,summary,body,sha256,published_at").order("slug").order("version", { ascending: false });
  return (data as any[]) || [];
}
export async function acceptanceCounts(): Promise<Record<string, number>> {
  const sb = await createClient();
  const { data } = await sb.from("acceptances").select("document_id");
  const m: Record<string, number> = {}; (data || []).forEach((a: any) => (m[a.document_id] = (m[a.document_id] || 0) + 1)); return m;
}
export async function memberRequests() {
  const sb = await createClient();
  const { data } = await sb.from("member_requests").select("*").order("created_at", { ascending: false });
  const reqs = (data as any[]) || [];
  const ids = [...new Set(reqs.map((r) => r.user_id))];
  const { data: ps } = ids.length ? await sb.from("profiles").select("id,member_code,role,private:profile_private(full_name,email)").in("id", ids) : { data: [] };
  const by = Object.fromEntries((ps || []).map((p: any) => [p.id, { code: p.member_code, role: p.role, name: one(p.private)?.full_name, email: one(p.private)?.email }]));
  const oids = [...new Set(reqs.map((r) => r.order_id).filter(Boolean))];
  const { data: os } = oids.length ? await sb.from("orders").select("id,ref,amount").in("id", oids) : { data: [] };
  const ob = Object.fromEntries((os || []).map((o: any) => [o.id, o]));
  return reqs.map((r) => ({ ...r, member: by[r.user_id], order: r.order_id ? ob[r.order_id] : null }));
}
export async function compliance(min = 10000) {
  const sb = await createClient();
  const { data, error } = await sb.rpc("admin_compliance", { p_min: min });
  if (error) throw new Error(error.message);
  return (data as any[]) || [];
}
export async function audit(table?: string, limit = 200) {
  const sb = await createClient();
  let q = sb.from("audit_log").select("*").order("at", { ascending: false }).limit(limit);
  if (table) q = q.eq("table_name", table);
  const { data } = await q;
  return (data as any[]) || [];
}
export async function kycStatus(): Promise<Record<string, { done: boolean; pep: boolean }>> {
  const sb = await createClient();
  const { data } = await sb.from("kyc").select("user_id,completed_at,pep");
  return Object.fromEntries((data || []).map((k: any) => [k.user_id, { done: !!k.completed_at, pep: k.pep }]));
}

/* ---------- Vendas ---------- */
export type SaleReq = { id: string; ref: string; kind: string; status: string; details: string; created_at: string };
export type Sale = {
  id: string; ref: string; amount: number; via: string; stage: number; created_at: string;
  paid_at?: string | null; shipped_at?: string | null; delivered_at?: string | null; carrier?: string | null; tracking_code?: string | null;
  cancelled_at?: string | null; cancel_reason?: string | null; payout_at?: string | null; payout_note?: string | null;
  work: Work & { artist?: { id: string; display_name: string; member_code: string; city: string } };
  buyer?: { member_code: string; city: string; name?: string; email?: string };
  contract?: { id: string; ref: string; signatures: { party: string; signed_at: string }[] } | null;
  reqs: SaleReq[];
};
const DAY = 864e5;
/** Situação da venda e alertas de prazo (pagamento 48 h, envio 5 dias, transporte 15 dias, arrependimento 7 dias). */
export function saleState(o: Pick<Sale, "stage" | "created_at" | "paid_at" | "shipped_at" | "delivered_at" | "cancelled_at" | "payout_at"> & { reqs?: SaleReq[] }, now = Date.now()) {
  const age = (d?: string | null) => (d ? (now - new Date(d).getTime()) / DAY : 0);
  const openReq = (o.reqs || []).find((r) => ["arrependimento", "problema"].includes(r.kind) && ["aberta", "em_andamento"].includes(r.status));
  if (o.cancelled_at) return { key: "cancelled", label: "Cancelada", alert: "" };
  if (openReq) return { key: o.stage === 3 ? "delivered" : ["awaiting", "toship", "transit"][o.stage], label: openReq.kind === "arrependimento" ? "Desistência aberta" : "Problema aberto", alert: `${openReq.ref}: ${openReq.kind === "arrependimento" ? "pedido de desistência" : "problema relatado"}` };
  if (o.stage === 0) return { key: "awaiting", label: "Aguardando pagamento", alert: age(o.created_at) > 2 ? `Pagamento atrasado (${Math.floor(age(o.created_at))} dias desde a reserva)` : "" };
  if (o.stage === 1) return { key: "toship", label: "Para despachar", alert: age(o.paid_at || o.created_at) > 5 ? `Paga há ${Math.floor(age(o.paid_at || o.created_at))} dias e ainda não despachada` : "" };
  if (o.stage === 2) return { key: "transit", label: "Em transporte", alert: age(o.shipped_at) > 15 ? `Em transporte há ${Math.floor(age(o.shipped_at))} dias` : "" };
  if (!o.payout_at) {
    const free = o.delivered_at ? age(o.delivered_at) >= 7 : false;
    return { key: "payout", label: free ? "Repasse liberado" : "Em arrependimento", alert: free ? "Repasse liberado: registre o pagamento à artista" : "" };
  }
  return { key: "done", label: "Repassada", alert: "" };
}
export async function adminSales(): Promise<Sale[]> {
  const sb = await createClient();
  const { data } = await sb.from("orders").select(`*,work:works!inner(${WORK_COLS},artist:profiles!works_artist_id_fkey(id,display_name,member_code,city)),buyer:profiles!orders_buyer_id_fkey(member_code,city,private:profile_private(full_name,email)),contract:contracts(id,ref,signatures:contract_signatures(party,signed_at))`)
    .order("created_at", { ascending: false });
  const os = (data as any[]) || [];
  const ids = os.map((o) => o.id);
  const { data: rq } = ids.length ? await sb.from("member_requests").select("id,ref,kind,status,details,created_at,order_id").in("order_id", ids) : { data: [] };
  return os.map((o) => {
    const work = one(o.work); work.artist = one(work.artist); const b = one(o.buyer); const p = b ? one(b.private) : null;
    return { ...o, work, buyer: b ? { member_code: b.member_code, city: b.city, name: p?.full_name, email: p?.email } : undefined,
      contract: one(o.contract) || null, reqs: ((rq as any[]) || []).filter((r) => r.order_id === o.id) };
  });
}
/** Quantas vendas pedem ação (para o selo no menu). */
export async function salesAttention(): Promise<number> {
  const sb = await createClient();
  const { data, error } = await sb.from("orders").select("*");
  if (error || !data) return 0;
  const { data: rq } = await sb.from("member_requests").select("order_id,kind,status").not("order_id", "is", null).in("status", ["aberta", "em_andamento"]);
  return (data as any[]).filter((o) => saleState({ ...o, reqs: ((rq as any[]) || []).filter((r) => r.order_id === o.id) }).alert).length;
}
