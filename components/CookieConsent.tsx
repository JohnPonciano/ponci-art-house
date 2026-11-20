"use client";
import { useEffect, useState } from "react";
import { Icon } from "./Icon";

/* Aviso de cookies (LGPD). Guarda a escolha num cookie de *.ponci.art por 12 meses e avisa o Google (Consent Mode v2). */
const KEY = "ponci-consent";
type Choice = { a: boolean; m: boolean };
const read = (): Choice | null => { const v = (document.cookie.match(/(?:^|; )ponci-consent=([^;]+)/) || [])[1]; return v ? { a: v.includes("a1"), m: v.includes("m1") } : null; };
function save(c: Choice) {
  const dom = /(^|\.)ponci\.art$/.test(location.hostname) ? "; domain=.ponci.art" : "";
  document.cookie = `${KEY}=v1.a${c.a ? 1 : 0}.m${c.m ? 1 : 0}; path=/; max-age=31536000; samesite=lax${location.protocol === "https:" ? "; secure" : ""}${dom}`;
  const w = window as any; w.dataLayer = w.dataLayer || [];
  const g = (...args: any[]) => w.dataLayer.push(args);
  g("consent", "update", { analytics_storage: c.a ? "granted" : "denied", ad_storage: c.m ? "granted" : "denied", ad_user_data: c.m ? "granted" : "denied", ad_personalization: c.m ? "granted" : "denied" });
  w.dataLayer.push({ event: "ponci_consent", consent_analytics: c.a, consent_marketing: c.m });
}
/** Reabre as preferências (link "Cookies" no rodapé). */
export const openCookiePrefs = () => window.dispatchEvent(new Event("ponci:cookies"));

export function CookieConsent() {
  const [open, setOpen] = useState(false); const [custom, setCustom] = useState(false); const [c, setC] = useState<Choice>({ a: true, m: false });
  useEffect(() => {
    const cur = read(); if (!cur) setOpen(true); else setC(cur);
    const f = () => { setC(read() || { a: true, m: false }); setCustom(true); setOpen(true); };
    window.addEventListener("ponci:cookies", f); return () => window.removeEventListener("ponci:cookies", f);
  }, []);
  if (!open) return null;
  const done = (x: Choice) => { save(x); setC(x); setOpen(false); setCustom(false); };
  return (
    <div className="cc" role="dialog" aria-modal="false" aria-labelledby="cc-t">
      <p className="cc-lab"><i />Cookies</p>
      <p id="cc-t" className="cc-t">Usamos cookies para a PONCI funcionar e, se você permitir, para medir o uso e melhorar a rede.</p>
      {custom && <ul className="cc-opts">
        <li><span><b>Essenciais</b><small>Login, segurança e preferências. Sempre ativos.</small></span><span className="switch" aria-checked="true" role="switch" aria-disabled="true"><span /></span></li>
        <li><span><b>Medição</b><small>Google Analytics: páginas vistas e uso, sem identificar você.</small></span><button type="button" className="switch" role="switch" aria-checked={c.a} aria-label="Medição" onClick={() => setC({ ...c, a: !c.a })}><span /></button></li>
        <li><span><b>Marketing</b><small>Anúncios e conversões (Google Tag Manager).</small></span><button type="button" className="switch" role="switch" aria-checked={c.m} aria-label="Marketing" onClick={() => setC({ ...c, m: !c.m })}><span /></button></li>
      </ul>}
      <div className="cc-acts">
        {custom ? <button type="button" className="btn sm" onClick={() => done(c)}>Salvar escolhas <Icon n="check" /></button>
          : <button type="button" className="btn sm" onClick={() => done({ a: true, m: true })}>Aceitar todos</button>}
        <button type="button" className="btn sm ghost" onClick={() => done({ a: false, m: false })}>Só essenciais</button>
        {!custom && <button type="button" className="linkbtn" onClick={() => setCustom(true)}>Personalizar</button>}
        <a className="linkbtn" href="https://ponci.art/cookies" target="_blank" rel="noreferrer">Saiba mais</a>
      </div>
    </div>
  );
}

export function CookieLink({ className = "" }: { className?: string }) {
  return <button type="button" className={"linkbtn " + className} onClick={openCookiePrefs}>Cookies</button>;
}
