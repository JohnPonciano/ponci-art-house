"use client";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "./Icon";
import { useToast } from "./Toast";
import { createMemberInvite, cancelMemberInvite } from "@/app/actions";

export type MyInvite = { code: string; role: "artist" | "buyer"; uses_left: number; invitee_name: string; created_at: string };
const MAX = 3;

/** Convites do membro: gera até 3, compartilha o link (card bonito) ou a imagem para os Stories. */
export function MemberInvites({ invites }: { invites: MyInvite[] }) {
  const router = useRouter(); const toast = useToast(); const [pending, start] = useTransition();
  const [name, setName] = useState(""); const [role, setRole] = useState<"artist" | "buyer">("buyer"); const [err, setErr] = useState("");
  const [canShare, setCanShare] = useState(false); useEffect(() => setCanShare(!!navigator.share), []);
  const left = MAX - invites.length;
  const link = (c: string) => `${location.origin}/convite/${c}`;
  const create = (e: React.FormEvent) => {
    e.preventDefault(); setErr("");
    if (name.trim().length < 2) { setErr("Escreva o nome de quem você vai convidar."); return; }
    start(async () => { const r = await createMemberInvite(role, name); if (!r.ok) { setErr(r.error || "Não foi possível gerar."); return; } setName(""); toast("Convite criado. Agora é só compartilhar."); router.refresh(); });
  };
  const share = async (i: MyInvite) => {
    const url = link(i.code), text = `${i.invitee_name.split(" ")[0]}, separei um dos meus convites da PONCI para você.`;
    if (canShare) { try { await navigator.share({ title: "Convite para a PONCI", text, url }); } catch {} }
    else { await navigator.clipboard.writeText(`${text} ${url}`); toast("Link copiado. Cole no WhatsApp ou no e-mail."); }
  };
  const story = async (i: MyInvite) => {
    const url = `/convite/${i.code}/story`;
    try {
      const blob = await (await fetch(url)).blob(); const file = new File([blob], `convite-ponci-${i.code}.png`, { type: "image/png" });
      if ((navigator as any).canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: "Convite para a PONCI" }); return; }
    } catch (e: any) { if (e?.name === "AbortError") return; }
    window.open(url, "_blank"); toast("Salve a imagem e publique nos Stories. Use o adesivo de link com o endereço do convite.");
  };
  return (
    <div className="inv">
      <div className="inv-head">
        <p className="inv-count"><b>{left}</b> de {MAX} convites disponíveis</p>
        <div className="inv-dots" aria-hidden="true">{Array.from({ length: MAX }, (_, k) => <i key={k} className={k < invites.length ? "on" : ""} />)}</div>
      </div>
      {left > 0 ? (
        <form className="inv-form" onSubmit={create} noValidate>
          <label className="lab" htmlFor="inv-name">Quem você vai convidar</label>
          <input id="inv-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da pessoa" maxLength={80} autoComplete="off" />
          <div className="inv-role" role="radiogroup" aria-label="Entra como">
            {(["buyer", "artist"] as const).map((r) => <button key={r} type="button" role="radio" aria-checked={role === r} onClick={() => setRole(r)}>{r === "buyer" ? "Colecionador" : "Artista"}</button>)}
          </div>
          <button className="btn" type="submit" disabled={pending}>{pending ? "Gerando…" : <>Gerar convite <Icon n="plus" /></>}</button>
          {err && <p className="err">{err}</p>}
        </form>
      ) : <p className="hint">Você já usou seus {MAX} convites. Cancelar um convite ainda não usado devolve a vaga.</p>}
      {invites.length > 0 && <ul className="inv-list">{invites.map((i) => {
        const used = i.uses_left <= 0;
        return (
          <li key={i.code} className={used ? "used" : ""}>
            <div className="inv-who"><b>{i.invitee_name}</b><span>{i.role === "artist" ? "Artista" : "Colecionador"} · {i.code}</span>
              <span className={"tag " + (used ? "t-accepted" : "t-open")}>{used ? "Aceito · aguardando a curadoria" : "Aguardando aceite"}</span></div>
            {!used && <div className="inv-acts">
              <button type="button" className="btn sm" onClick={() => share(i)}><Icon n="share" />{canShare ? "Compartilhar" : "Copiar link"}</button>
              <button type="button" className="btn sm ghost" onClick={() => story(i)}><Icon n="image" />Stories</button>
              <a className="btn sm ghost" href={`/convite/${i.code}`} target="_blank" rel="noreferrer">Ver card</a>
              <button type="button" className="linkbtn" disabled={pending} onClick={() => start(async () => { const r = await cancelMemberInvite(i.code); toast(r.ok ? "Convite cancelado. A vaga voltou." : r.error); router.refresh(); })}>Cancelar</button>
            </div>}
          </li>);
      })}</ul>}
      <p className="hint">Cada convite vale para 1 pessoa. Quem entra pelo seu convite passa pela confirmação da PONCI antes de ver o acervo.</p>
    </div>
  );
}
