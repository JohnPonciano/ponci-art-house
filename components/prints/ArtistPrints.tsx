"use client";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";
import { Icon } from "@/components/Icon";
import { Markdown } from "@/components/Markdown";
import { brlCents, parseCents, masterPxNeeded, masterFits, cm } from "@/lib/format";
import * as P from "@/app/print-actions";
import { imageDims } from "./imageDims";
import type { PrintProduct, PrintSize, PrintOffer, PrintOfferSize } from "@/lib/prints";

type Quote = { final: number; fixed: number; artist_fee: number; payment_fee: number; tax: number; commission: number; signed_extra: number;
  print: number; prep: number; packaging: number; shipping: number; commission_pct: number; payment_fee_pct: number; tax_pct: number };
const key = (p: string, s: string) => `${p}|${s}`;
const STATUS = { draft: ["Rascunho", "t-open"], active: ["À venda", "t-pub"], paused: ["Pausado", "t-closed"] } as const;

/** Configuração de prints de uma obra aprovada: edição, papéis e tamanhos, remuneração, arquivo-mestre e autorização. */
export function ArtistPrints({ workId, userId, products, sizes, rulesReady, saved }: {
  workId: string; userId: string; products: PrintProduct[]; sizes: PrintSize[]; rulesReady: boolean;
  saved: { offer: PrintOffer; sizes: PrintOfferSize[] } | null;
}) {
  const toast = useToast(); const router = useRouter(); const [pending, start] = useTransition();
  const o = saved?.offer;
  const [ed, setEd] = useState({ edition: o?.edition || "open", max: o?.edition_max ? String(o.edition_max) : "", signed: !!o?.signed, numbered: !!o?.numbered });
  const money = (c: number) => (c / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
  const [pick, setPick] = useState<Record<string, string>>(() => saved?.sizes.length
    ? Object.fromEntries(saved.sizes.map((s) => [key(s.product_id, s.size_id), money(s.artist_fee_cents)]))
    : products[0] ? Object.fromEntries(sizes.map((z) => [key(products[0].id, z.id), ""])) : {});
  const [fee, setFee] = useState(() => (saved?.sizes[0] ? money(saved.sizes[0].artist_fee_cents) : ""));
  const [custom, setCustom] = useState(() => new Set((saved?.sizes || []).map((s) => s.artist_fee_cents)).size > 1);
  const eff = (k: string) => (custom ? pick[k] : fee);
  const [master, setMaster] = useState<{ path: string; w: number; h: number; name?: string } | null>(o?.master_path ? { path: o.master_path, w: o.master_w!, h: o.master_h! } : null);
  const [upl, setUpl] = useState(""); const [quotes, setQuotes] = useState<Record<string, Quote | string>>({});
  const [auth, setAuth] = useState<{ body: string; sha256: string } | null>(null); const [agree, setAgree] = useState(false);
  const [open, setOpen] = useState(!!o);
  const locked = (o?.sold_count || 0) > 0;
  const dpi = useMemo(() => Object.fromEntries(products.map((p) => [p.id, p.min_dpi])), [products]);

  // prévia de preço por linha marcada (espera o artista parar de digitar)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const next: Record<string, Quote | string> = {};
      await Promise.all(Object.keys(pick).map(async (k) => {
        const c = parseCents(eff(k)); const [p, s] = k.split("|");
        if (c == null || c < 100) { next[k] = custom ? "Informe quanto você recebe neste tamanho." : "Informe quanto você quer receber por print."; return; }
        const r = await P.printQuote(p, s, ed.signed, c); next[k] = r.ok ? (r.data as Quote) : (r.error || "Sem prévia.");
      }));
      setQuotes(next);
    }, 450);
    return () => clearTimeout(timer.current);
  }, [pick, ed.signed, fee, custom]);

  if (!rulesReady || !products.length || !sizes.length) return (
    <div className="pr-intro"><p>Em breve você poderá liberar reproduções impressas desta obra. O original continua como está, e os prints seguem à venda mesmo depois que ele for vendido.</p>
      <p className="hint">A PONCI está homologando gráficas, papéis e custos de impressão.</p></div>);

  async function upload(f: File) {
    if (!/^image\/(jpeg|png|tiff)$/.test(f.type)) { toast("Use JPEG, PNG ou TIFF."); return; }
    if (f.size > 50 * 1024 * 1024) { toast("O arquivo-mestre pode ter até 50 MB."); return; }
    setUpl("Lendo o arquivo…");
    const d = await imageDims(f);
    if (!d) { setUpl(""); toast("Não consegui ler as dimensões deste arquivo."); return; }
    setUpl(`Enviando ${(f.size / 1048576).toFixed(1)} MB…`);
    const ext = f.type === "image/png" ? "png" : f.type === "image/tiff" ? "tif" : "jpg";
    const path = `${userId}/${workId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await createClient().storage.from("print-masters").upload(path, f, { contentType: f.type });
    setUpl("");
    if (error) { toast("O envio falhou: " + error.message); return; }
    setMaster({ path, ...d, name: f.name });
  }

  const chosen = Object.keys(pick);
  const save = (thenPreview: boolean) => start(async () => {
    const sizesArg = chosen.map((k) => { const [product, size] = k.split("|"); return { product, size, fee_cents: parseCents(eff(k)) || 0 }; });
    const r = await P.savePrintOffer({ work: workId, edition: ed.edition as "open" | "limited", max: ed.max ? +ed.max : null, signed: ed.signed, numbered: ed.numbered, sizes: sizesArg,
      master: master && master.path !== o?.master_path ? { path: master.path, w: master.w, h: master.h } : null });
    if (!r.ok) { toast(r.error!); return; }
    if (!thenPreview) { toast("Rascunho salvo. Nada vai para a vitrine sem a sua autorização."); router.refresh(); return; }
    const pv = await P.printAuthorizationPreview(r.data as string);
    if (!pv.ok) { toast(pv.error!); router.refresh(); return; }
    setAuth({ body: pv.data.body, sha256: pv.data.sha256 }); setAgree(false); router.refresh();
  });
  const publish = () => start(async () => {
    const r = await P.publishPrintOffer(o!.id, auth!.sha256);
    toast(r.ok ? "Prints à venda. A autorização ficou registrada." : r.error!); if (r.ok) { setAuth(null); router.refresh(); }
  });

  if (!open) return (
    <div className="pr-intro">
      <p>Libere prints desta obra em 3 passos: envie o arquivo, diga quanto quer receber por print e autorize. O original continua como está, e os prints seguem à venda mesmo depois que ele for vendido.</p>
      <button type="button" className="btn" onClick={() => setOpen(true)}>Liberar prints <Icon n="right" /></button>
    </div>);

  return (
    <div className="pr">
      {o && <p className="pr-state"><span className={"tag " + STATUS[o.status][1]}>{STATUS[o.status][0]}</span>
        {o.sold_count > 0 && <span>{o.sold_count} vendido{o.sold_count > 1 ? "s" : ""}{o.edition === "limited" ? ` de ${o.edition_max}` : ""}</span>}
        {o.status === "active" && <button type="button" className="linkbtn" disabled={pending} onClick={() => start(async () => { const r = await P.pausePrintOffer(o.id); toast(r.ok ? "Venda de prints pausada." : r.error!); router.refresh(); })}>Pausar venda</button>}</p>}
      {o?.paused_reason && <p className="sale-alert"><Icon n="info" />A PONCI pausou estes prints: {o.paused_reason}</p>}
      {locked && <p className="hint">Já houve venda: tipo de edição, tiragem, assinatura e numeração ficam como estão.</p>}

      <fieldset className="pr-box" disabled={pending}>
        <legend className="lab">01 · Arquivo para impressão</legend>
        <p className="hint">A imagem em alta resolução da obra, que vai para a gráfica (JPEG, PNG ou TIFF, até 50 MB). Fica num cofre privado: só você e a PONCI acessam. Não é a foto da vitrine.</p>
        <label className="btn ghost pr-up"><Icon n="upload" /> {master ? "Trocar arquivo" : "Enviar arquivo-mestre"}
          <input type="file" accept="image/jpeg,image/png,image/tiff" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} /></label>
        {upl ? <p className="hint">{upl}</p> : master && <p className="hint">{master.name ? `${master.name} · ` : ""}{master.w} × {master.h} px</p>}
      </fieldset>

      <fieldset className="pr-box" disabled={pending}>
        <legend className="lab">02 · Quanto você quer receber por print</legend>
        {!custom && <label className="field pr-main-fee"><span className="lab">Você recebe por print vendido</span>
          <input inputMode="decimal" value={fee} placeholder="R$ 0,00" onChange={(e) => setFee(e.target.value)} /></label>}
        <label className="check"><input type="checkbox" checked={custom} onChange={(e) => {
          if (e.target.checked) setPick(Object.fromEntries(Object.keys(pick).map((k) => [k, pick[k] || fee])));
          setCustom(e.target.checked); }} /><span>Quero um valor diferente para cada tamanho</span></label>
        <p className="hint">Esse valor é seu, limpo. O preço ao comprador já soma a impressão, a embalagem, as taxas e a comissão da PONCI.</p>
      </fieldset>

      <fieldset className="pr-box" disabled={pending}>
        <legend className="lab">03 · Papéis e tamanhos</legend>
        {products.map((p) => (
          <div key={p.id} className="pr-prod">
            <p className="pr-pname"><b>{p.name}</b>{[p.paper, p.finish].filter(Boolean).join(" · ")}{p.description && <small>{p.description}</small>}</p>
            {sizes.some((z) => !(key(p.id, z.id) in pick)) && <button type="button" className="linkbtn pr-all" onClick={() => {
              const n = { ...pick }; const first = sizes.map((z) => n[key(p.id, z.id)]).find(Boolean) || "";
              sizes.forEach((z) => { if (!(key(p.id, z.id) in n)) n[key(p.id, z.id)] = first; }); setPick(n);
            }}>Marcar todos os tamanhos deste papel</button>}
            <ul className="pr-sizes">{sizes.map((z) => {
              const k = key(p.id, z.id), on = k in pick, q = quotes[k], need = masterPxNeeded(z.w_cm, z.h_cm, dpi[p.id]);
              return (
                <li key={z.id} className={on ? "on" : ""}>
                  <label className="check"><input type="checkbox" checked={on} onChange={(e) => { const n = { ...pick }; if (e.target.checked) n[k] = ""; else delete n[k]; setPick(n); }} />
                    <span><b>{z.label}</b> {cm(z.w_cm)} × {cm(z.h_cm)} cm</span></label>
                  {on && <>
                    {custom ? <label className="field pr-fee"><span className="lab">Você recebe neste tamanho</span><input inputMode="decimal" value={pick[k]} placeholder="R$ 0,00" onChange={(e) => setPick({ ...pick, [k]: e.target.value })} /></label>
                      : <span className="pr-you"><span className="lab">Você recebe</span>{parseCents(fee) ? brlCents(parseCents(fee)!) : "—"}</span>}
                    <div className="pr-quote">{typeof q === "string" ? <span className="hint">{q}</span> : q ? <>
                      <span className="lab">Comprador paga</span><b>{brlCents(q.final)}</b>
                      <details><summary className="hint">Ver a conta</summary><dl className="pr-bd">
                        <dt>Impressão</dt><dd>{brlCents(q.print)}</dd>{q.prep > 0 && <><dt>Preparo</dt><dd>{brlCents(q.prep)}</dd></>}
                        <dt>Embalagem</dt><dd>{brlCents(q.packaging)}</dd>{q.shipping > 0 && <><dt>Frete-base</dt><dd>{brlCents(q.shipping)}</dd></>}
                        {q.signed_extra > 0 && <><dt>Ida até você para assinar</dt><dd>{brlCents(q.signed_extra)}</dd></>}
                        <dt><b>Você</b></dt><dd><b>{brlCents(q.artist_fee)}</b></dd>
                        <dt>Taxa de pagamento ({String(q.payment_fee_pct).replace(".", ",")}%)</dt><dd>{brlCents(q.payment_fee)}</dd>
                        <dt>Impostos ({String(q.tax_pct).replace(".", ",")}%)</dt><dd>{brlCents(q.tax)}</dd>
                        <dt>PONCI ({String(q.commission_pct).replace(".", ",")}%)</dt><dd>{brlCents(q.commission)}</dd>
                      </dl></details></> : <span className="hint">Calculando…</span>}</div>
                    {master && <p className={"hint pr-res" + (masterFits(master.w, master.h, need) ? "" : " bad")}>{masterFits(master.w, master.h, need) ? "Resolução ok" : `Arquivo pequeno: precisa de ${need[0]} × ${need[1]} px (${p.min_dpi} dpi)`}</p>}
                  </>}
                </li>);
            })}</ul>
          </div>))}
      </fieldset>

      <details className="pr-box pr-more" open={ed.edition === "limited" || ed.signed}>
        <summary className="lab">Mais opções: edição limitada, assinatura e numeração</summary>
        <p className="hint">Sem mexer aqui, a edição é aberta e o print vai direto da gráfica ao comprador, sem assinatura.</p>
        <fieldset disabled={pending} style={{ border: 0, padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="pr-row">
          {(["open", "limited"] as const).map((v) => <label key={v} className="check"><input type="radio" name="pr-ed" checked={ed.edition === v} disabled={locked} onChange={() => setEd({ ...ed, edition: v, numbered: v === "limited" && ed.numbered })} />
            <span><b>{v === "open" ? "Aberta" : "Limitada"}</b>{v === "open" ? ": sem limite de exemplares." : ": tiragem máxima somando todos os tamanhos."}</span></label>)}
        </div>
        {ed.edition === "limited" && <label className="field" style={{ maxWidth: 220 }}><span className="lab">Tiragem máxima</span>
          <input inputMode="numeric" value={ed.max} disabled={locked} onChange={(e) => setEd({ ...ed, max: e.target.value.replace(/\D/g, "").slice(0, 4) })} placeholder="Ex.: 30" /></label>}
        <label className="check"><input type="checkbox" checked={ed.signed} disabled={locked} onChange={(e) => setEd({ ...ed, signed: e.target.checked })} />
          <span><b>Assinado por mim.</b> A gráfica envia cada exemplar para você assinar e despachar ao comprador, com rastreio.</span></label>
        {ed.edition === "limited" && <label className="check"><input type="checkbox" checked={ed.numbered} disabled={locked} onChange={(e) => setEd({ ...ed, numbered: e.target.checked, signed: e.target.checked || ed.signed })} />
          <span><b>Numerado</b> (ex.: 3/30). A PONCI controla a numeração.</span></label>}
        </fieldset>
      </details>

      {o?.status === "active" && <p className="hint">Salvar mudanças tira os prints da vitrine até você autorizar as novas condições.</p>}
      <div className="pr-acts">
        <button type="button" className="btn" disabled={pending || !chosen.length || !master || !!upl || chosen.some((k) => (parseCents(eff(k)) || 0) < 100)} onClick={() => save(true)}>{pending ? "Salvando…" : <>Revisar e autorizar <Icon n="right" /></>}</button>
        <button type="button" className="linkbtn" disabled={pending || !chosen.length} onClick={() => save(false)}>Salvar rascunho</button>
      </div>

      {auth && <div className="pr-auth" role="dialog" aria-label="Autorização de reprodução">
        <div className="pr-auth-doc"><Markdown text={auth.body} /></div>
        <p className="hint">Impressão digital do texto (SHA-256): {auth.sha256.slice(0, 16)}…</p>
        <label className="check"><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} /><span>Li e autorizo estas reproduções, nestas condições.</span></label>
        <div className="pr-acts">
          <button type="button" className="btn" disabled={!agree || pending} onClick={publish}>{pending ? "Publicando…" : <>Autorizo e publico <Icon n="check" /></>}</button>
          <button type="button" className="linkbtn" onClick={() => setAuth(null)}>Voltar</button>
        </div>
      </div>}
    </div>
  );
}
