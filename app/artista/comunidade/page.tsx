import { requireMember } from "@/lib/supabase/server";
import { CommunityFeed } from "@/components/Community";

export const metadata = { title: "Comunidade" };

export default async function Comunidade({ searchParams }: { searchParams: Promise<{ aba?: string; t?: string; antes?: string }> }) {
  const me = await requireMember("artist");
  return <CommunityFeed me={me} base="/artista/comunidade" sp={await searchParams} />;
}
