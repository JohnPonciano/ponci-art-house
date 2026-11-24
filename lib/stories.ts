import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Person } from "@/lib/community";

export type Story = { id: string; path: string; w: number; h: number; caption: string; created_at: string; seen: boolean; views?: number };
export type StoryGroup = { author: Person & { id: string }; stories: Story[]; unseen: boolean; latest: string; mine: boolean };

/** Stories no ar (24 h), agrupados por pessoa: os seus primeiro, depois quem você ainda não viu, depois os já vistos. */
export async function storyGroups(meId: string): Promise<StoryGroup[]> {
  const sb = await createClient();
  const { data, error } = await sb.from("stories")
    .select("id,path,w,h,caption,created_at,author_id,author:profiles!stories_author_id_fkey(id,role,display_name,city,practice,member_code,show_name,handle,avatar_path)")
    .is("removed_at", null).gt("expires_at", new Date().toISOString()).order("created_at");
  if (error || !data?.length) return [];
  const ids = (data as any[]).map((s) => s.id);
  const [{ data: seen }, { data: views }] = await Promise.all([
    sb.from("story_views").select("story_id").eq("viewer_id", meId).in("story_id", ids),
    sb.from("story_views").select("story_id").in("story_id", (data as any[]).filter((s) => s.author_id === meId).map((s) => s.id)),
  ]);
  const seenSet = new Set(((seen as any[]) || []).map((v) => v.story_id));
  const viewCount = new Map<string, number>(); for (const v of (views as any[]) || []) viewCount.set(v.story_id, (viewCount.get(v.story_id) || 0) + 1);
  const by = new Map<string, StoryGroup>();
  for (const s of data as any[]) {
    const author = Array.isArray(s.author) ? s.author[0] : s.author; if (!author) continue;
    const g = by.get(s.author_id) || { author, stories: [], unseen: false, latest: s.created_at, mine: s.author_id === meId };
    const st: Story = { id: s.id, path: s.path, w: s.w, h: s.h, caption: s.caption, created_at: s.created_at, seen: seenSet.has(s.id) || s.author_id === meId, views: s.author_id === meId ? viewCount.get(s.id) || 0 : undefined };
    g.stories.push(st); g.latest = s.created_at; if (!st.seen) g.unseen = true; by.set(s.author_id, g);
  }
  return [...by.values()].sort((a, b) => Number(b.mine) - Number(a.mine) || Number(b.unseen) - Number(a.unseen) || b.latest.localeCompare(a.latest));
}
