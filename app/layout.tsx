import type { Metadata, Viewport } from "next";
import { Archivo, Instrument_Serif, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Concrete } from "@/components/Concrete";
import { ToastProvider } from "@/components/Toast";

const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], style: ["normal", "italic"], variable: "--font-archivo", display: "swap" });
const instrument = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-instrument", display: "swap" });
const plex = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-plex", display: "swap" });

export const metadata: Metadata = {
  title: { default: "PONCI — Rede privada de arte", template: "%s — PONCI" },
  description: "Rede fechada, por convite, onde artistas e colecionadores compram e vendem obras de arte diretamente, com curadoria e transação em custódia.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#121211" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${archivo.variable} ${instrument.variable} ${plex.variable}`}>
      <body>
        <Concrete />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
