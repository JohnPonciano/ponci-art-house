import Link from "next/link";
import { redirect } from "next/navigation";
import { Header, Footer } from "@/components/Chrome";
import { getAdmin, adminByEmail, authLevel } from "@/lib/supabase/server";
import { counts } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // painel exige sessão verificada com o segundo fator (aal2)
  if (!(await adminByEmail())) redirect("/entrar/admin");
  const lvl = await authLevel();
  if (lvl.current !== "aal2") redirect(lvl.needsCode ? "/entrar/verificacao?next=/admin" : "/seguranca");
  const admin = await getAdmin();
  if (!admin) redirect("/entrar/admin");
  const c = await counts();
  const nav = [
    { href: "/admin/pedidos", label: "Pedidos", badge: c.reqs || undefined }, { href: "/admin/membros", label: "Membros", badge: c.pend || undefined },
    { href: "/admin/curadoria", label: "Curadoria", badge: c.review || undefined }, { href: "/admin/solicitacoes", label: "Solicitações", badge: c.sol || undefined },
    { href: "/admin/compliance", label: "Compliance" },
  ];
  const sub = [["/admin", "Painel"], ["/admin/diario", "Diário"], ["/admin/documentos", "Documentos"], ["/admin/auditoria", "Auditoria"], ["/admin/convites", "Convites"], ["/seguranca", "Segurança"], ["/admin/conta", "Senha"]];
  return (
    <>
      <Header nav={nav} home="/admin" tag="Painel admin" user={{ name: "Admin", role: admin.email }} band={["Painel administrativo · PONCI", admin.email]} />
      <nav className="subnav" aria-label="Registros"><div className="wrap">{sub.map(([h, l]) => <Link key={h} href={h}>{l}</Link>)}</div></nav>
      <main id="main" tabIndex={-1} className="enter">{children}</main>
      <Footer />
    </>
  );
}
