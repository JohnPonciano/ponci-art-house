"use client";
export function PrintButton() {
  return <button type="button" className="btn ghost sm" onClick={() => window.print()}>Imprimir ou salvar PDF</button>;
}
