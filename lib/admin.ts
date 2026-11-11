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
  return ((data as any) || []).map((w: any) => ({ ...w, artist: one(w.artist) }));
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
