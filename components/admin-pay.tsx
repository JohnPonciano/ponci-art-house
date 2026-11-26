"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "./Toast";
import { Icon } from "./Icon";
import * as S from "@/app/shop-actions";

/** Conectar (ou trocar) o Access Token do Mercado Pago. Vai direto para o cofre do banco. */
export function MpConnect({ connected }: { connected: boolean }) {
  const toast = useToast(); const router = useRouter(); const [pending, start] = useTransition();
  const [open, setOpen] = useState(!connected); const [t, setT] = useState(""); const [sb, setSb] = useState(false);
  if (!open) return <button type="button" className="btn sm ghost" onClick={() => setOpen(true)}>Trocar token</button>;
  return (
    <form className="ig-connect" onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await S.adminMpConnect(t, sb); toast(r.ok ? `Mercado Pago conectado: ${r.data!.label}` : r.error!); if (r.ok) { setT(""); setOpen(false); router.refresh(); } }); }}>
      <label className="lab" htmlFor="mp-tok">Access Token do Mercado Pago (começa com APP_USR- ou TEST-)</label>
      <input id="mp-tok" type="password" autoComplete="off" spellCheck={false} value={t} onChange={(e) => setT(e.target.value)} placeholder="Cole aqui o Access Token de produção" />
      <label className="check"><input type="checkbox" checked={sb} onChange={(e) => setSb(e.target.checked)} /><span>É uma conta de teste (sandbox): os pagamentos não são de verdade.</span></label>
      <span style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <button className="btn sm" type="submit" disabled={pending || t.trim().length < 20}>{pending ? "Conferindo com o Mercado Pago…" : <>Conectar <Icon n="check" /></>}</button>
        {connected && <button type="button" className="linkbtn" onClick={() => setOpen(false)}>Cancelar</button>}
      </span>
      <p className="hint">Onde achar: Mercado Pago Developers → Suas integrações → crie uma aplicação (Checkout Pro) → Credenciais de produção → Access Token. Antes de salvar, a PONCI confere o token com o Mercado Pago. Ele fica criptografado no cofre do banco.</p>
    </form>
  );
}

export function MarkPaid({ id }: { id: string }) {
  const toast = useToast(); const router = useRouter(); const [pending, start] = useTransition(); const [ask, setAsk] = useState(false); const [n, setN] = useState("");
  if (!ask) return <button type="button" className="linkbtn" onClick={() => setAsk(true)}>Recebi por fora</button>;
  return (
    <span className="pa-acts">
      <input value={n} onChange={(e) => setN(e.target.value)} placeholder="Como foi pago (ex.: Pix 27/11)" />
      <button type="button" className="btn sm" disabled={pending || n.trim().length < 3} onClick={() => start(async () => { const r = await S.adminCheckoutMarkPaid(id, n); toast(r.ok ? "Pedido marcado como pago." : r.error!); if (r.ok) router.refresh(); })}>Marcar pago</button>
      <button type="button" className="linkbtn" onClick={() => setAsk(false)}>Voltar</button>
    </span>);
}
