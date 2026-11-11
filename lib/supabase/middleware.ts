import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const AREAS: Record<string, string> = { "/artista": "artista", "/colecionador": "colecionador", "/conta": "artista", "/aceite": "artista", "/contrato": "artista" };

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list) => {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  // segundo fator: quem tem autenticador ativo precisa passar pelo código antes das áreas restritas
  const guarded = ["/artista", "/colecionador", "/conta", "/admin", "/aceite", "/contrato"].some((p) => path === p || path.startsWith(p + "/"));
  if (user && guarded) {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal?.currentLevel === "aal1" && aal?.nextLevel === "aal2") {
      const url = request.nextUrl.clone();
      url.pathname = "/entrar/verificacao"; url.search = `?next=${encodeURIComponent(path + request.nextUrl.search)}`;
      return NextResponse.redirect(url);
    }
  }
  if ((path === "/admin" || path.startsWith("/admin/")) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/entrar/admin"; url.search = "";
    return NextResponse.redirect(url);
  }
  const area = Object.keys(AREAS).find((p) => path === p || path.startsWith(p + "/"));
  if (area && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/entrar";
    url.search = `?perfil=${AREAS[area]}&next=${encodeURIComponent(path + request.nextUrl.search)}`;
    return NextResponse.redirect(url);
  }
  return response;
}
