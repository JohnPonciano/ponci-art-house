"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "../Toast";
import { setCollectionItem } from "@/app/diary-actions";

/** Mostrar/esconder uma obra comprada na coleção do perfil, com um comentário opcional. */
export function CollectionToggle({ orderId, visible, note: note0 = "", compact }: { orderId: string; visible: boolean; note?: string; compact?: boolean }) {
  const toast = useToast(); const router = useRouter(); const [pending, start] = useTransition();
  const [on, setOn] = useState(visible); const [note, setNote] = useState(note0); const [edit, setEdit] = useState(false);
  const save = (v: boolean, n = note) => { const old = on; setOn(v); start(async () => {
    const r = await setCollectionItem(orderId, v, n);
    if (!r.ok) { setOn(old); toast(r.error); return; }
    toast(v ? "Aparece na sua coleção." : "Escondida da sua coleção."); setEdit(false); router.refresh(); }); };
  return (
    <div className={"col-toggle" + (compact ? " compact" : "")}>
      <label className="col-sw">
        <button type="button" role="switch" aria-checked={on} className="switch" disabled={pending} onClick={() => save(!on)}><span /></button>
        <span>{on ? "Aparece na sua coleção" : "Escondida da coleção"}</span>
      </label>
      {on && !edit && <button type="button" className="linkbtn" onClick={() => setEdit(true)}>{note ? "Editar comentário" : "Adicionar comentário"}</button>}
      {on && edit && <form className="col-note" onSubmit={(e) => { e.preventDefault(); save(true, note); }}>
        <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={280} placeholder="Ex.: fica na minha sala, pega a luz da tarde" autoFocus />
        <button className="btn sm" type="submit" disabled={pending}>Salvar</button>
      </form>}
    </div>
  );
}
