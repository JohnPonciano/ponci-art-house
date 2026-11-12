"use client";
import { useEffect, useState } from "react";
import { Icon } from "./Icon";

/** No Safari do iPhone/iPad, sugere "Adicionar à Tela de Início" (uma vez; dispensável). */
export function InstallHint() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    try {
      const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
      const standalone = (navigator as any).standalone || matchMedia("(display-mode: standalone)").matches;
      setShow(ios && !standalone && localStorage.getItem("ponci-install-hint") !== "x");
    } catch { /* sem armazenamento: não mostra */ }
  }, []);
  if (!show) return null;
  return (
    <div className="wrap"><p className="install-hint" role="note"><Icon n="share" />
      <span>Use a PONCI como app: no Safari, toque em <b>Compartilhar</b> e depois em <b>Adicionar à Tela de Início</b>.</span>
      <button type="button" className="linkbtn" onClick={() => { try { localStorage.setItem("ponci-install-hint", "x"); } catch {} setShow(false); }}>Agora não</button></p></div>
  );
}
