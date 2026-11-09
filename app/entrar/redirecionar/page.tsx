import { redirect } from "next/navigation";
import { getAdmin, getMe } from "@/lib/supabase/server";

export default async function Redirecionar() {
  if (await getAdmin()) redirect("/admin");
  const me = await getMe();
  redirect(!me ? "/entrar" : me.role === "artist" ? "/artista" : "/colecionador");
}
