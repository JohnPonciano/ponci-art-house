import { rnCtx } from "@/lib/rn";
import { officialId } from "@/lib/diary";
import { StoryComposer } from "@/components/rn/StoryComposer";
import { redirect } from "next/navigation";

export const metadata = { title: "Novo story" };
export default async function NovoStory() {
  const { me, base, isAdmin } = await rnCtx();
  const uid = isAdmin ? await officialId() : me.id;
  if (!uid) redirect(base || "/");
  return (
    <div className="rn-wrap rn-narrow">
      <h1 className="rn-h1">{isAdmin ? "Story da PONCI" : "Novo story"}</h1>
      <StoryComposer userId={uid} base={base} asPonci={isAdmin} />
    </div>
  );
}
