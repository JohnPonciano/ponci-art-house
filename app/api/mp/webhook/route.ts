import { createClient as createSupabase } from "@supabase/supabase-js";

/* Aviso do Mercado Pago. Não confiamos no conteúdo: só repassamos o id do pagamento para o banco, que consulta a
   API do Mercado Pago com o token do cofre e confere referência e valor antes de marcar o pedido como pago. */
async function handle(req: Request) {
  const url = new URL(req.url);
  let body: any = {};
  try { body = await req.json(); } catch { /* aviso pode vir só na URL */ }
  const type = body?.type || body?.topic || url.searchParams.get("type") || url.searchParams.get("topic");
  const id = String(body?.data?.id || url.searchParams.get("data.id") || (type === "payment" ? url.searchParams.get("id") : "") || "").replace(/\D/g, "");
  if ((type === "payment" || body?.action?.startsWith?.("payment.")) && id) {
    const sb = createSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL!, (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!, { auth: { persistSession: false } });
    await sb.rpc("mp_notify", { p_payment_id: id.slice(0, 30) });
  }
  return new Response("ok", { status: 200 });
}
export const POST = handle;
export const GET = handle;
