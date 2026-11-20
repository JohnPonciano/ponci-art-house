"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "../Icon";

type P = { base: string; main: string; code: string; unseen: number; initials: string; buyer: boolean; area: string; admin?: boolean };

/** Navegação da Comunidade: barra lateral no Mac (como no Instagram), topo + abas no iPhone. */
export function RnNav({ base, main, initials, buyer, area, unseen, code, admin }: P) {
  const path = usePathname(); const sp = useSearchParams(); const b = base || "";
  useEffect(() => { document.body.classList.add("has-rntabs"); return () => document.body.classList.remove("has-rntabs"); }, []);
  const home = b || "/";
  const isHome = (path === home || path === b + "/") && sp.get("aba") !== "seguindo";
  const at = (p: string) => path === b + p || path.startsWith(b + p + "/");
  const me = at("/eu") || path === `${b}/u/${code}`;
  type It = [string, string, string, boolean, number?]; const items: It[] = [
    [home, "grid", "Início", isHome],
    [b ? `${b}?aba=seguindo` : "/?aba=seguindo", "users", "Seguindo", sp.get("aba") === "seguindo"],
    [`${b}/busca`, "search", "Buscar", at("/busca")],
    ...(admin ? [] as It[] : [[`${b}/atividade`, "heart", "Atividade", at("/atividade"), unseen], [`${b}/novo`, "plus", "Publicar", at("/novo")]] as It[]),
  ];
  return (
    <>
      <aside className="ig-side" aria-label="Comunidade">
        <Link href={home} className="ig-brand" aria-label="Comunidade PONCI"><b>PONCI</b><span>comunidade</span><i aria-hidden="true">P</i></Link>
        <nav className="ig-nav">
          {items.map(([h, ic, l, on, n]) => <Link key={l} href={h} aria-current={on ? "page" : undefined} className={ic === "plus" ? "ig-pub" : ""}>
            <span className="ig-ico"><Icon n={ic} />{n ? <i className="tb-badge">{n}</i> : null}</span><span className="ig-l">{l}</span></Link>)}
          <Link href={`${b}/eu`} aria-current={me ? "page" : undefined}><span className={"ig-ico ig-me" + (buyer ? " av-buyer" : "")}>{initials}</span><span className="ig-l">Perfil</span></Link>
        </nav>
        {admin ? <a className="ig-out ig-admin" href={main + area}><span className="ig-ico"><Icon n="shield" />{unseen ? <i className="tb-badge">{unseen}</i> : null}</span><span className="ig-l">Moderação{unseen ? ` · ${unseen} ${unseen === 1 ? "denúncia" : "denúncias"}` : ""}</span></a>
          : <a className="ig-out" href={main + area}><span className="ig-ico"><Icon n={buyer ? "grid" : "home"} /></span><span className="ig-l">{buyer ? "Voltar ao Acervo" : "Voltar ao Ateliê"}</span></a>}
      </aside>
      <header className="ig-top">
        <Link href={home} className="ig-brand" aria-label="Comunidade PONCI"><b>PONCI</b><span>comunidade</span></Link>
        <div className="ig-top-acts">
          <a href={main + area} aria-label={admin ? "Moderação" : buyer ? "Acervo" : "Ateliê"}><Icon n={admin ? "shield" : buyer ? "grid" : "home"} />{admin && unseen ? <i className="tb-badge">{unseen}</i> : null}</a>
          {!admin && <Link href={`${b}/atividade`} aria-label="Atividade"><Icon n="heart" />{unseen ? <i className="tb-badge">{unseen}</i> : null}</Link>}
        </div>
      </header>
    </>
  );
}

/** Barra inferior no iPhone: Início, Buscar, Publicar, Seguindo, Eu. */
export function RnTabs({ base, unseen, initials, buyer, code, admin }: P) {
  const path = usePathname(); const b = base || ""; const sp = useSearchParams();
  const at = (p: string) => path === b + p || path.startsWith(b + p + "/");
  const home = (path === (b || "/") || path === b + "/") && sp.get("aba") !== "seguindo";
  void unseen;
  return (
    <nav className="rn-tabs" aria-label="Comunidade" style={admin ? ({ ["--tabs" as any]: 4, gridTemplateColumns: "repeat(4,1fr)" }) : undefined}>
      <Link href={b || "/"} aria-current={home ? "page" : undefined}><Icon n="grid" />Início</Link>
      <Link href={`${b}/busca`} aria-current={at("/busca") ? "page" : undefined}><Icon n="search" />Buscar</Link>
      {!admin && <Link href={`${b}/novo`} className="rn-plus" aria-label="Publicar"><span><Icon n="plus" /></span></Link>}
      <Link href={b ? `${b}?aba=seguindo` : "/?aba=seguindo"} aria-current={sp.get("aba") === "seguindo" ? "page" : undefined}><Icon n="users" />Seguindo</Link>
      <Link href={`${b}/eu`} aria-current={at("/eu") || path === `${b}/u/${code}` ? "page" : undefined}><span className={"rn-tab-av" + (buyer ? " av-buyer" : "")}>{initials}</span>Eu</Link>
    </nav>
  );
}

/** Campo de busca da tela de busca (no iPhone, a busca fica numa tela própria). */
export function SearchBox({ base, q }: { base: string; q: string }) {
  const router = useRouter(); const [v, setV] = useState(q);
  return (
    <form className="rn-searchpage" role="search" onSubmit={(e) => { e.preventDefault(); router.replace(`${base}/busca?q=${encodeURIComponent(v.trim())}`); }}>
      <Icon n="search" /><input autoFocus={!q} value={v} onChange={(e) => setV(e.target.value)} placeholder="Buscar notas, artistas, técnicas…" aria-label="Buscar" enterKeyHint="search" type="search" />
      {v && <button type="button" aria-label="Limpar" onClick={() => setV("")}><Icon n="x" /></button>}
    </form>
  );
}
/** Voltar: para a tela anterior se veio de dentro da comunidade, senão para o início. */
export function BackBtn({ base }: { base: string }) {
  const router = useRouter();
  return <button type="button" className="rn-backbtn" aria-label="Voltar" onClick={() => (history.length > 1 && document.referrer.includes(location.host) ? router.back() : router.push(base || "/"))}><Icon n="left" /></button>;
}
