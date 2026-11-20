import { avatarUrl } from "@/lib/community";
import { initials } from "@/lib/format";

type P = { role?: string; display_name?: string; show_name?: boolean; avatar_path?: string | null };
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
