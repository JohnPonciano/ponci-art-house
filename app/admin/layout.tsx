import { redirect } from "next/navigation";
import { Header, Footer } from "@/components/Chrome";
import { TabBar } from "@/components/TabBar";
import { getAdmin, adminByEmail, authLevel } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { communityHome } from "@/lib/site";
import { adminNav, AdminSubnav } from "@/components/AdminViewShell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // painel exige sessão verificada com o segundo fator (aal2)
  if (!(await adminByEmail())) redirect("/entrar/admin");
  const lvl = await authLevel();
  if (lvl.current !== "aal2") redirect(lvl.needsCode ? "/entrar/verificacao?next=/admin" : "/seguranca");
  const admin = await getAdmin();
  if (!admin) redirect("/entrar/admin");
  const { nav, view, records } = await adminNav(communityHome((await headers()).get("host")));
  return (
    <>
      <Header nav={nav} menuExtra={[...view, ...records]} home="/admin" tag="Painel admin" user={{ name: "Admin", role: admin.email }} band={["Painel administrativo · PONCI", admin.email]} />
      <AdminSubnav view={view} records={records} />
      <main id="main" tabIndex={-1} className="enter area-main">{children}</main>
      <Footer />
      <TabBar nav={[nav[0], nav[2], nav[3], nav[4]]} />
    </>
  );
}
