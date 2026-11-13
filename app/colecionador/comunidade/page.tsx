import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { communityHome } from "@/lib/site";
/** A Comunidade mudou para comunidade.ponci.art. */
export default async function Comunidade({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = new URLSearchParams(await searchParams); if (sp.get("aba") !== "seguindo") sp.delete("aba");
  const home = communityHome((await headers()).get("host"));
  redirect((home === "/c" ? "/c" : home + "/") + (sp.size ? "?" + sp : ""));
}
