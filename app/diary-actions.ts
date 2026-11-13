"use server";
import { revalidatePath } from "next/cache";
import { createClient, getMe } from "@/lib/supabase/server";
import { feed, myLikes, type Post, type Topic } from "@/lib/diary";
import type { Result } from "@/app/actions";

const done = <T,>(data?: T): Result<T> => { revalidatePath("/", "layout"); return { ok: true, data }; };
const fail = (e: any): Result<any> => ({ ok: false, error: e?.message || "Algo deu errado." });

const TOPIC_OK = ["geral", "processo", "exposicoes", "colecao", "mercado"];
export async function createPost(body: string, media: { path: string; w: number; h: number }[], workId?: string | null, topic = "geral", title = ""): Promise<Result<string>> {
  const me = await getMe();
  if (!me) return { ok: false, error: "Entre novamente." };
  if (me.status !== "active") return { ok: false, error: "Sua conta ainda não está ativa." };
  const text = body.trim();
  if (!text && !media.length) return { ok: false, error: "Escreva algo ou adicione uma imagem." };
  if (media.length > 6) return { ok: false, error: "Até 6 imagens por publicação." };
  if (media.some((m) => !m.path.startsWith(me.id + "/diario/"))) return { ok: false, error: "Imagem inválida." };
  if (!TOPIC_OK.includes(topic)) topic = "geral";
  const sb = await createClient();
  const { data, error } = await sb.from("posts").insert({ artist_id: me.id, body: text.slice(0, 2200), title: title.trim().slice(0, 90), work_id: me.role === "artist" ? workId || null : null, topic }).select("id").single();
  if (error) return fail(error);
  if (media.length) {
    const r = await sb.from("post_media").insert(media.map((m, i) => ({ post_id: data.id, position: i, path: m.path, w: Math.round(m.w), h: Math.round(m.h) })));
    if (r.error) { await sb.from("posts").delete().eq("id", data.id); return fail(r.error); }
  }
  return done(data.id);
}
export async function toggleLike(postId: string, on: boolean): Promise<Result> {
  const me = await getMe(); if (!me) return { ok: false, error: "Entre novamente." };
  const sb = await createClient();
  const { error } = on ? await sb.from("post_likes").insert({ member_id: me.id, post_id: postId }) : await sb.from("post_likes").delete().eq("member_id", me.id).eq("post_id", postId);
  return error && error.code !== "23505" ? fail(error) : done();
}
export async function addComment(postId: string, body: string, parentId?: string | null): Promise<Result<string>> {
  const me = await getMe(); if (!me) return { ok: false, error: "Entre novamente." };
  const text = body.trim(); if (!text) return { ok: false, error: "Escreva o comentário." };
  const sb = await createClient();
  const { data, error } = await sb.from("post_comments").insert({ post_id: postId, author_id: me.id, body: text.slice(0, 1000), parent_id: parentId || null }).select("id").single();
  return error ? fail(error) : done(data.id);
}
export async function deleteComment(id: string): Promise<Result> {
  const sb = await createClient();
  const { error, count } = await sb.from("post_comments").delete({ count: "exact" }).eq("id", id);
  if (error) return fail(error);
  return count ? done() : { ok: false, error: "Você não pode apagar este comentário." };
}
export async function moderateComment(id: string, remove: boolean, reason: string): Promise<Result> {
  const sb = await createClient();
  const { error } = await sb.rpc("admin_moderate_comment", { p_comment: id, p_remove: remove, p_reason: reason });
  return error ? fail(error) : done();
}
export async function markCommunitySeen(): Promise<Result> {
  const sb = await createClient();
  const { error } = await sb.rpc("mark_community_seen");
  return error ? fail(error) : done();
}
export async function setShowName(on: boolean): Promise<Result> {
  const me = await getMe(); if (!me) return { ok: false, error: "Entre novamente." };
  const { error } = await (await createClient()).from("profiles").update({ show_name: on }).eq("id", me.id);
  return error ? fail(error) : done();
}
export async function deletePost(id: string): Promise<Result> {
  const sb = await createClient();
  const { error } = await sb.from("posts").delete().eq("id", id);
  return error ? fail(error) : done();
}
export async function toggleSave(postId: string, on: boolean): Promise<Result> {
  const me = await getMe(); if (!me) return { ok: false, error: "Entre novamente." };
  const sb = await createClient();
  const { error } = on ? await sb.from("post_saves").insert({ member_id: me.id, post_id: postId }) : await sb.from("post_saves").delete().eq("member_id", me.id).eq("post_id", postId);
  return error && error.code !== "23505" ? fail(error) : done();
}
export async function toggleFollow(artistId: string, on: boolean): Promise<Result> {
  const me = await getMe(); if (!me) return { ok: false, error: "Entre novamente." };
  const sb = await createClient();
  const { error } = on ? await sb.from("follows").insert({ member_id: me.id, artist_id: artistId }) : await sb.from("follows").delete().eq("member_id", me.id).eq("artist_id", artistId);
  return error && error.code !== "23505" ? fail(error) : done();
}
export async function registerInterest(postId: string): Promise<Result<string | null>> {
  const sb = await createClient();
  const { data, error } = await sb.rpc("register_interest", { p_post: postId });
  if (error) return fail(error);
  let slug: string | null = null;
  if (data) slug = (await sb.from("works").select("slug,status").eq("id", data).maybeSingle()).data?.slug ?? null;
  return done(slug);
}
export async function reportPost(postId: string, reason: string): Promise<Result> {
  const me = await getMe(); if (!me) return { ok: false, error: "Entre novamente." };
  const sb = await createClient();
  const { error } = await sb.from("post_reports").insert({ post_id: postId, reporter_id: me.id, reason: reason.trim().slice(0, 1000) });
  return error ? (error.code === "23505" ? { ok: false, error: "Você já denunciou esta publicação." } : fail(error)) : done();
}
export async function markInterestsSeen(): Promise<Result> {
  const sb = await createClient();
  const { error } = await sb.rpc("mark_interests_seen");
  return error ? fail(error) : done();
}
export async function moderatePost(postId: string, remove: boolean, reason: string): Promise<Result> {
  const sb = await createClient();
  const { error } = await sb.rpc("admin_moderate_post", { p_post: postId, p_remove: remove, p_reason: reason });
  return error ? fail(error) : done();
}

/** Próxima página do feed da comunidade (rolagem infinita). */
export async function loadNotes(mode: "tudo" | "seguindo", topic: Topic | null, before?: string): Promise<Result<{ posts: Post[]; more: boolean; liked: string[] }>> {
  const me = await getMe(); if (!me) return { ok: false, error: "Entre novamente." };
  const [f, likes] = await Promise.all([feed(me.id, mode, topic, before, undefined, 20), myLikes(me.id)]);
  return { ok: true, data: { posts: f.posts, more: f.more, liked: f.posts.filter((p) => likes.has(p.id)).map((p) => p.id) } };
}
