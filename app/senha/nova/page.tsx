import Link from "next/link";
import { PublicShell } from "@/components/Shells";
import { PageHead, Slab, Empty } from "@/components/ui";
import { NewPasswordForm } from "@/components/forms/ResetForms";
import { Icon } from "@/components/Icon";
import { DEMO_ART } from "@/lib/demoArt";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Nova senha" };
export const dynamic = "force-dynamic";

export default async function NovaSenha() {
  const { data: { user } } = await (await createClient()).auth.getUser();
  return (
    <PublicShell>
      <div className="wrap">
        <PageHead title="Senha" label="Acesso" intro="Escolha uma nova senha para a sua conta." count={user?.email || "Link expirado"} />
        {user ? (
          <section className="gate" aria-labelledby="np-t">
            <div className="gate-art" aria-hidden="true"><Slab a={DEMO_ART.convite} label="Na rede" /></div>
            <div className="gate-main"><p className="lab">Nova senha</p><h2 id="np-t">Quase <em>lá.</em></h2><p>Depois de salvar, você entra direto na sua área.</p><NewPasswordForm /></div>
          </section>
        ) : (
          <div style={{ margin: "32px 0 clamp(72px,10vw,140px)" }}>
            <Empty title="Este link expirou ou já foi usado." body="Peça um novo link de redefinição."><Link className="btn" href="/senha">Pedir novo link <Icon n="right" /></Link></Empty>
          </div>
        )}
      </div>
    </PublicShell>
  );
}
