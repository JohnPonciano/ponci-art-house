"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { Icon } from "./Icon";

/** Trilho horizontal com encaixe (scroll-snap) e setas no Mac. */
export function Rail({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null); const [edge, setEdge] = useState({ l: false, r: false });
  const upd = () => { const el = ref.current; if (!el) return; setEdge({ l: el.scrollLeft > 8, r: el.scrollLeft + el.clientWidth < el.scrollWidth - 8 }); };
  useEffect(() => { upd(); const el = ref.current; el?.addEventListener("scroll", upd, { passive: true }); addEventListener("resize", upd); return () => { el?.removeEventListener("scroll", upd); removeEventListener("resize", upd); }; }, []);
  const go = (d: number) => ref.current?.scrollBy({ left: d * ref.current.clientWidth * 0.85, behavior: "smooth" });
  return (
    <div className={"g-rail" + (edge.l ? " at-l" : "") + (edge.r ? " at-r" : "")}>
      <div className="g-track" ref={ref}>{children}</div>
      <button type="button" className="g-arrow l" aria-label="Anteriores" onClick={() => go(-1)} disabled={!edge.l}><Icon n="left" /></button>
      <button type="button" className="g-arrow r" aria-label="Próximas" onClick={() => go(1)} disabled={!edge.r}><Icon n="right" /></button>
    </div>
  );
}

type Opt = [string, string];
/** Barra de filtros da galeria: técnicas à mão, demais filtros num painel (folha no iPhone). */
export function GalleryFilters({ cats, artists, prices, sorts, total }: { cats: Opt[]; artists: Opt[]; prices: Opt[]; sorts: Opt[]; total: number }) {
  const router = useRouter(); const path = usePathname(); const sp = useSearchParams(); const [open, setOpen] = useState(false);
  const [mobile, setMobile] = useState(false);
  useEffect(() => { const m = matchMedia("(max-width:700px)"); const f = () => setMobile(m.matches); f(); m.addEventListener("change", f); return () => m.removeEventListener("change", f); }, []);
  useEffect(() => { if (!(open && mobile)) return; document.body.classList.add("locked"); return () => document.body.classList.remove("locked"); }, [open, mobile]);
  const cur = (k: string) => sp.get(k) || (k === "sort" ? "new" : "all");
  const set = (k: string, v: string) => { const q = new URLSearchParams(sp.toString()); if (v === "all" || (k === "sort" && v === "new")) q.delete(k); else q.set(k, v); router.replace(path + (q.size ? "?" + q : ""), { scroll: false }); };
  const active = ["cat", "artist", "price"].filter((k) => cur(k) !== "all").length;
  const group = (k: string, label: string, opts: Opt[]) => (
    <div className="g-group" role="group" aria-label={label}><span className="lab">{label}</span>
      <div className="g-opts">{opts.map(([v, l]) => <button key={v} type="button" aria-pressed={cur(k) === v} onClick={() => set(k, v)}>{l}</button>)}</div></div>);
  const panel = (
    <div className={"g-panel" + (mobile ? " sheet" : "") + (open ? " open" : "")} role={mobile && open ? "dialog" : undefined} aria-label="Filtros" hidden={!open}>
      {mobile && <div className="g-panel-head"><span className="grab" aria-hidden="true" /><b>Filtros</b><button type="button" className="linkbtn" onClick={() => setOpen(false)}>Fechar</button></div>}
      {group("artist", "Artista", artists)}{group("price", "Faixa de preço", prices)}{group("sort", "Ordenar", sorts)}
      <div className="g-panel-foot">{active > 0 && <button type="button" className="linkbtn" onClick={() => router.replace(path, { scroll: false })}>Limpar filtros</button>}
        <button type="button" className="btn" onClick={() => setOpen(false)}>Ver {total} {total === 1 ? "obra" : "obras"} <Icon n="right" /></button></div>
    </div>);
  return (
    <div className="g-filters">
      <div className="g-bar" role="toolbar" aria-label="Filtrar acervo">
        <button type="button" className="g-filter-btn" aria-expanded={open} onClick={() => setOpen(!open)}><Icon n="sliders" />Filtros{active ? <i className="badge-n">{active}</i> : null}</button>
        <div className="g-chips">{cats.map(([v, l]) => <button key={v} type="button" aria-pressed={cur("cat") === v} onClick={() => set("cat", v)}>{l}</button>)}</div>
      </div>
      {mobile ? createPortal(<>{open && <div className="sheet-scrim" onClick={() => setOpen(false)} aria-hidden="true" />}{panel}</>, document.body) : panel}
    </div>
  );
}
