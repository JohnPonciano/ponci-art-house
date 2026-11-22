"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "./Icon";
import { useToast } from "./Toast";
import * as A from "@/app/admin/actions";

/* Horário de Brasília (sem horário de verão desde 2019): o campo datetime-local trabalha em -03:00. */
const BRT = -3 * 3600e3;
export const toLocalInput = (iso: string) => new Date(new Date(iso).getTime() + BRT).toISOString().slice(0, 16);
const fromLocalInput = (v: string) => `${v}:00-03:00`;

function useRun() {
  const toast = useToast(); const router = useRouter(); const [pending, start] = useTransition();
  const run = (fn: () => Promise<any>, ok: string, after?: () => void) => start(async () => {
    const r = await fn(); toast(r.ok ? ok : r.error); if (r.ok) { after?.(); router.refresh(); }
  });
  return { run, pending };
}

/** Conectar (ou trocar) o token da Meta. O valor vai direto para o cofre do Supabase. */
export function IgConnect({ connected }: { connected: boolean }) {
  const { run, pending } = useRun(); const [open, setOpen] = useState(!connected); const [t, setT] = useState("");
  if (!open) return <button type="button" className="btn sm ghost" onClick={() => setOpen(true)}>Trocar token</button>;
  return (
    <form className="ig-connect" onSubmit={(e) => { e.preventDefault(); run(() => A.igConnect(t), "Instagram conectado.", () => { setT(""); setOpen(false); }); }}>
      <label className="lab" htmlFor="ig-tok">Token de acesso da Meta (começa com EAA)</label>
      <input id="ig-tok" type="password" autoComplete="off" spellCheck={false} value={t} onChange={(e) => setT(e.target.value)} placeholder="Cole aqui o token estendido (60 dias)" />
      <span style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <button className="btn sm" type="submit" disabled={pending || t.trim().length < 20}>{pending ? "Conferindo com a Meta…" : <>Conectar <Icon n="check" /></>}</button>
        {connected && <button type="button" className="linkbtn" onClick={() => setOpen(false)}>Cancelar</button>}
      </span>
      <p className="hint">Antes de salvar, a PONCI confere com a Meta se o token enxerga a @ponci.art e pode publicar. Ele fica criptografado no cofre do banco e não aparece mais em lugar nenhum.</p>
    </form>
  );
}

/** Formulário de publicação: nova ou edição. */
export function IgEditor({ id, media = [], caption = "", publishAt, label = "", onDone }: { id?: string; media?: string[]; caption?: string; publishAt?: string; label?: string; onDone?: () => void }) {
  const { run, pending } = useRun();
  const [v, setV] = useState({ label, media: media.join("\n"), caption, when: publishAt ? toLocalInput(publishAt) : "" });
  const urls = v.media.split(/\s+/).map((s) => s.trim()).filter(Boolean);
  const tags = (v.caption.match(/#[\p{L}\p{N}_]+/gu) || []).length;
  return (
    <form className="ig-editor" onSubmit={(e) => { e.preventDefault(); run(() => A.igSave(id || null, urls, v.caption, fromLocalInput(v.when), v.label), id ? "Publicação atualizada." : "Publicação programada.", onDone); }}>
      {!id && <label className="field"><span className="lab">Nome (só para você)</span><input value={v.label} onChange={(e) => setV({ ...v, label: e.target.value })} placeholder="Ex.: Aviso de dezembro" /></label>}
      <label className="field"><span className="lab">Imagens JPEG (um link por linha, até 10, na ordem do carrossel)</span>
        <textarea rows={Math.min(8, Math.max(2, urls.length + 1))} value={v.media} onChange={(e) => setV({ ...v, media: e.target.value })} placeholder="https://ponci.art/kit/post-01-toda-obra-comeca-num-atelie.jpg" spellCheck={false} /></label>
      {urls.length > 0 && <div className="ig-thumbs">{urls.map((u, i) => /* eslint-disable-next-line @next/next/no-img-element */ <img key={i} src={u} alt="" />)}</div>}
      <label className="field"><span className="lab">Legenda <small>{v.caption.length}/2200 · {tags}/30 hashtags</small></span>
        <textarea rows={6} value={v.caption} onChange={(e) => setV({ ...v, caption: e.target.value })} maxLength={2200} /></label>
      <label className="field"><span className="lab">Data e hora (Brasília)</span><input type="datetime-local" value={v.when} onChange={(e) => setV({ ...v, when: e.target.value })} required /></label>
      <span style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <button className="btn sm" type="submit" disabled={pending || !urls.length || !v.when}>{pending ? "Salvando…" : id ? "Salvar alterações" : "Programar"}</button>
        {onDone && <button type="button" className="linkbtn" onClick={onDone}>Cancelar</button>}
      </span>
    </form>
  );
}

/** Ações de cada item da fila. */
export function IgItemActions({ id, status, media, caption, publishAt, permalink }: { id: string; status: string; media: string[]; caption: string; publishAt: string; permalink: string | null }) {
  const { run, pending } = useRun(); const [edit, setEdit] = useState(false); const [ask, setAsk] = useState<"" | "now" | "cancel">("");
  if (edit) return <IgEditor id={id} media={media} caption={caption} publishAt={publishAt} onDone={() => setEdit(false)} />;
  if (ask) return (
    <span className="ig-acts">
      <span className="hint">{ask === "now" ? "Publicar no Instagram no próximo minuto?" : "Tirar da fila?"}</span>
      <button type="button" className={"btn sm" + (ask === "cancel" ? " ocre" : "")} disabled={pending} onClick={() => run(() => A.igAction(id, ask), ask === "now" ? "Vai sair no próximo minuto." : "Tirada da fila.", () => setAsk(""))}>Confirmar</button>
      <button type="button" className="linkbtn" onClick={() => setAsk("")}>Voltar</button>
    </span>);
  return (
    <span className="ig-acts">
      {status === "published" && permalink && <a className="btn sm ghost" href={permalink} target="_blank" rel="noreferrer">Ver no Instagram <Icon n="right" /></a>}
      {["scheduled", "failed", "cancelled"].includes(status) && <button type="button" className="btn sm ghost" onClick={() => setEdit(true)}>Editar <Icon n="edit" /></button>}
      {status === "scheduled" && <button type="button" className="btn sm ghost" onClick={() => setAsk("now")}>Publicar agora</button>}
      {(status === "failed" || status === "cancelled") && <button type="button" className="btn sm" disabled={pending} onClick={() => run(() => A.igAction(id, "retry"), "De volta na fila.")}>Tentar de novo</button>}
      {(status === "scheduled" || status === "failed") && <button type="button" className="linkbtn" onClick={() => setAsk("cancel")}>Cancelar</button>}
    </span>
  );
}

export function IgNew() {
  const [open, setOpen] = useState(false);
  return open ? <div className="ig-new"><IgEditor onDone={() => setOpen(false)} /></div>
    : <button type="button" className="btn sm" onClick={() => setOpen(true)}>Nova publicação <Icon n="plus" /></button>;
}
