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
