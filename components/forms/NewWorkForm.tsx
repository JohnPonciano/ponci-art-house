"use client";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Field } from "./Field";
import { Icon } from "../Icon";
import { Slab } from "../ui";
import { useToast } from "../Toast";
import { createWork } from "@/app/actions";
import { brl, CAT, parseMoney } from "@/lib/format";

/* Cadastro de obra pensado para ser rápido: foto, título, técnica, tamanho e preço.
   O resto fica em "mais detalhes", opcional. Prints já ficam encaminhados com a própria foto. */
const TECNICAS: [string, string][] = [
  ["Óleo sobre tela", "painting"], ["Acrílica sobre tela", "painting"], ["Aquarela sobre papel", "paper"],
  ["Técnica mista", "mixed"], ["Desenho sobre papel", "paper"], ["Gravura", "edition"], ["Spray sobre tela", "painting"],
];
const YEAR = new Date().getFullYear();
// tamanho mínimo da foto para o menor print (A4 a 300 dpi): 3508 × 2480 px
const PRINT_MIN: [number, number] = [3508, 2480];

export function NewWorkForm({ userId, pct }: { userId: string; pct: number }) {
  const router = useRouter(); const toast = useToast(); const [pending, start] = useTransition();
  const [v, setV] = useState({ title: "", medium: "", cat: "painting", h: "", w: "", price: "", year: String(YEAR), desc: "", edition: "", repro: false, inc: true, depth: "", weight: "", prints: true });
  const [err, setErr] = useState<Record<string, string>>({}); const [status, setStatus] = useState("");
  const [photo, setPhoto] = useState<{ blob: Blob; thumb: Blob; url: string; w: number; h: number; file: File; ow: number; oh: number } | null>(null);
  const [over, setOver] = useState(false);
  const on = (k: string) => (e: any) => setV({ ...v, [k]: e.target.value });
  const price = parseMoney(v.price);
  const printOk = !!photo && /^image\/(jpeg|png)$/.test(photo.file.type) && photo.file.size <= 50 * 1048576
    && Math.max(photo.ow, photo.oh) >= PRINT_MIN[0] && Math.min(photo.ow, photo.oh) >= PRINT_MIN[1];

  const [pv, setPv] = useState(v);
  useEffect(() => { const t = setTimeout(() => setPv(v), 300); return () => clearTimeout(t); }, [v]);
  const preview = useMemo(() => ({ title: pv.title.trim() || "Sua obra", year: +pv.year || YEAR, h: Math.max(5, +pv.h || 100), w: Math.max(5, +pv.w || 80),
    gen: { g: "mono", seed: 7, p: ["#DAD6CF", "#C6C2BA", "#8B6A4F"] }, preview: photo?.url || null, img_w: photo?.w, img_h: photo?.h }), [pv, photo]);

  async function take(f?: File | null) {
    if (!f || !/^image\//.test(f.type)) return;
    let bmp: ImageBitmap;
    try { bmp = await createImageBitmap(f); } catch { toast("Não consegui abrir essa imagem. Tente uma foto em JPG ou PNG."); return; }
    const M = 1600, k = Math.min(1, M / Math.max(bmp.width, bmp.height));
    const cv = document.createElement("canvas"); cv.width = Math.round(bmp.width * k); cv.height = Math.round(bmp.height * k);
    cv.getContext("2d")!.drawImage(bmp, 0, 0, cv.width, cv.height);
    const blob: Blob = await new Promise((r) => cv.toBlob((b) => r(b!), "image/jpeg", 0.85));
    const kt = Math.min(1, 560 / Math.max(bmp.width, bmp.height));
    const ct = document.createElement("canvas"); ct.width = Math.round(bmp.width * kt); ct.height = Math.round(bmp.height * kt);
    ct.getContext("2d")!.drawImage(bmp, 0, 0, ct.width, ct.height);
    const thumb: Blob = await new Promise((r) => ct.toBlob((b) => r(b!), "image/jpeg", 0.8));
    if (photo) URL.revokeObjectURL(photo.url);
    setPhoto({ blob, thumb, url: URL.createObjectURL(blob), w: cv.width, h: cv.height, file: f, ow: bmp.width, oh: bmp.height });
    setErr({ ...err, photo: "" });
  }

  function submit(ev: React.FormEvent) {
    ev.preventDefault();
    const e: Record<string, string> = {};
    if (!photo) e.photo = "Envie uma foto da obra.";
    if (!v.title.trim()) e.title = "Dê um nome pra obra.";
    if (!v.medium.trim()) e.medium = "Escolha ou escreva a técnica.";
    if (!(+v.h >= 5 && +v.h <= 600)) e.h = "Entre 5 e 600 cm.";
    if (!(+v.w >= 5 && +v.w <= 600)) e.w = "Entre 5 e 600 cm.";
    if (price < 500) e.price = "A partir de R$ 500.";
    if (!(+v.year >= 1950 && +v.year <= YEAR)) e.year = `Entre 1950 e ${YEAR}.`;
    setErr(e);
    if (Object.keys(e).length) { setStatus("Falta pouco: confira os campos marcados."); document.getElementById(e.photo ? "f-photo" : "i-" + Object.keys(e)[0])?.scrollIntoView({ behavior: "smooth", block: "center" }); return; }
    setStatus("");
    start(async () => {
      const sb = createClient(); const id = crypto.randomUUID(), path = `${userId}/${id}.jpg`;
      const [{ error }] = await Promise.all([
        sb.storage.from("works").upload(path, photo!.blob, { contentType: "image/jpeg" }),
        sb.storage.from("works").upload(`${userId}/${id}-t.jpg`, photo!.thumb, { contentType: "image/jpeg", cacheControl: "31536000" }),
      ]);
      if (error) { setStatus("Não foi possível enviar a foto: " + error.message); return; }
      // prints: a foto original (sem redução) vai para o cofre privado e vira o arquivo de impressão
      let master: { path: string; w: number; h: number } | null = null;
      if (v.prints && !v.repro && printOk) {
        const ext = photo!.file.type === "image/png" ? "png" : "jpg", mp = `${userId}/${id}.${ext}`;
        const up = await sb.storage.from("print-masters").upload(mp, photo!.file, { contentType: photo!.file.type });
        if (!up.error) master = { path: mp, w: photo!.ow, h: photo!.oh };
      }
      const r = await createWork({ title: v.title, year: +v.year, cat: v.cat, medium: v.medium, h: +v.h, w: +v.w, edition: v.edition, price, description: v.desc,
        gen: {}, reproduction: v.repro, depth_cm: +v.depth.replace(/\D/g, "") || null, ship_included: v.inc, weight_kg: +v.weight.replace(",", ".") || null,
        image_path: path, img_w: photo!.w, img_h: photo!.h, prints_wanted: v.prints && !v.repro, print_master: master });
      if (!r.ok) { setStatus(r.error!); return; }
      toast("Obra enviada! A curadoria responde em até 3 dias úteis."); router.push(`/artista/obras/${r.data!.slug}`);
    });
  }

  return (
    <section className="acq nw" aria-labelledby="nf-t" style={{ marginTop: "clamp(28px,4vw,48px)" }}>
      <div className="acq-aside"><p className="lab">Prévia</p><h2 id="nf-t">Assim ela aparece.</h2>
        <div className="preview-slab" aria-live="polite"><Slab a={preview} label="Em curadoria" /></div></div>
      <div className="acq-main">
        <form className="form" onSubmit={submit} noValidate>
          <div className={"field" + (err.photo ? " bad" : "")} id="f-photo"><span className="lab">1 · Foto da obra</span>
            <label className={"drop nw-drop" + (over ? " over" : "") + (photo ? " has" : "")} onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={(e) => { e.preventDefault(); setOver(false); take(e.dataTransfer.files[0]); }}>
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => take(e.target.files?.[0])} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {photo ? <img src={photo.url} alt="" /> : <Icon n="upload" />}
              <b>{photo ? "Trocar foto" : "Escolher foto"}</b>
              <span>{photo ? `${photo.ow} × ${photo.oh} px` : "De frente, com boa luz e sem moldura. Quanto maior, melhor."}</span>
            </label>
            <p className="err">{err.photo || ""}</p>
          </div>

          <Field name="title" label="2 · Nome da obra" placeholder="Ex.: Campo de Anil III" value={v.title} onChange={on("title")} error={err.title} />

          <div className={"field" + (err.medium ? " bad" : "")}><span className="lab">3 · Técnica</span>
            <div className="nw-chips" role="group" aria-label="Técnica">{TECNICAS.map(([t, c]) => (
              <button key={t} type="button" aria-pressed={v.medium === t} onClick={() => setV({ ...v, medium: t, cat: c })}>{t}</button>))}</div>
            <input id="i-medium" value={v.medium} onChange={on("medium")} placeholder="Ou escreva: ex. Óleo e folha de ouro sobre linho" />
            <p className="err">{err.medium || ""}</p>
          </div>

          <div className="two">
            <Field name="h" label="4 · Altura (cm)" inputMode="decimal" placeholder="Ex.: 100" value={v.h} onChange={on("h")} error={err.h} />
            <Field name="w" label="Largura (cm)" inputMode="decimal" placeholder="Ex.: 80" value={v.w} onChange={on("w")} error={err.w} />
          </div>

          <Field name="price" label="5 · Preço do original (com frete)" placeholder="R$ 0" inputMode="numeric" aside={price ? `Você recebe ${brl(price - Math.round((price * pct) / 100))}` : ""}
            value={v.price} onChange={on("price")} onBlur={() => price && setV({ ...v, price: brl(price) })} error={err.price} />

          {!v.repro && <label className="check nw-prints"><input type="checkbox" checked={v.prints} onChange={(e) => setV({ ...v, prints: e.target.checked })} />
            <span><b>Também quero vender prints desta obra.</b> {!photo ? "A foto que você enviar vira o arquivo de impressão." : printOk
              ? "Sua foto tem qualidade pra impressão. Depois da aprovação, os prints ficam prontos: é só conferir os valores e autorizar."
              : `Pra imprimir, a foto precisa de pelo menos ${PRINT_MIN[0]} × ${PRINT_MIN[1]} px em JPG ou PNG. Pode seguir assim: depois da aprovação você envia o arquivo maior.`}</span></label>}

          <details className="nw-more">
            <summary className="lab">Mais detalhes (opcional)</summary>
            <div className="two">
              <Field name="year" label="Ano" inputMode="numeric" value={v.year} onChange={on("year")} error={err.year} />
              <Field as="select" name="cat" label="Categoria" value={v.cat} onChange={on("cat")}>{Object.keys(CAT).map((k) => <option key={k} value={k}>{CAT[k]}</option>)}</Field>
            </div>
            <Field as="textarea" name="desc" rows={3} label="Sobre a obra" placeholder="O que ela investiga, como foi feita… (ajuda a curadoria e quem compra)" value={v.desc} onChange={on("desc")} />
            <Field name="edition" label="Edição" placeholder="Obra única" value={v.edition} onChange={on("edition")} />
            <p className="hint"><b>Frete grátis para quem compra:</b> o preço já inclui o envio. Você embala e despacha com rastreio (<a href="/guia-de-envio" target="_blank" style={{ textDecoration: "underline" }}>guia de embalagem</a>).</p>
            <div className="two">
              <Field name="depth" label="Profundidade (cm)" inputMode="numeric" placeholder="Ex.: 4" value={v.depth} onChange={on("depth")} />
              <Field name="weight" label="Peso embalada (kg)" inputMode="decimal" placeholder="Ex.: 3,5" value={v.weight} onChange={on("weight")} />
            </div>
            <label className="check"><input type="checkbox" checked={v.repro} onChange={(e) => setV({ ...v, repro: e.target.checked })} />
              <span><b>Esta peça é uma reprodução</b> (impressão, pôster), não o original. Ela ganha a etiqueta REPROD.</span></label>
          </details>

          <p className="form-status" role="alert">{status}</p>
          <div className="form-actions"><button className="btn" type="submit" disabled={pending}>{pending ? "Enviando…" : <>Enviar para curadoria <Icon n="right" /></>}</button>
            <p>A curadoria responde em até 3 dias úteis. Só depois disso a obra aparece na galeria.</p></div>
        </form>
      </div>
    </section>
  );
}
