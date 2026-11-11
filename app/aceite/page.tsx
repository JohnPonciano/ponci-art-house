import Link from "next/link";
import { redirect } from "next/navigation";
import { PublicShell } from "@/components/Shells";
import { PageHead } from "@/components/ui";
import { AcceptForm } from "@/components/forms/AcceptForm";
import { getMe, pendingDocs, DOC_PATH } from "@/lib/supabase/server";
import { dateBR } from "@/lib/format";

export const metadata = { title: "Aceite de documentos" };
export const dynamic = "force-dynamic";

export default async function Aceite({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const me = await getMe();
  if (!me) redirect("/entrar");
  const home = me.role === "artist" ? "/artista" : "/colecionador";
  const n = (await searchParams).next;
  const next = n && n.startsWith("/") && !n.startsWith("//") ? n : home;
  const docs = await pendingDocs();
  if (!docs.length) redirect(next);
  return (
    <PublicShell me={me}>
      <div className="wrap">
        <PageHead title="Termos" label="Aceite necessário" intro="Há documentos novos ou atualizados. Para continuar usando a rede, leia e aceite as versões vigentes." count={`${docs.length} ${docs.length === 1 ? "documento" : "documentos"}`} />
        <section className="acq" aria-labelledby="ac-t" style={{ marginTop: "clamp(28px,4vw,48px)" }}>
          <div className="acq-aside"><p className="lab">Documentos</p><h2 id="ac-t">Antes de <em>continuar.</em></h2>
            <p>Cada documento abre numa nova aba. A versão e a impressão digital (SHA-256) ficam guardadas junto com o seu aceite.</p></div>
          <div className="acq-main">
            <ul className="sig-list" style={{ marginBottom: 20 }}>
              {docs.map((d) => <li key={d.id}><Link href={DOC_PATH[d.slug]} target="_blank" className="linkbtn" style={{ alignSelf: "flex-start", fontSize: 13 }}>{d.title}</Link>
                <span>Versão {d.version} · publicada em {dateBR(d.published_at)} · SHA-256 {d.sha256.slice(0, 16)}…</span><p style={{ color: "var(--muted)", margin: 0 }}>{d.summary}</p></li>)}
            </ul>
            <AcceptForm ids={docs.map((d) => d.id)} next={next} />
          </div>
        </section>
      </div>
    </PublicShell>
  );
}
