import { PublicShell } from "@/components/Shells";
import { PageHead, Slab, Empty } from "@/components/ui";
import { DEMO_ART } from "@/lib/demoArt";
import { ConfirmForm } from "./ConfirmForm";

export const metadata = { title: "Confirmar", robots: { index: false } };

const COPY: Record<string, { title: string; heading: string; text: string; label: string }> = {
  recovery: { title: "Senha", heading: "Redefinir senha", text: "Continue para escolher uma nova senha.", label: "Continuar" },
  email: { title: "Confirmar", heading: "Confirmar e-mail", text: "Continue para ativar sua conta de membro.", label: "Confirmar e-mail" },
  signup: { title: "Confirmar", heading: "Confirmar e-mail", text: "Continue para ativar sua conta de membro.", label: "Confirmar e-mail" },
  email_change: { title: "E-mail", heading: "Confirmar novo e-mail", text: "Continue para concluir a troca de e-mail.", label: "Confirmar troca" },
  magiclink: { title: "Entrar", heading: "Entrar na rede", text: "Continue para entrar na sua conta.", label: "Entrar" },
  invite: { title: "Convite", heading: "Aceitar convite", text: "Continue para aceitar o convite.", label: "Aceitar convite" },
};

// Página intermediária: filtros de e-mail que abrem links automaticamente não consomem o token.
export default async function Confirm({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const c = COPY[sp.type] || COPY.email;
  return (
    <PublicShell>
      <div className="wrap">
        <PageHead title={c.title} label="Acesso" intro={c.text} count={<>Link de<br />uso único</>} />
        {sp.token_hash && COPY[sp.type] ? (
          <section className="gate" aria-labelledby="cf-t">
            <div className="gate-art" aria-hidden="true"><Slab a={DEMO_ART.convite} label="Na rede" /></div>
            <div className="gate-main"><p className="lab">Confirmação</p><h2 id="cf-t">{c.heading}</h2><p>{c.text}</p>
              <ConfirmForm token_hash={sp.token_hash} type={sp.type} next={sp.next || ""} label={c.label} /></div>
          </section>
        ) : (
          <div style={{ margin: "32px 0 clamp(72px,10vw,140px)" }}><Empty title="Link incompleto." body="Abra o link completo que chegou no seu e-mail, ou peça um novo." /></div>
        )}
      </div>
    </PublicShell>
  );
}
