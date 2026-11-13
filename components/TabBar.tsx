"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "./Icon";
import type { NavItem } from "./Chrome";

const ICON: Record<string, string> = {
  "/artista": "home", "/artista/comunidade": "chat", "/artista/obras": "image", "/artista/propostas": "swap", "/artista/vendas": "bag",
  "/colecionador": "grid", "/colecionador/comunidade": "chat", "/colecionador/favoritos": "bookmark", "/colecionador/propostas": "swap", "/colecionador/aquisicoes": "bag",
  "/admin/pedidos": "inbox", "/admin/membros": "users", "/admin/curadoria": "image", "/admin/solicitacoes": "user", "/admin/compliance": "scale", "/conta": "user",
};
const SHORT: Record<string, string> = { "Solicitações": "Pedidos LGPD", "Aquisições": "Compras" };

/** Barra de abas no iPhone (HIG): até 4 destinos + "Mais", que abre o menu completo. */
export function TabBar({ nav }: { nav: NavItem[] }) {
  const path = usePathname();
  useEffect(() => { document.body.classList.add("has-tabbar"); return () => document.body.classList.remove("has-tabbar"); }, []);
  // destaque otimista: a aba acende no toque, antes da página chegar
  const [tapped, setTapped] = useState<string | null>(null);
  useEffect(() => setTapped(null), [path]);
  const icon = (n: NavItem) => ICON[n.href] || (n.label === "Comunidade" ? "chat" : "");
  const main = nav.filter((n) => icon(n)).slice(0, 4);
  const cur = tapped ?? [...nav].map((n) => n.href).filter((h) => path === h || path.startsWith(h + "/")).sort((a, b) => b.length - a.length)[0];
  return (
    <nav className="tabbar" aria-label="Navegação" style={{ ["--tabs" as any]: main.length + 1 }}>
      {main.map((n) => (
        <Link key={n.href} href={n.href} onClick={() => n.href !== cur && setTapped(n.href)} aria-current={cur === n.href ? "page" : undefined}>
          <Icon n={icon(n)} />{SHORT[n.label] || n.label}
          {n.badge ? <span className="tb-badge" aria-label={`${n.badge} novos`}>{n.badge}</span> : null}
        </Link>))}
      <button type="button" onClick={() => window.dispatchEvent(new Event("ponci:menu"))} aria-current={cur && !main.some((m) => m.href === cur) ? "page" : undefined}>
        <Icon n="more" />Mais</button>
    </nav>
  );
}
