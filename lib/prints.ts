import "server-only";
import { createClient } from "@/lib/supabase/server";

/* Prints sob demanda. Todas as leituras toleram a migração ainda não aplicada (devolvem vazio). */
export type PrintProduct = { id: string; name: string; paper: string; finish: string; description: string; min_dpi: number; active: boolean };
export type PrintSize = { id: string; label: string; w_cm: number; h_cm: number; active: boolean };
export type PrintOffer = {
  id: string; work_id: string; status: "draft" | "active" | "paused"; edition: "open" | "limited"; edition_max: number | null;
  signed: boolean; numbered: boolean; master_path: string | null; master_w: number | null; master_h: number | null;
  sold_count: number; paused_reason: string | null; published_at: string | null; updated_at: string;
};
export type PrintOfferSize = { product_id: string; size_id: string; artist_fee_cents: number; price_cents: number | null; breakdown: Record<string, number> | null };
export type PrintOption = {
  offer_id: string; edition: "open" | "limited"; edition_max: number | null; remaining: number | null; signed: boolean; numbered: boolean;
  product_id: string; product_name: string; paper: string; finish: string; size_id: string; label: string; w_cm: number; h_cm: number; price_cents: number;
};

/** Catálogo ativo e se as regras de print estão completas (sem isso, nada publica). */
export async function printCatalog() {
  const sb = await createClient();
  const [p, s, c] = await Promise.all([
    sb.from("print_products").select("*").eq("active", true).order("name"),
    sb.from("print_sizes").select("*").eq("active", true).order("w_cm"),
    sb.rpc("commerce_current"),
  ]);
  const st: any = c.data;
  const rulesReady = !!st && st.print_commission_pct != null && st.payment_fee_pct != null && st.tax_pct != null;
  return { ready: !p.error, products: (p.data as PrintProduct[]) || [], sizes: ((s.data as PrintSize[]) || []).map((z) => ({ ...z, w_cm: Number(z.w_cm), h_cm: Number(z.h_cm) })), rulesReady };
}

/** Oferta de print do artista para a obra (com os tamanhos escolhidos). */
export async function myPrintOffer(workId: string) {
  const sb = await createClient();
  const { data, error } = await sb.from("print_offers").select("*").eq("work_id", workId).maybeSingle();
  if (error || !data) return null;
  const { data: sz } = await sb.from("print_offer_sizes").select("product_id,size_id,artist_fee_cents,price_cents,breakdown").eq("offer_id", data.id);
  return { offer: data as PrintOffer, sizes: (sz as PrintOfferSize[]) || [] };
}

/** O que o comprador vê: opções à venda, com preço final. */
export async function printOptions(workId: string): Promise<PrintOption[]> {
  const sb = await createClient();
  const { data, error } = await sb.rpc("work_print_options", { p_work: workId });
  return error ? [] : ((data as PrintOption[]) || []).map((o) => ({ ...o, w_cm: Number(o.w_cm), h_cm: Number(o.h_cm) }));
}

/* ---------- admin ---------- */
export type PrintSupplier = { id: string; name: string; city: string; contact: string; notes: string; active: boolean };
export type PrintCost = { id: string; supplier_id: string; product_id: string; size_id: string; print_cents: number; prep_cents: number; packaging_cents: number;
  shipping_cents: number; signed_extra_cents: number; valid_from: string; valid_to: string | null; ended_at: string | null; note: string; created_at: string; created_by: string | null };
export type AdminPrintOffer = PrintOffer & { work: { title: string; slug: string; status: string } | null; artist: { display_name: string; member_code: string } | null };

export async function adminPrintData() {
  const sb = await createClient();
  const [su, pr, si, co, of, st] = await Promise.all([
    sb.from("print_suppliers").select("*").order("name"),
    sb.from("print_products").select("*").order("name"),
    sb.from("print_sizes").select("*").order("w_cm"),
    sb.from("print_costs").select("*").is("ended_at", null).order("created_at", { ascending: false }),
    sb.from("print_offers").select("*,work:works(title,slug,status),artist:profiles!print_offers_artist_id_fkey(display_name,member_code)").order("updated_at", { ascending: false }).limit(200),
    sb.rpc("commerce_current"),
  ]);
  const one = (x: any) => (Array.isArray(x) ? x[0] : x) ?? null;
  const s: any = st.data;
  return {
    ready: !su.error,
    rulesReady: !!s && s.print_commission_pct != null && s.payment_fee_pct != null && s.tax_pct != null,
    suppliers: (su.data as PrintSupplier[]) || [],
    products: (pr.data as PrintProduct[]) || [],
    sizes: ((si.data as PrintSize[]) || []).map((z) => ({ ...z, w_cm: Number(z.w_cm), h_cm: Number(z.h_cm) })),
    costs: (co.data as PrintCost[]) || [],
    offers: ((of.data as any[]) || []).map((o) => ({ ...o, work: one(o.work), artist: one(o.artist) })) as AdminPrintOffer[],
  };
}

