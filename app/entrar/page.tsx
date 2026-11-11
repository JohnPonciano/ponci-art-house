import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PublicShell } from "@/components/Shells";
import { PageHead, Slab } from "@/components/ui";
import { LoginForm } from "@/components/forms/LoginForm";
import { DEMO_ART } from "@/lib/demoArt";
import { adminByEmail, getMe } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Entrar" };

export default async function Entrar({ searchParams }: { searchParams: Promise<{ perfil?: string; next?: string; erro?: string }> }) {
  const sp = await searchParams;
  const perfil = sp.perfil === "colecionador" ? "colecionador" : "artista";
  if (await adminByEmail()) redirect("/admin");
  const me = await getMe();
  if (me) redirect(me.role === "artist" ? "/artista" : "/colecionador");
  const A = perfil === "artista";
  return (
    <PublicShell>
      <div className="wrap">
        <PageHead title={A ? "Artistas" : "Colecionadores"} label={A ? "Área do artista" : "Área do colecionador"}
          intro={A ? "Seu ateliê dentro da rede: cadastre obras, acompanhe a curadoria, responda propostas e veja seus repasses."
                   : "O acervo fechado da rede: preços visíveis, propostas diretas às artistas e aquisição em custódia."}
          count={<>Acesso restrito<br />Somente membros</>} />
        <section className="gate" aria-labelledby="gate-t">
          <div className="gate-art" aria-hidden="true"><Slab a={DEMO_ART[perfil]} label="Na rede" /></div>
          <div className="gate-main">
            <p className="lab">Entrar</p>
            <h2 id="gate-t">{A ? <>Ateliê <em>privado.</em></> : <>Acervo <em>fechado.</em></>}</h2>
            <p>{A ? "Entre com o e-mail e a senha da sua conta de artista membro." : "Entre com o e-mail e a senha da sua conta de colecionador."}</p>
            {sp.erro === "link" && <p className="err-box" role="alert">O link do e-mail expirou ou foi aberto em outro navegador. Entre com sua senha ou peça um novo link em “Esqueci a senha”.</p>}
            <LoginForm perfil={perfil} next={sp.next} />
          </div>
        </section>
      </div>
    </PublicShell>
  );
}
