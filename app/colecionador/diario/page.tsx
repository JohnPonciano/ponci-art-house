import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { communityHome } from "@/lib/site";
/** O Diário virou a Comunidade (comunidade.ponci.art). */
export default async function Diario() { const h = communityHome((await headers()).get("host")); redirect(h === "/c" ? "/c" : h + "/"); }
