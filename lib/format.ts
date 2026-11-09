export const pad = (n: number) => String(n).padStart(2, "0");
export const brl = (n: number) => "R$ " + Math.round(n || 0).toLocaleString("pt-BR");
const num1 = (n: number) => n.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
export const dims = (a: { h: number; w: number }) => `${a.h} × ${a.w} cm`;
export const dimsIn = (a: { h: number; w: number }) => `${num1(a.h / 2.54)} × ${num1(a.w / 2.54)} in`;
const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
export const dateBR = (ts: string | number | Date) => {
  const d = new Date(ts);
  return `${pad(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};
export const parseMoney = (v: unknown) => {
  const n = Number(String(v ?? "").replace(/[^\d,]/g, "").replace(",", "."));
  return isFinite(n) ? Math.round(n) : 0;
};
export const initials = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
export const catNo = (no: number) => "PNC " + String(no).padStart(3, "0");
export const firstName = (n: string) => (n || "").split(" ")[0];
export const slugify = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "obra";

export const CAT: Record<string, string> = { painting: "Pintura", mixed: "Técnica mista", paper: "Obra sobre papel", edition: "Edição" };
export const STATUS: Record<string, [string, string]> = {
  published: ["Publicada", "t-pub"], review: ["Em curadoria", "t-rev"], reserved: ["Reservada", "t-res"], sold: ["Vendida", "t-sold"],
};
export const PSTATUS: Record<string, [string, string]> = {
  open: ["Aguardando artista", "t-open"], countered: ["Contraproposta", "t-countered"], accepted: ["Aceita", "t-accepted"],
  declined: ["Recusada", "t-declined"], closed: ["Encerrada", "t-closed"], withdrawn: ["Retirada", "t-withdrawn"],
};
export const STAGES: [string, string][] = [
  ["Reservada", "Obra retirada da vitrine"], ["Pagamento em custódia", "Valor retido pela PONCI"],
  ["Em transporte", "Embalagem e seguro"], ["Entregue", "Certificado emitido"],
];
export const EVENT_LABEL: Record<string, string> = {
  offer: "Proposta", counter: "Contraproposta", decline: "Recusa", accept: "Aceite", close: "Encerrada", withdraw: "Retirada",
};
export const COMMISSION = 0.15;
export const DEMO_PASSWORD = "ponci-demo-2026";
export const DEMO = {
  artista: { email: "helena@demo.ponci.art", name: "Helena Vasques" },
  colecionador: { email: "marina@demo.ponci.art", name: "Marina Alves" },
};
