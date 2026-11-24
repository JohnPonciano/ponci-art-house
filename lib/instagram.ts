import "server-only";
import { createClient } from "@/lib/supabase/server";

export type IgSettings = { ig_user_id: string; ig_username: string | null; token_set_at: string | null; token_expires_at: string | null; last_tick_at: string | null; last_message: string | null };
export type IgPost = {
  id: string; kind: "image" | "carousel" | "story" | "reel"; cover_url?: string | null; media: string[]; caption: string; publish_at: string; label: string;
  status: "scheduled" | "publishing" | "published" | "failed" | "cancelled"; step: string | null; error: string | null;
  permalink: string | null; published_at: string | null; attempts: number;
};
/** Fila do Instagram (só o admin lê). Vazia se a migração ainda não rodou. */
export async function igData(): Promise<{ settings: IgSettings | null; posts: IgPost[] }> {
  const sb = await createClient();
  const [s, p] = await Promise.all([
    sb.from("ig_settings").select("*").eq("id", 1).maybeSingle(),
    sb.from("ig_posts").select("*").order("publish_at"),
  ]);
  return { settings: (s.data as any) || null, posts: (p.data as any[]) || [] };
}
