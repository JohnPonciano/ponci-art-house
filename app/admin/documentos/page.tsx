import Link from "next/link";
import { docs, acceptanceCounts } from "@/lib/admin";
import { PageHead, SecHead } from "@/components/ui";
import { PublishDocForm } from "@/components/admin-client";
import { DOC_PATH } from "@/lib/supabase/server";
import { dateBR } from "@/lib/format";

export const metadata = { title: "Documentos" };

export default async function Documentos() {
  const [all, counts] = await Promise.all([docs(), acceptanceCounts()]);
  const slugs = ["termos", "privacidade", "contrato-artista", "contrato-colecionador"];
  return (
    <div className="wrap">
      <PageHead title="Documentos" label="Versões e aceites" intro="Publicar uma nova versão cria um registro imutável com impressão digital (SHA-256). Membros afetados precisam aceitar de novo antes de continuar." count={`${all.length} versões`} />
      {slugs.map((slug, i) => {
        const vs = all.filter((d) => d.slug === slug); const cur = vs[0];
        if (!cur) return null;
        return (
          <section className="sub-sec" key={slug} aria-labelledby={`d-${slug}`}>
            <SecHead n={String(i + 1).padStart(2, "0")} eyebrow={`Versão ${cur.version} vigente`} title={cur.title} id={`d-${slug}`} href={DOC_PATH[slug]} linkText="Ver página pública" />
            <div className="acq" style={{ margin: 0, borderTop: 0 }}>
              <div className="acq-aside">
                <ul className="sig-list">{vs.map((d) => <li key={d.id}><b><Link href={`${DOC_PATH[slug]}?v=${d.version}`}>Versão {d.version}</Link></b>
                  <span>{dateBR(d.published_at)} · {counts[d.id] || 0} aceites</span><span className="hash">{d.sha256.slice(0, 32)}…</span></li>)}</ul>
              </div>
              <div className="acq-main"><details><summary className="linkbtn" style={{ display: "inline-block", cursor: "pointer", margin: "12px 0" }}>Editar e publicar nova versão</summary>
                <PublishDocForm slug={slug} title={cur.title} summary={cur.summary} body={cur.body} /></details></div>
            </div>
          </section>
        );
      })}
      <div style={{ height: "clamp(72px,10vw,140px)" }} />
    </div>
  );
}
