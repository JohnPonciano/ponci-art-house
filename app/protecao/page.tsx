import type { Metadata } from "next";
import Link from "next/link";
import { PublicShell } from "@/components/Shells";
import { PageHead } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { pad } from "@/lib/format";

export const metadata: Metadata = {
  title: "Proteção das obras",
  description: "Por que a PONCI é uma rede fechada: proteger o trabalho de quem cria da coleta em massa por inteligência artificial. Proteção, não elitismo.",
};

const FAZEMOS: [string, string][] = [
  ["Acervo só para membros", "As obras completas, os preços e os detalhes só aparecem para quem entrou na rede com convite."],
  ["Vitrine pública em miniatura", "Do lado de fora, a página inicial mostra só miniaturas de algumas obras. A versão em tamanho grande fica na área de membros."],
  ["Robôs de IA barrados", "O nosso robots.txt bloqueia os robôs de coleta das empresas de IA e sinaliza que o conteúdo do site não pode ser usado para treinar nem alimentar modelos."],
  ["Comunidade fechada", "Posts, fotos de ateliê e conversas da comunidade só abrem para membros logados."],
  ["Nada de vender obra para treino", "A PONCI não vende nem licencia obras, imagens ou dados de membros para treinar inteligência artificial."],
  ["Reprodução sempre identificada", "Impressões e fine art levam a etiqueta REPROD, para ninguém confundir cópia com original."],
];

export default function Protecao() {
  return (
    <PublicShell>
      <div className="wrap">
        <PageHead title="Proteção" label="Por que a rede é fechada" intro={<>A PONCI é fechada para proteger quem cria. <em>É proteção, não elitismo.</em></>} count={<>Arte feita<br />por gente</>} />

        <section className="sub-sec prot" aria-labelledby="p1">
          <div className="prot-row">
            <h2 id="p1" className="prot-h">O que está acontecendo</h2>
            <div className="prot-txt">
              <p>Hoje, programas de inteligência artificial aprendem lendo milhões de imagens da internet. Muitas vezes, obras de artistas entram nessa conta <b>sem pedido, sem pagamento e sem crédito</b>, e depois a máquina passa a imitar o estilo de quem fez.</p>
              <p>Para quem vive de arte, isso pesa: anos de pesquisa, de mão e de olho viram matéria-prima de graça para algo que compete com o próprio artista.</p>
            </div>
          </div>
          <div className="prot-row">
            <h2 className="prot-h">IA é ferramenta, não substituta</h2>
            <div className="prot-txt">
              <p>A gente não é contra tecnologia. A própria PONCI usa ferramentas digitais, inclusive inteligência artificial, para trabalhar melhor no dia a dia. IA é ótima para organizar, revisar, traduzir, tirar dúvida e poupar tempo.</p>
              <p className="prot-quote">“A IA existe para facilitar a nossa vida, não para sobrescrever o trabalho de ninguém.”</p>
              <p>O problema não é a ferramenta. É usar a obra dos outros sem permissão. Por isso as obras daqui ficam atrás da porta.</p>
            </div>
          </div>
          <div className="prot-row">
            <h2 className="prot-h">O que a PONCI faz</h2>
            <ol className="prot-list">{FAZEMOS.map(([t, d], i) => <li key={t}><span>{pad(i + 1)}</span><div><b>{t}</b><p>{d}</p></div></li>)}</ol>
          </div>
          <div className="prot-row">
            <h2 className="prot-h">O que não dá para prometer</h2>
            <div className="prot-txt">
              <p>Nenhuma proteção na internet é absoluta: alguém com acesso pode tirar um print, e um robô mal-intencionado pode ignorar as regras. O que a rede fechada faz é <b>tirar as obras do caminho da coleta em massa</b>, que é como esses modelos são alimentados.</p>
              <p>Viu uma obra da PONCI sendo usada onde não devia? Se você é membro, conte para a gente por uma solicitação em Minha conta. A gente quer saber.</p>
            </div>
          </div>
          <div className="prot-row">
            <h2 className="prot-h">Proteção, não elitismo</h2>
            <div className="prot-txt">
              <p>A porta é fechada para robô, não para gente. Qualquer artista ou colecionador pode pedir convite, de qualquer lugar do Brasil e em qualquer momento da carreira. A curadoria lê cada pedido com calma.</p>
              <div className="prot-acts">
                <Link className="btn" href="/#acesso">Pedir meu convite <Icon n="right" /></Link>
                <Link className="btn ghost" href="/#perguntas">Mais perguntas</Link>
              </div>
            </div>
          </div>
        </section>
        <div style={{ height: "clamp(60px,8vw,120px)" }} />
      </div>
    </PublicShell>
  );
}
