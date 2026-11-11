import "server-only";
import { headers } from "next/headers";

/** IP e navegador da requisição, guardados como evidência de aceite e assinatura. */
export async function reqMeta() {
  const h = await headers();
  const ip = h.get("cf-connecting-ip") || h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
  return { ip, ua: h.get("user-agent")?.slice(0, 400) || null };
}
