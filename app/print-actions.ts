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

/* ---------- pedidos de print ---------- */
import { getMe } from "@/lib/supabase/server";
import { sendMail } from "@/lib/email";
import { brlCents } from "@/lib/format";

async function site() { const { headers } = await import("next/headers"); const h = await headers(); return `https://${h.get("x-forwarded-host") || h.get("host") || "ponci.art"}`; }
/** E-mail de aviso: nunca bloqueia o fluxo (se falhar, o pedido segue igual). */
async function notify(to: string | undefined, subject: string, lines: string[]) {
  if (!to) return;
  const text = lines.join("\n\n");
  const html = `<div style="font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.55;color:#121211;max-width:560px">${lines.map((l) => `<p>${l.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!)}</p>`).join("")}<p style="color:#5D5B56">PONCI · ponci.art</p></div>`;
  try { await sendMail({ to, subject, text, html }); } catch { /* aviso é opcional */ }
}

export async function buyPrint(offer: string, product: string, size: string): Promise<Result<{ ref: string }>> {
  const r = await rpc("buy_print", { p_offer: offer, p_product: product, p_size: size });
  if (!r.ok) return r;
  const me = await getMe();
  await notify(me?.email, `Pedido ${r.data} recebido`, [
    `Olá, ${me?.full_name?.split(" ")[0] || ""}! Recebemos o seu pedido de print ${r.data}.`,
    "Em até 1 dia útil a PONCI envia, por este e-mail, as instruções de pagamento. O seu exemplar fica guardado por 48 horas.",
    `Acompanhe em ${await site()}/colecionador/aquisicoes`]);
  return { ok: true, data: { ref: r.data as string } };
}
export const cancelPrintOrder = async (id: string) => rpc("cancel_print_order", { p_order: id });
export const confirmPrintReceived = async (id: string) => rpc("confirm_print_received", { p_order: id });
export const artistShipPrint = async (id: string, carrier: string, tracking: string) => rpc("artist_ship_print", { p_order: id, p_carrier: carrier, p_tracking: tracking });

async function orderForMail(id: string) {
  const sb = await createClient();
  const { data } = await sb.from("print_orders").select("ref,product_name,size_label,price_cents,artist_fee_cents,edition,edition_no,edition_max,signed,carrier,tracking_code,work:works(title),artist:profiles!print_orders_artist_id_fkey(private:profile_private(email,full_name)),buyer:profiles!print_orders_buyer_id_fkey(private:profile_private(email,full_name))").eq("id", id).maybeSingle();
  const one = (x: any) => (Array.isArray(x) ? x[0] : x) ?? null;
  if (!data) return null;
  const d: any = data;
  return { ...d, title: one(d.work)?.title || "", artist: one(one(d.artist)?.private) || {}, buyer: one(one(d.buyer)?.private) || {} };
}

export async function adminConfirmPrintPayment(id: string) {
  const r = await rpc("admin_confirm_print_payment", { p_order: id });
  if (!r.ok) return r;
  const o = await orderForMail(id);
  if (o) {
    const no = o.edition === "limited" && o.edition_no ? ` Seu exemplar é o ${o.edition_no}/${o.edition_max}.` : "";
    await notify(o.buyer.email, `Pagamento confirmado · ${o.ref}`, [`Pagamento do pedido ${o.ref} confirmado.${no}`,
      `O print de “${o.title}” (${o.product_name}, ${o.size_label}) entrou em produção. ${o.signed ? "Depois de impresso, vai para a artista assinar e ela mesma despacha pra você." : "A gráfica despacha direto pra você."} O rastreio aparece em Aquisições.`]);
    await notify(o.artist.email, `Print vendido · ${o.title}`, [`Venda de print confirmada: “${o.title}”, ${o.product_name}, ${o.size_label}${o.edition_no ? `, exemplar ${o.edition_no}/${o.edition_max}` : ""}.`,
      `Você recebe ${brlCents(o.artist_fee_cents)} depois da entrega.`, o.signed ? "A gráfica vai te enviar o exemplar para assinar. Quando ele chegar, assine, numere e despache pela tela Vendas." : "Não precisa fazer nada: a gráfica imprime e envia direto ao comprador."]);
  }
  return r;
}
export async function adminPrintOrderAction(id: string, action: "supplier" | "shipped" | "delivered" | "cancel" | "payout", carrier?: string, tracking?: string, note?: string) {
  const r = await rpc("admin_print_order_action", { p_order: id, p_action: action, p_carrier: carrier ?? null, p_tracking: tracking ?? null, p_note: note ?? null });
  if (r.ok && action === "shipped") {
    const o = await orderForMail(id);
    if (o) await notify(o.buyer.email, `Seu print saiu para entrega · ${o.ref}`, [`O print de “${o.title}” foi despachado.`, `${o.carrier} · rastreio ${o.tracking_code}.`, "Quando chegar, confirme o recebimento em Aquisições."]);
  }
  return r;
}
