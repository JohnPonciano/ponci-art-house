import type { Metadata } from "next";
import { PublicShell } from "@/components/Shells";
import { PageHead, Slab, Notice } from "@/components/ui";
import { SignupForm } from "@/components/forms/SignupForm";
import { DEMO_ART } from "@/lib/demoArt";

export const metadata: Metadata = { title: "Aceitar convite" };

export default async function Cadastro({ searchParams }: { searchParams: Promise<{ perfil?: string; codigo?: string }> }) {
  const sp = await searchParams;
  const perfil = sp.perfil === "colecionador" ? "colecionador" : "artista";
  return (
    <PublicShell>
      <div className="wrap">
        <PageHead title="Convite" label="Novo membro" intro="Recebeu um código da curadoria? Crie aqui a sua conta de membro. O código define se você entra como artista ou colecionador." count={<>Somente<br />por convite</>} />
        <section className="gate" aria-labelledby="cad-t">
          <div className="gate-art" aria-hidden="true"><Slab a={DEMO_ART.convite} label="Na rede" /></div>
          <div className="gate-main">
            <p className="lab">Cadastro</p>
            <h2 id="cad-t">Aceite o seu <em>convite.</em></h2>
            <p>Cada código tem um número limitado de usos e é ligado a um perfil.</p>
            <SignupForm perfil={perfil} code={sp.codigo} />
            <Notice>Para testar: <b>PONCI-ARTISTA-2026</b> (artista) ou <b>PONCI-COLECAO-2026</b> (colecionador). Contas criadas com esses códigos ficam aguardando a aprovação da curadoria.</Notice>
          </div>
        </section>
      </div>
    </PublicShell>
  );
}
