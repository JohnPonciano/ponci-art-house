import { requireMember } from "@/lib/supabase/server";
import { CommunityPost } from "@/components/Community";

export const metadata = { title: "Comunidade" };

export default async function Publicacao({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireMember("buyer");
  return <CommunityPost me={me} base="/colecionador/comunidade" id={(await params).id} />;
}
