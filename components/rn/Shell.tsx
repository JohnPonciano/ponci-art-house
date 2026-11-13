"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "../Icon";

type P = { base: string; main: string; code: string; unseen: number; initials: string; buyer: boolean; area: string };

/** Cabeçalho da Comunidade: marca, busca e volta ao site principal. */
export function RnHeader({ base, main, initials, buyer, area }: P) {
  const router = useRouter(); const path = usePathname(); const [q, setQ] = useState("");
  useEffect(() => { try { setQ(new URLSearchParams(location.search).get("q") || ""); } catch {} }, [path]);
  return (
    <header className="rn-head">
      <div className="rn-head-in">
        <Link href={base || "/"} className="rn-logo" aria-label="Comunidade PONCI — início"><b>PONCI</b><span>comunidade</span></Link>
        <form className="rn-search" role="search" onSubmit={(e) => { e.preventDefault(); router.push(`${base}/busca?q=${encodeURIComponent(q.trim())}`); }}>
          <Icon n="search" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar notas, artistas, técnicas…" aria-label="Buscar" enterKeyHint="search" />
        </form>
        <nav className="rn-head-nav" aria-label="PONCI">
          <a href={main + area} className="rn-back"><Icon n={buyer ? "grid" : "home"} /><span>{buyer ? "Acervo" : "Ateliê"}</span></a>
          <Link href={`${base}/novo`} className="btn sm rn-post"><Icon n="plus" /><span>Publicar</span></Link>
          <Link href={`${base}/eu`} className={"rn-me" + (buyer ? " av-buyer" : "")} aria-label="Meu perfil">{initials}</Link>
        </nav>
      </div>
    </header>
  );
}

/** Barra inferior no iPhone: Início, Seguindo, Publicar, Atividade, Eu. */
export function RnTabs({ base, unseen }: P) {
  const path = usePathname(); const b = base || ""; const sp = useSearchParams();
  const at = (p: string) => path === (b + p || "/") || (p !== "" && path.startsWith(b + p + "/"));
  useEffect(() => { document.body.classList.add("has-rntabs"); return () => document.body.classList.remove("has-rntabs"); }, []);
  const home = (path === (b || "/") || path === b + "/") && sp?.get("aba") !== "seguindo";
  return (
    <nav className="rn-tabs" aria-label="Comunidade">
      <Link href={b || "/"} aria-current={home ? "page" : undefined}><Icon n="grid" />Início</Link>
      <Link href={b ? `${b}?aba=seguindo` : "/?aba=seguindo"} aria-current={sp?.get("aba") === "seguindo" ? "page" : undefined}><Icon n="users" />Seguindo</Link>
      <Link href={`${b}/novo`} className="rn-plus" aria-label="Publicar"><span><Icon n="plus" /></span></Link>
      <Link href={`${b}/atividade`} aria-current={at("/atividade") ? "page" : undefined}><Icon n="bell" />Atividade{unseen ? <i className="tb-badge">{unseen}</i> : null}</Link>
      <Link href={`${b}/eu`} aria-current={at("/eu") || at("/u") ? "page" : undefined}><Icon n="user" />Eu</Link>
    </nav>
  );
}
