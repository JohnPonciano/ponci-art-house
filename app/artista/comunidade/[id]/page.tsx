import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { communityHome } from "@/lib/site";
export default async function Publicacao({ params }: { params: Promise<{ id: string }> }) {
  redirect(communityHome((await headers()).get("host")) + "/p/" + (await params).id);
}
