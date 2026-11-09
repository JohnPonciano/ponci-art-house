import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";
import { redirect } from "next/navigation";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => {
          try {
            list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            /* chamado de um Server Component: o middleware renova a sessão */
          }
        },
      },
    }
  );
}

export type Me = {
  id: string;
  role: "artist" | "buyer";
  member_code: string;
  display_name: string;
  city: string;
  practice: string;
  bio: string;
  created_at: string;
  status: "pending" | "active" | "suspended";
  full_name: string;
  email: string;
};

/** Membro logado (perfil público + privado), ou null. Cacheado por requisição. */
export const getMe = cache(async (): Promise<Me | null> => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("id,role,member_code,display_name,city,practice,bio,created_at,status,private:profile_private(full_name,email)")
    .eq("id", user.id)
    .maybeSingle();
  if (!data) return null;
  const priv: any = Array.isArray(data.private) ? data.private[0] : data.private;
  return { ...(data as any), full_name: priv?.full_name ?? "", email: priv?.email ?? user.email ?? "" };
});

/** E-mail do admin logado, ou null. A permissão vem da tabela public.admins (função is_admin). */
export const getAdmin = cache(async (): Promise<{ id: string; email: string } | null> => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.rpc("is_admin");
  return data === true ? { id: user.id, email: user.email ?? "" } : null;
});

/** Membro ativo do papel pedido; senão redireciona (as páginas renderizam em paralelo ao layout). */
export async function requireMember(role: "artist" | "buyer"): Promise<Me> {
  const me = await getMe();
  if (!me) redirect(role === "artist" ? "/entrar?perfil=artista" : "/entrar?perfil=colecionador");
  if (me.role !== role) redirect(me.role === "artist" ? "/artista" : "/colecionador");
  if (me.status !== "active") redirect(role === "artist" ? "/artista" : "/colecionador");
  return me;
}
