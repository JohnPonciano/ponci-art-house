import { notFound, redirect } from "next/navigation";
import { rnCtx } from "@/lib/rn";
import { storyGroups } from "@/lib/stories";
import { personName } from "@/lib/community";
import { Avatar } from "@/components/Avatar";
import { StoryViewer } from "@/components/rn/StoryViewer";

export const metadata = { title: "Story" };
export const dynamic = "force-dynamic";

export default async function VerStory({ params }: { params: Promise<{ code: string }> }) {
  const { me, base, isAdmin } = await rnCtx(); const code = (await params).code;
  const groups = await storyGroups(me.id);
  const k = groups.findIndex((g) => g.author.member_code === code || g.author.handle === code);
  if (k < 0) { if (code === me.member_code) redirect(`${base}/s/novo`); notFound(); }
  const g = groups[k];
  // próxima pessoa: quem ainda não foi visto, na ordem da fileira
  const nxt = groups.slice(k + 1).find((x) => x.unseen && !x.mine) || null;
  return <StoryViewer key={g.author.id} stories={g.stories} base={base} mine={g.mine} admin={isAdmin}
    author={{ name: personName(g.author), avatar: <Avatar p={g.author} className="sv-av" /> }}
    profileHref={`${base}/u/${g.author.member_code}`} next={nxt ? `${base}/s/${nxt.author.member_code}` : null} />;
}
