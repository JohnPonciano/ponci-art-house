"use server";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { reqMeta } from "@/lib/reqmeta";
import type { Result } from "@/app/actions";

async function rpc(fn: string, args: Record<string, unknown>, revalidate = true): Promise<Result<any>> {
  const sb = await createClient();
  const { data, error } = await sb.rpc(fn, args);
  if (error) return { ok: false, error: error.message };
  if (revalidate) revalidatePath("/", "layout");
  return { ok: true, data };
}
async function site() { const h = await headers(); return `https://${h.get("x-forwarded-host") || h.get("host") || "ponci.art"}`; }

export const cartAdd = async (kind: "original" | "print", work: string, product?: string, size?: string) =>
  rpc("cart_add", { p_kind: kind, p_work: work, p_product: product ?? null, p_size: size ?? null });
export async function cartRemove(id: string): Promise<Result> {
  const sb = await createClient();
  const { error } = await sb.from("cart_items").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout"); return { ok: true };
}
/** Finaliza a compra: vira um pedido PED- e, com o Mercado Pago conectado, já pede o link de pagamento. */
export async function checkoutCreate(): Promise<Result<{ id: string; ref: string; mp: boolean }>> {
  const m = await reqMeta();
  return rpc("checkout_create", { p_site: await site(), p_ip: m.ip, p_ua: m.ua });
}
export const checkoutStatus = async (id: string) => rpc("checkout_status", { p_checkout: id }, false);
export const checkoutRetry = async (id: string) => rpc("checkout_retry_link", { p_checkout: id, p_site: await site() });
/** Volta do Mercado Pago com o id do pagamento: pede ao banco para conferir já (sem esperar o aviso). */
export const mpCheck = async (paymentId: string) => rpc("mp_notify", { p_payment_id: String(paymentId).replace(/\D/g, "").slice(0, 30) }, false);

/* ---------- admin ---------- */
export async function adminMpConnect(token: string, sandbox: boolean): Promise<Result<{ label: string }>> {
  const t = token.trim();
  if (t.length < 20 || /\s/.test(t)) return { ok: false, error: "Cole o Access Token inteiro, sem espaços." };
  if (!/^(APP_USR|TEST)-/.test(t)) return { ok: false, error: "Esse não parece um Access Token do Mercado Pago (começa com APP_USR- ou TEST-)." };
  try {
    const r = await fetch("https://api.mercadopago.com/users/me", { headers: { Authorization: `Bearer ${t}` }, cache: "no-store" });
    const j: any = await r.json().catch(() => ({}));
    if (!r.ok || !j?.id) return { ok: false, error: "O Mercado Pago não aceitou este token. Confira se copiou o Access Token (não a Public Key)." };
    const label = [j.nickname, j.site_id, sandbox || t.startsWith("TEST-") ? "teste" : "produção"].filter(Boolean).join(" · ");
    const s = await rpc("admin_mp_set_token", { p_token: t, p_label: label, p_sandbox: sandbox || t.startsWith("TEST-") });
    return s.ok ? { ok: true, data: { label } } : s;
  } catch { return { ok: false, error: "Não consegui falar com o Mercado Pago agora. Tente de novo." }; }
}
export const adminCheckoutMarkPaid = async (id: string, note: string) => rpc("admin_checkout_mark_paid", { p_checkout: id, p_note: note });
