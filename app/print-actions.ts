"use server";
import { revalidatePath } from "next/cache";
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

/** Prévia de preço para o artista (não grava nada). */
export const printQuote = async (product: string, size: string, signed: boolean, feeCents: number) =>
  rpc("print_quote", { p_product: product, p_size: size, p_signed: signed, p_fee_cents: Math.round(feeCents) }, false);

export const savePrintOffer = async (v: {
  work: string; edition: "open" | "limited"; max: number | null; signed: boolean; numbered: boolean;
  sizes: { product: string; size: string; fee_cents: number }[]; master: { path: string; w: number; h: number } | null;
}) => rpc("save_print_offer", {
  p_work: v.work, p_edition: v.edition, p_edition_max: v.edition === "limited" ? v.max : null, p_signed: v.signed, p_numbered: v.edition === "limited" && v.numbered,
  p_sizes: v.sizes.map((s) => ({ ...s, fee_cents: Math.round(s.fee_cents) })), p_master_path: v.master?.path ?? null, p_master_w: v.master?.w ?? null, p_master_h: v.master?.h ?? null,
});

/** Texto da autorização para as condições salvas, com o hash que o artista vai aceitar. */
export const printAuthorizationPreview = async (offer: string) => rpc("print_authorization_preview", { p_offer: offer }, false);

export async function publishPrintOffer(offer: string, sha256: string) {
  const m = await reqMeta();
  return rpc("publish_print_offer", { p_offer: offer, p_sha256: sha256, p_ip: m.ip, p_ua: m.ua });
}
export const pausePrintOffer = async (offer: string) => rpc("pause_print_offer", { p_offer: offer });

/* ---------- admin ---------- */
export const adminSupplierSave = async (v: { id?: string | null; name: string; city: string; contact: string; notes: string; active: boolean }) =>
  rpc("admin_print_supplier_save", { p_id: v.id || null, p_name: v.name, p_city: v.city, p_contact: v.contact, p_notes: v.notes, p_active: v.active });
export const adminProductSave = async (v: { id?: string | null; name: string; paper: string; finish: string; description: string; min_dpi: number; active: boolean }) =>
  rpc("admin_print_product_save", { p_id: v.id || null, p_name: v.name, p_paper: v.paper, p_finish: v.finish, p_description: v.description, p_min_dpi: v.min_dpi, p_active: v.active });
export const adminSizeSave = async (v: { id?: string | null; label: string; w: number; h: number; active: boolean }) =>
  rpc("admin_print_size_save", { p_id: v.id || null, p_label: v.label, p_w: v.w, p_h: v.h, p_active: v.active });
export const adminCostAdd = async (v: { supplier: string; product: string; size: string; print: number; prep: number; packaging: number; shipping: number; signed: number; from: string | null; note: string }) =>
  rpc("admin_print_cost_add", { p_supplier: v.supplier, p_product: v.product, p_size: v.size, p_print: v.print, p_prep: v.prep, p_packaging: v.packaging, p_shipping: v.shipping, p_signed_extra: v.signed, p_valid_from: v.from || null, p_note: v.note });
export const adminCostEnd = async (id: string) => rpc("admin_print_cost_end", { p_cost: id });
export const adminPauseOffer = async (id: string, reason: string) => rpc("admin_pause_print_offer", { p_offer: id, p_reason: reason });
export const adminReleaseOffer = async (id: string) => rpc("admin_release_print_offer", { p_offer: id });
