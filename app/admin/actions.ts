"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Result } from "@/app/actions";

async function rpc(fn: string, args: Record<string, unknown>): Promise<Result<any>> {
  const sb = await createClient();
  const { data, error } = await sb.rpc(fn, args);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true, data };
}
export const approveRequest = async (id: string) => rpc("admin_approve_request", { p_request: id });
export const rejectRequest = async (id: string) => rpc("admin_reject_request", { p_request: id });
export const setMemberStatus = async (id: string, status: "pending" | "active" | "suspended") => rpc("admin_set_member_status", { p_member: id, p_status: status });
export const reviewWork = async (id: string, approve: boolean) => rpc("admin_review_work", { p_work: id, p_approve: approve });
export const createInvite = async (role: "artist" | "buyer", uses: number, note: string, auto: boolean) =>
  rpc("admin_create_invite", { p_role: role, p_uses: Math.round(uses), p_note: note, p_auto: auto });
export const revokeInvite = async (code: string) => rpc("admin_revoke_invite", { p_code: code });
