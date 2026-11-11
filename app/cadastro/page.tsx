import type { Metadata } from "next";
import { PublicShell } from "@/components/Shells";
import { PageHead, Slab, Notice } from "@/components/ui";
import { SignupForm } from "@/components/forms/SignupForm";
import { DEMO_ART } from "@/lib/demoArt";
import { currentDocs, createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Aceitar convite" };

export const dynamic = "force-dynamic";

export default async function Cadastro({ searchParams }: { searchParams: Promise<{ perfil?: string; codigo?: string }> }) {
  const sp = await searchParams;
  const prefill = sp.codigo ? ((await (await createClient()).rpc("invite_prefill", { p_code: sp.codigo })).data as any) : null;
  const perfil = sp.perfil === "colecionador" ? "colecionador" : "artista";
  return (
    <PublicShell>
      <div className="wrap">
        <PageHead title="Convite" label="Novo membro" intro="Recebeu um código da curadoria? Crie aqui a sua conta de membro. O código define se você entra como artista ou colecionador." count={<>Somente<br />por convite</>} />
        <section className="gate" aria-labelledby="cad-t">
          <div className="gate-art" aria-hidden="true"><Slab a={DEMO_ART.convite} label="Na rede" /></div>
          <div className="gate-main">
            <p className="lab">Cadastro</p>
            <h2 id="cad-t">{prefill?.name ? <>Olá, {String(prefill.name).split(" ")[0]}. <em>Falta pouco.</em></> : <>Aceite o seu <em>convite.</em></>}</h2>
            <p>{prefill?.name ? "Seu pedido foi aprovado. Já temos seus dados; só precisamos do CPF, do celular e de uma senha." : "Cada código tem um número limitado de usos e é ligado a um perfil."}</p>
            <SignupForm perfil={prefill?.role === "buyer" ? "colecionador" : prefill?.role === "artist" ? "artista" : perfil} code={prefill ? sp.codigo : ""} prefill={prefill} docIds={(await currentDocs()).map((d) => d.id)} />
            {!prefill?.name && <Notice>Para testar: <b>PONCI-ARTISTA-2026</b> (artista) ou <b>PONCI-COLECAO-2026</b> (colecionador). Contas criadas com esses códigos ficam aguardando a aprovação da curadoria.</Notice>}
          </div>
        </section>
      </div>
    </PublicShell>
  );
}
