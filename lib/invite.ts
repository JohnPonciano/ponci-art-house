import "server-only";
import { createClient } from "@/lib/supabase/server";

export type InviteCard = { valid: boolean; role?: "artist" | "buyer"; invitee?: string; inviter?: string; inviter_role?: string; inviter_city?: string; inviter_practice?: string; art?: { path: string; w: number; h: number; title: string } | null };
export async function inviteCard(code: string): Promise<InviteCard> {
  const { data } = await (await createClient()).rpc("invite_card", { p_code: code });
  return (data as any) || { valid: false };
}
export const artUrl = (p: string) => `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/works/${p.replace(/\.jpg$/, "-t.jpg")}`;

/** Fontes da marca para as imagens geradas (Satori não lê woff2): lidas dos arquivos estáticos do Worker. */
const cache = new Map<string, ArrayBuffer>();
export async function font(name: "ArchivoBlack" | "InstrumentSerif" | "IBMPlexMono"): Promise<ArrayBuffer> {
  if (cache.has(name)) return cache.get(name)!;
  let buf: ArrayBuffer | null = null;
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const assets = (getCloudflareContext().env as any)?.ASSETS;
    if (assets) { const r = await assets.fetch(new Request(`https://assets.local/fonts/${name}.ttf`)); if (r.ok) buf = await r.arrayBuffer(); }
  } catch {}
  if (!buf) { const fs = await import("fs/promises"); const path = await import("path"); const b = await fs.readFile(path.join(process.cwd(), "public", "fonts", `${name}.ttf`)); buf = b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer; }
  cache.set(name, buf); return buf;
}
export const fonts = async () => [
  { name: "Archivo", data: await font("ArchivoBlack"), weight: 900 as const, style: "normal" as const },
  { name: "Serif", data: await font("InstrumentSerif"), weight: 400 as const, style: "italic" as const },
  { name: "Mono", data: await font("IBMPlexMono"), weight: 500 as const, style: "normal" as const },
];
