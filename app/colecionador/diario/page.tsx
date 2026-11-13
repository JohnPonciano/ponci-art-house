import { redirect } from "next/navigation";
/** O Diário virou Comunidade: links antigos continuam funcionando. */
export default async function Diario({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = new URLSearchParams(await searchParams); if (sp.get("aba") === "rede") sp.delete("aba");
  redirect("/colecionador/comunidade" + (sp.size ? "?" + sp : ""));
}
