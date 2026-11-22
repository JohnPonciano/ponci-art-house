import Link from "next/link";
import type { ReactNode } from "react";
import { Header, Footer } from "./Chrome";
import { TabBar } from "./TabBar";
import { Icon } from "./Icon";
import { getAdmin } from "@/lib/supabase/server";
import { counts, salesAttention } from "@/lib/admin";

/** Menu do admin, organizado: trabalho do dia (topo), ver como membro e registros (submenu). */
export async function adminNav(com: string) {
  const [c, sales] = await Promise.all([counts(), salesAttention()]);
  const nav = [
    { href: "/admin", label: "Painel" },
    { href: "/admin/pedidos", label: "Pedidos", badge: c.reqs || undefined },
    { href: "/admin/membros", label: "Membros", badge: c.pend || undefined },
    { href: "/admin/curadoria", label: "Curadoria", badge: c.review || undefined },
    { href: "/admin/vendas", label: "Vendas", badge: sales || undefined },
    { href: "/admin/instagram", label: "Instagram" },
    { href: "/admin/diario", label: "Moderação" },
  ];
  const view = [{ href: "/colecionador", label: "Acervo" }, { href: com, label: "Comunidade" }];
  const records = [
    { href: "/admin/solicitacoes", label: "LGPD", badge: c.sol || undefined }, { href: "/admin/compliance", label: "Compliance" },
    { href: "/admin/convites", label: "Convites" }, { href: "/admin/documentos", label: "Documentos" }, { href: "/admin/auditoria", label: "Auditoria" },
    { href: "/seguranca", label: "Segurança" }, { href: "/admin/conta", label: "Senha" },
  ];
  return { nav, view, records };
}

export function AdminSubnav({ view, records }: { view: { href: string; label: string }[]; records: { href: string; label: string; badge?: number }[] }) {
  return (
    <nav className="subnav admin-sub" aria-label="Mais do painel"><div className="wrap">
      <span className="sub-g"><span className="sub-l">Ver como membro</span>{view.map((v) => <a key={v.label} href={v.href}><Icon n={v.label === "Acervo" ? "grid" : "chat"} />{v.label}</a>)}</span>
      <span className="sub-g"><span className="sub-l">Registros</span>{records.map((r) => <Link key={r.href} href={r.href}>{r.label}{r.badge ? <i className="badge-n">{r.badge}</i> : null}</Link>)}</span>
    </div></nav>
  );
}

/** Acervo visto pelo admin: mesmo menu do painel e um aviso de que é só visualização. */
export async function AdminViewShell({ children, com }: { children: ReactNode; com: string }) {
  const admin = await getAdmin(); const { nav, view, records } = await adminNav(com);
  return (
    <>
      <Header nav={[...nav, { href: "/colecionador", label: "Acervo" }]} menuExtra={[...view.slice(1), ...records]} home="/admin" tag="Painel admin" user={{ name: "Admin", role: admin?.email || "" }} band={["Visualizando o acervo como admin · compras e propostas ficam com os membros", admin?.email || ""]} />
      <AdminSubnav view={view} records={records} />
      <main id="main" tabIndex={-1} className="enter area-main">{children}</main>
      <Footer />
      <TabBar nav={[{ href: "/admin", label: "Painel" }, { href: "/admin/membros", label: "Membros" }, { href: "/colecionador", label: "Acervo" }, { href: "/admin/diario", label: "Moderação" }]} />
    </>
  );
}
