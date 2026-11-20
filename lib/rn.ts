import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getMe, getAdmin, type Me } from "@/lib/supabase/server";
import { communityBase, isCommunityHost, MAIN_ORIGIN } from "@/lib/site";

export type Viewer = Omit<Me, "role"> & { role: "artist" | "buyer" | "admin" };
/** Admin entra na comunidade como "PONCI · Admin" para moderar (não publica, não curte). */
export const adminViewer = (a: { id: string; email: string }): Viewer => ({
  id: a.id, role: "admin", member_code: "ADMIN", display_name: "PONCI · Admin", city: "", practice: "Moderação", bio: "", created_at: "",
  status: "active", full_name: "Administração PONCI", email: a.email, accepts_offers: false, show_name: true,
});

/** Contexto da Comunidade: membro ativo (ou admin), caminho base e endereço do site principal. */
export async function rnCtx() {
  const host = (await headers()).get("host");
  let me: Viewer | null = await getMe();
  if (!me) { const a = await getAdmin(); if (a) me = adminViewer(a); }
  if (!me) redirect((isCommunityHost(host) ? MAIN_ORIGIN : "") + "/entrar");
  return { me: me as any as Me & { role: any }, viewer: me, isAdmin: me.role === "admin", base: communityBase(host), main: isCommunityHost(host) ? MAIN_ORIGIN : "" };
}
