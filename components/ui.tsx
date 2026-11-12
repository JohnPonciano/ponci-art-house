import Link from "next/link";
import type { ReactNode } from "react";
import { ArtImage, type ArtLike } from "./ArtImage";
import { Icon } from "./Icon";
import { Fit } from "./Fit";
import { STATUS, PSTATUS } from "@/lib/format";

export function Slab({ a, h, plaque = true, label = "Composição ilustrativa" }: { a: ArtLike; h?: string; plaque?: boolean; label?: string }) {
  return (
    <div className={"slab" + (plaque ? "" : " np")} style={h ? ({ ["--h" as any]: h }) : undefined}>
      <div className="hang"><ArtImage a={a} /></div>
      {plaque && <p className="plaque"><b>{a.title}</b><span>{a.year}</span><span>{label}</span></p>}
    </div>
  );
}

export function SecHead({ n, eyebrow, title, id, href, linkText }: { n: string; eyebrow: string; title: ReactNode; id: string; href?: string; linkText?: string }) {
  return (
    <div className="sec-head">
      <p className="n">{n} — {eyebrow}</p>
      <h2 id={id}>{title}</h2>
      {href && <div className="side"><Link href={href}>{linkText} <Icon n="right" /></Link></div>}
    </div>
  );
}

export function PageHead({ title, label, intro, count }: { title: string; label: ReactNode; intro: ReactNode; count: ReactNode }) {
  return (
    <header className="page-head">
      <Fit as="h1">{title}</Fit>
      <div className="page-strip"><p className="lab">{label}</p><p className="intro">{intro}</p><p className="count">{count}</p></div>
    </header>
  );
}

export const Tag = ({ s, kind = "work" }: { s: string; kind?: "work" | "proposal" }) => {
  const m = (kind === "work" ? STATUS : PSTATUS)[s];
  return m ? <span className={"tag " + m[1]}>{m[0]}</span> : null;
};

export function Empty({ title, body, children, sm }: { title: string; body?: string; children?: ReactNode; sm?: boolean }) {
  return (
    <div className={"empty" + (sm ? " sm" : "")}>
      <p>{title}</p>
      {body && <p style={{ color: "var(--muted)" }}>{body}</p>}
      {children}
    </div>
  );
}

export function Notice({ icon = "info", children }: { icon?: string; children: ReactNode }) {
  return <p className="notice"><Icon n={icon} /><span>{children}</span></p>;
}
