"use client";
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon";
import { ArtImage, type ArtLike } from "./ArtImage";

/** Toque na obra para ver em tela cheia; toque duplo (ou botão) amplia. Pinça também funciona. */
export function Zoomable({ a, children, caption }: { a: ArtLike; children: ReactNode; caption?: string }) {
  const [open, setOpen] = useState(false); const [zoom, setZoom] = useState(false);
  useEffect(() => {
    if (!open) return;
    document.body.classList.add("locked");
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", k);
    return () => { document.body.classList.remove("locked"); window.removeEventListener("keydown", k); };
  }, [open]);
  return (
    <>
      <button type="button" className="zoomable" onClick={() => { setZoom(false); setOpen(true); }} aria-label={`Ver ${a.title} em tela cheia`}>{children}</button>
      {open && createPortal(
        <div className="lightbox" role="dialog" aria-modal="true" aria-label={a.title}>
          <div className="lightbox-bar"><span>{caption || `${a.title} · ${a.year}`}</span>
            <span style={{ display: "flex", gap: 8 }}>
              <button type="button" onClick={() => setZoom(!zoom)}><Icon n="expand" />{zoom ? "Ajustar" : "Ampliar"}</button>
              <button type="button" onClick={() => setOpen(false)} autoFocus><Icon n="x" />Fechar</button></span></div>
          <div className={"lightbox-stage" + (zoom ? " zoom" : "")} onDoubleClick={() => setZoom(!zoom)}><ArtImage a={a} /></div>
          <p className="lightbox-hint">Toque duplo para ampliar · arraste para percorrer os detalhes</p>
        </div>, document.body)}
    </>
  );
}
