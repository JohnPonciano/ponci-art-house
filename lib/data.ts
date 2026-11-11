import "server-only";
import { createClient } from "@/lib/supabase/server";

export const WORK_COLS =
  "id,slug,no,title,year,cat,medium,h,w,edition,price,description,status,gen,image_path,img_w,img_h,created_at,artist_id";
const ARTIST = "artist:profiles!works_artist_id_fkey(id,display_name,city,practice,bio,member_code)";

export type Work = {
  id: string; slug: string; no: number; title: string; year: number; cat: string; medium: string; h: number; w: number;
  edition: string | null; price: number; description: string[]; status: string; gen: any; image_path: string | null;
  img_w: number | null; img_h: number | null; created_at: string; artist_id: string;
  artist?: { id: string; display_name: string; city: string; practice: string; bio: string; member_code?: string };
};
export type PEvent = { id: number; actor: string; kind: string; amount: number | null; msg: string; created_at: string };
export type Proposal = {
  id: string; ref: string; status: string; created_at: string; work: Work;
  buyer?: { member_code: string; city: string }; events: PEvent[]; current: number; last: PEvent;
};
export type Signature = { party: string; name: string; signed_at: string; method: string };
export type OrderContract = { id: string; ref: string; sha256: string; signatures: Signature[] };
export type Order = {
  id: string; ref: string; amount: number; via: string; stage: number; created_at: string; delivered_at: string | null; work: Work;
  contract?: OrderContract | null;
  buyer?: { member_code: string; city: string; full_name?: string };
};

const one = (x: any) => (Array.isArray(x) ? x[0] : x);
function normProposal(p: any): Proposal {
  const events: PEvent[] = (p.events || []).slice().sort((a: PEvent, b: PEvent) => a.id - b.id);
  const withAmount = [...events].reverse().find((e) => e.amount != null);
  const work = one(p.work); if (work) work.artist = one(work.artist);
  return { ...p, work, buyer: one(p.buyer), events, current: withAmount?.amount ?? 0, last: events[events.length - 1] };
}

export async function worksByArtist(artistId: string): Promise<Work[]> {
  const sb = await createClient();
  const { data } = await sb.from("works").select(WORK_COLS).eq("artist_id", artistId).order("created_at", { ascending: false });
  return (data as any) || [];
}
export async function workBySlug(slug: string): Promise<Work | null> {
  const sb = await createClient();
  const { data } = await sb.from("works").select(`${WORK_COLS},${ARTIST}`).eq("slug", slug).maybeSingle();
  if (!data) return null;
  const w: any = data; w.artist = one(w.artist); return w;
}
export async function catalogue(): Promise<Work[]> {
  const sb = await createClient();
  const { data } = await sb.from("works").select(`${WORK_COLS},${ARTIST}`).in("status", ["published", "reserved"]).order("created_at", { ascending: false });
  return ((data as any) || []).map((w: any) => ({ ...w, artist: one(w.artist) }));
}
export async function artists() {
  const sb = await createClient();
  const { data } = await sb.from("profiles").select("id,display_name").eq("role", "artist").order("display_name");
  return data || [];
}

const P_SEL = (extraWork = "") =>
  `id,ref,status,created_at,work:works!inner(${WORK_COLS}${extraWork}),buyer:profiles!proposals_buyer_id_fkey(member_code,city),events:proposal_events(id,actor,kind,amount,msg,created_at)`;

export async function proposalsForArtist(artistId: string): Promise<Proposal[]> {
  const sb = await createClient();
  const { data } = await sb.from("proposals").select(P_SEL()).eq("work.artist_id", artistId).order("created_at", { ascending: false });
  return ((data as any) || []).map(normProposal);
}
export async function proposalsForBuyer(buyerId: string): Promise<Proposal[]> {
  const sb = await createClient();
  const { data } = await sb.from("proposals").select(P_SEL(`,${ARTIST}`)).eq("buyer_id", buyerId).order("created_at", { ascending: false });
  return ((data as any) || []).map(normProposal);
}

const O_SEL = (extraWork = "") =>
  `id,ref,amount,via,stage,created_at,delivered_at,work:works!inner(${WORK_COLS}${extraWork}),buyer:profiles!orders_buyer_id_fkey(member_code,city,private:profile_private(full_name)),contract:contracts(id,ref,sha256,signatures:contract_signatures(party,name,signed_at,method))`;
function normOrder(o: any): Order {
  const work = one(o.work); if (work) work.artist = one(work.artist);
  const b = one(o.buyer);
  return { ...o, work, contract: one(o.contract) || null, buyer: b ? { member_code: b.member_code, city: b.city, full_name: one(b.private)?.full_name } : undefined };
}
export async function ordersForArtist(artistId: string): Promise<Order[]> {
  const sb = await createClient();
  const { data } = await sb.from("orders").select(O_SEL()).eq("work.artist_id", artistId).order("created_at", { ascending: false });
  return ((data as any) || []).map(normOrder);
}
export async function ordersForBuyer(buyerId: string): Promise<Order[]> {
  const sb = await createClient();
  const { data } = await sb.from("orders").select(O_SEL(`,${ARTIST}`)).eq("buyer_id", buyerId).order("created_at", { ascending: false });
  return ((data as any) || []).map(normOrder);
}
export async function favoriteIds(buyerId: string): Promise<string[]> {
  const sb = await createClient();
  const { data } = await sb.from("favorites").select("work_id").eq("buyer_id", buyerId);
  return (data || []).map((f: any) => f.work_id);
}

/* LP (visitante): vitrine sem preço e números da rede */
export async function vitrine(limit = 6) {
  const sb = await createClient();
  const { data } = await sb.rpc("vitrine", { p_limit: limit });
  return (data as any[]) || [];
}
export async function networkStats(): Promise<{ artists: number; buyers: number; published: number }> {
  const sb = await createClient();
  const { data } = await sb.rpc("network_stats");
  return (data as any) || { artists: 0, buyers: 0, published: 0 };
}
