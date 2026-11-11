import Link from "next/link";
import { redirect } from "next/navigation";
import { AreaShell } from "@/components/Shells";
import { PageHead, SecHead, Notice, Empty } from "@/components/ui";
import { KycForm } from "@/components/forms/KycForm";
import { RequestForm, REQUEST_KINDS } from "@/components/forms/RequestForm";
import { Icon } from "@/components/Icon";
import { getMe, myKyc, createClient, authLevel, DOC_PATH } from "@/lib/supabase/server";
import { ARTIST_NAV, BUYER_NAV } from "@/lib/nav";
import { dateBR } from "@/lib/format";

export const metadata = { title: "Minha conta" };
export const dynamic = "force-dynamic";
const RS: Record<string, [string, string]> = { aberta: ["Aberta", "t-open"], em_andamento: ["Em andamento", "t-countered"], concluida: ["Concluída", "t-accepted"], negada: ["Negada", "t-declined"] };

export default async function Conta() {
  const me = await getMe();
  if (!me) redirect("/entrar");
  const sb = await createClient();
  const [kyc, lvl, acc, reqs, factors] = await Promise.all([
    myKyc(), authLevel(),
    sb.from("acceptances").select("id,doc_slug,doc_version,doc_sha256,method,accepted_at,ip").eq("user_id", me.id).order("accepted_at", { ascending: false }),
    sb.from("member_requests").select("id,ref,kind,details,status,response,created_at,resolved_at").eq("user_id", me.id).order("created_at", { ascending: false }),
    sb.auth.mfa.listFactors(),
  ]);
  const mfaOn = (factors.data?.totp || []).some((f) => f.status === "verified");
  const A = me.role === "artist";
  return (
    <AreaShell me={me} nav={A ? ARTIST_NAV : BUYER_NAV} tag={A ? "Área do artista" : "Área do colecionador"}>
      <div className="wrap">
        <PageHead title="Conta" label="Minha conta" intro="Identificação, segurança, documentos aceitos e seus direitos sobre os dados pessoais." count={<>{me.member_code}<br />{me.email}</>} />

        <section className="sub-sec" id="identificacao" aria-labelledby="id-t">
          <SecHead n="01" eyebrow="Identificação" title={kyc?.completed_at ? <>Cadastro <em>completo</em></> : <>Complete seu <em>cadastro</em></>} id="id-t" />
          <div className="acq" style={{ margin: 0, borderTop: 0 }}>
            <div className="acq-aside"><p>Exigido para negociar, publicar obras e assinar contratos. A PONCI identifica todos os membros, como determina a Lei 9.613/98 para o comércio de arte.</p>
              <Notice icon="shield">Seus dados ficam visíveis só para você e para a administração. No contrato de uma venda, a outra parte vê seu nome e o documento mascarado.</Notice>
              {kyc?.completed_at && <p className="lab">Atualizado em {dateBR(kyc.completed_at)}</p>}</div>
            <div className="acq-main"><KycForm kyc={kyc} artist={A} /></div>
          </div>
        </section>

        {A && <section className="sub-sec" aria-labelledby="pp-t">
          <SecHead n="—" eyebrow="Perfil público" title={<>Como os colecionadores <em>veem você</em></>} id="pp-t" href="/artista/perfil" linkText="Editar perfil" />
        </section>}
        <section className="sub-sec" aria-labelledby="sg-t">
          <SecHead n="02" eyebrow="Segurança" title={mfaOn ? <>Verificação em <em>duas etapas</em></> : <>Proteja sua <em>conta</em></>} id="sg-t" href="/seguranca" linkText={mfaOn ? "Gerenciar" : "Ativar agora"} />
          <div style={{ paddingTop: 16 }}><Notice icon={mfaOn ? "check" : "info"}>{mfaOn
            ? `Ativa. Depois da senha, a PONCI pede o código do seu aplicativo autenticador${lvl.current === "aal2" ? " (esta sessão já foi verificada)" : ""}.`
            : "Recomendado: além da senha, peça um código do aplicativo autenticador (Google Authenticator, 1Password, Authy) a cada login."}</Notice></div>
        </section>

        <section className="sub-sec" aria-labelledby="dc-t">
          <SecHead n="03" eyebrow="Documentos" title={<>Aceites <em>registrados</em></>} id="dc-t" />
          {(acc.data || []).length ? <div className="ledger">{(acc.data || []).map((a: any) => (
            <div className="arow" key={a.id}>
              <span>{dateBR(a.accepted_at)}<small>{a.method === "cadastro" ? "No cadastro" : a.method === "seed" ? "Conta demo" : "Aceite"}</small></span>
              <span className="who-b"><b><Link href={`${DOC_PATH[a.doc_slug]}?v=${a.doc_version}`}>{({ termos: "Termos de Uso", privacidade: "Política de Privacidade", "contrato-artista": "Contrato — Artista", "contrato-colecionador": "Condições de Compra" } as any)[a.doc_slug]}</Link></b><span>Versão {a.doc_version}</span></span>
              <span className="det"><span className="hash">SHA-256 {a.doc_sha256}</span>{a.ip && <span className="hash">IP {a.ip}</span>}</span>
              <span className="act" />
            </div>))}</div> : <Empty sm title="Nenhum aceite registrado." />}
        </section>

        <section className="sub-sec" aria-labelledby="pv-t">
          <SecHead n="04" eyebrow="Privacidade" title={<>Seus <em>direitos</em></>} id="pv-t" href="/privacidade" linkText="Política de privacidade" />
          <div className="acq" style={{ margin: 0, borderTop: 0 }}>
            <div className="acq-aside"><p>Pela LGPD você pode acessar, corrigir, levar ou pedir a exclusão dos seus dados. Respondemos em até 15 dias.</p>
              <a className="btn ghost" href="/conta/exportar" download>Baixar meus dados (JSON) <Icon n="upload" /></a></div>
            <div className="acq-main"><RequestForm /></div>
          </div>
          {(reqs.data || []).length > 0 && <div className="ledger" style={{ marginTop: 24 }}>{(reqs.data || []).map((r: any) => (
            <div className="arow" key={r.id}>
              <span>{r.ref}<small>{dateBR(r.created_at)}</small><span className={"tag " + RS[r.status][1]}>{RS[r.status][0]}</span></span>
              <span className="who-b"><b>{REQUEST_KINDS[r.kind]}</b></span>
              <span className="det">{r.details && <q>{r.details}</q>}{r.response && <span><b style={{ color: "var(--ink)" }}>Resposta:</b> {r.response}</span>}</span>
              <span className="act" />
            </div>))}</div>}
        </section>
        <div style={{ height: "clamp(72px,10vw,140px)" }} />
      </div>
    </AreaShell>
  );
}
