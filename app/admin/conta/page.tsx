import { getAdmin } from "@/lib/supabase/server";
import { PageHead } from "@/components/ui";
import { PasswordForm } from "@/components/admin-client";

export const metadata = { title: "Conta" };

export default async function Conta() {
  const admin = (await getAdmin())!;
  return (
    <div className="wrap">
      <PageHead title="Conta" label="Administrador" intro="Troque a senha temporária no primeiro acesso." count={admin.email} />
      <section className="acq" aria-labelledby="pw-t" style={{ marginTop: "clamp(28px,4vw,48px)" }}>
        <div className="acq-aside"><p className="lab">Segurança</p><h2 id="pw-t">Nova <em>senha.</em></h2><p>A senha é guardada pelo Supabase Auth. Ninguém, nem a PONCI, consegue lê-la.</p></div>
        <div className="acq-main"><PasswordForm /></div>
      </section>
    </div>
  );
}
