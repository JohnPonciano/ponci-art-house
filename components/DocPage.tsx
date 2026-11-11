import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicShell } from "./Shells";
import { PageHead } from "./ui";
import { Markdown } from "./Markdown";
import { createClient, getMe, DOC_PATH, type LegalDoc } from "@/lib/supabase/server";
import { dateBR } from "@/lib/format";

export async function DocPage({ slug, v }: { slug: string; v?: string }) {
  const sb = await createClient();
  const { data } = await sb.from("legal_documents").select("id,slug,version,title,summary,body,sha256,published_at").eq("slug", slug).order("version", { ascending: false });
  const all = (data as LegalDoc[]) || [];
  if (!all.length) notFound();
  const doc = (v && all.find((d) => String(d.version) === v)) || all[0];
  const me = await getMe();
  return (
    <PublicShell me={me}>
      <div className="wrap">
        <PageHead title={slug === "termos" ? "Termos" : slug === "privacidade" ? "Privacidade" : "Contrato"} label={doc.title}
          intro={doc.summary} count={<>Versão {doc.version}<br />{dateBR(doc.published_at)}</>} />
        <div className="doc-wrap">
          <aside className="doc-side">
            <p className="lab" style={{ color: "var(--ink)" }}>Versão {doc.version}{doc === all[0] ? " · vigente" : " · anterior"}</p>
            <div><p className="lab">Impressão digital (SHA-256)</p><p className="hash">{doc.sha256}</p></div>
            {all.length > 1 && <div><p className="lab">Histórico</p>{all.map((d) => <p key={d.id}><Link className="linkbtn" href={`${DOC_PATH[slug]}?v=${d.version}`}>Versão {d.version} · {dateBR(d.published_at)}</Link></p>)}</div>}
            <p className="lab">Outros documentos</p>
            {Object.entries(DOC_PATH).filter(([s]) => s !== slug).map(([s, href]) => <Link key={s} className="linkbtn" href={href} style={{ alignSelf: "flex-start" }}>{({ termos: "Termos de Uso", privacidade: "Política de Privacidade", "contrato-artista": "Contrato — Artista", "contrato-colecionador": "Condições de Compra" } as any)[s]}</Link>)}
          </aside>
          <article className="doc-main"><Markdown text={doc.body} /></article>
        </div>
      </div>
    </PublicShell>
  );
}
