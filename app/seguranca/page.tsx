import { redirect } from "next/navigation";
import { PublicShell } from "@/components/Shells";
import { PageHead, Notice } from "@/components/ui";
import { MfaManager } from "@/components/forms/Mfa";
import { createClient, getMe, adminByEmail, authLevel } from "@/lib/supabase/server";

export const metadata = { title: "Segurança" };
export const dynamic = "force-dynamic";

export default async function Seguranca() {
  const { data: { user } } = await (await createClient()).auth.getUser();
  if (!user) redirect("/entrar");
  const lvl = await authLevel();
  if (lvl.needsCode) redirect("/entrar/verificacao?next=/seguranca");
  const [me, admin] = await Promise.all([getMe(), adminByEmail()]);
  const mustEnroll = admin && lvl.current !== "aal2";
  return (
    <PublicShell me={me}>
      <div className="wrap">
        <PageHead title="Segurança" label="Verificação em duas etapas" intro="Além da senha, um código do aplicativo autenticador no seu celular a cada login." count={user.email} />
        <section className="acq" aria-labelledby="mf-t" style={{ marginTop: "clamp(28px,4vw,48px)" }}>
          <div className="acq-aside"><p className="lab">Autenticador</p><h2 id="mf-t">Código no <em>celular.</em></h2>
            {mustEnroll ? <Notice icon="shield">Para administradores, a verificação em duas etapas é obrigatória. Ative para abrir o painel.</Notice>
              : <p>Mesmo que alguém descubra sua senha, não entra sem o código do seu aparelho.</p>}</div>
          <div className="acq-main"><MfaManager after={mustEnroll ? "/admin" : undefined} /></div>
        </section>
      </div>
    </PublicShell>
  );
}
