"use client";
import { useState, useTransition } from "react";
import { Field } from "./Field";
import { Icon } from "../Icon";
import { useToast } from "../Toast";
import { updateProfile } from "@/app/actions";

export function ProfileForm({ me }: { me: { full_name: string; city: string; practice: string; bio: string; role: string } }) {
  const toast = useToast(); const [pending, start] = useTransition();
  const [v, setV] = useState({ full_name: me.full_name, city: me.city, practice: me.practice, bio: me.bio });
  const [err, setErr] = useState<Record<string, string>>({});
  const on = (k: string) => (e: any) => setV({ ...v, [k]: e.target.value });
  const A = me.role === "artist";
  return (
    <form className="form" noValidate onSubmit={(e) => {
      e.preventDefault(); const x: Record<string, string> = {};
      if (v.full_name.trim().length < 2) x.full_name = "Informe seu nome."; if (!v.city.trim()) x.city = "Informe sua cidade.";
      setErr(x); if (Object.keys(x).length) return;
      start(async () => { const r = await updateProfile(v); toast(r.ok ? "Perfil salvo." : r.error); });
    }}>
      <Field name="full_name" label="Nome civil (privado)" value={v.full_name} onChange={on("full_name")} error={err.full_name} aside="Só a contraparte de uma venda vê" />
      <div className="two">
        <Field name="city" label="Cidade / UF" value={v.city} onChange={on("city")} error={err.city} />
        <Field name="practice" label={A ? "Linguagem" : "Interesse"} value={v.practice} onChange={on("practice")} />
      </div>
      <Field as="textarea" name="bio" rows={5} label={A ? "Sobre a sua prática" : "Sobre a sua coleção"} value={v.bio} onChange={on("bio")} />
      <div className="form-actions"><button className="btn" type="submit" disabled={pending}>{pending ? "Salvando…" : <>Salvar perfil <Icon n="check" /></>}</button></div>
    </form>
  );
}
