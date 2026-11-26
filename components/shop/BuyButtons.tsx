"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";
import { Icon } from "@/components/Icon";
import { cartAdd } from "@/app/shop-actions";

/** "Comprar agora" (vai direto para a sacola/checkout) e "Adicionar à sacola" (continua navegando). */
export function BuyButtons({ kind, work, product, size, price, title }: { kind: "original" | "print"; work: string; product?: string; size?: string; price: string; title: string }) {
  const toast = useToast(); const router = useRouter(); const [pending, start] = useTransition();
  const add = (go: boolean) => start(async () => {
    const r = await cartAdd(kind, work, product, size);
    if (!r.ok) { toast(r.error || "Não deu certo."); return; }
    if (go) router.push("/colecionador/sacola");
    else { toast(`${title} está na sua sacola.`); router.refresh(); }
  });
  return (
    <div className="buy2">
      <button type="button" className="btn" disabled={pending} onClick={() => add(true)}>{pending ? "Um instante…" : <>Comprar agora · {price} <Icon n="right" /></>}</button>
      <button type="button" className="btn ghost" disabled={pending} onClick={() => add(false)}>Adicionar à sacola</button>
    </div>
  );
}
