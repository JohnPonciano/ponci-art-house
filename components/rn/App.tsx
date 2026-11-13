"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "../Icon";

/** Comportamento de app: service worker, cabeçalho que some ao rolar e puxar para atualizar. */
export function RnApp() {
  const router = useRouter(); const [pull, setPull] = useState(0); const [busy, setBusy] = useState(false); const st = useRef<{ y: number } | null>(null);
  useEffect(() => {
    if ("serviceWorker" in navigator && location.hostname.startsWith("comunidade.")) navigator.serviceWorker.register("/sw-comunidade.js", { scope: "/" }).catch(() => {});
    // cabeçalho recolhe ao descer e volta ao subir (mais espaço para as fotos)
    let last = scrollY, raf = 0;
    const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { const y = scrollY; document.body.classList.toggle("rn-hide-head", y > 120 && y > last + 4); if (y < last - 4 || y < 60) document.body.classList.remove("rn-hide-head"); last = y; }); };
    addEventListener("scroll", onScroll, { passive: true });
    return () => removeEventListener("scroll", onScroll);
  }, []);
  // puxar para atualizar (no app instalado não há botão de recarregar)
  useEffect(() => {
    const start = (e: TouchEvent) => { st.current = scrollY <= 0 && e.touches.length === 1 && !(e.target as HTMLElement).closest(".rn-slides,.rn-chips,textarea,input") ? { y: e.touches[0].clientY } : null; };
    const move = (e: TouchEvent) => { if (!st.current) return; const d = e.touches[0].clientY - st.current.y; if (d > 0 && scrollY <= 0) setPull(Math.min(110, d * .5)); else setPull(0); };
    const end = () => { if (!st.current) return; st.current = null; setPull((p) => { if (p >= 64) { setBusy(true); router.refresh(); setTimeout(() => setBusy(false), 1100); } return 0; }); };
    addEventListener("touchstart", start, { passive: true }); addEventListener("touchmove", move, { passive: true }); addEventListener("touchend", end);
    return () => { removeEventListener("touchstart", start); removeEventListener("touchmove", move); removeEventListener("touchend", end); };
  }, [router]);
  const h = busy ? 56 : pull;
  return h > 0 ? <div className={"rn-ptr" + (busy || pull >= 64 ? " ready" : "")} style={{ height: h }} aria-hidden="true"><Icon n={busy ? "check" : "left"} /></div> : null;
}
