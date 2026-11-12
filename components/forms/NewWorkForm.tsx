"use client";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Field } from "./Field";
import { Icon } from "../Icon";
import { Slab } from "../ui";
import { useToast } from "../Toast";
import { createWork } from "@/app/actions";
import { PALETTES, STYLE_NAMES } from "@/lib/gen";
import { brl, CAT, parseMoney, COMMISSION } from "@/lib/format";

const rand = () => Math.floor(Math.random() * 9000) + 100;

export function NewWorkForm({ userId }: { userId: string }) {
  const router = useRouter(); const toast = useToast(); const [pending, start] = useTransition();
  const [v, setV] = useState({ title: "", year: "2026", cat: "painting", medium: "", h: "120", w: "100", edition: "", price: "", desc: "" });
  const [err, setErr] = useState<Record<string, string>>({}); const [status, setStatus] = useState("");
  const [style, setStyle] = useState({ g: "mono", pi: 0, seed: rand() });
  const [photo, setPhoto] = useState<{ blob: Blob; url: string; w: number; h: number } | null>(null);
  const [over, setOver] = useState(false);
  const on = (k: string) => (e: any) => setV({ ...v, [k]: e.target.value });

  // prévia com atraso para não regenerar a cada tecla
  const [pv, setPv] = useState(v);
  useEffect(() => { const t = setTimeout(() => setPv(v), 350); return () => clearTimeout(t); }, [v]);
  const gen = useMemo(() => {
    const pal = (PALETTES as any)[style.g];
    return { g: style.g, seed: style.seed, p: pal[style.pi % pal.length], ...(style.g === "sur" ? { v: style.seed % 2 ? "sphere" : "door" } : {}) };
  }, [style]);
  const preview = {
    title: pv.title.trim() || "Sem título", year: +pv.year || 2026,
    h: Math.max(5, +pv.h || 120), w: Math.max(5, +pv.w || 100), gen,
    preview: photo?.url || null, img_w: photo?.w, img_h: photo?.h,
  };

  async function take(f?: File | null) {
    if (!f || !/^image\//.test(f.type)) return;
    const bmp = await createImageBitmap(f);
    const M = 1600, k = Math.min(1, M / Math.max(bmp.width, bmp.height));
    const cv = document.createElement("canvas"); cv.width = Math.round(bmp.width * k); cv.height = Math.round(bmp.height * k);
    cv.getContext("2d")!.drawImage(bmp, 0, 0, cv.width, cv.height);
    const blob: Blob = await new Promise((r) => cv.toBlob((b) => r(b!), "image/jpeg", 0.85));
    if (photo) URL.revokeObjectURL(photo.url);
    setPhoto({ blob, url: URL.createObjectURL(blob), w: cv.width, h: cv.height }); toast("Imagem carregada.");
  }

  function submit(ev: React.FormEvent) {
    ev.preventDefault();
    const e: Record<string, string> = {}; const price = parseMoney(v.price);
    if (!v.title.trim()) e.title = "Informe o título da obra.";
    if (!(+v.year >= 1950 && +v.year <= 2026)) e.year = "Informe um ano entre 1950 e 2026.";
    if (!v.medium.trim()) e.medium = "Informe a técnica, como “Óleo sobre tela”.";
    if (!(+v.h >= 5 && +v.h <= 600)) e.h = "Entre 5 e 600 cm.";
    if (!(+v.w >= 5 && +v.w <= 600)) e.w = "Entre 5 e 600 cm.";
    if (price < 500) e.price = "Informe um valor de pelo menos R$ 500.";
    if (v.desc.trim().length < 40) e.desc = `Escreva pelo menos 40 caracteres (${v.desc.trim().length} até agora).`;
    setErr(e);
    if (Object.keys(e).length) { setStatus("Alguns campos precisam de atenção antes do envio."); document.getElementById("i-" + Object.keys(e)[0])?.focus(); return; }
    setStatus("");
    start(async () => {
      let image_path: string | null = null;
      if (photo) {
        const path = `${userId}/${crypto.randomUUID()}.jpg`;
        const { error } = await createClient().storage.from("works").upload(path, photo.blob, { contentType: "image/jpeg" });
        if (error) { setStatus("Não foi possível enviar a imagem: " + error.message); return; }
        image_path = path;
      }
      const r = await createWork({ title: v.title, year: +v.year, cat: v.cat, medium: v.medium, h: +v.h, w: +v.w, edition: v.edition, price, description: v.desc, gen,
        image_path, img_w: photo?.w ?? null, img_h: photo?.h ?? null });
      if (!r.ok) { setStatus(r.error); return; }
      toast("Obra enviada para a curadoria."); router.push(`/artista/obras/${r.data!.slug}`);
    });
  }
  const price = parseMoney(v.price);
  return (
    <section className="acq" aria-labelledby="nf-t" style={{ marginTop: "clamp(36px,5vw,64px)" }}>
      <div className="acq-aside"><p className="lab">Prévia</p><h2 id="nf-t">Como a obra aparecerá.</h2>
        <p>Envie uma fotografia da obra. Sem foto, geramos uma composição ilustrativa no estilo escolhido.</p>
        <div className="preview-slab" aria-live="polite"><Slab a={preview} label="Prévia · Em curadoria" /></div></div>
      <div className="acq-main">
        <form className="form" onSubmit={submit} noValidate>
          <Field name="title" label="Título" placeholder="Ex.: Campo de Anil III" value={v.title} onChange={on("title")} error={err.title} />
          <div className="two">
            <Field name="year" label="Ano" type="number" inputMode="numeric" min={1950} max={2026} value={v.year} onChange={on("year")} error={err.year} />
            <Field as="select" name="cat" label="Categoria" value={v.cat} onChange={on("cat")}>{Object.keys(CAT).map((k) => <option key={k} value={k}>{CAT[k]}</option>)}</Field>
          </div>
          <Field name="medium" label="Técnica" placeholder="Ex.: Óleo sobre linho" value={v.medium} onChange={on("medium")} error={err.medium} />
          <div className="three">
            <Field name="h" label="Altura (cm)" type="number" inputMode="decimal" value={v.h} onChange={on("h")} error={err.h} />
            <Field name="w" label="Largura (cm)" type="number" inputMode="decimal" value={v.w} onChange={on("w")} error={err.w} />
            <Field name="edition" label="Edição" placeholder="Obra única" value={v.edition} onChange={on("edition")} />
          </div>
          <Field name="price" label="Preço" placeholder="R$ 0" inputMode="numeric" aside={price ? `Você recebe ${brl(price * (1 - COMMISSION))}` : "Você recebe —"}
            value={v.price} onChange={on("price")} onBlur={() => price && setV({ ...v, price: brl(price) })} error={err.price} />
          <Field as="textarea" name="desc" rows={4} label="Descrição" aside={`${v.desc.trim().length} / 40+`} placeholder="O que a obra investiga, como foi feita, como se comporta na luz…" value={v.desc} onChange={on("desc")} error={err.desc} />
          <div className="field"><span className="lab">Imagem</span>
            <label className={"drop" + (over ? " over" : "")} onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={(e) => { e.preventDefault(); setOver(false); take(e.dataTransfer.files[0]); }}>
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => take(e.target.files?.[0])} />
              <b><Icon n="upload" /> {photo ? "Trocar fotografia" : "Enviar fotografia da obra"}</b>
              <span>{photo ? "Imagem carregada. Ela substitui a composição gerada." : "JPG, PNG ou WebP. A imagem é reduzida para 1600 px antes do envio."}</span>
            </label>
            {photo ? <button type="button" className="linkbtn" style={{ alignSelf: "flex-start" }} onClick={() => { URL.revokeObjectURL(photo.url); setPhoto(null); }}>Remover imagem</button> : <>
              <span className="lab" style={{ marginTop: 8 }}>Ou estilo da composição ilustrativa</span>
              <div className="styles" role="group" aria-label="Estilo">{Object.keys(STYLE_NAMES).map((k) => (
                <button key={k} type="button" aria-pressed={style.g === k} onClick={() => setStyle({ g: k, pi: Math.floor(Math.random() * 9), seed: rand() })}>{(STYLE_NAMES as any)[k]}</button>))}</div>
              <button type="button" className="linkbtn" style={{ alignSelf: "flex-start", marginTop: 4 }} onClick={() => setStyle({ ...style, pi: style.pi + 1, seed: rand() })}>Gerar outra variação</button></>}
          </div>
          <p className="form-status" role="alert">{status}</p>
          <div className="form-actions"><button className="btn" type="submit" disabled={pending}>{pending ? "Enviando…" : <>Enviar para curadoria <Icon n="right" /></>}</button><p>A obra só aparece para colecionadores depois de aprovada.</p></div>
        </form>
      </div>
    </section>
  );
}
