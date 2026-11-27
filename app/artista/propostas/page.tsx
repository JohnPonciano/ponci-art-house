import { redirect } from "next/navigation";
// Propostas foram desativadas: a PONCI trabalha com preço fixo (comprar agora / sacola).
export default function Propostas() { redirect("/artista/vendas"); }
