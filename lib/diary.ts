import "server-only";
import { createClient } from "@/lib/supabase/server";

import { type Topic, type Person, type PostMedia, type Comment, type Post } from "@/lib/community";
export * from "@/lib/community";
const PERSON = "id,role,display_name,city,practice,member_code,show_name";
export const SEL = `id,kind,topic,body,created_at,removed_at,removed_reason,author:profiles!posts_artist_id_fkey(${PERSON}),media:post_media(id,position,path,gen,w,h),work:works(id,slug,title,year,price,status,h,w,gen,image_path,img_w,img_h,medium,no),likes:post_likes(count),comments:post_comments(count)`;
const one = (x: any) => (Array.isArray(x) ? x[0] : x);
const cnt = (x: any) => (Array.isArray(x) ? x[0]?.count ?? 0 : x?.count ?? 0);
export const norm = (p: any): Post => ({ ...p, author: one(p.author), work: one(p.work) || null, likes: cnt(p.likes), comments: cnt(p.comments),
  media: (p.media || []).slice().sort((a: PostMedia, b: PostMedia) => a.position - b.position) });
export const PAGE = 12;

export type FeedMode = "tudo" | "seguindo" | "salvos";
/** Feed cronológico (sem algoritmo), filtrável por espaço. */
export async function feed(meId: string, mode: FeedMode, topic?: Topic | null, before?: string) {
  const sb = await createClient();
  let q = sb.from("posts").select(SEL).is("removed_at", null).order("created_at", { ascending: false }).limit(PAGE + 1);
  if (before) q = q.lt("created_at", before);
  if (topic) q = q.eq("topic", topic);
  if (mode === "seguindo") {
    const ids = (await sb.from("follows").select("artist_id").eq("member_id", meId)).data?.map((f: any) => f.artist_id) || [];
    q = q.in("artist_id", [...ids, meId]);
  }
  if (mode === "salvos") {
    const ids = (await sb.from("post_saves").select("post_id").eq("member_id", meId)).data?.map((s: any) => s.post_id) || [];
    if (!ids.length) return { posts: [] as Post[], more: false };
    q = q.in("id", ids);
  }
  const rows = (((await q).data as any[]) || []).map(norm);
  return { posts: rows.slice(0, PAGE), more: rows.length > PAGE };
}
export async function postById(id: string) {
  const sb = await createClient();
  const { data } = await sb.from("posts").select(SEL).eq("id", id).maybeSingle();
  return data ? norm(data) : null;
}
export async function postsByAuthor(authorId: string, includeRemoved = false) {
  const sb = await createClient();
  let q = sb.from("posts").select(SEL).eq("artist_id", authorId).order("created_at", { ascending: false }).limit(60);
  if (!includeRemoved) q = q.is("removed_at", null);
  return (((await q).data as any[]) || []).map(norm);
}
export const postsByArtist = postsByAuthor;

/** Comentários de várias publicações de uma vez (para o feed) ou de uma (página da publicação). */
export async function commentsFor(postIds: string[]): Promise<Record<string, Comment[]>> {
  if (!postIds.length) return {};
  const sb = await createClient();
  const { data } = await sb.from("post_comments").select(`id,post_id,parent_id,body,created_at,removed_at,author:profiles!post_comments_author_id_fkey(${PERSON})`)
    .in("post_id", postIds).is("removed_at", null).order("created_at", { ascending: true }).limit(500);
  const out: Record<string, Comment[]> = {};
  for (const c of (data as any[]) || []) (out[c.post_id] ||= []).push({ ...c, author: one(c.author) });
  return out;
}
const ids = async (table: string, col: string, meCol: string, meId: string) => {
  const sb = await createClient();
  return new Set(((await sb.from(table).select(col).eq(meCol, meId)).data || []).map((r: any) => r[col]));
};
export const mySaves = (meId: string) => ids("post_saves", "post_id", "member_id", meId);
export const myLikes = (meId: string) => ids("post_likes", "post_id", "member_id", meId);
export const myFollows = (meId: string) => ids("follows", "artist_id", "member_id", meId);
export const myInterests = (meId: string) => ids("post_interests", "post_id", "buyer_id", meId);

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
export type Activity = { kind: "comment" | "reply" | "like"; created_at: string; post_id: string; body: string; fresh: boolean; role: string; member_code: string; city: string; name: string | null };
export async function activity(): Promise<{ unseen: number; items: Activity[] }> {
  const sb = await createClient();
  const { data } = await sb.rpc("community_activity");
  return (data as any) || { unseen: 0, items: [] };
}
