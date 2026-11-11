import "server-only";
import { createClient } from "@/lib/supabase/server";

export type PostMedia = { id: string; position: number; path: string | null; gen: any; w: number; h: number };
export type Post = {
  id: string; kind: "post" | "obra_nova"; body: string; created_at: string; removed_at: string | null; removed_reason?: string;
  artist: { id: string; display_name: string; city: string; practice: string; member_code: string };
  media: PostMedia[];
  work: { id: string; slug: string; title: string; year: number; price: number; status: string; h: number; w: number; gen: any; image_path: string | null; img_w: number | null; img_h: number | null; medium: string; no: number } | null;
};
const SEL = "id,kind,body,created_at,removed_at,removed_reason,artist:profiles!posts_artist_id_fkey(id,display_name,city,practice,member_code),media:post_media(id,position,path,gen,w,h),work:works(id,slug,title,year,price,status,h,w,gen,image_path,img_w,img_h,medium,no)";
const one = (x: any) => (Array.isArray(x) ? x[0] : x);
const norm = (p: any): Post => ({ ...p, artist: one(p.artist), work: one(p.work) || null, media: (p.media || []).slice().sort((a: PostMedia, b: PostMedia) => a.position - b.position) });
export const PAGE = 12;

/** Feed cronológico (sem algoritmo). "seguindo" usa os artistas que o membro segue. */
export async function feed(meId: string, mode: "seguindo" | "rede" | "salvos", before?: string) {
  const sb = await createClient();
  let q = sb.from("posts").select(SEL).is("removed_at", null).order("created_at", { ascending: false }).limit(PAGE + 1);
  if (before) q = q.lt("created_at", before);
  if (mode === "seguindo") {
    const ids = (await sb.from("follows").select("artist_id").eq("member_id", meId)).data?.map((f: any) => f.artist_id) || [];
    if (!ids.length) return { posts: [] as Post[], more: false, following: 0 };
    q = q.in("artist_id", ids);
  }
  if (mode === "salvos") {
    const ids = (await sb.from("post_saves").select("post_id").eq("member_id", meId)).data?.map((s: any) => s.post_id) || [];
    if (!ids.length) return { posts: [] as Post[], more: false, following: -1 };
    q = q.in("id", ids);
  }
  const { data } = await q;
  const rows = ((data as any[]) || []).map(norm);
  return { posts: rows.slice(0, PAGE), more: rows.length > PAGE, following: -1 };
}
export async function postsByArtist(artistId: string, includeRemoved = false) {
  const sb = await createClient();
  let q = sb.from("posts").select(SEL).eq("artist_id", artistId).order("created_at", { ascending: false }).limit(60);
  if (!includeRemoved) q = q.is("removed_at", null);
  return (((await q).data as any[]) || []).map(norm);
}
export async function mySaves(meId: string): Promise<Set<string>> {
  const sb = await createClient();
  return new Set(((await sb.from("post_saves").select("post_id").eq("member_id", meId)).data || []).map((s: any) => s.post_id));
}
export async function myFollows(meId: string): Promise<Set<string>> {
  const sb = await createClient();
  return new Set(((await sb.from("follows").select("artist_id").eq("member_id", meId)).data || []).map((f: any) => f.artist_id));
}
export async function myInterests(meId: string): Promise<Set<string>> {
  const sb = await createClient();
  return new Set(((await sb.from("post_interests").select("post_id").eq("buyer_id", meId)).data || []).map((i: any) => i.post_id));
}
export async function artistsDirectory() {
  const sb = await createClient();
  const { data } = await sb.from("profiles").select("id,display_name,city,practice,member_code").eq("role", "artist").eq("status", "active").order("display_name");
  return data || [];
}
export async function artistByCode(code: string) {
  const sb = await createClient();
  const { data } = await sb.from("profiles").select("id,display_name,city,practice,bio,member_code,role").eq("member_code", code).maybeSingle();
  return data && data.role === "artist" ? data : null;
}
/** Interesses recebidos pela artista (o colecionador aparece só pelo código e pela cidade). */
export async function interestsForArtist(artistId: string) {
  const sb = await createClient();
  const { data } = await sb.from("post_interests")
    .select("id,created_at,seen_at,post:posts!inner(id,body,kind,artist_id,work:works(slug,title)),buyer:profiles!post_interests_buyer_id_fkey(member_code,city)")
    .eq("post.artist_id", artistId).order("created_at", { ascending: false }).limit(50);
  return ((data as any[]) || []).map((i) => ({ ...i, post: one(i.post), buyer: one(i.buyer), work: one(one(i.post)?.work) }));
}
export async function diaryStats() {
  const sb = await createClient();
  const { data } = await sb.rpc("diary_stats");
  return (data as any) || { followers: 0, saves: 0, interests: 0, unseen: 0, posts: 0 };
}
