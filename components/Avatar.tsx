import { avatarUrl } from "@/lib/community";
import { initials } from "@/lib/format";

type P = { role?: string; display_name?: string; show_name?: boolean; avatar_path?: string | null; member_code?: string };
/** Foto de perfil (ou iniciais). Colecionadores anônimos aparecem como "C". */
export function Avatar({ p, className = "", label }: { p: P; className?: string; label?: string }) {
  const url = avatarUrl(p as any);
  const txt = p.role === "artist" || p.show_name ? initials(p.display_name || "") : p.role === "admin" ? "AD" : "C";
  return (
    <span className={className + (url ? " has-img" : "") + (p.role === "buyer" ? " av-buyer" : "")} aria-hidden={label ? undefined : true} aria-label={label}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {url ? <img src={url} alt="" loading="lazy" decoding="async" /> : txt}
    </span>
  );
}

/** Selo do perfil oficial da PONCI. */
export function OfficialBadge({ p }: { p?: { member_code?: string } | null }) {
  if (p?.member_code !== "PONCI") return null;
  return <span className="official" title="Perfil oficial da PONCI" aria-label="Perfil oficial"><svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M8 0l2 1.6 2.5-.3.8 2.4 2.2 1.3-.7 2.4.7 2.4-2.2 1.3-.8 2.4-2.5-.3L8 16l-2-1.6-2.5.3-.8-2.4L.5 11l.7-2.4L.5 6.2l2.2-1.3.8-2.4 2.5.3z"/><path d="M5 8.2l2 2 4-4.2" fill="none" stroke="var(--paper)" stroke-width="1.6"/></svg></span>;
}
