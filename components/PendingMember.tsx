import { PageHead, Notice } from "./ui";
import type { Me } from "@/lib/supabase/server";

export function PendingMember({ me }: { me: Me }) {
  const susp = me.status === "suspended";
  return (
    <div className="wrap" style={{ paddingBottom: "clamp(72px,10vw,140px)" }}>
      <PageHead title={susp ? "Suspenso" : "Aguardando"} label={me.role === "artist" ? "Área do artista" : "Área do colecionador"}
        intro={susp ? "Seu acesso à rede está suspenso. Fale com a curadoria da PONCI para entender o motivo."
          : <>Sua conta foi criada. A curadoria da PONCI <em>confirma cada novo membro</em> antes de liberar o acesso à rede.</>}
        count={<>{me.member_code}<br />{me.email}</>} />
      <div style={{ marginTop: 24 }}><Notice icon="shield">{susp ? "Enquanto isso, obras, preços e negociações ficam ocultos." : "Você recebe acesso assim que a aprovação for feita. Não é preciso fazer nada agora."}</Notice></div>
    </div>
  );
}
