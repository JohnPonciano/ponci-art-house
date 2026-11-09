import { PublicShell } from "@/components/Shells";
import { PageHead, Slab } from "@/components/ui";
import { ForgotForm } from "@/components/forms/ResetForms";
import { DEMO_ART } from "@/lib/demoArt";

export const metadata = { title: "Esqueci minha senha" };

export default function Senha() {
  return (
    <PublicShell>
      <div className="wrap">
        <PageHead title="Senha" label="Acesso" intro="Mandamos um link para o seu e-mail. Por ele você cria uma nova senha." count={<>Membros<br />da rede</>} />
        <section className="gate" aria-labelledby="pw-t">
          <div className="gate-art" aria-hidden="true"><Slab a={DEMO_ART.convite} label="Na rede" /></div>
          <div className="gate-main"><p className="lab">Redefinir</p><h2 id="pw-t">Esqueceu a <em>senha?</em></h2><p>Informe o e-mail da sua conta de membro.</p><ForgotForm /></div>
        </section>
      </div>
    </PublicShell>
  );
}
