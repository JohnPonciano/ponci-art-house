import { redirect } from "next/navigation";
import { AreaShell } from "@/components/Shells";
import { PendingMember } from "@/components/PendingMember";
import { KycBanner } from "@/components/KycBanner";
import { getMe, pendingDocs, myKyc } from "@/lib/supabase/server";
import { proposalsForArtist } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ArtistaLayout({ children }: { children: React.ReactNode }) {
  const me = await getMe();
  if (!me) redirect("/entrar?perfil=artista");
  if (me.role !== "artist") redirect("/colecionador");
  if ((await pendingDocs()).length) redirect("/aceite?next=/artista");
  if (me.status !== "active")
    return <AreaShell me={me} nav={[]} tag={"Área do artista"}><PendingMember me={me} /></AreaShell>;
  const open = (await proposalsForArtist(me.id)).filter((p) => p.status === "open").length;
  const nav = [
    { href: "/artista", label: "Ateliê" }, { href: "/artista/obras", label: "Obras" },
    { href: "/artista/propostas", label: "Propostas", badge: open || undefined }, { href: "/artista/vendas", label: "Vendas" }, { href: "/artista/perfil", label: "Perfil" },
  ];
  return <AreaShell me={me} nav={[...nav, { href: "/conta", label: "Conta" }]} tag="Área do artista">{!(await myKyc())?.completed_at && <KycBanner />}{children}</AreaShell>;
}