/* ---------- pedidos de print ---------- */
export type PrintOrderStatus = "awaiting_payment" | "in_production" | "shipped" | "delivered" | "cancelled";
export type PrintOrder = {
  id: string; ref: string; work_id: string; product_name: string; size_label: string; w_cm: number; h_cm: number; price_cents: number; artist_fee_cents: number;
  edition: "open" | "limited"; edition_max: number | null; edition_no: number | null; signed: boolean; numbered: boolean; status: PrintOrderStatus;
  carrier: string | null; tracking_code: string | null; expires_at: string; paid_at: string | null; shipped_at: string | null; delivered_at: string | null;
  cancelled_at: string | null; cancel_reason: string | null; payout_at: string | null; created_at: string; sent_to_supplier_at?: string | null; supplier_ref?: string | null;
  ship_to: Record<string, string> | null; work?: { title: string; slug: string; image_path: string | null; artist?: { display_name: string; member_code: string } | null } | null;
};
const one = (x: any) => (Array.isArray(x) ? x[0] : x) ?? null;

/** Pedidos de print do comprador (os mais recentes primeiro). */
export async function myPrintOrders(meId: string): Promise<PrintOrder[]> {
  const sb = await createClient();
  const { data, error } = await sb.from("print_orders").select("*,work:works(title,slug,image_path,artist:profiles!works_artist_id_fkey(display_name,member_code))")
    .eq("buyer_id", meId).order("created_at", { ascending: false }).limit(100);
  if (error) return [];
  return ((data as any[]) || []).map((o) => ({ ...o, w_cm: Number(o.w_cm), h_cm: Number(o.h_cm), work: o.work ? { ...one(o.work), artist: one(one(o.work)?.artist) } : null }));
}

/** Vendas de print da artista (endereço do comprador só quando ela precisa enviar). */
export async function artistPrintOrders() {
  const sb = await createClient();
  const { data, error } = await sb.rpc("artist_print_orders");
  if (error) return [] as (PrintOrder & { buyer_city: string })[];
  const rows = ((data as any[]) || []);
  const ids = [...new Set(rows.map((r) => r.work_id))];
  const { data: ws } = ids.length ? await sb.from("works").select("id,title,slug,image_path").in("id", ids) : { data: [] as any[] };
  const by = Object.fromEntries(((ws as any[]) || []).map((w) => [w.id, w]));
  return rows.map((r) => ({ ...r, w_cm: Number(r.w_cm), h_cm: Number(r.h_cm), work: by[r.work_id] || null })) as (PrintOrder & { buyer_city: string })[];
}

/** Admin: pedidos de print com obra, artista, comprador e gráfica; link temporário do arquivo-mestre para os pagos. */
export async function adminPrintOrders() {
  const sb = await createClient();
  const { data, error } = await sb.from("print_orders")
    .select("*,work:works(title,slug),artist:profiles!print_orders_artist_id_fkey(display_name,member_code,private:profile_private(email),kyc(legal_name,phone,cep,street,number,complement,district,city,uf)),buyer:profiles!print_orders_buyer_id_fkey(member_code,private:profile_private(full_name,email)),supplier:print_suppliers(name,contact),offer:print_offers(master_path,master_w,master_h)")
    .order("created_at", { ascending: false }).limit(200);
  if (error) return [];
  const rows = ((data as any[]) || []).map((o) => ({
    ...o, w_cm: Number(o.w_cm), h_cm: Number(o.h_cm), work: one(o.work), supplier: one(o.supplier), offer: one(o.offer),
    artist: { ...one(o.artist), email: one(one(o.artist)?.private)?.email || "", address: one(one(o.artist)?.kyc) || null }, buyer: { ...one(o.buyer), name: one(one(o.buyer)?.private)?.full_name || "", email: one(one(o.buyer)?.private)?.email || "" },
  }));
  // link do arquivo para a gráfica (7 dias), só para pedidos pagos e ainda não despachados
  await Promise.all(rows.filter((o) => o.status === "in_production" && o.offer?.master_path).map(async (o) => {
    const { data: u } = await sb.storage.from("print-masters").createSignedUrl(o.offer.master_path, 7 * 24 * 3600, { download: true });
    o.master_url = u?.signedUrl || null;
  }));
  return rows as (PrintOrder & { master_url?: string | null; supplier: { name: string; contact: string } | null; offer: { master_w: number; master_h: number } | null;
    artist: { display_name: string; member_code: string; email: string; address: Record<string, string> | null }; buyer: { member_code: string; name: string; email: string } })[];
}
