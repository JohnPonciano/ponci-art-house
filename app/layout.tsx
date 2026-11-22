import type { Metadata, Viewport } from "next";
import { Archivo, Instrument_Serif, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import { headers } from "next/headers";
import { isCommunityHost } from "@/lib/site";
import { Concrete } from "@/components/Concrete";
import { ToastProvider } from "@/components/Toast";
import { CookieConsent } from "@/components/CookieConsent";

const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], style: ["normal", "italic"], variable: "--font-archivo", display: "swap" });
const instrument = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-instrument", display: "swap" });
const plex = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-plex", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://ponci.art"),
  title: { default: "PONCI — Rede privada de arte", template: "%s — PONCI" },
  description: "Rede fechada, por convite, onde artistas e colecionadores compram e vendem obras de arte diretamente, com curadoria e transação em custódia.",
  applicationName: "PONCI",
  manifest: "/manifest.webmanifest",
  icons: { icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }], apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }] },
  appleWebApp: { capable: true, title: "PONCI", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false, email: false, address: false },
  // pede a ferramentas de IA que não usem textos e imagens do site (convenção noai/noimageai)
  robots: "index, follow, noai, noimageai",
  // verificação do domínio no Meta (Facebook/Instagram)
  other: { "facebook-domain-verification": "2vb2pwqyrm97omdi3rm1rvb47pcj1v" },
};
export const viewport: Viewport = {
  width: "device-width", initialScale: 1, viewportFit: "cover",
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#121211" }, { media: "(prefers-color-scheme: dark)", color: "#0A0A09" }],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // um container do Tag Manager para cada produto: site principal e comunidade.ponci.art
  const com = isCommunityHost((await headers()).get("host"));
  const gtm = com ? "GTM-WMFJVRXD" : "GTM-TZRKM9K6";
  const ga4 = com ? "G-K7WLX4WSRV" : "G-N7R525NZ0Y";
  return (
    <html lang="pt-BR" className={`${archivo.variable} ${instrument.variable} ${plex.variable}`}>
      <body className="book">
        {/* Google Tag Manager */}
        {/* Consentimento (LGPD + Consent Mode v2): tudo negado até a pessoa escolher; a escolha vale para *.ponci.art */}
        <Script id="gtm-init" strategy="beforeInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
var c=(document.cookie.match(/(?:^|; )ponci-consent=([^;]+)/)||[])[1]||'';var a=c.indexOf('a1')>-1,m=c.indexOf('m1')>-1;
gtag('consent','default',{analytics_storage:a?'granted':'denied',ad_storage:m?'granted':'denied',ad_user_data:m?'granted':'denied',ad_personalization:m?'granted':'denied',functionality_storage:'granted',security_storage:'granted',wait_for_update:500});
gtag('set','ads_data_redaction',true);gtag('js',new Date());gtag('config','${ga4}');`}</Script>
        {/* Google Analytics 4 (as trocas de página no app são medidas pelo histórico do navegador) */}
        <Script id="ga4" strategy="afterInteractive" src={`https://www.googletagmanager.com/gtag/js?id=${ga4}`} />
        <Script id="gtm" strategy="afterInteractive" src={`https://www.googletagmanager.com/gtm.js?id=${gtm}`} />
        <Concrete />
        <ToastProvider>{children}</ToastProvider>
        <CookieConsent />
      </body>
    </html>
  );
}
