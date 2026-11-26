import { requireMember, myKyc } from "@/lib/supabase/server";
import { cartView, paymentsReady } from "@/lib/shop";
import { PageHead } from "@/components/ui";
import { Checkout } from "@/components/shop/Checkout";

export const metadata = { title: "Sacola" };
export const dynamic = "force-dynamic";

export default async function Sacola() {
  await requireMember("buyer");
  const [items, kyc, mp] = await Promise.all([cartView(), myKyc(), paymentsReady()]);
  const shipTo = kyc?.completed_at && kyc.street && kyc.cep ? `${kyc.legal_name} · ${kyc.street}, ${kyc.number || "s/n"}${kyc.complement ? ` · ${kyc.complement}` : ""} · ${kyc.city}/${kyc.uf} · CEP ${kyc.cep}` : null;
  return (
    <div className="wrap">
      <PageHead title="Sacola" label="Finalizar compra" intro="Confira os itens, o endereço e pague com segurança. Frete grátis para todo o Brasil." count={`${items.length} ${items.length === 1 ? "item" : "itens"}`} />
      <div style={{ margin: "clamp(24px,3vw,40px) 0 clamp(72px,10vw,140px)" }}>
        <Checkout items={items} shipTo={shipTo} ready={!!kyc?.completed_at} mp={mp} />
      </div>
    </div>
  );
}
