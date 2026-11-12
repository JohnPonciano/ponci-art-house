import Link from "next/link";
import { PublicShell } from "@/components/Shells";
import { Slab, SecHead, Notice } from "@/components/ui";
import { ArtImage } from "@/components/ArtImage";
import { Fit } from "@/components/Fit";
import { Icon } from "@/components/Icon";
import { AccessForm, PickRole } from "@/components/forms/AccessForm";
import { vitrine, networkStats } from "@/lib/data";
import { getMe } from "@/lib/supabase/server";
import { DEMO_ART } from "@/lib/demoArt";
import { catNo, dims, pad } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [me, works, st] = await Promise.all([getMe(), vitrine(7), networkStats()]);
  const hero = works.find((w) => w.slug === "gesto-n3") || works[0];
  const sel = works.filter((w) => w !== hero).slice(0, 6);
  const area = me ? (me.role === "artist" ? "/artista" : "/colecionador") : null;
  return (
    <PublicShell me={me}>
      <section className="hero wrap" id="top" aria-labelledby="hero-t">
        <Fit as="h1" className="mega" id="hero-t">PONCI</Fit>
        <div className="strip"><span>Rede privada de arte</span><span>Somente por convite</span><span>{st.artists} artistas membros</span><span>{st.published} obras na vitrine</span><span>Brasil · 2026</span></div>
        <div className="hero-body">
          <div className="hero-text">
            <p className="hero-quote">“Entre quem cria e quem coleciona, <em style={{ color: "var(--ocre)" }}>nada</em> além da obra.”</p>
            <p className="hero-sub">Uma rede fechada onde artistas e colecionadores verificados negociam obras diretamente, com curadoria, privacidade e pagamento em custódia.</p>
            <div className="hero-ctas">
              {area ? <Link className="btn" href={area}>Ir para a minha área <Icon n="right" /></Link> : <>
                <PickRole role="artist" className="btn">Sou artista — solicitar convite <Icon n="right" /></PickRole>
                <PickRole role="buyer" className="btn ghost">Sou colecionador — solicitar acesso <Icon n="right" /></PickRole></>}
            </div>
          </div>
          {hero && <div className="hero-art"><a href="#vitrine" aria-label="Ver a vitrine"><Slab a={hero} label="Na rede · Preço para membros" /></a></div>}
        </div>
      </section>

      <section className="sec wrap" id="entrar" aria-labelledby="doors-t">
        <SecHead n="01" eyebrow="Duas portas" title={<>Uma rede, <em>duas portas de entrada</em></>} id="doors-t" />
        <div className="doors">
          <article className="door" id="artistas">
            <div className="door-head"><span>Porta A</span><span>Artistas</span></div>
            <Slab a={DEMO_ART.artista} plaque={false} />
            <div className="door-body">
              <h3>Para <em>artistas</em></h3>
              <p>Publique obras para um público pequeno e qualificado. Você define o preço, recebe propostas e decide com quem negociar.</p>
              <Ticks items={[["Ateliê digital", "Cadastre obras com técnica, dimensões, edição, preço e fotografia."], ["Curadoria antes da vitrine", "Cada obra é revisada antes de aparecer para os colecionadores."], ["Propostas e contrapropostas", "Aceite, recuse ou responda com outro valor, tudo registrado."], ["Repasse garantido", "O pagamento fica em custódia e é liberado na entrega."]]} />
              <Link className="btn" href="/artista">Entrar na área do artista <Icon n="right" /></Link>
            </div>
          </article>
          <article className="door dark" id="colecionadores">
            <div className="door-head"><span>Porta B</span><span>Colecionadores</span></div>
            <Slab a={DEMO_ART.colecionador} plaque={false} />
            <div className="door-body">
              <h3>Para <em>colecionadores</em></h3>
              <p>Acesse obras que não estão em nenhuma outra vitrine, com preço visível, documentação completa e contato direto com quem fez.</p>
              <Ticks items={[["Acervo fechado", "Somente membros veem preços e disponibilidade."], ["Compra direta ou proposta", "Reserve pelo preço ou, se a artista aceitar negociar, envie uma proposta."], ["Lista de interesse", "Guarde obras e acompanhe mudanças de status."], ["Procedência", "Certificado de autenticidade emitido pela rede."]]} />
              <Link className="btn inv" href="/colecionador">Entrar na área do colecionador <Icon n="right" /></Link>
            </div>
          </article>
        </div>
      </section>

      <section className="sec wrap" id="vitrine" aria-labelledby="vit-t" style={{ paddingTop: 0 }}>
        <SecHead n="02" eyebrow="Vitrine" title={<>Na rede <em>agora</em></>} id="vit-t" href="/colecionador" linkText="Ver acervo completo" />
        <div className="board">{sel.map((a) => (
          <article className="card" key={a.id}><Link className="card-link" href={`/colecionador/obras/${a.slug}`}>
            <div className="card-top"><span>{catNo(a.no)}</span><span>{a.year}</span></div>
            <div className="card-img veil"><ArtImage a={a} /></div>
            <div className="card-cap"><h3 className="card-title">{a.title}</h3><p className="card-en">{a.artist_name}</p>
              <p className="card-meta first">{a.medium}</p><p className="card-meta">{dims(a)}{a.edition ? " · " + a.edition : ""}</p></div>
            <div className="card-foot"><span className="locked-p"><Icon n="lock" /> Preço para membros</span><span className="go">Ver <Icon n="right" /></span></div>
          </Link></article>))}
        </div>
        <div style={{ marginTop: 16 }}><Notice icon="lock">Preços, disponibilidade e propostas ficam visíveis apenas para membros.</Notice></div>
      </section>

      <section className="manifesto" id="rede" aria-labelledby="man-t"><div className="wrap">
        <div className="man-head"><span>03 — A rede</span><span>PONCI</span></div>
        <Fit as="h2" className="man-title" id="man-t">Fechada por princípio.</Fit>
        <div className="man-grid">
          <ul className="man-terms">{["Curadoria", "Confiança", "Privacidade", "Procedência"].map((w, i) => <li key={w}><span>{pad(i + 1)}</span>{w}</li>)}</ul>
          <div className="man-body">
            <p>Uma rede pequena, onde cada membro foi convidado e cada obra foi vista antes de chegar à vitrine.</p>
            <p>Artistas não disputam atenção com milhares de anúncios. Colecionadores não precisam adivinhar preço, procedência ou disponibilidade. A identidade de quem compra só é revelada à artista quando a negociação é concluída.</p>
            <p>A PONCI fica no meio apenas onde é necessário: na curadoria, na custódia do pagamento, no transporte e no certificado.</p>
          </div>
        </div>
      </div></section>

      <section className="sec wrap" id="processo" aria-labelledby="proc-t">
        <SecHead n="04" eyebrow="Como funciona" title={<>Do convite <em>à parede</em></>} id="proc-t" href="#acesso" linkText="Solicitar acesso" />
        <ol className="steps" style={{ marginTop: 0, borderTop: 0 }}>{[
          ["Convite", "Artistas enviam portfólio; colecionadores entram por indicação ou verificação. Todo membro é aprovado pela PONCI."],
          ["Curadoria", "A artista cadastra a obra com preço. A curadoria revisa documentação e imagens antes de publicar."],
          ["Negociação privada", "O colecionador reserva pelo preço ou envia uma proposta. A artista aceita, recusa ou faz contraproposta."],
          ["Custódia e entrega", "O pagamento fica retido até a entrega. A obra viaja com seguro e chega com certificado de autenticidade."],
        ].map((s, i) => <li key={s[0]}><span className="n">{i + 1}</span><h3>{s[0]}</h3><p>{s[1]}</p></li>)}</ol>
        <div className="rules" style={{ marginTop: "clamp(36px,5vw,64px)", borderTop: "var(--b)" }}>
          <div><b>15<small>%</small></b><h3>Comissão única</h3><p>Cobrada da venda concluída. Sem mensalidade para artistas.</p></div>
          <div><b>0</b><h3>Taxa de entrada</h3><p>Ser membro não custa nada. A rede só ganha quando a obra é vendida.</p></div>
          <div><b>7<small>d</small></b><h3>Liberação</h3><p>Repasse à artista até 7 dias após a confirmação de entrega.</p></div>
          <div><b>1:1</b><h3>Certificado</h3><p>Cada obra vendida recebe um certificado numerado com procedência.</p></div>
        </div>
      </section>

      <section className="sec wrap" id="perguntas" aria-labelledby="faq-t" style={{ paddingTop: 0 }}>
        <SecHead n="05" eyebrow="Perguntas" title={<>Antes de <em>entrar</em></>} id="faq-t" />
        <div className="faq">{[
          ["Por que a rede é fechada?", "Porque confiança não escala com anúncios abertos. Uma rede menor permite verificar quem vende, quem compra e o que é vendido, e dá a cada obra atenção real."],
          ["Quem pode ser artista na PONCI?", "Artistas com produção consistente, de qualquer estágio de carreira. A curadoria olha o trabalho, não o currículo. O convite é por portfólio."],
          ["Como um colecionador entra?", "Por indicação de um membro ou por verificação direta de identidade. Depois disso, o acervo completo, os preços e as propostas ficam disponíveis."],
          ["A artista sabe quem está fazendo a proposta?", "Durante a negociação, o colecionador aparece por um código verificado (ex.: COL-0105) e pela cidade. O nome é revelado às duas partes quando a venda é fechada."],
          ["Como funciona o pagamento?", "O colecionador paga à PONCI, que retém o valor em custódia. Com a entrega confirmada, o valor, menos a comissão, é repassado à artista."],
        ].map((q, i) => <details key={i}><summary><span>{pad(i + 1)}</span><b>{q[0]}</b><Icon n="plus" /></summary><p className="ans">{q[1]}</p></details>)}</div>
      </section>

      <div className="wrap" id="acesso">
        <section className="acq" aria-labelledby="form-t" style={{ marginTop: 0 }}>
          <div className="acq-aside"><p className="lab">06 — Solicitar acesso</p><h2 id="form-t">Peça o seu convite.</h2>
            <p>Conte quem você é. Cada pedido é lido pessoalmente pela curadoria da PONCI.</p>
            <Notice>Já recebeu um código? <Link href="/cadastro" style={{ textDecoration: "underline" }}>Crie sua conta de membro</Link>.</Notice>
            <div aria-hidden="true"><Slab a={DEMO_ART.convite} plaque={false} /></div></div>
          <div className="acq-main"><AccessForm /></div>
        </section>
      </div>

      <section className="closing" aria-labelledby="close-t"><div className="wrap">
        <h2 id="close-t">A arte merece <em>espaço.</em></h2>
        <div className="act"><Link className="btn" href="/artista">Área do artista <Icon n="right" /></Link><Link className="btn ghost" href="/colecionador">Área do colecionador <Icon n="right" /></Link><p>Membros entram com e-mail e senha.</p></div>
      </div></section>
    </PublicShell>
  );
}

function Ticks({ items }: { items: string[][] }) {
  return <ul className="ticks">{items.map((t, i) => <li key={t[0]}><span>{pad(i + 1)}</span><div><b>{t[0]}</b><small>{t[1]}</small></div></li>)}</ul>;
}
