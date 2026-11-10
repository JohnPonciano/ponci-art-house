"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const TYPES = ["signup", "invite", "magiclink", "recovery", "email_change", "email"] as const;
type OtpType = (typeof TYPES)[number];

/** Valida o token do e-mail no servidor (funciona em qualquer navegador/aparelho). */
export async function confirmToken(_: { error: string }, form: FormData): Promise<{ error: string }> {
  const token_hash = String(form.get("token_hash") || "");
  const type = String(form.get("type") || "") as OtpType;
  const next = String(form.get("next") || "");
  if (!token_hash || !TYPES.includes(type)) return { error: "Link incompleto. Peça um novo e-mail." };
  const sb = await createClient();
  const { error } = await sb.auth.verifyOtp({ type, token_hash });
  if (error) {
    return { error: /expired|invalid/i.test(error.message) ? "Este link expirou ou já foi usado. Peça um novo e-mail." : error.message };
  }
  const safe = next.startsWith("/") && !next.startsWith("//") ? next : type === "recovery" ? "/senha/nova" : "/entrar/redirecionar";
  redirect(safe);
}
