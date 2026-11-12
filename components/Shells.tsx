import type { ReactNode } from "react";
import { Header, Footer, type NavItem } from "./Chrome";
import { TabBar } from "./TabBar";
import { InstallHint } from "./InstallHint";
import type { Me } from "@/lib/supabase/server";

const PUBLIC_NAV: NavItem[] = [
  { href: "/#rede", label: "A rede" }, { href: "/#artistas", label: "Artistas" },
  { href: "/#colecionadores", label: "Colecionadores" }, { href: "/#processo", label: "Como funciona" },
];

export function PublicShell({ children, me }: { children: ReactNode; me?: Me | null }) {
  const nav = me ? [...PUBLIC_NAV.slice(0, 2), { href: me.role === "artist" ? "/artista" : "/colecionador", label: "Minha área" }] : PUBLIC_NAV;
  return (
    <>
      <Header nav={nav} enter={!me} user={me ? { name: me.role === "artist" ? me.display_name : me.full_name, role: me.role === "artist" ? "Artista" : me.member_code } : null} />
      <main id="main" tabIndex={-1} className="enter">{children}</main>
      <Footer />
    </>
  );
}

export function AreaShell({ children, me, nav, tag }: { children: ReactNode; me: Me; nav: NavItem[]; tag: string }) {
  const name = me.role === "artist" ? me.display_name : me.full_name;
  return (
    <>
      <Header nav={nav} home="/" tag={tag} user={{ name, role: me.role === "artist" ? "Artista" : me.member_code }}
        band={[`${tag} · ${name}${me.role === "buyer" ? " · " + me.member_code : ""}`, me.email.endsWith("@demo.ponci.art") ? "Conta de demonstração" : "Membro verificado"]} />
      <main id="main" tabIndex={-1} className="enter"><InstallHint />{children}</main>
      <Footer />
      <TabBar nav={nav} />
    </>
  );
}
