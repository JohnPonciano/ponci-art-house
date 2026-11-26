import "server-only";
import { createClient } from "@/lib/supabase/server";

/* Loja: sacola, pedidos (PED-) e pagamento. Leituras toleram a migração ainda não aplicada. */
export type CartItem = { id: string; kind: "original" | "print"; work_id: string; slug: string; title: string; artist_name: string; image_path: string | null;
  img_w: number | null; img_h: number | null; label: string; price_cents: number; available: boolean; note: string | null };
export type CheckoutStatus = "awaiting_payment" | "paid" | "expired" | "cancelled" | "problem";
export type Checkout = { id: string; ref: string; total_cents: number; status: CheckoutStatus; pay_until: string; created_at: string; paid_at: string | null;
  mp_init_point: string | null; mp_error: string | null; items: { kind: "original" | "print"; ref: string; title: string; label: string; price_cents: number; image: string | null }[] };

export async function cartView(): Promise<CartItem[]> {
  const sb = await createClient();
  const { data, error } = await sb.rpc("cart_view");
  return error ? [] : ((data as any[]) || []).map((r) => ({ ...r, price_cents: Number(r.price_cents) }));
}
export async function cartCount(meId: string): Promise<number> {
  const sb = await createClient();
  const { count, error } = await sb.from("cart_items").select("id", { count: "exact", head: true }).eq("buyer_id", meId);
  return error ? 0 : count || 0;
}
export async function paymentsReady(): Promise<boolean> {
  const sb = await createClient();
  const { data, error } = await sb.rpc("payments_ready");
  return !error && !!data;
}
export async function myCheckouts(meId: string): Promise<Checkout[]> {
  const sb = await createClient();
  const { data, error } = await sb.from("checkouts").select("*").eq("buyer_id", meId).order("created_at", { ascending: false }).limit(50);
  return error ? [] : ((data as any[]) || []).map((c) => ({ ...c, total_cents: Number(c.total_cents) }));
}
export async function checkoutByRef(ref: string): Promise<Checkout | null> {
  const sb = await createClient();
  const { data } = await sb.from("checkouts").select("*").eq("ref", ref.toUpperCase().replace(/[^A-Z0-9-]/g, "")).maybeSingle();
  return data ? ({ ...(data as any), total_cents: Number((data as any).total_cents) } as Checkout) : null;
}
/** Admin: pedidos recentes e estado do Mercado Pago. */
export async function adminCheckouts() {
  const sb = await createClient();
  const [cs, st] = await Promise.all([
    sb.from("checkouts").select("*,buyer:profiles!checkouts_buyer_id_fkey(member_code,private:profile_private(full_name,email))").order("created_at", { ascending: false }).limit(100),
    sb.from("pay_settings").select("*").eq("id", 1).maybeSingle(),
  ]);
  const one = (x: any) => (Array.isArray(x) ? x[0] : x) ?? null;
  return {
    ready: !cs.error,
    settings: (st.data as any) || null,
    checkouts: ((cs.data as any[]) || []).map((c) => ({ ...c, total_cents: Number(c.total_cents), buyer: { ...one(c.buyer), ...one(one(c.buyer)?.private) } })),
  };
}
