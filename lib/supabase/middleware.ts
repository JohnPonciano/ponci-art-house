import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { COMMUNITY_ORIGIN, MAIN_ORIGIN, cookieDomain, isCommunityHost } from "@/lib/site";

const AREAS: Record<string, string> = { "/artista": "artista", "/colecionador": "colecionador", "/conta": "artista", "/aceite": "artista", "/contrato": "artista" };
// rotas que o subdomínio comunidade.ponci.art serve (mapeadas para /c/*); o resto vai para o site principal
const COMMUNITY_ROUTES = /^\/($|p\/|u\/|novo$|atividade$|salvos$|eu$|busca$)/;
const PASSTHRU = /^\/(_next|auth|icons|manifest|favicon|robots|comunidade\.webmanifest|sw-comunidade\.js|offline-comunidade\.html|entrar|senha)/;

export async function updateSession(request: NextRequest) {
  const host = request.headers.get("host");
  const path = request.nextUrl.pathname;
  const community = isCommunityHost(host);
  const domain = cookieDomain(host);

  // comunidade.ponci.art/x → /c/x (por dentro); caminhos que não são da comunidade vão para ponci.art
  let rewrite: URL | null = null;
  if (community && !PASSTHRU.test(path)) {
    if (!COMMUNITY_ROUTES.test(path)) return NextResponse.redirect(MAIN_ORIGIN + path + request.nextUrl.search);
    rewrite = request.nextUrl.clone(); rewrite.pathname = "/c" + (path === "/" ? "" : path);
  }
  // no site principal em produção, /c/* mora no subdomínio
  if (!community && domain && (path === "/c" || path.startsWith("/c/")))
    return NextResponse.redirect(COMMUNITY_ORIGIN + (path.slice(2) || "/") + request.nextUrl.search);

  const make = () => (rewrite ? NextResponse.rewrite(rewrite, { request }) : NextResponse.next({ request }));
  let response = make(); let refreshed = false;
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookieOptions: domain ? { domain } : undefined,
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list) => {
          refreshed = true;
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = make();
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );
  // getClaims valida o JWT localmente (chaves assimétricas) e renova a sessão quando expira — sem ida aos EUA a cada clique
  const { data: cl } = await supabase.auth.getClaims();
  const user = cl?.claims?.sub ? cl.claims : null;

  const here = rewrite ? rewrite.pathname : path;
  const origin = `${request.nextUrl.protocol}//${host}`;
  const back = community ? origin + path + request.nextUrl.search : path + request.nextUrl.search;
  // segundo fator: quem tem autenticador ativo precisa passar pelo código antes das áreas restritas
  const guarded = ["/artista", "/colecionador", "/conta", "/admin", "/aceite", "/contrato", "/c"].some((p) => here === p || here.startsWith(p + "/"));
  if (user && guarded && user.aal !== "aal2") {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal?.currentLevel === "aal1" && aal?.nextLevel === "aal2")
      return NextResponse.redirect(`${community ? origin : request.nextUrl.origin}/entrar/verificacao?next=${encodeURIComponent(back)}`);
  }
  if ((path === "/admin" || path.startsWith("/admin/")) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/entrar/admin"; url.search = "";
    return NextResponse.redirect(url);
  }
  if ((here === "/c" || here.startsWith("/c/")) && !user)
    return NextResponse.redirect(`${community ? origin : request.nextUrl.origin}/entrar?next=${encodeURIComponent(back)}`);
  const area = Object.keys(AREAS).find((p) => path === p || path.startsWith(p + "/"));
  if (area && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/entrar";
    url.search = `?perfil=${AREAS[area]}&next=${encodeURIComponent(path + request.nextUrl.search)}`;
    return NextResponse.redirect(url);
  }
  // login único: cookies antigos (só de ponci.art) passam a valer para *.ponci.art, uma vez por navegador
  if (domain && !refreshed && !request.cookies.get("ponci-sso")) {
    const sb = request.cookies.getAll().filter((c) => c.name.startsWith("sb-"));
    for (const c of sb) {
      response.headers.append("Set-Cookie", `${c.name}=; Path=/; Max-Age=0; Secure; SameSite=Lax`);
      response.headers.append("Set-Cookie", `${c.name}=${c.value}; Domain=${domain}; Path=/; Max-Age=34560000; Secure; SameSite=Lax`);
    }
    response.headers.append("Set-Cookie", `ponci-sso=1; Domain=${domain}; Path=/; Max-Age=34560000; Secure; SameSite=Lax`);
  }
  return response;
}
