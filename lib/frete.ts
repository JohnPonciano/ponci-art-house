import "server-only";
import { serverEnv } from "@/lib/env";

/* Cotação de frete pelo Melhor Envio (Correios, Jadlog, Loggi, J&T e outras numa API só).
   Segredos no Worker: MELHOR_ENVIO_TOKEN (obrigatório), MELHOR_ENVIO_SANDBOX=1 (ambiente de teste)
   e MELHOR_ENVIO_UA ("Nome (e-mail técnico)", pedido pela API). */

export type FreteWork = { h: number; w: number; cat: string; price: number; depth_cm?: number | null; weight_kg?: number | null };
export type FreteOption = { id: number; company: string; logo: string | null; service: string; price: number; days: number | null; daysMax: number | null };
export type FreteResult = { ok: true; options: FreteOption[]; estimated: boolean; pkg: { h: number; w: number; l: number; kg: number } } | { ok: false; error: string; big?: boolean };

/** Medidas da caixa: obra + cantoneiras e caixa (≈10 cm a mais em cada lado). Sem peso informado, estima pela área. */
export function packageOf(a: FreteWork) {
  const paper = a.cat === "paper" || a.cat === "edition";
  const area = (a.h * a.w) / 1e4; // m²
  const kg = a.weight_kg ? Number(a.weight_kg) : Math.round((area * (paper ? 1.5 : 4) + (paper ? 0.8 : 1.5)) * 10) / 10;
  return { h: Math.round(a.h + 10), w: Math.round(a.w + 10), l: Math.round((a.depth_cm || (paper ? 3 : 4)) + 8), kg: Math.max(0.3, kg), estimated: !a.weight_kg || !a.depth_cm };
}

export async function quoteFrete(fromCep: string, toCep: string, a: FreteWork): Promise<FreteResult> {
  const token = await serverEnv("MELHOR_ENVIO_TOKEN");
  if (!token) return { ok: false, error: "O cálculo de frete ainda não foi ligado. A PONCI informa o frete antes do pagamento." };
  const base = (await serverEnv("MELHOR_ENVIO_SANDBOX")) === "1" ? "https://sandbox.melhorenvio.com.br" : "https://melhorenvio.com.br";
  const ua = (await serverEnv("MELHOR_ENVIO_UA")) || "PONCI (ponci.art)";
  const p = packageOf(a);
  try {
    const r = await fetch(`${base}/api/v2/me/shipment/calculate`, {
      method: "POST", cache: "no-store",
      headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${token}`, "User-Agent": ua },
      body: JSON.stringify({
        from: { postal_code: fromCep }, to: { postal_code: toCep },
        package: { height: p.h, width: p.w, length: p.l, weight: p.kg },
        options: { insurance_value: Math.round(a.price), receipt: false, own_hand: false },
      }),
    });
    const data = await r.json().catch(() => null);
    if (!r.ok || !Array.isArray(data)) return { ok: false, error: "Não consegui calcular o frete agora. Tente de novo em instantes." };
    const options: FreteOption[] = data
      .filter((s: any) => !s.error && (s.custom_price || s.price))
      .map((s: any) => ({
        id: s.id, company: s.company?.name || "", logo: s.company?.picture || null, service: s.name || "",
        price: Number(s.custom_price || s.price), days: s.custom_delivery_time ?? s.delivery_time ?? null,
        daysMax: s.custom_delivery_range?.max ?? s.delivery_range?.max ?? null,
      }))
      .sort((x: FreteOption, y: FreteOption) => x.price - y.price);
    if (!options.length) return { ok: false, big: true, error: "Esta obra passa do tamanho, do peso ou do seguro das transportadoras comuns. O envio é por transportadora de arte, cotado pela PONCI antes do pagamento." };
    return { ok: true, options, estimated: p.estimated, pkg: { h: p.h, w: p.w, l: p.l, kg: p.kg } };
  } catch {
    return { ok: false, error: "Não consegui calcular o frete agora. Tente de novo em instantes." };
  }
}
