// Publica legal/*.md como nova versão dos documentos (só cria versão se o texto mudou).
// Uso: ADMIN_EMAIL=... ADMIN_PASSWORD=... [ADMIN_TOTP=123456] node scripts/publish-legal.mjs
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const sb = createClient(url, key, { auth: { persistSession: false } });
const { error: le } = await sb.auth.signInWithPassword({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD });
if (le) { console.error("login:", le.message); process.exit(1); }
if (process.env.ADMIN_TOTP) {
  const { data: f } = await sb.auth.mfa.listFactors();
  const factor = f?.totp?.[0];
  const { error } = await sb.auth.mfa.challengeAndVerify({ factorId: factor.id, code: process.env.ADMIN_TOTP });
  if (error) { console.error("mfa:", error.message); process.exit(1); }
}
for (const slug of ["termos", "privacidade", "contrato-artista", "contrato-colecionador"]) {
  const raw = readFileSync(`legal/${slug}.md`, "utf8");
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  const meta = Object.fromEntries(m[1].split("\n").map((l) => [l.slice(0, l.indexOf(":")).trim(), l.slice(l.indexOf(":") + 1).trim()]));
  const { data, error } = await sb.rpc("admin_publish_document", { p_slug: slug, p_title: meta.title, p_summary: meta.summary || "", p_body: m[2].trim() + "\n" });
  console.log(slug, error ? "ERRO " + error.message : "versão " + data);
}
