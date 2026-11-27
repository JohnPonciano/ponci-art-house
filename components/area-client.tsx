"use client";
import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "./Icon";
import { useToast } from "./Toast";
import { brl, parseMoney, fmtPct } from "@/lib/format";
import * as A from "@/app/actions";

function useAct() {
  const toast = useToast(); const router = useRouter(); const [pending, start] = useTransition();
  const run = (fn: () => Promise<A.Result<any>>, ok: string | ((d: any) => string), after?: (d: any) => void) =>
    start(async () => {
      const r = await fn();
      if (!r.ok) { toast(r.error); router.refresh(); return; }
      toast(typeof ok === "function" ? ok(r.data) : ok); after ? after(r.data) : router.refresh();
    });
  return { run, pending, router };
}

/* Botão simples ligado a uma ação do servidor */
export function ActButton({ action, args, ok, className = "btn", children, go, confirm }: {
  action: keyof typeof A; args: any[]; ok: string; className?: string; children: ReactNode; go?: string; confirm?: ReactNode;
}) {
  const { run, pending, router } = useAct(); const [ask, setAsk] = useState(false);
  const fire = () => run(() => (A[action] as any)(...args), ok, go ? () => router.push(go) : undefined);
  if (confirm && ask) return (
    <>
      <span className="hint">{confirm}</span>
      <button type="button" className="btn ocre" disabled={pending} onClick={fire}>{pending ? "Aguarde…" : <>Confirmar <Icon n="check" /></>}</button>
      <button type="button" className="linkbtn" style={{ alignSelf: "flex-start" }} onClick={() => setAsk(false)}>Cancelar</button>
    </>
  );
  return <button type="button" className={className} disabled={pending} onClick={() => (confirm ? setAsk(true) : fire())}>{pending ? "Aguarde…" : children}</button>;
}

/* Artista: aceitar / contrapropor / recusar */

/* Colecionador: responder contraproposta / retirar */

/* Favorito */
export function FavButton({ workId, on, title, variant = "card" }: { workId: string; on: boolean; title: string; variant?: "card" | "link" }) {
  const { run, pending } = useAct();
  const toggle = (e: React.MouseEvent) => { e.preventDefault(); run(() => A.toggleFavorite(workId, !on), on ? "Removida dos favoritos." : "Salva nos favoritos."); };
  if (variant === "link") return <button type="button" className="favlink" aria-pressed={on} disabled={pending} onClick={toggle}><Icon n="bookmark" />{on ? "Salva" : "Salvar"}</button>;
  return <button type="button" className="fav" aria-pressed={on} disabled={pending} onClick={toggle} aria-label={`${on ? "Remover dos" : "Salvar nos"} favoritos: ${title}`}><Icon n="bookmark" /></button>;
}

/* Preço (artista) */
export function PriceForm({ workId, price, pct }: { workId: string; price: number; pct: number }) {
  const { run, pending } = useAct(); const [v, setV] = useState(brl(price)); const [err, setErr] = useState("");
  const n = parseMoney(v);
  return (
    <form className="d-buy offer" noValidate onSubmit={(e) => { e.preventDefault(); if (n < 500) { setErr("Informe um valor de pelo menos R$ 500."); return; } setErr(""); run(() => A.updatePrice(workId, n), "Preço atualizado na vitrine."); }}>
      <div className="row">
        <div className={"field" + (err ? " bad" : "")}><label className="lab" htmlFor="i-price">Preço na vitrine</label>
          <input id="i-price" inputMode="numeric" value={v} onChange={(e) => setV(e.target.value)} onBlur={() => n && setV(brl(n))} aria-describedby="e-price" /><p className="err" id="e-price">{err}</p></div>
        <button className="btn" type="submit" disabled={pending}>Salvar</button>
      </div>
      <p className="hint">Comissão PONCI de {fmtPct(pct)}%. Você recebe {brl(n - Math.round((n * pct) / 100))} por este preço.</p>
      <ActButton action="withdrawWork" args={[workId]} ok="Obra retirada." className="linkbtn" go="/artista/obras" confirm="Retirar a obra da vitrine? As propostas abertas serão encerradas.">Retirar da vitrine</ActButton>
    </form>
  );
}

/* Proposta (colecionador) */

/* Assinatura eletrônica do contrato da venda */
export function SignButton({ contractId, label = "Assinar contrato" }: { contractId: string; label?: string }) {
  const { run, pending } = useAct(); const [ask, setAsk] = useState(false);
  if (ask) return (<span style={{ display: "inline-flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
    <span className="hint">Ao confirmar, você assina eletronicamente o contrato (registramos data, hora, IP e a impressão digital do texto).</span>
    <button className="btn sm ocre" type="button" disabled={pending} onClick={() => run(() => A.signContract(contractId), "Contrato assinado.")}>Confirmar assinatura <Icon n="check" /></button>
    <button className="linkbtn" type="button" onClick={() => setAsk(false)}>Cancelar</button></span>);
  return <button className="btn sm" type="button" onClick={() => setAsk(true)}>{label} <Icon n="check" /></button>;
}

/* Artista: despachar a obra (transportadora + rastreio) */
export const CARRIERS = ["Correios", "Jadlog", "Loggi", "Transportadora de arte", "Entrega em mãos"];
export function ShipForm({ orderId }: { orderId: string }) {
  const { run, pending } = useAct(); const [c, setC] = useState(""); const [code, setCode] = useState(""); const [err, setErr] = useState("");
  const hand = c === "Entrega em mãos";
  return (
    <form className="ship-form" onSubmit={(e) => { e.preventDefault(); setErr("");
      if (!c) return setErr("Escolha a forma de envio.");
      if (!hand && code.trim().length < 6) return setErr("Informe o código de rastreio.");
      run(() => A.shipOrder(orderId, c, hand ? "" : code), "Envio registrado. A colecionadora já vê o rastreio."); }}>
      <p className="ship-t"><b>Hora de despachar.</b> O pagamento está em custódia. Embale bem a obra, envie com seguro pelo valor da obra e registre aqui. <a href="/guia-de-envio" target="_blank" style={{ textDecoration: "underline" }}>Guia de embalagem</a></p>
      <div className="ship-row">
        <label className="field"><span className="lab">Forma de envio</span>
          <select value={c} onChange={(e) => setC(e.target.value)} required><option value="">Escolha…</option>{CARRIERS.map((x) => <option key={x}>{x}</option>)}</select></label>
        {!hand && <label className="field"><span className="lab">Código de rastreio</span>
          <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Ex.: AB123456789BR" maxLength={60} autoCapitalize="characters" spellCheck={false} /></label>}
        <button className="btn sm" type="submit" disabled={pending}>{pending ? "Registrando…" : <>Confirmar envio <Icon n="right" /></>}</button>
      </div>
      {err && <p className="err" role="alert">{err}</p>}
    </form>
  );
}
export function CopyCode({ code }: { code: string }) {
  const toast = useToast();
  return <button type="button" className="ship-code" title="Copiar código" onClick={() => { navigator.clipboard?.writeText(code).then(() => toast("Código copiado.")).catch(() => {}); }}>{code} <Icon n="copy" /></button>;
}
