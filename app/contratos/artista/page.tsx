import { DocPage } from "@/components/DocPage";

export const metadata = { title: "Contrato de Intermediação — Artista" };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ v?: string }> }) {
  return <DocPage slug="contrato-artista" v={(await searchParams).v} />;
}
