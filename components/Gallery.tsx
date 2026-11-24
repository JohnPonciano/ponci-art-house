import Link from "next/link";
import type { ReactNode } from "react";
import { ArtImage } from "./ArtImage";
import { Icon } from "./Icon";
import { FavButton } from "./area-client";
import { Rail } from "./GalleryClient";
import { brl, catNo, dims, CAT } from "@/lib/format";
import type { Work } from "@/lib/data";
import { Reprod, PrintTag } from "./ui";

/** Obra como numa parede de galeria: a peça na parede e a etiqueta (plaqueta) embaixo. */
export function GalleryCard({ a, fav, size = "m" }: { a: Work; fav?: boolean; size?: "m" | "l" }) {
  const sold = a.status !== "published";
  return (
    <article className={"g-card g-" + size}>
      <Link href={`/colecionador/obras/${a.slug}`} className="g-link">
        <div className="g-wall"><ArtImage a={a} max={size === "l" ? 1000 : 560} />{sold && <span className="g-dot" title={a.status === "sold" ? "Original vendido" : "Reservada"}>{a.status === "sold" ? "Vendida" : "Reservada"}</span>}</div>
        <div className="g-label">
          <span className="g-tags"><span className="g-no">{catNo(a.no)} · {a.year}</span><Reprod a={a} /><PrintTag a={a} /></span>
          <h3 className="g-title">{a.title}</h3>
          <span className="g-artist">{a.artist?.display_name}</span>
          <span className="g-meta">{a.medium} · {dims(a)}</span>
          <span className="g-price">{a.status === "sold" ? (a.prints ? "Original vendido · prints à venda" : "Vendida") : sold ? "Indisponível no momento" : brl(a.price)}</span>
        </div>
      </Link>
      {fav != null && <FavButton workId={a.id} on={fav} title={a.title} />}
    </article>
  );
}

/** Uma "sala" do acervo: título, contexto e as obras lado a lado num carrossel. */
export function Room({ title, sub, href, linkText = "Ver todas", children, n }: { title: ReactNode; sub?: ReactNode; href?: string; linkText?: string; children: ReactNode; n?: string }) {
  return (
    <section className="g-room">
      <header className="g-room-head">
        <div>{n && <span className="lab">{n}</span>}<h2>{title}</h2>{sub && <p>{sub}</p>}</div>
        {href && <Link href={href} className="g-all" scroll={false}>{linkText} <Icon n="right" /></Link>}
      </header>
      <Rail>{children}</Rail>
    </section>
  );
}

/** Obra em destaque, como a peça principal de uma sala. */
export function Feature({ a, fav }: { a: Work; fav?: boolean }) {
  return (
    <section className="g-feature" aria-label="Em destaque">
      <Link href={`/colecionador/obras/${a.slug}`} className="g-feature-wall"><ArtImage a={a} /></Link>
      <div className="g-feature-label">
        <span className="lab">Em destaque · {CAT[a.cat] || "Obra"}</span>
        <h2>{a.title}</h2>
        <p className="g-feature-artist">{a.artist?.display_name}<span>{a.artist?.city}</span></p>
        <dl><dt>Ano</dt><dd>{a.year}</dd><dt>Técnica</dt><dd>{a.medium}</dd><dt>Dimensões</dt><dd>{dims(a)}</dd></dl>
        <p className="g-feature-price">{brl(a.price)}<small>Preço da artista · transação em custódia</small></p>
        <div className="g-feature-acts"><Link className="btn" href={`/colecionador/obras/${a.slug}`}>Ver a obra <Icon n="right" /></Link>
          {fav != null && <span className="g-feature-fav"><FavButton workId={a.id} on={fav} title={a.title} variant="link" /></span>}</div>
      </div>
    </section>
  );
}
