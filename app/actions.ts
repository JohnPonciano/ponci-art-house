"use server";
import { revalidatePath } from "next/cache";
import { createClient, getMe } from "@/lib/supabase/server";
import { slugify } from "@/lib/format";
import { reqMeta } from "@/lib/reqmeta";

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
export async function reserveWork(workId: string) {
  const m = await reqMeta();
  return rpc("reserve_work", { p_work: workId, p_ip: m.ip, p_ua: m.ua });
}
export const shipOrder = async (orderId: string, carrier: string, tracking: string) => rpc("ship_order", { p_order: orderId, p_carrier: carrier, p_tracking: tracking });
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
export async function respondProposal(id: string, kind: string, amount?: number, msg?: string) {
  const m = await reqMeta();
  return rpc("respond_proposal", { p_proposal: id, p_kind: kind, p_amount: amount ?? null, p_msg: msg || "", p_ip: m.ip, p_ua: m.ua });
}

/* ---------- Artista ---------- */
export const updatePrice = async (workId: string, price: number) => rpc("update_work_price", { p_work: workId, p_price: Math.round(price) });
export const withdrawWork = async (workId: string) => rpc("withdraw_work", { p_work: workId });
export const approveWorkDemo = async (workId: string) => rpc("demo_approve_work", { p_work: workId });

export async function createWork(v: {
  title: string; year: number; cat: string; medium: string; h: number; w: number; edition?: string; price: number;
  description: string; gen: any; image_path?: string | null; img_w?: number | null; img_h?: number | null; reproduction?: boolean;
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
      ...(v.reproduction ? { reproduction: true } : {}),
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

export async function updateWorkReview(workId: string, v: {
  title: string; year: number; medium: string; h: number; w: number; edition: string; price: number; description: string; reproduction: boolean;
}): Promise<Result> {
  if (!v.title.trim() || !v.medium.trim()) return { ok: false, error: "Preencha título e técnica." };
  if (!(v.price >= 500)) return { ok: false, error: "Preço mínimo de R$ 500." };
  if (v.description.trim().length < 40) return { ok: false, error: "A descrição precisa de pelo menos 40 caracteres." };
  return rpc("update_work_review", { p_work: workId, p: { ...v, h: Math.round(v.h), w: Math.round(v.w), price: Math.round(v.price) } });
}
export const setWorkReproduction = async (workId: string, on: boolean) => rpc("set_work_reproduction", { p_work: workId, p_on: on });

export async function setAcceptsOffers(on: boolean): Promise<Result> {
  const me = await getMe(); if (!me || me.role !== "artist") return { ok: false, error: "Somente artistas." };
  const { error } = await (await createClient()).from("profiles").update({ accepts_offers: on }).eq("id", me.id);
  return error ? fail(error) : done();
}

/* ---------- Responsabilidade: aceites, cadastro, contratos, solicitações ---------- */
export async function acceptDocuments(ids: string[]): Promise<Result<number>> {
  const m = await reqMeta();
  return rpc("accept_documents", { p_docs: ids, p_ip: m.ip, p_ua: m.ua });
}
export async function saveKyc(v: Record<string, unknown>): Promise<Result> {
  return rpc("save_kyc", { p: v });
}
export async function signContract(contractId: string): Promise<Result> {
  const m = await reqMeta();
  return rpc("sign_contract", { p_contract: contractId, p_ip: m.ip, p_ua: m.ua });
}
export async function createRequest(kind: string, details: string, orderId?: string): Promise<Result<string>> {
  return rpc("create_request", { p_kind: kind, p_details: details, p_order: orderId ?? null });
}

/* ---------- Convites de membros (até 3) ---------- */
export async function createMemberInvite(role: "artist" | "buyer", name: string): Promise<Result<string>> {
  return rpc("member_create_invite", { p_role: role, p_name: name }) as any;
}
export async function cancelMemberInvite(code: string): Promise<Result> {
  return rpc("member_cancel_invite", { p_code: code });
}

/* ---------- Perfil público: nome, @, foto, bio ---------- */
export type ProfileSettingsInput = { display_name: string; handle: string; bio: string; city: string; practice: string; full_name: string; avatar_path?: string | null };
export async function updateProfileSettings(v: ProfileSettingsInput): Promise<Result> {
  const me = await getMe(); if (!me) return { ok: false, error: "Entre novamente." };
  const handle = v.handle.trim().replace(/^@/, "").toLowerCase();
  if (!/^[a-z0-9._]{3,30}$/.test(handle)) return { ok: false, error: "O @ precisa ter de 3 a 30 caracteres: letras minúsculas, números, ponto ou _." };
  const name = v.display_name.trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 60) return { ok: false, error: "O nome precisa ter entre 2 e 60 caracteres." };
  if (v.avatar_path && !v.avatar_path.startsWith(me.id + "/avatar/")) return { ok: false, error: "Foto inválida." };
  const sb = await createClient();
  const pub: Record<string, unknown> = { display_name: name, handle, bio: v.bio.trim().slice(0, 600), city: v.city.trim().slice(0, 80), practice: v.practice.trim().slice(0, 80) };
  if (v.avatar_path !== undefined) pub.avatar_path = v.avatar_path;
  const a = await sb.from("profiles").update(pub).eq("id", me.id);
  if (a.error) return a.error.code === "23505" ? { ok: false, error: `O @${handle} já está em uso. Tente outro.` } : fail(a.error);
  if (v.full_name.trim().length >= 2) {
    const b = await sb.from("profile_private").update({ full_name: v.full_name.trim() }).eq("id", me.id);
    if (b.error) return fail(b.error);
  }
  return done();
}
