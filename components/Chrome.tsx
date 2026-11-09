"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "./Icon";
import { pad, initials } from "@/lib/format";

export type NavItem = { href: string; label: string; badge?: number | string };
type User = { name: string; role: string } | null;

function Wordmark({ home, tag }: { home: string; tag: string }) {
  return <Link href={home} className="wordmark" aria-label="PONCI — início"><b>PONCI</b><small>{tag}</small></Link>;
}
function Logout({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <form action="/auth/sair" method="post" style={{ display: "contents" }}><button type="submit" className={className}>{children}</button></form>;
}

export function Header({ nav, user, enter, home = "/", tag = "Rede privada de arte", band }: { nav: NavItem[]; user?: User; enter?: boolean; home?: string; tag?: string; band?: [string, string] }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const cur = nav.filter((n) => !n.href.includes("#")).map((n) => n.href)
    .filter((h) => path === h || (h !== "/" && path.startsWith(h + "/")) ).sort((a, b) => b.length - a.length)[0];
  useEffect(() => { setOpen(false); }, [path]);
  useEffect(() => {
    document.body.classList.toggle("locked", open);
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  }, [open]);
  const items = [...nav, ...(enter ? [{ href: "/#entrar", label: "Entrar" }] : [])];
  return (
    <>
      <a className="skip" href="#main">Pular para o conteúdo</a>
      <div className="protobar" role="note"><div className="wrap"><span><span className="dot" aria-hidden="true" /><span>Protótipo · Conteúdo de demonstração</span></span><span id="pb-r">ponci.art — Rede privada · Brasil</span></div></div>
      {band && <div className="area-band"><div className="wrap"><span>{band[0]}</span><span>{band[1]}</span></div></div>}
      <header className="head" id="head"><div className="wrap">
        <span id="brand"><Wordmark home={home} tag={tag} /></span>
        <nav className="nav" aria-label="Principal">
          <ul>
            {nav.map((n, i) => (
              <li key={n.href + n.label}><Link href={n.href} aria-current={cur === n.href ? "page" : undefined}><span>{pad(i + 1)}</span>{n.label}{n.badge ? <> <i className="badge-n">{n.badge}</i></> : null}</Link></li>
            ))}
            {enter && <li><Link href="/#entrar" className="enter-a"><span><Icon n="lock" /></span>Entrar</Link></li>}
          </ul>
          {user && <div className="who"><span className="av" aria-hidden="true">{initials(user.name)}</span><span><b>{user.name}</b>{user.role}</span><Logout><Icon n="logout" /> Sair</Logout></div>}
        </nav>
        <button className="menu-btn" type="button" aria-expanded={open} aria-controls="menu" onClick={() => setOpen(true)}>Menu <Icon n="menu" /></button>
      </div></header>
      <div className="menu" id="menu" hidden={!open} role="dialog" aria-modal="true" aria-label="Menu">
        <div className="wrap" style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div className="top"><Wordmark home={home} tag={tag} /><button className="menu-btn" type="button" style={{ display: "inline-flex" }} onClick={() => setOpen(false)} autoFocus>Fechar <Icon n="x" /></button></div>
          <ul>{items.map((n, i) => <li key={n.href + n.label}><Link href={n.href} onClick={() => setOpen(false)} aria-current={cur === n.href ? "page" : undefined}>{n.label}{(n as NavItem).badge ? ` (${(n as NavItem).badge})` : ""}<span>{pad(i + 1)}</span></Link></li>)}</ul>
          <div className="foot2"><span className="lab">{user ? `${user.name} · ${user.role}` : "ponci.art"}</span>
            {user ? <Logout className="btn ghost sm">Sair <Icon n="logout" /></Logout> : <Link className="btn sm" href="/#acesso">Solicitar acesso <Icon n="right" /></Link>}</div>
        </div>
      </div>
    </>
  );
}

export function Footer() {
  return (
    <footer className="foot"><div className="wrap">
      <div className="foot-grid">
        <div className="c1"><p className="lab">PONCI</p><p className="ftag">Rede privada de artistas e colecionadores. Brasil, fund. 2026.</p><span className="domain">ponci.art</span></div>
        <nav className="c2" aria-label="Índice"><p className="lab">Índice</p><ul><li><Link href="/">A rede</Link></li><li><Link href="/artista">Área do artista</Link></li><li><Link href="/colecionador">Área do colecionador</Link></li><li><Link href="/#acesso">Solicitar acesso</Link></li></ul></nav>
        <div className="c3"><p className="lab">Acesso</p><ul className="note" style={{ gap: 4 }}><li>Somente por convite</li><li>Membros verificados</li><li>Transação em custódia</li></ul></div>
        <p className="c4 note">Este site é um protótipo. Obras, nomes de artistas e colecionadores, preços e transações são conteúdo de demonstração.</p>
      </div>
      <FootMega />
      <div className="foot-base"><span>© 2026 PONCI</span><span>ponci.art</span><span>Brasil — Fund. 2026</span></div>
    </div></footer>
  );
}
import { Fit } from "./Fit";
function FootMega() { return <Fit className="foot-mega" ariaHidden>PONCI</Fit>; }
