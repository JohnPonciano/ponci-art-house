"use client";
import { useLayoutEffect, useRef, type ReactNode } from "react";

/** Tipografia de exibição ajustada à largura da coluna (como no protótipo original). */
export function Fit({ as: Tag = "div", className = "", children, id, ariaHidden }: { as?: any; className?: string; children: ReactNode; id?: string; ariaHidden?: boolean }) {
  const ref = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const el = ref.current; if (!el) return;
    const run = () => {
      const s = el.firstElementChild as HTMLElement; if (!s) return;
      const text = s.textContent?.trim() || "";
      el.classList.remove("nofit");
      el.classList.toggle("acc", /[À-ÖØ-öø-ÿ]/.test(text));
      el.style.fontSize = "100px";
      const avail = el.clientWidth;
      if (text.length > 12 && /\s/.test(text) && avail < 700) { el.classList.add("nofit"); el.style.fontSize = ""; return; }
      const w = s.getBoundingClientRect().width;
      if (w > 0 && avail > 0) el.style.fontSize = Math.floor(((100 * avail) / w) * 0.995 * 100) / 100 + "px";
    };
    run();
    let t: any;
    const onR = () => { clearTimeout(t); t = setTimeout(run, 120); };
    window.addEventListener("resize", onR);
    document.fonts?.ready.then(run);
    return () => { window.removeEventListener("resize", onR); clearTimeout(t); };
  }, [children]);
  return <Tag ref={ref} id={id} className={"fit " + className} aria-hidden={ariaHidden}><span>{children}</span></Tag>;
}
