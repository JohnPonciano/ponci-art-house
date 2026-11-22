import Link from "next/link";
import { Icon } from "@/components/Icon";

export default function NotFound() {
  return (
    <main id="main" className="wrap nf">
      <Link href="/" className="nf-brand" aria-label="PONCI, início">PONCI</Link>
      <p className="lab">404</p>
      <h1>Esta página não existe.</h1>
      <p className="nf-sub">O endereço pode ter mudado, ou a obra saiu da vitrine.</p>
      <div className="nf-acts">
        <Link className="btn" href="/">Voltar ao início <Icon n="right" /></Link>
        <Link className="btn ghost" href="/colecionador">Ver o acervo <Icon n="right" /></Link>
      </div>
    </main>
  );
}
