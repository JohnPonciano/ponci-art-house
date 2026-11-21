import { PHOTOS, type PhotoKey } from "@/lib/photos";

const ref = "?utm_source=ponci&utm_medium=referral";
/** Foto institucional (Unsplash) com o crédito do fotógrafo, como pedem as regras da API. */
export function Photo({ k, className = "", alt, pos }: { k: PhotoKey; className?: string; alt?: string; pos?: string }) {
  const p = PHOTOS[k];
  return (
    <figure className={"photo " + className}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/photos/${k}.jpg`} alt={alt || ""} loading="lazy" decoding="async" style={pos ? { objectPosition: pos } : undefined} />
      <figcaption>Foto: <a href={`https://unsplash.com/@${p.user}${ref}`} target="_blank" rel="noreferrer">{p.by}</a> / <a href={`https://unsplash.com/${ref}`} target="_blank" rel="noreferrer">Unsplash</a></figcaption>
    </figure>
  );
}
