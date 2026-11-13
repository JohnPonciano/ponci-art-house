import { redirect } from "next/navigation";
import { AreaShell } from "@/components/Shells";
import { PendingMember } from "@/components/PendingMember";
import { KycBanner } from "@/components/KycBanner";
import { getMe, pendingDocs, myKyc } from "@/lib/supabase/server";
import { favoriteIds, proposalsForBuyer } from "@/lib/data";
import { activity } from "@/lib/diary";

export const dynamic = "force-dynamic";

export default async function ColecionadorLayout({ children }: { children: React.ReactNode }) {
  const [me, docs, kyc] = await Promise.all([getMe(), pendingDocs(), myKyc()]);
  if (!me) redirect("/entrar?perfil=colecionador");
  if (me.role !== "buyer") redirect("/artista");
  if (docs.length) redirect("/aceite?next=/colecionador");
  if (me.status !== "active")
    return <AreaShell me={me} nav={[]} tag={"Área do colecionador"}><PendingMember me={me} /></AreaShell>;
  const [ps, favs, act] = await Promise.all([proposalsForBuyer(me.id), favoriteIds(me.id), activity()]);
  const c = ps.filter((p) => p.status === "countered").length;
  const nav = [
    { href: "/colecionador", label: "Acervo" }, { href: "/colecionador/comunidade", label: "Comunidade", badge: act.unseen || undefined }, { href: "/colecionador/favoritos", label: "Favoritos", badge: favs.length || undefined },
    { href: "/colecionador/propostas", label: "Propostas", badge: c || undefined }, { href: "/colecionador/aquisicoes", label: "Aquisições" },
  ];
  return <AreaShell me={me} nav={[...nav, { href: "/conta", label: "Conta" }]} tag="Área do colecionador">{!kyc?.completed_at && <KycBanner />}{children}</AreaShell>;
}
