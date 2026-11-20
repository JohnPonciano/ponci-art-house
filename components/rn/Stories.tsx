import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { initials } from "@/lib/format";

/** Fileira de "stories" (como no Instagram): artistas da rede; anel ocre para quem publicou nos últimos 3 dias. */
export async function Stories({ base, me }: { base: string; me: { member_code: string; role: string; display_name: string; show_name?: boolean } }) {
  const sb = await createClient();
  const since = new Date(Date.now() - 3 * 86400e3).toISOString();
  const [{ data: arts }, { data: fresh }] = await Promise.all([
    sb.from("profiles").select("id,display_name,member_code").eq("role", "artist").eq("status", "active"),
    sb.from("posts").select("artist_id,created_at").is("removed_at", null).gte("created_at", since).order("created_at", { ascending: false }),
  ]);
  const last = new Map<string, string>(); for (const p of (fresh as any[]) || []) if (!last.has(p.artist_id)) last.set(p.artist_id, p.created_at);
  const list = ((arts as any[]) || []).filter((a) => a.member_code !== me.member_code)
    .sort((x, y) => (last.get(y.id) || "").localeCompare(last.get(x.id) || "") || x.display_name.localeCompare(y.display_name));
  const first = (n: string) => n.split(" ")[0];
  return (
    <nav className="ig-stories" aria-label="Artistas da rede">
      {me.role !== "admin" && <Link href={`${base}/novo`} className="ig-story me"><span className="ig-ring"><span className="ig-st-av">{me.role === "artist" || me.show_name ? initials(me.display_name) : "C"}<i>+</i></span></span><span className="ig-st-n">Publicar</span></Link>}
      {list.map((a) => (
        <Link key={a.id} href={`${base}/u/${a.member_code}`} className={"ig-story" + (last.has(a.id) ? " fresh" : "")} aria-label={`${a.display_name}${last.has(a.id) ? " (publicou recentemente)" : ""}`}>
          <span className="ig-ring"><span className="ig-st-av">{initials(a.display_name)}</span></span><span className="ig-st-n">{first(a.display_name)}</span></Link>))}
    </nav>
  );
}
