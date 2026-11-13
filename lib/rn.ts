import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getMe } from "@/lib/supabase/server";
import { communityBase, isCommunityHost, MAIN_ORIGIN } from "@/lib/site";

/** Contexto da Comunidade: membro ativo, caminho base e endereço do site principal. */
export async function rnCtx() {
  const host = (await headers()).get("host");
  const me = await getMe();
  if (!me) redirect((isCommunityHost(host) ? MAIN_ORIGIN : "") + "/entrar");
  return { me, base: communityBase(host), main: isCommunityHost(host) ? MAIN_ORIGIN : "" };
}
