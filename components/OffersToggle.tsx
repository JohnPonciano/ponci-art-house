"use client";
import { useState, useTransition } from "react";
import { useToast } from "./Toast";
import { setAcceptsOffers, setWorkReproduction } from "@/app/actions";

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

/** Marcação REPROD da obra: a artista avisa que é uma reprodução, não o original. */
export function ReprodToggle({ workId, initial }: { workId: string; initial: boolean }) {
  const [on, setOn] = useState(initial); const [pending, start] = useTransition(); const toast = useToast();
  const flip = () => {
    const v = !on; setOn(v);
    start(async () => {
      const r = await setWorkReproduction(workId, v);
      if (!r.ok) { setOn(!v); toast(r.error); } else toast(v ? "Obra marcada como reprodução (REPROD)." : "Marcação de reprodução removida.");
    });
  };
  return (
    <div className="offers-toggle">
      <div>
        <p className="ot-title">É uma reprodução</p>
        <p className="hint">{on ? "A obra aparece com a etiqueta REPROD no acervo e na ficha." : "Ligue se for impressão, fine art ou pôster de uma obra, e não o original."}</p>
      </div>
      <button type="button" role="switch" aria-checked={on} aria-label="É uma reprodução" className="switch" disabled={pending} onClick={flip}><span /></button>
    </div>
  );
}
