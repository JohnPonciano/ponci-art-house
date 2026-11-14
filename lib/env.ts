/** Lê variáveis/segredos do Worker (Cloudflare) ou do process.env (local). */
export async function serverEnv(name: string): Promise<string | undefined> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const v = (getCloudflareContext().env as any)?.[name];
    if (typeof v === "string" && v) return v;
  } catch {}
  return process.env[name];
}
/* Cookie assinado que lembra, por 12 h, que esta sessão já foi conferida quanto ao segundo fator.
   Evita uma ida ao servidor de autenticação a cada clique; a assinatura impede falsificação. */
const enc = new TextEncoder();
async function hkey() {
  const s = (await serverEnv("AAL_COOKIE_SECRET")) || (await serverEnv("SENDGRID_API_KEY"));
  if (!s) return null;
  const raw = await crypto.subtle.digest("SHA-256", enc.encode("ponci-aal-v1|" + s));
  return crypto.subtle.importKey("raw", raw, { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}
const b64 = (b: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
export async function signAal(sub: string, sid: string, ttl = 12 * 3600) {
  const k = await hkey(); if (!k) return null;
  const exp = Math.floor(Date.now() / 1000) + ttl;
  const sig = b64(await crypto.subtle.sign("HMAC", k, enc.encode(`${sub}|${sid}|${exp}`)));
  return `${exp}.${sig}`;
}
export async function checkAal(v: string | undefined, sub: string, sid: string) {
  if (!v) return false; const [exp, sig] = v.split(".");
  if (!exp || !sig || Number(exp) < Date.now() / 1000) return false;
  const k = await hkey(); if (!k) return false;
  const good = b64(await crypto.subtle.sign("HMAC", k, enc.encode(`${sub}|${sid}|${exp}`)));
  return good.length === sig.length && good === sig;
}
