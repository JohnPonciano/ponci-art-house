import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "../Avatar";
import { storyGroups } from "@/lib/stories";
import { personName, isOfficial } from "@/lib/community";

/** Fileira de stories: quem tem story no ar (24 h) vem primeiro, com anel ocre se você ainda não viu;
    depois os artistas da rede (atalho para o perfil). */
export async function Stories({ base, me }: { base: string; me: { id?: string; member_code: string; role: string; display_name: string; show_name?: boolean; avatar_path?: string | null } }) {
  const sb = await createClient();
  const [groups, { data: arts }] = await Promise.all([
    me.id ? storyGroups(me.id) : Promise.resolve([]),
    sb.from("profiles").select("id,display_name,member_code,avatar_path,role").eq("role", "artist").eq("status", "active").order("display_name"),
  ]);
  const withStory = new Set(groups.map((g) => g.author.id));
  const mine = groups.find((g) => g.mine);
  const others = groups.filter((g) => !g.mine);
  const rest = ((arts as any[]) || []).filter((a) => a.member_code !== me.member_code && !withStory.has(a.id));
  const first = (n: string) => n.split(" ")[0];
  return (
    <nav className="ig-stories" aria-label="Stories">
      <span className="ig-story me">
        <Link href={mine ? `${base}/s/${me.member_code}` : `${base}/s/novo`} className={"ig-ring" + (mine ? " live seen" : "")} aria-label={mine ? "Ver seu story" : "Publicar story"}>
          <span className="ig-st-wrap"><Avatar p={me} className="ig-st-av" /></span></Link>
        <Link href={`${base}/s/novo`} className="ig-st-add" aria-label="Novo story">+</Link>
        <span className="ig-st-n">{me.role === "admin" ? "PONCI" : "Seu story"}</span>
      </span>
      {others.map((g) => (
        <Link key={g.author.id} href={`${base}/s/${g.author.member_code}`} className="ig-story" aria-label={`Story de ${personName(g.author)}${g.unseen ? " (novo)" : ""}`}>
          <span className={"ig-ring live" + (g.unseen ? "" : " seen")}><Avatar p={g.author} className="ig-st-av" /></span>
          <span className="ig-st-n">{isOfficial(g.author) ? "PONCI" : first(personName(g.author))}</span></Link>))}
      {rest.map((a) => (
        <Link key={a.id} href={`${base}/u/${a.member_code}`} className="ig-story" aria-label={a.display_name}>
          <span className="ig-ring"><Avatar p={a} className="ig-st-av" /></span><span className="ig-st-n">{first(a.display_name)}</span></Link>))}
    </nav>
  );
}
