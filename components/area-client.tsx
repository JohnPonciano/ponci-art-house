"use client";
import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "./Icon";
import { useToast } from "./Toast";
import { brl, parseMoney } from "@/lib/format";
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
export function ArtistProposalActions({ id, current, price }: { id: string; current: number; price: number }) {
  const { run, pending } = useAct();
  const [mode, setMode] = useState<"" | "accept" | "counter">("");
  const [val, setVal] = useState(brl(Math.round((current + price) / 2 / 500) * 500)); const [msg, setMsg] = useState("");
  if (mode === "accept") return (<>
    <span className="hint">Aceitar {brl(current)}? A obra será reservada e as outras propostas encerradas.</span>
    <button className="btn sm ocre" type="button" disabled={pending} onClick={() => run(() => A.respondProposal(id, "accept"), "Proposta aceita. A obra foi reservada.")}>Confirmar <Icon n="check" /></button>
    <button className="linkbtn" type="button" onClick={() => setMode("")}>Cancelar</button></>);
  if (mode === "counter") return (
    <form className="inline-form" onSubmit={(e) => { e.preventDefault(); const n = parseMoney(val); if (n < 500) return; run(() => A.respondProposal(id, "counter", n, msg), "Contraproposta enviada."); }}>
      <label className="lab" htmlFor={"cv-" + id}>Seu valor</label>
      <input id={"cv-" + id} inputMode="numeric" value={val} onChange={(e) => setVal(e.target.value)} onBlur={() => { const n = parseMoney(val); if (n) setVal(brl(n)); }} autoFocus required />
      <input placeholder="Mensagem (opcional)" aria-label="Mensagem" value={msg} onChange={(e) => setMsg(e.target.value)} />
      <button className="btn sm" type="submit" disabled={pending}>Enviar <Icon n="swap" /></button>
      <button className="linkbtn" type="button" onClick={() => setMode("")}>Cancelar</button>
    </form>);
  return (<>
    <button className="btn sm" type="button" onClick={() => setMode("accept")}>Aceitar <Icon n="check" /></button>
    <button className="btn sm ghost" type="button" onClick={() => setMode("counter")}>Contrapropor <Icon n="swap" /></button>
    <button className="linkbtn" type="button" disabled={pending} onClick={() => run(() => A.respondProposal(id, "decline"), "Proposta recusada.")}>Recusar</button></>);
}

/* Colecionador: responder contraproposta / retirar */
export function BuyerProposalActions({ id, status, current, slug }: { id: string; status: string; current: number; slug: string }) {
  const { run, pending, router } = useAct(); const [ask, setAsk] = useState(false);
  if (status === "open") return <button className="linkbtn" type="button" disabled={pending} onClick={() => run(() => A.respondProposal(id, "withdraw"), "Proposta retirada.")}>Retirar proposta</button>;
  if (ask) return (<>
    <span className="hint">Aceitar {brl(current)}? A obra fica reservada para você.</span>
    <button className="btn sm ocre" type="button" disabled={pending} onClick={() => run(() => A.respondProposal(id, "accept"), "Contraproposta aceita. Obra reservada.", () => router.push("/colecionador/aquisicoes"))}>Confirmar <Icon n="check" /></button>
    <button className="linkbtn" type="button" onClick={() => setAsk(false)}>Cancelar</button></>);
  return (<>
    <button className="btn sm" type="button" onClick={() => setAsk(true)}>Aceitar {brl(current)}</button>
    <Link className="btn sm ghost" href={`/colecionador/obras/${slug}`}>Nova proposta</Link>
    <button className="linkbtn" type="button" disabled={pending} onClick={() => run(() => A.respondProposal(id, "decline"), "Contraproposta recusada.")}>Recusar</button></>);
}

/* Favorito */
export function FavButton({ workId, on, title, variant = "card" }: { workId: string; on: boolean; title: string; variant?: "card" | "link" }) {
  const { run, pending } = useAct();
  const toggle = (e: React.MouseEvent) => { e.preventDefault(); run(() => A.toggleFavorite(workId, !on), on ? "Removida dos favoritos." : "Salva nos favoritos."); };
  if (variant === "link") return <button type="button" className="favlink" aria-pressed={on} disabled={pending} onClick={toggle}><Icon n="bookmark" />{on ? "Salva" : "Salvar"}</button>;
  return <button type="button" className="fav" aria-pressed={on} disabled={pending} onClick={toggle} aria-label={`${on ? "Remover dos" : "Salvar nos"} favoritos: ${title}`}><Icon n="bookmark" /></button>;
}

