import type { InviteCard } from "@/lib/invite";
import { artUrl } from "@/lib/invite";

const INK = "#121211", PAPER = "#F2F0EB", OCRE = "#8B6A4F", WALL = "#E3DED4", MUTED = "#A39F97";
const who = (c: InviteCard) => (c.invitee ? c.invitee.split(" ")[0] : "você");
const as = (c: InviteCard) => (c.role === "artist" ? "artista" : "colecionador");

/** Painel da obra (ou composição da casa, quando quem convida é colecionador). */
function Panel({ c, w, h }: { c: InviteCard; w: number; h: number }) {
  const art = c.art;
  if (art?.path) {
    const k = Math.min((w * 0.74) / art.w, (h * 0.7) / art.h), iw = Math.round(art.w * k), ih = Math.round(art.h * k);
    return (
      <div style={{ width: w, height: h, background: WALL, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: Math.round(h * 0.045) }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={artUrl(art.path)} width={iw} height={ih} alt="" style={{ boxShadow: "14px 18px 26px rgba(18,18,17,.35)" }} />
        <div style={{ display: "flex", fontFamily: "Mono", fontSize: Math.round(h * 0.03), color: "#5E5850", letterSpacing: 1 }}>{art.title.toUpperCase()}</div>
      </div>);
  }
  return (
    <div style={{ width: w, height: h, background: WALL, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: w * 0.62, height: h * 0.62, background: PAPER, display: "flex", position: "relative", boxShadow: "14px 18px 26px rgba(18,18,17,.3)" }}>
        <div style={{ position: "absolute", left: "10%", top: "12%", width: "52%", height: "44%", background: OCRE }} />
        <div style={{ position: "absolute", right: "10%", bottom: "10%", width: Math.round(Math.min(w, h) * 0.62 * 0.5), height: Math.round(Math.min(w, h) * 0.62 * 0.5), borderRadius: 9999, background: INK }} />
        <div style={{ position: "absolute", left: "10%", bottom: "14%", width: "30%", height: 6, background: INK }} />
      </div>
    </div>);
}

export function OgCard({ c, code }: { c: InviteCard; code: string }) {
  return (
    <div style={{ width: 1200, height: 630, background: INK, display: "flex", padding: 54, gap: 48 }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontFamily: "Mono", fontSize: 20, color: MUTED, letterSpacing: 2 }}>
          <div style={{ width: 22, height: 22, background: OCRE }} />CONVITE · REDE PRIVADA DE ARTE</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontFamily: "Archivo", fontSize: 148, color: PAPER, lineHeight: 0.8, letterSpacing: -4 }}>PONCI</div>
          <div style={{ fontFamily: "Serif", fontStyle: "italic", fontSize: 50, color: PAPER, lineHeight: 1.1 }}>{`${c.inviter} convida ${who(c)}.`}</div>
          <div style={{ fontFamily: "Mono", fontSize: 21, color: MUTED, letterSpacing: 1 }}>{`ENTRADA COMO ${as(c).toUpperCase()} · VÁLIDO PARA 1 PESSOA`}</div>
        </div>
        <div style={{ display: "flex", fontFamily: "Mono", fontSize: 22, color: PAPER }}>{`ponci.art/convite/${code}`}</div>
      </div>
      <Panel c={c} w={380} h={522} />
    </div>);
}

export function StoryCard({ c, code }: { c: InviteCard; code: string }) {
  return (
    <div style={{ width: 1080, height: 1920, background: INK, display: "flex", flexDirection: "column", padding: "120px 80px 110px", justifyContent: "space-between" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontFamily: "Mono", fontSize: 28, color: MUTED, letterSpacing: 3 }}>
          <div style={{ width: 30, height: 30, background: OCRE }} />CONVITE · SÓ POR INDICAÇÃO</div>
        <div style={{ fontFamily: "Archivo", fontSize: 250, color: PAPER, lineHeight: 0.8, letterSpacing: -8 }}>PONCI</div>
      </div>
      <Panel c={c} w={920} h={860} />
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        <div style={{ fontFamily: "Serif", fontStyle: "italic", fontSize: 76, color: PAPER, lineHeight: 1.08 }}>{`${c.inviter} convida ${who(c)} para a rede.`}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontFamily: "Mono", fontSize: 30, color: MUTED }}>{`ponci.art/convite/${code}`}</div>
          <div style={{ display: "flex", background: OCRE, color: PAPER, fontFamily: "Mono", fontSize: 26, padding: "14px 20px", letterSpacing: 2 }}>1 VAGA</div>
        </div>
      </div>
    </div>);
}
