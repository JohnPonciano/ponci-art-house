import { redirect } from "next/navigation";
import { PublicShell } from "@/components/Shells";
import { PageHead, Notice } from "@/components/ui";
import { MfaChallenge } from "@/components/forms/Mfa";
import { createClient, authLevel } from "@/lib/supabase/server";
import { safeNext } from "@/lib/site";

export const metadata = { title: "Verificação" };
export const dynamic = "force-dynamic";

export default async function Verificacao({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const n = (await searchParams).next;
  const next = safeNext(n) || "/entrar/redirecionar";
  const { data: { user } } = await (await createClient()).auth.getUser();
  if (!user) redirect("/entrar");
  const lvl = await authLevel();
  if (!lvl.needsCode) redirect(next);
  return (
    <PublicShell>
      <div className="wrap">
        <PageHead title="Código" label="Verificação em duas etapas" intro="Digite o código de 6 dígitos que aparece agora no seu aplicativo autenticador." count={user.email} />
        <section className="acq" aria-labelledby="vf-t" style={{ marginTop: "clamp(28px,4vw,48px)" }}>
          <div className="acq-aside"><p className="lab">Segurança</p><h2 id="vf-t">Mais uma <em>etapa.</em></h2>
            <Notice icon="shield">Perdeu o celular? Fale com a administração da PONCI para recuperar o acesso com verificação de identidade.</Notice></div>
          <div className="acq-main"><MfaChallenge next={next} /></div>
        </section>
      </div>
    </PublicShell>
  );
}
