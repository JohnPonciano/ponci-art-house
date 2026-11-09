import { redirect } from "next/navigation";
import { AreaShell } from "@/components/Shells";
import { getMe } from "@/lib/supabase/server";
import { proposalsForArtist } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ArtistaLayout({ children }: { children: React.ReactNode }) {
  const me = await getMe();
  if (!me) redirect("/entrar?perfil=artista");
  if (me.role !== "artist") redirect("/colecionador");
  const open = (await proposalsForArtist(me.id)).filter((p) => p.status === "open").length;
  const nav = [
    { href: "/artista", label: "Ateliê" }, { href: "/artista/obras", label: "Obras" }, { href: "/artista/obras/nova", label: "Nova obra" },
    { href: "/artista/propostas", label: "Propostas", badge: open || undefined }, { href: "/artista/vendas", label: "Vendas" }, { href: "/artista/perfil", label: "Perfil" },
  ];
  return <AreaShell me={me} nav={nav} tag="Área do artista">{children}</AreaShell>;
}
