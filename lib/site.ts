/* Domínios da PONCI: o site principal e a Comunidade (comunidade.ponci.art), com sessão compartilhada. */
export const MAIN_ORIGIN = "https://ponci.art";
export const COMMUNITY_ORIGIN = "https://comunidade.ponci.art";
export const isCommunityHost = (host?: string | null) => !!host && host.startsWith("comunidade.");
/** Cookies da sessão valem para ponci.art e todos os subdomínios (login único). */
export const cookieDomain = (host?: string | null) => (host && /(^|\.)ponci\.art(:\d+)?$/.test(host) ? ".ponci.art" : undefined);
/** Destino seguro depois do login: caminho interno ou a Comunidade. */
export function safeNext(n?: string | null): string | null {
  if (!n) return null;
  if (n.startsWith("/") && !n.startsWith("//")) return n;
  if (n === COMMUNITY_ORIGIN || n.startsWith(COMMUNITY_ORIGIN + "/")) return n;
  return null;
}
/** Caminho da Comunidade: no subdomínio fica na raiz; no site principal (ou local), em /c. */
export const communityBase = (host?: string | null) => (isCommunityHost(host) ? "" : "/c");
/** Endereço da Comunidade visto a partir do site principal. */
export const communityHome = (host?: string | null) => (cookieDomain(host) ? COMMUNITY_ORIGIN : "/c");
/** Endereço do site principal visto a partir da Comunidade. */
export const mainUrl = (host: string | null | undefined, path: string) => (isCommunityHost(host) ? MAIN_ORIGIN + path : path);
export function go(url: string, router?: { replace: (u: string) => void; refresh: () => void }) {
  if (/^https?:\/\//.test(url)) { location.assign(url); return; }
  if (router) { router.replace(url); router.refresh(); } else location.assign(url);
}
