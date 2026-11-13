"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { Icon } from "./Icon";

const VKEY = "ponci-view";
/** Barra do acervo no celular: filtros numa folha (bottom sheet) e troca entre grade e lista. */
export function ExploreBar({ active, total, children }: { active: number; total: number; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [mobile, setMobile] = useState(false);
  useEffect(() => { const m = matchMedia("(max-width:700px)"); const f = () => setMobile(m.matches); f(); m.addEventListener("change", f); return () => m.removeEventListener("change", f); }, []);
  useEffect(() => { try { const v = localStorage.getItem(VKEY); if (v === "list" || v === "grid") setView(v); } catch {} }, []);
  useEffect(() => { document.documentElement.dataset.view = view; try { localStorage.setItem(VKEY, view); } catch {} }, [view]);
  useEffect(() => {
    if (!open) return; document.body.classList.add("locked");
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false); window.addEventListener("keydown", k);
    return () => { document.body.classList.remove("locked"); window.removeEventListener("keydown", k); };
  }, [open]);
  return (
    <>
      <div className="xbar" role="toolbar" aria-label="Explorar">
        <button type="button" className="xbar-filter" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded={open}>
          <Icon n="sliders" />Filtrar{active ? <i className="badge-n">{active}</i> : null}</button>
        <div className="seg xbar-view" role="group" aria-label="Visualização">
          <button type="button" aria-pressed={view === "grid"} onClick={() => setView("grid")} aria-label="Grade"><Icon n="grid" /></button>
          <button type="button" aria-pressed={view === "list"} onClick={() => setView("list")} aria-label="Lista"><Icon n="list" /></button>
        </div>
      </div>
      {mobile ? createPortal(<>
        {open && <div className="sheet-scrim" onClick={() => setOpen(false)} aria-hidden="true" />}
        <div className={"xsheet" + (open ? " open" : "")} role={open ? "dialog" : undefined} aria-modal={open || undefined} aria-label="Filtros" aria-hidden={!open}>
          <div className="xsheet-head"><span className="grab" aria-hidden="true" /><b>Filtros</b>
            <button type="button" className="linkbtn" onClick={() => setOpen(false)}>Fechar</button></div>
          {children}
          <div className="xsheet-foot"><button type="button" className="btn" onClick={() => setOpen(false)}>Ver {total} {total === 1 ? "obra" : "obras"} <Icon n="right" /></button></div>
        </div></>, document.body) : <div className="xinline">{children}</div>}
    </>
  );
}

/** Deslize a obra para os lados para ir à anterior/próxima (como na Fotos do iPhone). */
export function SwipeNav({ prev, next, children }: { prev?: string; next?: string; children: ReactNode }) {
  const router = useRouter(); const s = useRef<{ x: number; y: number; t: number } | null>(null);
  useEffect(() => { prev && router.prefetch(prev); next && router.prefetch(next); }, [prev, next, router]);
  return (
    <div className="swipe"
      onTouchStart={(e) => { const t = e.touches[0]; s.current = e.touches.length === 1 ? { x: t.clientX, y: t.clientY, t: Date.now() } : null; }}
      onTouchEnd={(e) => {
        const st = s.current; s.current = null; if (!st) return; const t = e.changedTouches[0];
        const dx = t.clientX - st.x, dy = t.clientY - st.y;
        if (Math.abs(dx) > 60 && Math.abs(dy) < 50 && Date.now() - st.t < 700) { const to = dx < 0 ? next : prev; if (to) router.push(to); }
      }}>
      {children}
      {(prev || next) && <p className="swipe-hint" aria-hidden="true"><Icon n="left" />deslize para ver outras obras<Icon n="right" /></p>}
    </div>
  );
}

/** Barra fixa de compra no celular: aparece quando o bloco de compra sai da tela. */
export function StickyBuy({ price, label = "Reservar" }: { price: string; label?: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = document.getElementById("comprar"); if (!el) return;
    const io = new IntersectionObserver(([e]) => setShow(!e.isIntersecting && e.boundingClientRect.top > 0), { threshold: 0 });
    io.observe(el); return () => io.disconnect();
  }, []);
  const go = () => {
    const el = document.getElementById("comprar"); if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => (el.querySelector("button.btn") as HTMLButtonElement | null)?.click(), 450);
  };
  const [host, setHost] = useState<HTMLElement | null>(null);
  useEffect(() => setHost(document.body), []);
  if (!host) return null;
  return createPortal(
    <div className={"stickybuy" + (show ? " show" : "")} aria-hidden={!show}>
      <span className="price">{price}<small>Preço da artista</small></span>
      <button type="button" className="btn sm" tabIndex={show ? 0 : -1} onClick={go}>{label} <Icon n="right" /></button>
    </div>, host);
}
