import { redirect } from "next/navigation";
import { AreaShell } from "@/components/Shells";
import { getMe } from "@/lib/supabase/server";
import { favoriteIds, proposalsForBuyer } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ColecionadorLayout({ children }: { children: React.ReactNode }) {
  const me = await getMe();
  if (!me) redirect("/entrar?perfil=colecionador");
  if (me.role !== "buyer") redirect("/artista");
  const [ps, favs] = await Promise.all([proposalsForBuyer(me.id), favoriteIds(me.id)]);
  const c = ps.filter((p) => p.status === "countered").length;
  const nav = [
    { href: "/colecionador", label: "Acervo" }, { href: "/colecionador/favoritos", label: "Favoritos", badge: favs.length || undefined },
    { href: "/colecionador/propostas", label: "Propostas", badge: c || undefined }, { href: "/colecionador/aquisicoes", label: "Aquisições" },
  ];
  return <AreaShell me={me} nav={nav} tag="Área do colecionador">{children}</AreaShell>;
}
