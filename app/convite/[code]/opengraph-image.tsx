import { ImageResponse } from "next/og";
import { inviteCard, fonts } from "@/lib/invite";
import { OgCard } from "./art";

export const alt = "Convite para a PONCI";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ code: string }> }) {
  const code = (await params).code.toUpperCase(); const c = await inviteCard(code);
  return new ImageResponse(<OgCard c={c.valid || c.inviter ? c : { valid: false, inviter: "A PONCI", role: "buyer" }} code={code} />, { ...size, fonts: await fonts() });
}
