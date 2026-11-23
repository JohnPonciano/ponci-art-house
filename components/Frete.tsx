"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "./Icon";
import { useToast } from "./Toast";
import { brl } from "@/lib/format";
import { quoteShipping, setWorkShipping } from "@/app/actions";
import type { FreteResult } from "@/lib/frete";

const fmtCep = (v: string) => { const d = v.replace(/\D/g, "").slice(0, 8); return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d; };

/** Colecionadora: estimativa de frete até o CEP dela, antes de reservar. */
export function FreteQuote({ workId, cep: cep0 = "" }: { workId: string; cep?: string }) {
  const [cep, setCep] = useState(fmtCep(cep0)); const [r, setR] = useState<FreteResult | null>(null); const [pending, start] = useTransition();
  const go = (e: React.FormEvent) => { e.preventDefault(); start(async () => setR(await quoteShipping(workId, cep))); };
  return (
    <div className="frete">
      <form className="frete-form" onSubmit={go}>
        <label className="lab" htmlFor="frete-cep"><Icon n="truck" /> Calcular frete</label>
        <span className="frete-row">
          <input id="frete-cep" inputMode="numeric" autoComplete="postal-code" placeholder="CEP de entrega" value={cep} onChange={(e) => setCep(fmtCep(e.target.value))} />
          <button className="btn sm ghost" type="submit" disabled={pending || cep.replace(/\D/g, "").length !== 8}>{pending ? "Calculando…" : "Calcular"}</button>
        </span>
      </form>
      {r && (r.ok ? <>
        <ul className="frete-list">{r.options.slice(0, 5).map((o) => <li key={o.id}>
          {o.logo && /* eslint-disable-next-line @next/next/no-img-element */ <img src={o.logo} alt="" width={36} height={18} />}
          <span><b>{o.company}</b> {o.service}<small>{o.days ? `${o.days}${o.daysMax && o.daysMax !== o.days ? `–${o.daysMax}` : ""} dias úteis após a postagem` : "prazo a confirmar"}</small></span>
          <b className="frete-price">{brl(o.price)}</b></li>)}</ul>
        <p className="hint">Com seguro pelo valor da obra. A artista despacha em até 5 dias úteis depois do pagamento.{r.estimated ? " Medidas da embalagem estimadas: o valor final pode variar um pouco." : ""}</p>
      </> : <p className={"hint" + ((r as Extract<FreteResult, { ok: false }>).big ? "" : " err")}>{(r as Extract<FreteResult, { ok: false }>).error}</p>)}
    </div>
  );
}

/** Artista: medidas de envio (profundidade e peso já embalada). */
export function FreteDados({ workId, depth, weight, included }: { workId: string; depth?: number | null; weight?: number | null; included?: boolean }) {
  const toast = useToast(); const router = useRouter(); const [pending, start] = useTransition();
  const [inc, setInc] = useState(!!included);
  const [d, setD] = useState(depth ? String(depth) : ""); const [w, setW] = useState(weight ? String(weight).replace(".", ",") : "");
  const save = (e: React.FormEvent) => { e.preventDefault(); start(async () => {
    const r = await setWorkShipping(workId, d ? +d : null, w ? +w.replace(",", ".") : null, inc);
    toast(r.ok ? "Dados de envio salvos." : r.error); if (r.ok) router.refresh(); }); };
  return (
    <form className="frete-dados" onSubmit={save}>
      <p className="lab">Envio</p>
      <p className="hint">Você embala e despacha com seguro, em até 5 dias úteis depois do pagamento. <a href="/guia-de-envio" target="_blank" style={{ textDecoration: "underline" }}>Guia de embalagem</a></p>
      <label className="check"><input type="checkbox" checked={inc} onChange={(e) => setInc(e.target.checked)} />
        <span><b>Frete incluso no preço</b>: você paga o envio. Desmarcado, a colecionadora paga o frete, calculado antes do pagamento.</span></label>
      <p className="hint">Medidas da obra embalada (ajudam a calcular o frete; sem elas, a PONCI estima pelo tamanho):</p>
      <span className="frete-row">
        <label className="field"><span className="lab">Profundidade (cm)</span><input inputMode="numeric" value={d} onChange={(e) => setD(e.target.value.replace(/\D/g, ""))} placeholder="Ex.: 4" /></label>
        <label className="field"><span className="lab">Peso embalada (kg)</span><input inputMode="decimal" value={w} onChange={(e) => setW(e.target.value.replace(/[^\d,.]/g, ""))} placeholder="Ex.: 3,5" /></label>
        <button className="btn sm ghost" type="submit" disabled={pending}>{pending ? "Salvando…" : "Salvar"}</button>
      </span>
    </form>
  );
}
