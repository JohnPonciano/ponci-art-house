import { redirect } from "next/navigation";
// A área do artista abre direto nas obras (o resumo de vendas fica no topo dela).
export default function Painel() { redirect("/artista/obras"); }
