import { DocPage } from "@/components/DocPage";

export const metadata = { title: "Condições Gerais de Compra" };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ v?: string }> }) {
  return <DocPage slug="contrato-colecionador" v={(await searchParams).v} />;
}
