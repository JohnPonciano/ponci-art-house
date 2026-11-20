import type { Metadata } from "next";
import { PublicShell } from "@/components/Shells";
import { PageHead } from "@/components/ui";
import { CookieLink } from "@/components/CookieConsent";

export const metadata: Metadata = { title: "Cookies" };

const ROWS: [string, string, string, string][] = [
  ["Essenciais", "Sessão de login (sb-*), login único entre ponci.art e a comunidade (ponci-sso), verificação em duas etapas (ponci-aal), sua escolha de cookies (ponci-consent)", "PONCI / Supabase", "Sempre ativos. Sem eles a rede não funciona."],
  ["Medição", "Google Analytics 4 (_ga, _ga_*)", "Google", "Só com o seu consentimento. Conta páginas vistas e uso, sem identificar você."],
  ["Marketing", "Tags configuradas no Google Tag Manager (anúncios e conversões)", "Google e parceiros", "Só com o seu consentimento."],
];

export default function Cookies() {
  return (
    <PublicShell>
      <div className="wrap">
        <PageHead title="Cookies" label="Privacidade" intro="O que guardamos no seu navegador, para quê, e como mudar a sua escolha a qualquer momento." count={<>LGPD<br />Lei 13.709/2018</>} />
        <section className="sub-sec cookies-page">
          <table className="ck-table"><thead><tr><th>Categoria</th><th>O que é</th><th>De quem</th><th>Quando</th></tr></thead>
            <tbody>{ROWS.map((r) => <tr key={r[0]}><td><b>{r[0]}</b></td><td>{r[1]}</td><td>{r[2]}</td><td>{r[3]}</td></tr>)}</tbody></table>
          <p>Sem o seu consentimento, as ferramentas do Google funcionam no modo restrito: não gravam cookies e não usam seus dados para anúncios. A escolha vale para ponci.art e comunidade.ponci.art e fica guardada por 12 meses.</p>
          <p>Para mudar agora: <CookieLink className="ck-open" />. Dúvidas sobre dados pessoais: veja a <a href="/privacidade" style={{ textDecoration: "underline" }}>Política de Privacidade</a> ou peça pela sua Conta, em Solicitações.</p>
        </section>
        <div style={{ height: 80 }} />
      </div>
    </PublicShell>
  );
}
