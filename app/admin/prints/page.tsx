import Link from "next/link";
import { PageHead, Empty } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { adminPrintData } from "@/lib/prints";
import { brlCents, cm, dateBR } from "@/lib/format";
import { CostForm, CostEnd, EditToggle, NewToggle, OfferModeration } from "@/components/admin-prints";

export const metadata = { title: "Catálogo de prints" };
const ST: Record<string, [string, string]> = { draft: ["Rascunho", "t-open"], active: ["À venda", "t-pub"], paused: ["Pausado", "t-closed"] };

export default async function Prints() {
  const d = await adminPrintData();
  if (!d.ready) return (
    <div className="wrap"><PageHead title="Catálogo de prints" label="Impressão sob demanda" intro="Os prints ainda não foram ativados no banco." count="" />
      <div style={{ margin: "32px 0 120px" }}><Empty sm title="Falta rodar a migração de prints." body="Depois do SQL, esta tela cadastra gráficas, papéis, tamanhos e custos, e mostra as ofertas dos artistas." /></div></div>);
  const name = (list: { id: string; name?: string; label?: string }[], id: string) => { const x = list.find((i) => i.id === id); return x?.name || x?.label || "—"; };
  const live = d.offers.filter((o) => o.status === "active").length;
  const missing = [!d.rulesReady && "regras de print", !d.suppliers.some((s) => s.active) && "gráfica", !d.products.some((p) => p.active) && "papel",
    !d.sizes.some((z) => z.active) && "tamanho", !d.costs.length && "custo"].filter(Boolean) as string[];
  return (
    <div className="wrap">
      <PageHead title="Catálogo de prints" label="Impressão sob demanda" count={`${live} à venda`}
        intro="Gráficas homologadas, papéis, tamanhos e custos reais. O artista escolhe papel, tamanho e quanto quer receber; o preço sai das regras comerciais. Nada aqui vem preenchido." />
      {missing.length > 0 && <p className="sale-alert" style={{ marginTop: 24 }}><Icon n="info" />Para artistas poderem publicar prints, falta cadastrar: {missing.join(", ")}.
        {!d.rulesReady && <> Defina comissão, taxa de pagamento e impostos dos prints em <Link href="/admin/regras">Regras comerciais</Link>.</>}</p>}

      <section className="pa-sec" aria-labelledby="pa-of">
        <div className="ig-head"><h2 className="lab" id="pa-of">Ofertas dos artistas</h2></div>
        {d.offers.length ? <ol className="ig-list">{d.offers.map((o) => (
          <li key={o.id} className="ig-item" style={{ display: "block" }}>
            <p className="ig-meta"><span className={"tag " + ST[o.status][1]}>{ST[o.status][0]}</span><b>{o.work?.title}</b><span>{o.artist?.display_name} · {o.artist?.member_code}</span>
              <span>{o.edition === "limited" ? `Limitada ${o.sold_count}/${o.edition_max}` : `Aberta · ${o.sold_count} vendidos`}{o.signed ? (o.numbered ? " · assinada e numerada" : " · assinada") : ""}</span>
              {o.published_at && <span>desde {dateBR(o.published_at)}</span>}</p>
            {o.paused_reason && <p className="hint">Pausada pela PONCI: {o.paused_reason}</p>}
            <span className="pa-acts">{o.work && <Link className="linkbtn" href={`/colecionador/obras/${o.work.slug}`}>Ver obra</Link>}<OfferModeration id={o.id} status={o.status} reason={o.paused_reason} /></span>
          </li>))}</ol> : <Empty sm title="Nenhuma oferta ainda." body="Quando um artista liberar prints de uma obra aprovada, ela aparece aqui." />}
      </section>

      <section className="pa-sec" aria-labelledby="pa-co">
        <div className="ig-head"><h2 className="lab" id="pa-co">Custos vigentes</h2></div>
        {d.costs.length > 0 && <div className="pa-table" role="region" aria-label="Custos" tabIndex={0}><table>
          <thead><tr><th>Papel</th><th>Tamanho</th><th>Gráfica</th><th>Impressão</th><th>Preparo</th><th>Embalagem</th><th>Frete-base</th><th>Extra assinado</th><th>Fixo</th><th>Vigência</th><th /></tr></thead>
          <tbody>{d.costs.map((c) => (
            <tr key={c.id}><td>{name(d.products, c.product_id)}</td><td>{name(d.sizes, c.size_id)}</td><td>{name(d.suppliers, c.supplier_id)}</td>
              <td>{brlCents(c.print_cents)}</td><td>{brlCents(c.prep_cents)}</td><td>{brlCents(c.packaging_cents)}</td><td>{brlCents(c.shipping_cents)}</td><td>{brlCents(c.signed_extra_cents)}</td>
              <td><b>{brlCents(c.print_cents + c.prep_cents + c.packaging_cents + c.shipping_cents)}</b></td>
              <td>{dateBR(c.valid_from + "T12:00:00")}{c.valid_to ? ` a ${dateBR(c.valid_to + "T12:00:00")}` : ""}{c.note && <small className="hint" style={{ display: "block" }}>{c.note}</small>}</td>
              <td><CostEnd id={c.id} /></td></tr>))}</tbody></table></div>}
        {d.suppliers.length && d.products.length && d.sizes.length ? <div className="pa-new"><CostForm suppliers={d.suppliers} products={d.products} sizes={d.sizes} /></div>
          : <p className="hint">Cadastre ao menos uma gráfica, um papel e um tamanho para lançar custos.</p>}
      </section>

      <section className="pa-sec" aria-labelledby="pa-su">
        <div className="ig-head"><h2 className="lab" id="pa-su">Gráficas homologadas</h2><NewToggle kind="supplier" label="Nova gráfica" /></div>
        <ul className="pa-list">{d.suppliers.map((s) => <li key={s.id}><p><b>{s.name}</b>{s.city && ` · ${s.city}`}{!s.active && <span className="tag t-closed">Inativa</span>}</p>
          {(s.contact || s.notes) && <p className="hint">{[s.contact, s.notes].filter(Boolean).join(" · ")}</p>}<EditToggle kind="supplier" item={s} /></li>)}</ul>
      </section>

      <section className="pa-sec" aria-labelledby="pa-pr">
        <div className="ig-head"><h2 className="lab" id="pa-pr">Papéis</h2><NewToggle kind="product" label="Novo papel" /></div>
        <ul className="pa-list">{d.products.map((p) => <li key={p.id}><p><b>{p.name}</b>{[p.paper, p.finish].filter(Boolean).map((t) => ` · ${t}`)} · mínimo {p.min_dpi} dpi{!p.active && <span className="tag t-closed">Inativo</span>}</p>
          {p.description && <p className="hint">{p.description}</p>}<EditToggle kind="product" item={p} /></li>)}</ul>
      </section>

      <section className="pa-sec" aria-labelledby="pa-sz">
        <div className="ig-head"><h2 className="lab" id="pa-sz">Tamanhos</h2><NewToggle kind="size" label="Novo tamanho" /></div>
        <ul className="pa-list">{d.sizes.map((z) => <li key={z.id}><p><b>{z.label}</b> · {cm(z.w_cm)} × {cm(z.h_cm)} cm{!z.active && <span className="tag t-closed">Inativo</span>}</p><EditToggle kind="size" item={z} /></li>)}</ul>
      </section>
      <div style={{ height: "clamp(72px,10vw,140px)" }} />
    </div>
  );
}
