import Link from "next/link";
import { Icon } from "@/components/Icon";
export default function NotFound() {
  return <main id="main" className="wrap nf"><p className="lab">404</p><h1>Esta página não existe.</h1><Link className="btn" href="/">Voltar ao início <Icon n="right" /></Link></main>;
}
