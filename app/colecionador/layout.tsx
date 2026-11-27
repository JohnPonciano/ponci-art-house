import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { communityHome } from "@/lib/site";
import { AreaShell } from "@/components/Shells";
import { PendingMember } from "@/components/PendingMember";
import { KycBanner } from "@/components/KycBanner";
import { getMe, pendingDocs, myKyc, adminAsBuyer } from "@/lib/supabase/server";
import { AdminViewShell } from "@/components/AdminViewShell";
import { favoriteIds } from "@/lib/data";
import { activity } from "@/lib/diary";
import { cartCount } from "@/lib/shop";

export const dynamic = "force-dynamic";

export default async function ColecionadorLayout({ children }: { children: React.ReactNode }) {
  const [me, docs, kyc] = await Promise.all([getMe(), pendingDocs(), myKyc()]);
  if (!me) {
    // admin também enxerga o acervo (sem comprar), com o menu do painel
    const adm = await adminAsBuyer();
    if (adm) return <AdminViewShell com={communityHome((await headers()).get("host"))}>{children}</AdminViewShell>;
    redirect("/entrar?perfil=colecionador");
  }
  if (me.role !== "buyer") redirect("/artista");
  if (docs.length) redirect("/aceite?next=/colecionador");
  if (me.status !== "active")
    return <AreaShell me={me} nav={[]} tag={"Área do colecionador"}><PendingMember me={me} /></AreaShell>;
  const [favs, act, bag] = await Promise.all([favoriteIds(me.id), activity(), cartCount(me.id)]);
  const com = communityHome((await headers()).get("host"));
  const nav = [
    { href: "/colecionador", label: "Acervo" }, { href: com, label: "Comunidade", badge: act.unseen || undefined }, { href: "/colecionador/favoritos", label: "Favoritos", badge: favs.length || undefined },
    { href: "/colecionador/aquisicoes", label: "Meus pedidos" }, { href: "/colecionador/sacola", label: "Sacola", badge: bag || undefined },
  ];
  return <AreaShell me={me} nav={[...nav, { href: "/conta#convites", label: "Convidar" }, { href: "/conta", label: "Conta" }]} tag="Área do colecionador">{!kyc?.completed_at && <KycBanner />}{children}</AreaShell>;
}
