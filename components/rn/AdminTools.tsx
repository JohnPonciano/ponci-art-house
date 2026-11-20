"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "../Icon";
import { useToast } from "../Toast";
import { setMemberStatus } from "@/app/admin/actions";

const LABEL: Record<string, [string, string]> = { active: ["Ativo", "t-accepted"], pending: ["Aguardando aprovação", "t-open"], suspended: ["Suspenso", "t-declined"] };

/** Ferramentas do admin no perfil de um membro: situação da conta, suspender e reativar. */
export function AdminMemberTools({ id, status, name, adminHref }: { id: string; status: string; name: string; adminHref: string }) {
  const router = useRouter(); const toast = useToast(); const [pending, start] = useTransition(); const [ask, setAsk] = useState(false);
  const go = (s: "active" | "suspended") => start(async () => {
    const r = await setMemberStatus(id, s); setAsk(false);
    toast(r.ok ? (s === "suspended" ? `${name} foi suspenso. Não entra mais na rede até ser reativado.` : `${name} foi reativado.`) : r.error); router.refresh();
  });
  const [l, cls] = LABEL[status] || [status, "t-open"];
  return (
    <div className="rn-mod rn-mod-member">
      <p className="lab"><Icon n="shield" /> Moderação · <span className={"tag " + cls}>{l}</span></p>
      {status === "suspended" ? <button type="button" className="btn sm" disabled={pending} onClick={() => go("active")}>Reativar membro</button>
        : ask ? <span className="rn-mod-ask"><span className="hint">Suspender {name}? Perde o acesso à rede e à comunidade.</span>
            <button type="button" className="btn sm ocre" disabled={pending} onClick={() => go("suspended")}>Suspender</button><button type="button" className="linkbtn" onClick={() => setAsk(false)}>Cancelar</button></span>
        : <button type="button" className="btn sm ghost" onClick={() => setAsk(true)}>Suspender membro</button>}
      <a className="linkbtn" href={adminHref}>Abrir no painel</a>
    </div>
  );
}