/* Preço (artista) */
export function PriceForm({ workId, price }: { workId: string; price: number }) {
  const { run, pending } = useAct(); const [v, setV] = useState(brl(price)); const [err, setErr] = useState("");
  const n = parseMoney(v);
  return (
    <form className="d-buy offer" noValidate onSubmit={(e) => { e.preventDefault(); if (n < 500) { setErr("Informe um valor de pelo menos R$ 500."); return; } setErr(""); run(() => A.updatePrice(workId, n), "Preço atualizado na vitrine."); }}>
      <div className="row">
        <div className={"field" + (err ? " bad" : "")}><label className="lab" htmlFor="i-price">Preço na vitrine</label>
          <input id="i-price" inputMode="numeric" value={v} onChange={(e) => setV(e.target.value)} onBlur={() => n && setV(brl(n))} aria-describedby="e-price" /><p className="err" id="e-price">{err}</p></div>
        <button className="btn" type="submit" disabled={pending}>Salvar</button>
      </div>
      <p className="hint">Comissão PONCI de 15%. Você recebe {brl(n * 0.85)} por este preço.</p>
      <ActButton action="withdrawWork" args={[workId]} ok="Obra retirada." className="linkbtn" go="/artista/obras" confirm="Retirar a obra da vitrine? As propostas abertas serão encerradas.">Retirar da vitrine</ActButton>
    </form>
  );
}

/* Proposta (colecionador) */
export function OfferForm({ workId, price, label }: { workId: string; price: number; label: string }) {
  const { run, pending } = useAct(); const [v, setV] = useState(""); const [msg, setMsg] = useState(""); const [err, setErr] = useState("");
  function submit(e: React.FormEvent) {
    e.preventDefault(); const n = parseMoney(v);
    if (n < Math.ceil(price * 0.5)) return setErr(`Propostas abaixo de 50% do preço (${brl(price * 0.5)}) não são enviadas.`);
    if (n >= price) return setErr("Para pagar o preço cheio, use “Reservar pelo preço”.");
    setErr(""); run(() => A.makeProposal(workId, n, msg), "Proposta enviada à artista.", () => { setV(""); setMsg(""); });
  }
  return (
    <form className="offer" onSubmit={submit} noValidate>
      <div className="row">
        <div className={"field" + (err ? " bad" : "")}><label className="lab" htmlFor="i-amount">{label}</label>
          <input id="i-amount" inputMode="numeric" placeholder={brl(Math.round((price * 0.9) / 500) * 500)} value={v} onChange={(e) => setV(e.target.value)} onBlur={() => { const n = parseMoney(v); if (n) setV(brl(n)); }} aria-describedby="e-amount" />
          <p className="err" id="e-amount">{err}</p></div>
        <button className="btn ghost" type="submit" disabled={pending}>{pending ? "…" : "Enviar"}</button>
      </div>
      <div className="field"><label className="lab" htmlFor="i-msg">Mensagem para a artista</label>
        <textarea id="i-msg" rows={3} placeholder="Onde a obra vai viver, dúvidas sobre moldura, transporte…" value={msg} onChange={(e) => setMsg(e.target.value)} /></div>
    </form>
  );
}

/* Assinatura eletrônica do contrato da venda */
export function SignButton({ contractId, label = "Assinar contrato" }: { contractId: string; label?: string }) {
  const { run, pending } = useAct(); const [ask, setAsk] = useState(false);
  if (ask) return (<span style={{ display: "inline-flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
    <span className="hint">Ao confirmar, você assina eletronicamente o contrato (registramos data, hora, IP e a impressão digital do texto).</span>
    <button className="btn sm ocre" type="button" disabled={pending} onClick={() => run(() => A.signContract(contractId), "Contrato assinado.")}>Confirmar assinatura <Icon n="check" /></button>
    <button className="linkbtn" type="button" onClick={() => setAsk(false)}>Cancelar</button></span>);
  return <button className="btn sm" type="button" onClick={() => setAsk(true)}>{label} <Icon n="check" /></button>;
}
