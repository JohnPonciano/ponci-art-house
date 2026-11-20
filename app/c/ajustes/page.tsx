import Link from "next/link";
import { redirect } from "next/navigation";
import { rnCtx } from "@/lib/rn";
import { ProfileSettings } from "@/components/ProfileSettings";
import { ShowNameToggle } from "@/components/diary-client";
import { Icon } from "@/components/Icon";

export const metadata = { title: "Editar perfil" };

export default async function Ajustes() {
  const { me, base, main, isAdmin } = await rnCtx();
  if (isAdmin) redirect(base || "/");
  const back = `${base}/u/${me.handle || me.member_code}`;
  return (
    <div className="rn-wrap rn-narrow ps-page">
      <Link className="backlink always" href={back}><Icon n="left" />Perfil</Link>
      <h1 className="rn-h1">Editar perfil</h1>
      {me.role === "buyer" && <div style={{ marginBottom: 18 }}><ShowNameToggle initial={!!me.show_name} code={me.member_code} /></div>}
      <ProfileSettings me={me as any} after={`${base}/u/`} />
      <p className="hint" style={{ marginTop: 24 }}>Documentos, segurança e dados de cadastro ficam na <a href={`${main}/conta`} style={{ textDecoration: "underline" }}>sua conta da PONCI</a>.</p>
    </div>
  );
}
