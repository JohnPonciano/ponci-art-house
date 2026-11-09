import { redirect } from "next/navigation";
import { getMe } from "@/lib/supabase/server";

export default async function Redirecionar() {
  const me = await getMe();
  redirect(!me ? "/entrar" : me.role === "artist" ? "/artista" : "/colecionador");
}
