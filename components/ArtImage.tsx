"use client";
import { useEffect, useRef, useState } from "react";
import { generate, renderSize } from "@/lib/gen";

export type ArtLike = {
  slug?: string; title: string; year: number; h: number; w: number;
  gen?: any; image_path?: string | null; img_w?: number | null; img_h?: number | null; preview?: string | null;
};
const BLANK = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
// fila: desenha uma composição por vez, no tempo ocioso, para não travar o toque
const queue: (() => void)[] = []; let busy = false;
const idle = (fn: () => void) => ((window as any).requestIdleCallback ? (window as any).requestIdleCallback(fn, { timeout: 400 }) : setTimeout(fn, 16));
function pump() { if (busy) return; const job = queue.shift(); if (!job) return; busy = true; idle(() => { try { job(); } finally { busy = false; pump(); } }); }
export const imageUrl = (path: string) =>
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/works/${path}`;

/** Foto enviada pela artista, ou composição generativa desenhada no navegador. */
export function ArtImage({ a }: { a: ArtLike }) {
  const photo = a.preview || (a.image_path ? imageUrl(a.image_path) : null);
  const { W, H } = renderSize(photo ? a : { h: a.h, w: a.w });
  const [src, setSrc] = useState<string>(photo || BLANK);
  const [ready, setReady] = useState(!!photo);
  const key = photo || JSON.stringify([a.gen, a.h, a.w]);
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    if (photo) { setSrc(photo); setReady(true); return; }
    let alive = true;
    const job = () => { if (alive) { setSrc(generate(a)); setReady(true); } };
    // só desenha quando a obra está chegando na tela
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); queue.push(job); pump(); } }, { rootMargin: "400px 0px" });
    if (ref.current) io.observe(ref.current);
    return () => { alive = false; io.disconnect(); const i = queue.indexOf(job); if (i >= 0) queue.splice(i, 1); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref} src={src} data-art="" loading={photo ? "lazy" : undefined} className={ready ? "ready" : ""} width={W} height={H}
      style={{ aspectRatio: `${W}/${H}` }} decoding="async"
      alt={(photo ? "Fotografia da obra: " : "Composição generativa no lugar da fotografia da obra: ") + `${a.title}, ${a.year}`}
    />
  );
}
