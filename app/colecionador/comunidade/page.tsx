import { requireMember } from "@/lib/supabase/server";
import { CommunityFeed } from "@/components/Community";

export const metadata = { title: "Comunidade" };

export default async function Comunidade({ searchParams }: { searchParams: Promise<{ aba?: string; t?: string; antes?: string }> }) {
  const me = await requireMember("buyer");
  return <CommunityFeed me={me} base="/colecionador/comunidade" sp={await searchParams} />;
}
