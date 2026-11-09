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
  const [reqs, pend, review, artists, buyers, published] = await Promise.all([
    c(sb.from("access_requests").select("id", { count: "exact", head: true }).eq("status", "pending")),
    c(sb.from("profiles").select("id", { count: "exact", head: true }).eq("status", "pending")),
    c(sb.from("works").select("id", { count: "exact", head: true }).eq("status", "review")),
    c(sb.from("profiles").select("id", { count: "exact", head: true }).eq("role", "artist").eq("status", "active")),
    c(sb.from("profiles").select("id", { count: "exact", head: true }).eq("role", "buyer").eq("status", "active")),
    c(sb.from("works").select("id", { count: "exact", head: true }).eq("status", "published")),
  ]);
  return { reqs, pend, review, artists, buyers, published };
}
