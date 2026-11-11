import { redirect } from "next/navigation";
import { adminByEmail, getMe } from "@/lib/supabase/server";

export default async function Redirecionar() {
  if (await adminByEmail()) redirect("/admin");
  const me = await getMe();
  redirect(!me ? "/entrar" : me.role === "artist" ? "/artista" : "/colecionador");
}
