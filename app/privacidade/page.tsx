import { DocPage } from "@/components/DocPage";

export const metadata = { title: "Política de Privacidade" };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ v?: string }> }) {
  return <DocPage slug="privacidade" v={(await searchParams).v} />;
}
