"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "./Icon";
import { useToast } from "./Toast";
import { createClient } from "@/lib/supabase/client";
import { updateProfileSettings } from "@/app/actions";
import { initials } from "@/lib/format";

type Me = { id: string; role: string; display_name: string; handle: string | null; avatar_path: string | null; bio: string; city: string; practice: string; full_name: string; show_name: boolean; member_code: string };
const url = (p: string) => `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/works/${p}`;

/** Editar perfil (site e comunidade): foto, nome de exibição, @, bio, cidade e linguagem. */
export function ProfileSettings({ me, after }: { me: Me; after?: string }) {
  const router = useRouter(); const toast = useToast(); const [pending, start] = useTransition();
  const A = me.role === "artist";
  const [v, setV] = useState({ display_name: A || me.display_name !== "Colecionador verificado" ? me.display_name : me.full_name.split(" ")[0] || "", handle: me.handle || "", bio: me.bio || "", city: me.city || "", practice: me.practice || "", full_name: me.full_name || "" });
  const [avatar, setAvatar] = useState<{ path: string | null; preview: string | null }>({ path: me.avatar_path, preview: me.avatar_path ? url(me.avatar_path) : null });
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const on = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setV({ ...v, [k]: k === "handle" ? e.target.value.toLowerCase().replace(/[^a-z0-9._@]/g, "") : e.target.value });

  async function pick(f: File | undefined) {
    if (!f || !/^image\//.test(f.type)) return;
    setBusy(true); setErr("");
    try {
      // recorte quadrado central, 480 px
      const bmp = await createImageBitmap(f); const s = Math.min(bmp.width, bmp.height), S = 480;
      const cv = document.createElement("canvas"); cv.width = cv.height = S;
      cv.getContext("2d")!.drawImage(bmp, (bmp.width - s) / 2, (bmp.height - s) / 2, s, s, 0, 0, S, S);
      const blob: Blob = await new Promise((r) => cv.toBlob((b) => r(b!), "image/jpeg", 0.86));
      const path = `${me.id}/avatar/${crypto.randomUUID()}.jpg`;
      const { error } = await createClient().storage.from("works").upload(path, blob, { contentType: "image/jpeg", cacheControl: "31536000" });
      if (error) throw error;
      setAvatar({ path, preview: URL.createObjectURL(blob) });
    } catch (e: any) { setErr("Não foi possível enviar a foto: " + (e?.message || "tente outra imagem.")); }
    setBusy(false);
  }
  function save(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    start(async () => {
      const r = await updateProfileSettings({ ...v, avatar_path: avatar.path });
      if (!r.ok) { setErr(r.error || "Não foi possível salvar."); return; }
      toast("Perfil atualizado.");
      // "after" terminado em /u/ volta para o perfil pelo @ novo
      if (after) router.push(after.endsWith("/u/") ? after + v.handle.replace(/^@/, "").toLowerCase() : after); else router.refresh();
    });
  }
  return (
    <form className="ps" onSubmit={save} noValidate>
      <div className="ps-photo">
        <span className={"ps-av" + (me.role === "buyer" ? " av-buyer" : "")}>{/* eslint-disable-next-line @next/next/no-img-element */}{avatar.preview ? <img src={avatar.preview} alt="Sua foto" /> : initials(v.display_name || "C")}</span>
        <div>
          <p className="ps-name">{v.display_name || "Seu nome"}</p><p className="ps-handle">@{v.handle.replace(/^@/, "") || "usuario"}</p>
          <div className="ps-photo-acts">
            <label className="linkbtn ps-change"><input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />{busy ? "Enviando…" : avatar.path ? "Trocar foto" : "Adicionar foto"}</label>
            {avatar.path && <button type="button" className="linkbtn" onClick={() => setAvatar({ path: null, preview: null })}>Remover</button>}
          </div>
        </div>
      </div>
      {!A && <p className="hint ps-note">{me.show_name ? "Seu nome, @ e foto aparecem na comunidade." : `Hoje você aparece como “Colecionador ${me.member_code}”. Nome, @ e foto só aparecem se você ligar “Mostrar meu nome”.`}</p>}
      <label className="ps-f"><span className="lab">{A ? "Nome artístico" : "Nome de exibição"}</span><input value={v.display_name} onChange={on("display_name")} maxLength={60} autoComplete="nickname" /></label>
      <label className="ps-f"><span className="lab">Usuário</span><span className="ps-at"><b>@</b><input value={v.handle.replace(/^@/, "")} onChange={on("handle")} maxLength={30} autoCapitalize="none" autoCorrect="off" spellCheck={false} /></span>
        <small>Letras minúsculas, números, ponto ou _. Seu link: comunidade.ponci.art/u/{v.handle.replace(/^@/, "") || "usuario"}</small></label>
      <label className="ps-f"><span className="lab">Bio <em>{v.bio.length}/600</em></span><textarea rows={4} maxLength={600} value={v.bio} onChange={on("bio")} placeholder={A ? "Sua prática, seus materiais, o que move o seu trabalho…" : "O que você coleciona, o que procura…"} /></label>
      <div className="ps-two">
        <label className="ps-f"><span className="lab">Cidade / UF</span><input value={v.city} onChange={on("city")} maxLength={80} autoComplete="address-level2" /></label>
        <label className="ps-f"><span className="lab">{A ? "Linguagem" : "Interesse"}</span><input value={v.practice} onChange={on("practice")} maxLength={80} placeholder={A ? "Pintura, gravura, escultura…" : "Pintura, fotografia…"} /></label>
      </div>
      <label className="ps-f"><span className="lab">Nome civil <em>privado</em></span><input value={v.full_name} onChange={on("full_name")} autoComplete="name" /><small>Não aparece na rede. Só a outra parte de uma venda vê, no contrato.</small></label>
      {err && <p className="err" role="alert">{err}</p>}
      <div className="ps-foot"><button className="btn" type="submit" disabled={pending || busy}>{pending ? "Salvando…" : <>Salvar perfil <Icon n="check" /></>}</button></div>
    </form>
  );
}
