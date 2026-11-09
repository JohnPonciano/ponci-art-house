import { redirect } from "next/navigation";
import { PublicShell } from "@/components/Shells";
import { PageHead } from "@/components/ui";
import { AdminLoginForm } from "@/components/admin-client";
import { getAdmin } from "@/lib/supabase/server";

export const metadata = { title: "Admin", robots: { index: false } };

export default async function AdminEntrar() {
  if (await getAdmin()) redirect("/admin");
  return (
    <PublicShell>
      <div className="wrap">
        <PageHead title="Curadoria" label="Painel administrativo" intro="Acesso restrito à administração da PONCI." count={<>Somente<br />administradores</>} />
        <section className="acq" aria-labelledby="adm-t" style={{ marginTop: "clamp(28px,4vw,48px)" }}>
          <div className="acq-aside"><p className="lab">Entrar</p><h2 id="adm-t">Painel <em>da rede.</em></h2><p>Aprovação de pedidos de convite, membros, obras em curadoria e códigos de convite.</p></div>
          <div className="acq-main"><AdminLoginForm /></div>
        </section>
      </div>
    </PublicShell>
  );
}
