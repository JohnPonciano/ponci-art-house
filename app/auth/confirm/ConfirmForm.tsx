"use client";
import { useActionState } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { confirmToken } from "./actions";

export function ConfirmForm({ token_hash, type, next, label }: { token_hash: string; type: string; next: string; label: string }) {
  const [state, action, pending] = useActionState(confirmToken, { error: "" });
  return (
    <form action={action} className="form">
      <input type="hidden" name="token_hash" value={token_hash} />
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="next" value={next} />
      {state.error && <p className="err-box" role="alert">{state.error}</p>}
      <div className="form-actions">
        <button className="btn" type="submit" disabled={pending}>{pending ? "Validando…" : <>{label} <Icon n="right" /></>}</button>
        {state.error && <Link className="linkbtn" href={type === "recovery" ? "/senha" : "/entrar"}>{type === "recovery" ? "Pedir novo link" : "Ir para o login"}</Link>}
      </div>
    </form>
  );
}
