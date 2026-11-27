import Link from "next/link";

/** Abas da tela única de Pedidos do admin. */
export function PedidosTabs({ cur }: { cur: "pagamentos" | "originais" | "prints" }) {
  const t: [typeof cur, string, string][] = [["pagamentos", "Pagamentos", "/admin/pagamentos"], ["originais", "Obras originais", "/admin/vendas"], ["prints", "Prints", "/admin/pedidos-prints"]];
  return (
    <nav className="ped-tabs" aria-label="Pedidos">{t.map(([k, l, h]) => <Link key={k} href={h} aria-current={cur === k ? "page" : undefined}>{l}</Link>)}</nav>
  );
}
