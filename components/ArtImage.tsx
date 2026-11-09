"use client";
import { useEffect, useState } from "react";
import { generate, renderSize } from "@/lib/gen";

export type ArtLike = {
  slug?: string; title: string; year: number; h: number; w: number;
  gen?: any; image_path?: string | null; img_w?: number | null; img_h?: number | null; preview?: string | null;
};
const BLANK = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
export const imageUrl = (path: string) =>
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/works/${path}`;

/** Foto enviada pela artista, ou composição generativa desenhada no navegador. */
export function ArtImage({ a }: { a: ArtLike }) {
  const photo = a.preview || (a.image_path ? imageUrl(a.image_path) : null);
  const { W, H } = renderSize(photo ? a : { h: a.h, w: a.w });
  const [src, setSrc] = useState<string>(photo || BLANK);
  const [ready, setReady] = useState(!!photo);
  const key = photo || JSON.stringify([a.gen, a.h, a.w]);
  useEffect(() => {
    if (photo) { setSrc(photo); setReady(true); return; }
    let alive = true;
    const id = requestAnimationFrame(() => {
      if (!alive) return;
      setSrc(generate(a)); setReady(true);
    });
    return () => { alive = false; cancelAnimationFrame(id); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src} data-art="" className={ready ? "ready" : ""} width={W} height={H}
      style={{ aspectRatio: `${W}/${H}` }} decoding="async"
      alt={(photo ? "Fotografia da obra: " : "Composição generativa no lugar da fotografia da obra: ") + `${a.title}, ${a.year}`}
    />
  );
}
