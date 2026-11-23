import type { Metadata } from "next";
import Link from "next/link";
import { PublicShell } from "@/components/Shells";
import { PageHead } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { pad } from "@/lib/format";

export const metadata: Metadata = {
  title: "Guia de envio",
  description: "Como embalar e despachar uma obra vendida na PONCI: materiais, passo a passo, seguro e rastreio.",
};

const PASSOS: [string, string][] = [
  ["Proteja a superfície", "Cubra a obra com papel neutro (sem ácido) ou papel glassine. Nunca plástico bolha direto na tinta: ele gruda e marca."],
  ["Cantoneiras nos quatro cantos", "Os cantos são o que mais sofre. Cantoneira de papelão ou de espuma em cada um."],
  ["Plástico bolha por fora", "Duas ou três voltas, com as bolhas para fora, fechando bem com fita."],
  ["Caixa com folga e calço", "Caixa firme, uns 5 cm maior que a obra em cada lado, com o espaço preenchido para a obra não balançar. Obra grande ou de valor alto: caixa dupla ou caixa de madeira."],
  ["Certificado e um bilhete", "Coloque o certificado de autenticidade e, se quiser, um bilhete seu. Quem compra adora."],
  ["Etiqueta e “frágil”", "Etiqueta bem visível, “FRÁGIL” e “ESTE LADO PARA CIMA” em mais de um lado da caixa."],
];
const TIPOS: [string, string][] = [
  ["Obra em papel sem moldura", "Entre duas placas rígidas (papelão grosso ou foam board), em envelope rígido. Ou enrolada, com a imagem para fora, em tubo rígido."],
  ["Obra com vidro", "Fita crepe em X no vidro (se quebrar, os cacos não riscam a obra) e proteção extra na frente. Em obra cara, prefira acrílico."],
  ["Escultura e cerâmica", "Caixa dentro de caixa, com espuma ou flocos em volta. Partes que se soltam vão embaladas separadas."],
];

export default function GuiaDeEnvio() {
  return (
    <PublicShell>
      <div className="wrap">
        <PageHead title="Envio" label="Guia para artistas" intro="Vendeu? A obra é sua até chegar. Um bom pacote evita dor de cabeça para você e para quem comprou." count={<>Despacho em até<br />5 dias úteis</>} />
        <section className="sub-sec prot" aria-label="Guia de envio">
          <div className="prot-row">
            <h2 className="prot-h">Como funciona</h2>
            <div className="prot-txt">
              <p>Depois que a colecionadora paga, o dinheiro fica guardado pela PONCI. Você embala, despacha <b>com seguro pelo valor da obra</b> em até 5 dias úteis e registra a transportadora e o código de rastreio em <b>Vendas</b>.</p>
              <p>Até a entrega, a obra corre por sua conta. Quando a colecionadora confirma o recebimento e passam os 7 dias de arrependimento, o repasse é liberado.</p>
              <p>Em cada obra você escolhe se o <b>frete é incluso no preço</b> (você paga o envio) ou se <b>quem compra paga o frete</b>, calculado antes do pagamento.</p>
            </div>
          </div>
          <div className="prot-row">
            <h2 className="prot-h">Passo a passo</h2>
            <ol className="prot-list">{PASSOS.map(([t, d], i) => <li key={t}><span>{pad(i + 1)}</span><div><b>{t}</b><p>{d}</p></div></li>)}</ol>
          </div>
          <div className="prot-row">
            <h2 className="prot-h">Casos especiais</h2>
            <ol className="prot-list">{TIPOS.map(([t, d], i) => <li key={t}><span>{pad(i + 1)}</span><div><b>{t}</b><p>{d}</p></div></li>)}</ol>
          </div>
          <div className="prot-row">
            <h2 className="prot-h">Seguro e transportadora</h2>
            <div className="prot-txt">
              <p>Declare sempre o <b>valor da obra</b> no envio: é o que garante o reembolso se algo acontecer no caminho. Cada serviço tem um limite de valor declarado e de tamanho; obra grande, pesada ou acima do limite vai por <b>transportadora especializada em arte</b>.</p>
              <p>Tire fotos da obra embalada e da caixa fechada antes de postar. Se houver qualquer problema, elas ajudam na resolução.</p>
            </div>
          </div>
          <div className="prot-row">
            <h2 className="prot-h">Chegou com problema?</h2>
            <div className="prot-txt">
              <p>A colecionadora tem 48 horas para registrar avaria pela plataforma, com fotos. A PONCI media o caso com você e com a transportadora antes de liberar qualquer valor.</p>
              <div className="prot-acts"><Link className="btn" href="/artista/vendas">Minhas vendas <Icon n="right" /></Link></div>
            </div>
          </div>
        </section>
        <div style={{ height: "clamp(60px,8vw,120px)" }} />
      </div>
    </PublicShell>
  );
}
