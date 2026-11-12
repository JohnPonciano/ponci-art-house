import Link from "next/link";
import type { ReactNode } from "react";
import { ArtImage } from "./ArtImage";
import { Icon } from "./Icon";
import { Slab, Tag, Empty } from "./ui";
import { brl, catNo, dateBR, dims, pad, STAGES, COMMISSION } from "@/lib/format";
import type { Order, Proposal, Work } from "@/lib/data";
import { ActButton, ArtistProposalActions, BuyerProposalActions, FavButton, SignButton } from "./area-client";
import { RequestForm } from "./forms/RequestForm";

export function WorkCard({ a, href, foot, sub, fav }: { a: Work; href: string; foot: ReactNode; sub?: string; fav?: boolean | null }) {
  return (
    <article className="card"><Link className="card-link" href={href}>
      <div className="card-top"><span>{catNo(a.no)}</span><span>{a.year}</span></div>
      <div className="card-img"><ArtImage a={a} /></div>
      <div className="card-cap">
        <h3 className="card-title">{a.title}</h3>
        {sub && <p className="card-en">{sub}</p>}
        <p className="card-meta first">{a.medium}</p>
        <p className="card-meta">{dims(a)}{a.edition ? " · " + a.edition : ""}</p>
        {(fav === undefined || a.status !== "published") && <Tag s={a.status} />}
      </div>
      <div className="card-foot">{foot}</div>
    </Link>{fav != null && <FavButton workId={a.id} on={fav} title={a.title} />}</article>
  );
}

export function Ledger({ children, empty }: { children: ReactNode[]; empty: [string, string] }) {
  if (!children.length) return <Empty sm title={empty[0]} body={empty[1]} />;
  return <div className="ledger"><div className="lrow head"><span>Ref.</span><span>Obra</span><span></span><span>Mensagem</span><span>Valor</span><span>Ação</span></div>{children}</div>;
}

export function ArtistProposalRow({ p }: { p: Proposal }) {
  const a = p.work, diff = Math.round((p.current / a.price - 1) * 100);
  return (
    <div className="lrow">
      <span className="l-ref">{p.ref}<small>{dateBR(p.created_at)}</small></span>
      <Link className="l-thumb" href={`/artista/obras/${a.slug}`} aria-hidden="true" tabIndex={-1}><ArtImage a={a} /></Link>
      <span className="l-main"><Link href={`/artista/obras/${a.slug}`}><b>{a.title}</b></Link><span>{p.buyer?.member_code} · {p.buyer?.city}</span><span>{p.last?.actor === "artist" ? "Você respondeu" : p.last?.actor === "system" ? "Sistema" : "Colecionador"} · {dateBR(p.last?.created_at)}</span></span>
      <span className="l-msg">{p.last?.msg ? `“${p.last.msg}”` : ""}</span>
      <span className="l-val">{brl(p.current)}<small>{p.last?.actor === "artist" ? "Sua contraproposta" : "Oferta"}</small><small>{diff >= 0 ? "+" : ""}{diff}% do preço ({brl(a.price)})</small></span>
      <span className="l-act">{p.status === "open" ? <ArtistProposalActions id={p.id} current={p.current} price={a.price} /> : <>
        <Tag s={p.status} kind="proposal" />{p.status === "countered" && <span className="hint">Aguardando o colecionador.</span>}
        {p.status === "accepted" && <Link className="linkbtn" href="/artista/vendas">Ver venda</Link>}</>}</span>
    </div>
  );
}

export function BuyerProposalRow({ p }: { p: Proposal }) {
  const a = p.work;
  return (
    <div className="lrow">
      <span className="l-ref">{p.ref}<small>{dateBR(p.created_at)}</small></span>
      <Link className="l-thumb" href={`/colecionador/obras/${a.slug}`} aria-hidden="true" tabIndex={-1}><ArtImage a={a} /></Link>
      <span className="l-main"><Link href={`/colecionador/obras/${a.slug}`}><b>{a.title}</b></Link><span>{a.artist?.display_name}</span><span>{p.last?.actor === "artist" ? "Artista respondeu" : p.last?.actor === "system" ? "Sistema" : "Você"} · {dateBR(p.last?.created_at)}</span></span>
      <span className="l-msg">{p.last?.msg ? `“${p.last.msg}”` : ""}</span>
      <span className="l-val">{brl(p.current)}<small>{p.last?.actor === "artist" ? "Contraproposta" : "Sua oferta"}</small><small>Preço: {brl(a.price)}</small></span>
      <span className="l-act">
        {(p.status === "open" || p.status === "countered") && <Tag s={p.status} kind="proposal" />}
        {p.status === "open" || p.status === "countered" ? <BuyerProposalActions id={p.id} status={p.status} current={p.current} slug={a.slug} />
          : <><Tag s={p.status} kind="proposal" />{p.status === "accepted" && <Link className="linkbtn" href="/colecionador/aquisicoes">Ver aquisição</Link>}</>}
      </span>
    </div>
  );
}

