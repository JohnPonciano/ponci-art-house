"use server";
import { revalidatePath } from "next/cache";
import { createClient, getMe } from "@/lib/supabase/server";
import { slugify } from "@/lib/format";

export type Result<T = unknown> = { ok: boolean; data?: T; error?: string };
const fail = (e: any): Result => ({ ok: false, error: e?.message || "Algo deu errado. Tente de novo." });
const done = <T,>(data?: T): Result<T> => { revalidatePath("/", "layout"); return { ok: true, data }; };

async function rpc(fn: string, args: Record<string, unknown>): Promise<Result<any>> {
  const sb = await createClient();
  const { data, error } = await sb.rpc(fn, args);
  return error ? fail(error) : done(data);
}

/* ---------- LP ---------- */
export async function requestAccess(v: Record<string, string>): Promise<Result<{ ref: string }>> {
  const role = v.role === "buyer" ? "buyer" : "artist";
  const name = (v.name || "").trim(), email = (v.email || "").trim();
  if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { ok: false, error: "Verifique nome e e-mail." };
  const sb = await createClient();
  // sem .select(): visitantes podem inserir mas não ler a tabela
  const ref = "PNC-ACS-" + (1000 + Math.floor(Math.random() * 9000));
  const { error } = await sb.from("access_requests").insert({
    role, name, email, ref, city: (v.city || "").trim(), link: (v.link || "").trim(), practice: (v.practice || "").trim(), msg: (v.msg || "").trim().slice(0, 4000),
  });
  return error ? (fail(error) as any) : { ok: true, data: { ref } };
}

/* ---------- Colecionador ---------- */
export const makeProposal = async (workId: string, amount: number, msg: string) =>
  rpc("make_proposal", { p_work: workId, p_amount: Math.round(amount), p_msg: msg || "" });
export const reserveWork = async (workId: string) => rpc("reserve_work", { p_work: workId });
export const advanceOrder = async (orderId: string) => rpc("advance_order", { p_order: orderId });
export async function toggleFavorite(workId: string, on: boolean): Promise<Result> {
  const me = await getMe(); if (!me) return { ok: false, error: "Entre novamente." };
  const sb = await createClient();
  const { error } = on
    ? await sb.from("favorites").insert({ buyer_id: me.id, work_id: workId })
    : await sb.from("favorites").delete().eq("buyer_id", me.id).eq("work_id", workId);
  return error && error.code !== "23505" ? fail(error) : done();
}

/* ---------- Propostas (ambos os lados) ---------- */
export const respondProposal = async (id: string, kind: string, amount?: number, msg?: string) =>
  rpc("respond_proposal", { p_proposal: id, p_kind: kind, p_amount: amount ?? null, p_msg: msg || "" });

/* ---------- Artista ---------- */
export const updatePrice = async (workId: string, price: number) => rpc("update_work_price", { p_work: workId, p_price: Math.round(price) });
export const withdrawWork = async (workId: string) => rpc("withdraw_work", { p_work: workId });
export const approveWorkDemo = async (workId: string) => rpc("demo_approve_work", { p_work: workId });

export async function createWork(v: {
  title: string; year: number; cat: string; medium: string; h: number; w: number; edition?: string; price: number;
  description: string; gen: any; image_path?: string | null; img_w?: number | null; img_h?: number | null;
}): Promise<Result<{ slug: string }>> {
  const me = await getMe();
  if (!me || me.role !== "artist") return { ok: false, error: "Somente artistas cadastram obras." };
  if (v.image_path && !v.image_path.startsWith(me.id + "/")) return { ok: false, error: "Imagem inválida." };
  const sb = await createClient();
  const base = slugify(v.title);
  for (let i = 0; i < 5; i++) {
    const slug = i === 0 ? base : `${base}-${Math.floor(Math.random() * 900 + 100)}`;
    const { error } = await sb.from("works").insert({
      slug, artist_id: me.id, title: v.title.trim(), year: v.year, cat: v.cat, medium: v.medium.trim(), h: Math.round(v.h), w: Math.round(v.w),
      edition: v.edition?.trim() || null, price: Math.round(v.price), status: "review",
      description: v.description.trim().split(/\n+/).map((s) => s.trim()).filter(Boolean),
      gen: v.gen || {}, image_path: v.image_path || null, img_w: v.img_w || null, img_h: v.img_h || null,
    });
    if (!error) return done({ slug }) as any;
    if (error.code !== "23505") return fail(error) as any;
  }
  return { ok: false, error: "Não foi possível gerar um endereço para a obra." };
}

export async function updateProfile(v: { display_name?: string; city: string; practice: string; bio: string; full_name: string }): Promise<Result> {
  const me = await getMe(); if (!me) return { ok: false, error: "Entre novamente." };
  const sb = await createClient();
  const pub: any = { city: v.city.trim(), practice: v.practice.trim(), bio: v.bio.trim() };
  const a = await sb.from("profiles").update(pub).eq("id", me.id);
  if (a.error) return fail(a.error);
  const b = await sb.from("profile_private").update({ full_name: v.full_name.trim() }).eq("id", me.id);
  return b.error ? fail(b.error) : done();
}
