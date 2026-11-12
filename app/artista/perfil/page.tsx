import { requireMember } from "@/lib/supabase/server";
import { PageHead, Notice } from "@/components/ui";
import { ProfileForm } from "@/components/forms/ProfileForm";

export const metadata = { title: "Perfil" };

export default async function Perfil() {
  const me = await requireMember("artist");
  return (
    <div className="wrap">
      <PageHead title="Perfil" label="Artista membro" intro="O perfil aparece para colecionadores ao lado das suas obras. Dados bancários e documentos ficam na sua Conta, visíveis só para você e a PONCI." count={<>{me.member_code}<br />{me.email}</>} />
      <section className="acq" aria-labelledby="pf-t" style={{ marginTop: "clamp(36px,5vw,64px)" }}>
        <div className="acq-aside"><p className="lab">Membro</p><h2 id="pf-t">{me.display_name}</h2><p>{me.practice} · {me.city}</p>
          <Notice icon="shield">Identidade verificada pela PONCI. Para mudar o nome artístico, fale com a curadoria.</Notice></div>
        <div className="acq-main"><ProfileForm me={me} /></div>
      </section>
    </div>
  );
}
