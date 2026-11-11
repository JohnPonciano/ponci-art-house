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
export const reviewWork = async (id: string, approve: boolean) => rpc("admin_review_work", { p_work: id, p_approve: approve });
export const createInvite = async (role: "artist" | "buyer", uses: number, note: string, auto: boolean) =>
  rpc("admin_create_invite", { p_role: role, p_uses: Math.round(uses), p_note: note, p_auto: auto });
export const revokeInvite = async (code: string) => rpc("admin_revoke_invite", { p_code: code });
export const updateRequest = async (id: string, status: string, response: string) => rpc("admin_update_request", { p_id: id, p_status: status, p_response: response });
export const publishDocument = async (slug: string, title: string, summary: string, body: string) =>
  rpc("admin_publish_document", { p_slug: slug, p_title: title, p_summary: summary, p_body: body });
