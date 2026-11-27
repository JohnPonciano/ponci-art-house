import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { communityHome } from "@/lib/site";
import { AreaShell } from "@/components/Shells";
import { PendingMember } from "@/components/PendingMember";
import { KycBanner } from "@/components/KycBanner";
import { getMe, pendingDocs, myKyc } from "@/lib/supabase/server";
import { diaryStats, activity } from "@/lib/diary";

export const dynamic = "force-dynamic";

export default async function ArtistaLayout({ children }: { children: React.ReactNode }) {
  const [me, docs, kyc] = await Promise.all([getMe(), pendingDocs(), myKyc()]);
  if (!me) redirect("/entrar?perfil=artista");
  if (me.role !== "artist") redirect("/colecionador");
  if (docs.length) redirect("/aceite?next=/artista");
  if (me.status !== "active")
    return <AreaShell me={me} nav={[]} tag={"Área do artista"}><PendingMember me={me} /></AreaShell>;
  const [stats, act] = await Promise.all([diaryStats(), activity()]);
  const unseen = stats.unseen + act.unseen;
  const com = communityHome((await headers()).get("host"));
  const nav = [
    { href: "/artista/obras", label: "Obras" }, { href: "/artista/vendas", label: "Vendas" }, { href: com, label: "Comunidade", badge: unseen || undefined },
  ];
  return <AreaShell me={me} nav={[...nav, { href: "/conta#convites", label: "Convidar" }, { href: "/conta", label: "Conta" }]} tag="Área do artista">{!kyc?.completed_at && <KycBanner />}{children}</AreaShell>;
}
