"use server";
import { revalidatePath } from "next/cache";
import { createClient, getMe } from "@/lib/supabase/server";
import type { Result } from "@/app/actions";

const done = <T,>(data?: T): Result<T> => { revalidatePath("/", "layout"); return { ok: true, data }; };
const fail = (e: any): Result<any> => ({ ok: false, error: e?.message || "Algo deu errado." });

export async function createPost(body: string, media: { path: string; w: number; h: number }[], workId?: string | null): Promise<Result<string>> {
  const me = await getMe();
  if (!me || me.role !== "artist") return { ok: false, error: "Somente artistas publicam no diário." };
  const text = body.trim();
  if (!text && !media.length) return { ok: false, error: "Escreva algo ou adicione uma imagem." };
  if (media.length > 6) return { ok: false, error: "Até 6 imagens por publicação." };
  if (media.some((m) => !m.path.startsWith(me.id + "/diario/"))) return { ok: false, error: "Imagem inválida." };
  const sb = await createClient();
  const { data, error } = await sb.from("posts").insert({ artist_id: me.id, body: text.slice(0, 2200), work_id: workId || null }).select("id").single();
  if (error) return fail(error);
  if (media.length) {
    const r = await sb.from("post_media").insert(media.map((m, i) => ({ post_id: data.id, position: i, path: m.path, w: Math.round(m.w), h: Math.round(m.h) })));
    if (r.error) { await sb.from("posts").delete().eq("id", data.id); return fail(r.error); }
  }
  return done(data.id);
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
