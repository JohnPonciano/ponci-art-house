import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PublicShell } from "@/components/Shells";
import { PageHead, Notice } from "@/components/ui";
import { Markdown } from "@/components/Markdown";
import { SignButton } from "@/components/area-client";
import { PrintButton } from "@/components/PrintButton";
import { createClient, getMe, adminByEmail } from "@/lib/supabase/server";
import { dateBR } from "@/lib/format";

export const metadata = { title: "Contrato", robots: { index: false } };
export const dynamic = "force-dynamic";
const PARTY: Record<string, string> = { artista: "Vendedor (artista)", comprador: "Comprador (colecionador)", intermediadora: "Intermediadora" };

export default async function Contrato({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/entrar");
  const { data: c } = await sb.from("contracts")
    .select("id,ref,body,sha256,created_at,order:orders(ref,buyer_id,stage,work:works(artist_id,slug,title)),signatures:contract_signatures(party,name,signed_at,method,ip)")
    .eq("ref", ref).maybeSingle();
  if (!c) notFound();
  const o: any = Array.isArray(c.order) ? c.order[0] : c.order; const w: any = Array.isArray(o.work) ? o.work[0] : o.work;
  const sigs: any[] = (c.signatures as any[]) || [];
  const me = await getMe();
  const party = o.buyer_id === user.id ? "comprador" : w.artist_id === user.id ? "artista" : null;
  const back = party === "comprador" ? "/colecionador/aquisicoes" : party === "artista" ? "/artista/vendas" : (await adminByEmail()) ? "/admin/compliance" : "/";
  const order = ["artista", "comprador", "intermediadora"];
  return (
    <PublicShell me={me}>
      <div className="wrap">
        <PageHead title="Contrato" label={c.ref} intro={<>Instrumento de compra e venda da obra <em>{w.title}</em>, pedido {o.ref}.</>} count={<>Emitido em<br />{dateBR(c.created_at)}</>} />
        <div className="doc-wrap">
          <aside className="doc-side">
            <div><p className="lab">Impressão digital (SHA-256)</p><p className="hash">{c.sha256}</p></div>
            <div><p className="lab">Assinaturas</p>
              <ul className="sig-list">{order.map((p) => { const s = sigs.find((x) => x.party === p); return (
                <li key={p}><span>{PARTY[p]}</span>{s ? <><b>{s.name}</b><span>{new Date(s.signed_at).toLocaleString("pt-BR")} · {s.method === "automatica" ? "automática" : s.method === "seed" ? "demonstração" : "eletrônica"}{s.ip ? ` · IP ${s.ip}` : ""}</span></>
                  : <b style={{ color: "var(--ocre)" }}>Aguardando assinatura</b>}</li>); })}</ul></div>
            {party && !sigs.some((s) => s.party === party) && <SignButton contractId={c.id} />}
            <PrintButton />
            <Link className="linkbtn" href={back} style={{ alignSelf: "flex-start" }}>Voltar</Link>
            <Notice>A assinatura vale para este texto exato. Qualquer alteração mudaria a impressão digital acima.</Notice>
          </aside>
          <article className="doc-main"><Markdown text={c.body} /></article>
        </div>
      </div>
    </PublicShell>
  );
}
