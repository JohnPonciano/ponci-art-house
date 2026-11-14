import type { Metadata } from "next";
import Link from "next/link";
import { inviteCard, artUrl } from "@/lib/invite";
import { Icon } from "@/components/Icon";

type P = { params: Promise<{ code: string }> };
const who = (n?: string) => (n ? n.split(" ")[0] : "você");

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const code = (await params).code.toUpperCase(); const c = await inviteCard(code);
  const title = c.inviter ? `${c.inviter} convida ${who(c.invitee)} para a PONCI` : "Convite para a PONCI";
  const description = "Rede privada de artistas e colecionadores. Acesso só por convite: compra direta do ateliê, com curadoria e transação em custódia.";
  return { title, description, robots: { index: false, follow: false },
    openGraph: { title, description, type: "website", siteName: "PONCI", locale: "pt_BR", url: `/convite/${code}` },
    twitter: { card: "summary_large_image", title, description } };
}

export default async function Convite({ params }: P) {
  const code = (await params).code.toUpperCase(); const c = await inviteCard(code);
  const ok = c.valid && !!c.role;
  return (
    <main className="invite-page">
      <div className="invite-card">
        <div className="invite-copy">
          <p className="invite-lab"><i />Convite · rede privada de arte</p>
          <p className="invite-mark">PONCI</p>
          {ok ? <>
            <h1><em>{c.inviter}</em> convida {who(c.invitee)} para a rede.</h1>
            <p className="invite-sub">{c.inviter_role === "artist" ? `${c.inviter_practice ? c.inviter_practice + " · " : ""}${c.inviter_city}` : c.inviter_city}</p>
            <ul className="invite-ticks">
              <li>Entrada como <b>{c.role === "artist" ? "artista" : "colecionador"}</b></li>
              <li>Obras direto do ateliê, com curadoria</li>
              <li>Pagamento em custódia até a entrega</li>
            </ul>
            <Link className="btn invite-cta" href={`/cadastro?codigo=${code}&perfil=${c.role === "artist" ? "artista" : "colecionador"}`}>Aceitar convite <Icon n="right" /></Link>
            <p className="invite-fine">Válido para 1 pessoa · código {code}. A PONCI confirma cada novo membro antes de liberar o acesso.</p>
          </> : <>
            <h1>Este convite {c.inviter ? "já foi usado" : "não existe"}.</h1>
            <p className="invite-sub">Peça um novo convite a quem indicou você, ou solicite acesso à curadoria.</p>
            <Link className="btn invite-cta" href="/#acesso">Solicitar acesso <Icon n="right" /></Link>
          </>}
        </div>
        <div className="invite-wall" aria-hidden={!c.art}>
          {c.art?.path ? <figure>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={artUrl(c.art.path)} alt={`${c.art.title}, de ${c.inviter}`} /><figcaption>{c.art.title}</figcaption></figure>
            : <div className="invite-comp"><span /><span /><span /></div>}
        </div>
      </div>
    </main>
  );
}
