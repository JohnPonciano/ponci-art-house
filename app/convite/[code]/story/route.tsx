import { ImageResponse } from "next/og";
import { inviteCard, fonts } from "@/lib/invite";
import { StoryCard } from "../art";

/** Imagem vertical (1080×1920) para os Stories do Instagram. */
export async function GET(_: Request, { params }: { params: Promise<{ code: string }> }) {
  const code = (await params).code.toUpperCase(); const c = await inviteCard(code);
  if (!c.inviter) return new Response("Convite não encontrado", { status: 404 });
  return new ImageResponse(<StoryCard c={c} code={code} />, { width: 1080, height: 1920, fonts: await fonts(),
    headers: { "Cache-Control": "public, max-age=3600", "Content-Disposition": `inline; filename="convite-ponci-${code}.png"` } });
}
