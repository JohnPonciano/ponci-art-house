import Link from "next/link";
import { Icon } from "./Icon";

export function KycBanner() {
  return (
    <div className="wrap" style={{ marginTop: 16 }}>
      <p className="notice" style={{ border: "var(--b)", padding: "12px 14px", background: "var(--slab-lt)" }}>
        <Icon n="shield" /><span>Para negociar, publicar obras e assinar contratos, complete seu cadastro de identificação (endereço e data de nascimento). <Link href="/conta#identificacao" style={{ textDecoration: "underline" }}>Completar agora</Link></span>
      </p>
    </div>
  );
}
