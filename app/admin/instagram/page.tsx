import { igData, type IgPost } from "@/lib/instagram";
import { PageHead, Empty } from "@/components/ui";
import { IgConnect, IgItemActions, IgNew } from "@/components/admin-ig";
import { Icon } from "@/components/Icon";

export const metadata = { title: "Instagram" };

const fmt = (iso: string) => new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
const ago = (iso: string) => { const m = Math.round((Date.now() - new Date(iso).getTime()) / 6e4); return m < 1 ? "agora" : m < 60 ? `há ${m} min` : m < 1440 ? `há ${Math.round(m / 60)} h` : `há ${Math.round(m / 1440)} dias`; };
const STATUS: Record<IgPost["status"], [string, string]> = {
  scheduled: ["Programada", "t-rev"], publishing: ["Saindo agora", "t-open"], published: ["Publicada", "t-pub"], failed: ["Com erro", "t-declined"], cancelled: ["Cancelada", "t-closed"],
};

export default async function Instagram() {
  const { settings: s, posts } = await igData();
  if (!s) return (
    <div className="wrap"><PageHead title="Instagram" label="Publicações" intro="A fila do Instagram ainda não foi ativada no banco." count="" />
      <div style={{ margin: "32px 0 120px" }}><Empty sm title="Falta rodar a migração da fila do Instagram." body="Depois de rodar o SQL no Supabase, esta tela mostra a conexão e as publicações programadas." /></div></div>);
  const connected = !!s.token_set_at;
  const days = s.token_expires_at ? Math.floor((new Date(s.token_expires_at).getTime() - Date.now()) / 864e5) : null;
  const tickOk = s.last_tick_at && Date.now() - new Date(s.last_tick_at).getTime() < 5 * 6e4;
  const next = posts.filter((p) => p.status === "scheduled" || p.status === "publishing");
  const bad = posts.filter((p) => p.status === "failed");
  const done = posts.filter((p) => p.status === "published").reverse();
  const off = posts.filter((p) => p.status === "cancelled");
  return (
    <div className="wrap">
      <PageHead title="Instagram" label="Publicações @ponci.art" intro="Fila de posts, carrosséis, stories e reels programados. Um disparador no banco confere a fila a cada minuto e publica na hora marcada. Música da biblioteca do Instagram e figurinhas continuam pelo app."
        count={`${next.length} na fila${bad.length ? ` · ${bad.length} com erro` : ""}`} />

      <section className="ig-status" aria-label="Conexão">
        <div>
          <p className="lab">Conexão</p>
          {connected ? <p><b>@{s.ig_username || "ponci.art"}</b> conectada · token salvo {ago(s.token_set_at!)}
            {days != null && <> · <span className={days <= 7 ? "warn" : ""}>{days > 0 ? `vence em ${days} dias` : "token vencido"}</span></>}</p>
            : <p className="warn">Nenhum token conectado. A fila só começa a publicar depois de conectar.</p>}
          <p className="hint">{tickOk ? <>Disparador ativo · último ciclo {ago(s.last_tick_at!)}</> : s.last_tick_at ? <>Disparador parado desde {fmt(s.last_tick_at)}. Confira o pg_cron no Supabase.</> : "O disparador ainda não rodou."}
            {s.last_message ? ` · ${s.last_message}` : ""}</p>
          {days != null && days <= 7 && <p className="warn">Gere um token novo no Explorador da Meta, estenda pra 60 dias e troque aqui.</p>}
        </div>
        <IgConnect connected={connected} />
      </section>

      <div className="ig-head"><h2 className="lab">Na fila</h2><IgNew /></div>
      {next.length ? <ol className="ig-list">{next.map((p) => <Item key={p.id} p={p} />)}</ol> : <Empty sm title="Nada programado." body="Use “Nova publicação” para colocar um post ou carrossel na fila." />}
      {bad.length > 0 && <><h2 className="lab ig-h">Com erro</h2><ol className="ig-list">{bad.map((p) => <Item key={p.id} p={p} />)}</ol></>}
      {done.length > 0 && <><h2 className="lab ig-h">Publicadas</h2><ol className="ig-list">{done.map((p) => <Item key={p.id} p={p} />)}</ol></>}
      {off.length > 0 && <details className="ig-off"><summary className="lab">Canceladas ({off.length})</summary><ol className="ig-list">{off.map((p) => <Item key={p.id} p={p} />)}</ol></details>}
      <div style={{ height: "clamp(72px,10vw,140px)" }} />
    </div>
  );
}

function Item({ p }: { p: IgPost }) {
  return (
    <li className={"ig-item" + (p.status === "failed" ? " bad" : "")}>
      <div className={"ig-thumbs sm" + (p.kind === "story" ? " story" : "")}>{(p.kind === "reel" ? (p.cover_url ? [p.cover_url] : []) : p.media.slice(0, 4)).map((u, i) => /* eslint-disable-next-line @next/next/no-img-element */ <img key={i} src={u} alt="" loading="lazy" />)}
        {p.media.length > 4 && <span className="more">+{p.media.length - 4}</span>}</div>
      <div className="ig-body">
        <p className="ig-meta"><span className={"tag " + STATUS[p.status][1]}>{STATUS[p.status][0]}</span>
          <b>{p.status === "published" && p.published_at ? fmt(p.published_at) : fmt(p.publish_at)}</b>
          <span>{p.kind === "carousel" ? `Carrossel · ${p.media.length} imagens` : p.kind === "story" ? "Story" : p.kind === "reel" ? "Reel" : "Post"}</span></p>
        <h3>{p.label || p.caption.split("\n")[0].slice(0, 60)}</h3>
        {p.caption && <p className="ig-cap">{p.caption}</p>}
        {p.error && <p className="sale-alert"><Icon n="info" />{p.error}</p>}
        <IgItemActions id={p.id} status={p.status} media={p.media} caption={p.caption} publishAt={p.publish_at} permalink={p.permalink} story={p.kind === "story"} reel={p.kind === "reel"} cover={p.cover_url} />
      </div>
    </li>
  );
}
