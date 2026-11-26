"use client";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { useToast } from "@/components/Toast";
import * as S from "@/app/shop-actions";

/** Na volta do Mercado Pago: confere o pagamento na hora e atualiza a página quando ele cai. */
export function OrderStatus({ id, status, payLink, paymentId, mpStatus, mp }: { id: string; status: string; payLink: string | null; paymentId?: string; mpStatus?: string; mp: boolean }) {
  const router = useRouter(); const toast = useToast(); const [pending, start] = useTransition();
  const [link, setLink] = useState(payLink); const [checking, setChecking] = useState(status === "awaiting_payment" && !!paymentId);
  useEffect(() => {
    if (status !== "awaiting_payment") return;
    let alive = true, n = 0;
    (async () => {
      if (paymentId) await S.mpCheck(paymentId);
      while (alive && n++ < 40) {
        await new Promise((ok) => setTimeout(ok, n < 10 ? 1500 : 4000));
        const r = await S.checkoutStatus(id);
        if (!r.ok) break;
        if (r.data.pay_link) setLink(r.data.pay_link);
        if (r.data.status !== "awaiting_payment") { router.refresh(); break; }
      }
      if (alive) setChecking(false);
    })();
    return () => { alive = false; };
  }, [id, status, paymentId, router]);
  if (status !== "awaiting_payment") return null;
  return (
    <div className="od-pay">
      {checking ? <p className="hint">{mpStatus === "approved" ? "Pagamento aprovado no Mercado Pago. Confirmando…" : "Conferindo o pagamento…"}</p> : null}
      {!mp && !link ? <p className="od-mail"><Icon n="inbox" /> As instruções de pagamento (Pix) chegam no seu e-mail. Assim que o pagamento cair, a gente confirma por aqui.</p>
        : link ? <a className="btn" href={link}>Pagar agora <Icon n="lock" /></a>
        : <button type="button" className="btn ghost" disabled={pending} onClick={() => start(async () => { const r = await S.checkoutRetry(id); if (!r.ok) toast(r.error!); else router.refresh(); })}>Gerar link de pagamento</button>}
    </div>
  );
}
