import { redirect } from "next/navigation";
import { Header, Footer } from "@/components/Chrome";
import { getAdmin } from "@/lib/supabase/server";
import { counts } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/entrar");
  const c = await counts();
  const nav = [
    { href: "/admin", label: "Painel" }, { href: "/admin/pedidos", label: "Pedidos", badge: c.reqs || undefined },
    { href: "/admin/membros", label: "Membros", badge: c.pend || undefined }, { href: "/admin/curadoria", label: "Curadoria", badge: c.review || undefined },
    { href: "/admin/convites", label: "Convites" }, { href: "/admin/conta", label: "Conta" },
  ];
  return (
    <>
      <Header nav={nav} home="/" tag="Painel admin" user={{ name: "Admin", role: admin.email }} band={["Painel administrativo · PONCI", admin.email]} />
      <main id="main" tabIndex={-1} className="enter">{children}</main>
      <Footer />
    </>
  );
}
