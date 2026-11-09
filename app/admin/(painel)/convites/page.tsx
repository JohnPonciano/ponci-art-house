import { invites } from "@/lib/admin";
import { PageHead, Empty } from "@/components/ui";
import { InviteRow } from "@/components/admin";
import { NewInviteForm } from "@/components/admin-client";

export const metadata = { title: "Convites" };

export default async function Convites() {
  const is = await invites();
  return (
    <div className="wrap">
      <PageHead title="Convites" label="Códigos de acesso" intro="Gere um código para convidar alguém diretamente, sem pedido. O papel (artista ou colecionador) vem do código." count={`${is.filter((i) => i.uses_left > 0).length} ativos`} />
      <section className="acq" aria-labelledby="ni-t" style={{ margin: "clamp(28px,4vw,48px) 0 0" }}>
        <div className="acq-aside"><p className="lab">Novo</p><h2 id="ni-t">Convidar <em>alguém.</em></h2><p>Copie a mensagem gerada e envie por WhatsApp ou e-mail. O link já abre o cadastro com o código preenchido.</p></div>
        <div className="acq-main"><NewInviteForm /></div>
      </section>
      <div style={{ margin: "clamp(36px,5vw,64px) 0 clamp(72px,10vw,140px)" }}>
        {is.length ? <div className="ledger">{is.map((i) => <InviteRow key={i.code} i={i} />)}</div> : <Empty sm title="Nenhum convite." />}
      </div>
    </div>
  );
}
