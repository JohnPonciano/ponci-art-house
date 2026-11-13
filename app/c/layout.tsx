import type { Metadata, Viewport } from "next";
import { RnApp } from "@/components/rn/App";
import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getMe, pendingDocs } from "@/lib/supabase/server";
import { activity } from "@/lib/diary";
import { communityBase, isCommunityHost, MAIN_ORIGIN } from "@/lib/site";
import { initials } from "@/lib/format";
import { RnHeader, RnTabs } from "@/components/rn/Shell";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: { default: "Comunidade PONCI", template: "%s — Comunidade PONCI" },
  description: "A comunidade da rede PONCI: artistas e colecionadores mostrando processo, ateliê, coleção e agenda.",
  applicationName: "PONCI Comunidade",
  manifest: "/comunidade.webmanifest",
  icons: { icon: [{ url: "/icons/c-icon-192.png", sizes: "192x192", type: "image/png" }], apple: [{ url: "/icons/c-apple-touch-icon.png", sizes: "180x180" }] },
  appleWebApp: { capable: true, title: "Comunidade", statusBarStyle: "default" },
};
export const viewport: Viewport = {
  width: "device-width", initialScale: 1, viewportFit: "cover",
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#F2F0EB" }, { media: "(prefers-color-scheme: dark)", color: "#131312" }],
};

export default async function CommunityLayout({ children }: { children: React.ReactNode }) {
  const host = (await headers()).get("host"); const main = isCommunityHost(host) ? MAIN_ORIGIN : ""; const base = communityBase(host);
  const [me, docs] = await Promise.all([getMe(), pendingDocs()]);
  if (!me) redirect(main + "/entrar");
  if (docs.length) redirect(main + "/aceite?next=" + encodeURIComponent(me.role === "artist" ? "/artista" : "/colecionador"));
  if (me.status !== "active") redirect(main + (me.role === "artist" ? "/artista" : "/colecionador"));
  const act = await activity();
  const p = { base, main, code: me.member_code, unseen: act.unseen, initials: me.role === "artist" || me.show_name ? initials(me.display_name) : "C", buyer: me.role === "buyer", area: me.role === "buyer" ? "/colecionador" : "/artista" };
  return (
    <div className="rn">
      <a className="skip" href="#main">Pular para o conteúdo</a>
      <Suspense><RnHeader {...p} /></Suspense>
      <main id="main" tabIndex={-1} className="rn-main">{children}</main>
      <Suspense><RnTabs {...p} /></Suspense>
      <RnApp />
    </div>
  );
}