export function OrderBlock({ o, side }: { o: Order; side: "artist" | "buyer" }) {
  const a = o.work;
  return (
    <article className="order" id={o.ref}>
      <div className="order-art"><Slab a={a} plaque={false} /></div>
      <div className="order-info">
        <div className="top">
          <div><b>{a.title}</b>
            {side === "buyer" && <span>{a.artist?.display_name} · {a.year} · {dims(a)}</span>}
            <span>{o.ref} · {dateBR(o.created_at)} · {o.via === "direct" ? "Compra pelo preço" : "Proposta aceita"}</span>
            {side === "artist" && <span>Colecionador: {o.buyer?.full_name || "—"} ({o.buyer?.member_code}) · {o.buyer?.city}</span>}</div>
          <div className="price" style={{ textAlign: "right" }}>{brl(o.amount)}<small>{side === "artist" ? `Líquido para você: ${brl(o.amount * (1 - COMMISSION))}` : o.stage === 0 ? "Aguardando pagamento" : o.stage < 3 ? "Em custódia" : "Concluída"}</small></div>
        </div>
        <ol className="track">{STAGES.map((s, i) => (
          <li key={s[0]} className={`${i < o.stage || o.stage === 3 ? "done" : ""} ${i === o.stage && o.stage < 3 ? "now" : ""}`}><i>{pad(i + 1)}</i><b>{s[0]}</b><span className="hint" style={{ color: "inherit", opacity: 0.8 }}>{s[1]}</span></li>))}</ol>
        <ContractStrip o={o} side={side} />
        {side === "buyer" && <div className="acts">{o.stage < 3 ? <>
          {o.stage === 0 && !bothSigned(o) ? <span className="hint">O pagamento libera depois que as duas partes assinarem o contrato.</span> : <>
          <ActButton action="advanceOrder" args={[o.id]} ok="Etapa atualizada." className="btn sm">{["Pagar em custódia", "Confirmar envio", "Confirmar recebimento"][o.stage]} <Icon n="right" /></ActButton>
          <span className="hint">Confirme aqui depois de concluir esta etapa com a PONCI.</span></>}</>
          : <><span className="tag t-accepted">Certificado PNC-CA-{o.ref.slice(4)}</span><span className="hint">Procedência registrada na rede.</span></>}</div>}
        {side === "buyer" && o.stage === 3 && o.delivered_at && withinWithdrawal(o.delivered_at) && <details className="acts" style={{ display: "block" }}>
          <summary className="linkbtn" style={{ display: "inline-block", cursor: "pointer" }}>Desistir da compra (até {dateBR(new Date(o.delivered_at).getTime() + 7 * 864e5)})</summary>
          <div style={{ marginTop: 12 }}><RequestForm orderId={o.id} kinds={["arrependimento", "problema"]} compact /></div></details>}
        {side === "artist" && o.stage === 3 && o.delivered_at && <div className="acts"><span className="hint">{withinWithdrawal(o.delivered_at)
          ? `Prazo de arrependimento do comprador até ${dateBR(new Date(o.delivered_at).getTime() + 7 * 864e5)}. O repasse é liberado depois.`
          : "Prazo de arrependimento encerrado. Repasse liberado em até 7 dias."}</span></div>}
      </div>
    </article>
  );
}

const bothSigned = (o: Order) => ["comprador", "artista"].every((p) => o.contract?.signatures?.some((s) => s.party === p));
const withinWithdrawal = (d: string) => Date.now() <= new Date(d).getTime() + 7 * 864e5;

function ContractStrip({ o, side }: { o: Order; side: "artist" | "buyer" }) {
  const c = o.contract; if (!c) return null;
  const mine = side === "buyer" ? "comprador" : "artista", other = side === "buyer" ? "artista" : "comprador";
  const signed = (p: string) => c.signatures?.find((s) => s.party === p);
  return (
    <div className="acts" style={{ justifyContent: "space-between" }}>
      <span className="hint">Contrato <Link href={`/contrato/${c.ref}`} style={{ textDecoration: "underline" }}>{c.ref}</Link> ·
        {" "}{signed(mine) ? "você assinou" : "aguardando sua assinatura"} · {signed(other) ? `${other === "artista" ? "artista" : "colecionador"} assinou` : `aguardando ${other === "artista" ? "artista" : "colecionador"}`}</span>
      {!signed(mine) && <SignButton contractId={c.id} />}
    </div>
  );
}
