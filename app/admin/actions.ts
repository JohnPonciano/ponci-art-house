"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Result } from "@/app/actions";
import { headers } from "next/headers";
import { sendInvite } from "@/lib/email";

async function rpc(fn: string, args: Record<string, unknown>): Promise<Result<any>> {
  const sb = await createClient();
  const { data, error } = await sb.rpc(fn, args);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true, data };
}
async function emailInvite(id: string, code: string) {
  const sb = await createClient();
  const { data: r } = await sb.from("access_requests").select("name,email,role").eq("id", id).maybeSingle();
  if (!r) return { ok: false as const, error: "Pedido não encontrado." };
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host");
  const origin = host && !host.startsWith("localhost") ? `https://${host}` : undefined;
  return sendInvite({ name: r.name, email: r.email, code, role: r.role, origin });
}
/** Aprova, gera o código de uso único e envia o convite por e-mail. */
export async function approveRequest(id: string): Promise<Result<{ code: string; emailed: boolean; emailError?: string }>> {
  const res = await rpc("admin_approve_request", { p_request: id });
  if (!res.ok) return res;
  const mail = await emailInvite(id, res.data);
  return { ok: true, data: { code: res.data, emailed: mail.ok, emailError: mail.ok ? undefined : mail.error } };
}
export async function resendInvite(id: string): Promise<Result> {
  const sb = await createClient();
  const { data: r } = await sb.from("access_requests").select("invite_code,status").eq("id", id).maybeSingle();
  if (!r?.invite_code || r.status !== "approved") return { ok: false, error: "Pedido sem convite aprovado." };
  const mail = await emailInvite(id, r.invite_code);
  return mail.ok ? { ok: true } : { ok: false, error: mail.error };
}
export const rejectRequest = async (id: string) => rpc("admin_reject_request", { p_request: id });
export const setMemberStatus = async (id: string, status: "pending" | "active" | "suspended") => rpc("admin_set_member_status", { p_member: id, p_status: status });
export const cancelOrder = async (id: string, reason: string) => rpc("admin_cancel_order", { p_order: id, p_reason: reason });
export const markPayout = async (id: string, note: string) => rpc("admin_mark_payout", { p_order: id, p_note: note });
/* ---------- Instagram ---------- */
const GRAPH = "https://graph.facebook.com/v21.0";
/** Valida o token com a Meta (conta certa e permissão de publicar) e guarda no cofre do Supabase. */
export async function igConnect(token: string): Promise<Result<{ username: string; expires: string | null }>> {
  const t = token.trim();
  if (t.length < 20 || /\s/.test(t)) return { ok: false, error: "Cole o token inteiro, sem espaços." };
  if (t.includes("|")) return { ok: false, error: "Esse é o token do app (ID|chave secreta). Use o token de usuário, que começa com EAA." };
  const sb = await createClient();
  const { data: st } = await sb.from("ig_settings").select("ig_user_id").eq("id", 1).maybeSingle();
  const ig = (st as any)?.ig_user_id || "17841438995605886";
  const h = { Authorization: `Bearer ${t}` };
  try {
    const acc = await (await fetch(`${GRAPH}/${ig}?fields=username`, { headers: h, cache: "no-store" })).json();
    if (!acc?.username) return { ok: false, error: "A Meta não deixou este token ver a conta @ponci.art. Gere o token com instagram_basic e instagram_content_publish, marcando a página e a conta." };
    const dbg = await (await fetch(`${GRAPH}/debug_token?input_token=${encodeURIComponent(t)}`, { headers: h, cache: "no-store" })).json();
    const scopes: string[] = dbg?.data?.scopes || [];
    if (scopes.length && !scopes.includes("instagram_content_publish")) return { ok: false, error: "Falta a permissão instagram_content_publish no token." };
    const exp = dbg?.data?.expires_at ? new Date(dbg.data.expires_at * 1000).toISOString() : null;
    const r = await rpc("admin_ig_set_token", { p_token: t, p_expires_at: exp, p_username: acc.username });
    return r.ok ? { ok: true, data: { username: acc.username, expires: exp } } : r;
  } catch { return { ok: false, error: "Não consegui falar com a Meta agora. Tente de novo em instantes." }; }
}
export const igSave = async (id: string | null, media: string[], caption: string, publishAt: string, label = "", story = false, reel = false, cover = "") =>
  rpc("admin_ig_save", { p_id: id, p_media: media, p_caption: caption, p_publish_at: publishAt, p_label: label, p_story: story, p_reel: reel, p_cover: cover || null });
export const igAction = async (id: string, action: "cancel" | "retry" | "now") => rpc("admin_ig_action", { p_id: id, p_action: action });
export const curateWork = async (id: string, decision: "aprovada" | "ajustes" | "recusada", note: string) =>
  rpc("admin_curate", { p_work: id, p_decision: decision, p_note: note });
export const reviewWork = async (id: string, approve: boolean) => rpc("admin_review_work", { p_work: id, p_approve: approve });
export const createInvite = async (role: "artist" | "buyer", uses: number, note: string, auto: boolean) =>
  rpc("admin_create_invite", { p_role: role, p_uses: Math.round(uses), p_note: note, p_auto: auto });
export const revokeInvite = async (code: string) => rpc("admin_revoke_invite", { p_code: code });
export const updateRequest = async (id: string, status: string, response: string) => rpc("admin_update_request", { p_id: id, p_status: status, p_response: response });
export const publishDocument = async (slug: string, title: string, summary: string, body: string) =>
  rpc("admin_publish_document", { p_slug: slug, p_title: title, p_summary: summary, p_body: body });
