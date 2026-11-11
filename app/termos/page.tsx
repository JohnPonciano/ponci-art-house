import { DocPage } from "@/components/DocPage";

export const metadata = { title: "Termos de Uso" };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ v?: string }> }) {
  return <DocPage slug="termos" v={(await searchParams).v} />;
}
