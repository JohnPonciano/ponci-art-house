import "server-only";
import { CONVITE_HTML } from "./email-templates";

/** Lê variáveis/segredos do Worker (Cloudflare) ou do process.env (local). */
async function env(name: string): Promise<string | undefined> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const v = (getCloudflareContext().env as any)?.[name];
    if (v) return String(v);
  } catch { /* fora do Worker */ }
  return process.env[name];
}

type Mail = { to: string; toName?: string; subject: string; html: string; text: string };

/** Envia pelo SendGrid (Mail Send v3). Retorna erro legível em caso de falha. */
export async function sendMail(m: Mail): Promise<{ ok: boolean; error?: string }> {
  const key = await env("SENDGRID_API_KEY");
  if (!key) return { ok: false, error: "Envio de e-mail não configurado (falta SENDGRID_API_KEY no servidor)." };
  const from = (await env("SENDGRID_FROM")) || "convites@ponci.art";
  try {
    const r = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: m.to, ...(m.toName ? { name: m.toName } : {}) }] }],
        from: { email: from, name: "PONCI" },
        subject: m.subject,
        content: [{ type: "text/plain", value: m.text }, { type: "text/html", value: m.html }],
        tracking_settings: { click_tracking: { enable: false, enable_text: false } },
      }),
    });
    if (r.status === 202) return { ok: true };
    const body = await r.text();
    if (r.status === 401) return { ok: false, error: "SendGrid recusou a chave (401). Confira SENDGRID_API_KEY." };
    if (r.status === 403 && /sender|from address/i.test(body)) return { ok: false, error: `O remetente ${from} não está verificado no SendGrid (Sender Authentication).` };
    return { ok: false, error: `SendGrid respondeu ${r.status}: ${body.slice(0, 200)}` };
  } catch (e: any) {
    return { ok: false, error: "Falha de conexão com o SendGrid: " + (e?.message || e) };
  }
}

const escapeHtml = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export async function sendInvite(p: { name: string; email: string; code: string; role: "artist" | "buyer"; origin?: string }) {
  const origin = p.origin || (await env("SITE_URL")) || "https://ponci.art";
  const perfil = p.role === "artist" ? "artista" : "colecionador";
  const link = `${origin}/cadastro?perfil=${perfil}&codigo=${encodeURIComponent(p.code)}`;
  const first = p.name.trim().split(/\s+/)[0] || "";
  const html = CONVITE_HTML.replaceAll("{{nome}}", escapeHtml(first)).replaceAll("{{codigo}}", escapeHtml(p.code))
    .replaceAll("{{perfil}}", p.role === "artist" ? "Artista" : "Colecionador").replaceAll("{{link}}", escapeHtml(link));
  const text = `Olá, ${first}.\n\nSeu acesso à PONCI, rede privada de arte, foi aprovado.\n\nCódigo de convite: ${p.code}\nCrie sua conta em: ${link}\n\nO código é pessoal e vale para um cadastro.\n\nPONCI`;
  return sendMail({ to: p.email, toName: p.name, subject: "Seu convite para a PONCI", html, text });
}
