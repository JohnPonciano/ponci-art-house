"use client";
import { useState, type ReactNode } from "react";

/** Na obra com prints: o comprador escolhe entre a obra original (peça única) e o print, cada um com seu preço e condições. */
export function BuyModes({ original, print, originalLabel, printLabel, initial }: {
  original: ReactNode; print: ReactNode; originalLabel: string; printLabel: string; initial: "original" | "print";
}) {
  const [m, setM] = useState(initial);
  return (
    <div className="bm">
      <div className="bm-tabs" role="tablist" aria-label="O que você quer levar">
        <button type="button" role="tab" aria-selected={m === "original"} className={"bm-tab" + (m === "original" ? " on" : "")} onClick={() => setM("original")}>
          <span className="tag t-orig">Original</span><b>Obra original</b><small>{originalLabel}</small></button>
        <button type="button" role="tab" aria-selected={m === "print"} className={"bm-tab" + (m === "print" ? " on" : "")} onClick={() => setM("print")}>
          <span className="tag t-print">Print</span><b>Print fine art</b><small>{printLabel}</small></button>
      </div>
      <div role="tabpanel" className="bm-panel">{m === "original" ? original : print}</div>
    </div>
  );
}
