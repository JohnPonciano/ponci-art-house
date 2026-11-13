import { requireMember } from "@/lib/supabase/server";
import { CommunityPost } from "@/components/Community";

export const metadata = { title: "Comunidade" };

export default async function Publicacao({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireMember("artist");
  return <CommunityPost me={me} base="/artista/comunidade" id={(await params).id} />;
}
