"use client";
import { useState, useTransition } from "react";
import { useToast } from "./Toast";
import { setAcceptsOffers } from "@/app/actions";

/** Chave do artista: aceita propostas de valor ou vende só pelo preço fixo. */
export function OffersToggle({ initial }: { initial: boolean }) {
  const [on, setOn] = useState(initial); const [pending, start] = useTransition(); const toast = useToast();
  const flip = () => {
    const v = !on; setOn(v);
    start(async () => {
      const r = await setAcceptsOffers(v);
      if (!r.ok) { setOn(!v); toast(r.error); } else toast(v ? "Colecionadores podem enviar propostas." : "Suas obras agora têm preço fixo.");
    });
  };
  return (
    <div className="offers-toggle">
      <div>
        <p className="ot-title">Aceito negociar o valor</p>
        <p className="hint">{on ? "Colecionadores podem enviar propostas abaixo do preço; você aceita, recusa ou contrapropõe." : "Preço fixo: colecionadores só reservam pelo valor que você definiu."}</p>
      </div>
      <button type="button" role="switch" aria-checked={on} aria-label="Aceito negociar o valor" className="switch" disabled={pending} onClick={flip}><span /></button>
    </div>
  );
}
