import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Portabilidade (LGPD art. 18, V): todos os dados do membro acessíveis a ele, em JSON.
export async function GET() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ erro: "não autenticado" }, { status: 401 });
  const q = async (t: string, col = "user_id") => (await sb.from(t).select("*").eq(col, user.id)).data || [];
  const [profile, priv, kyc, works, proposals, orders, favorites, acceptances, requests] = await Promise.all([
    q("profiles", "id"), q("profile_private", "id"), q("kyc"), q("works", "artist_id"),
    sb.from("proposals").select("*,events:proposal_events(*)").eq("buyer_id", user.id).then((r) => r.data || []),
    q("orders", "buyer_id"), q("favorites", "buyer_id"), q("acceptances"), q("member_requests"),
  ]);
  const body = {
    gerado_em: new Date().toISOString(), conta: { id: user.id, email: user.email, criada_em: user.created_at, ultimo_acesso: user.last_sign_in_at },
    perfil: profile[0] || null, dados_privados: priv[0] || null, identificacao: kyc[0] || null, obras: works,
    propostas_feitas: proposals, aquisicoes: orders, favoritos: favorites, aceites: acceptances, solicitacoes: requests,
  };
  return new NextResponse(JSON.stringify(body, null, 2), {
    headers: { "content-type": "application/json; charset=utf-8", "content-disposition": `attachment; filename="ponci-meus-dados-${new Date().toISOString().slice(0, 10)}.json"`, "cache-control": "no-store" },
  });
}
