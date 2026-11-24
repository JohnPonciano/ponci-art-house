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
  ["Em transporte", "Despachada pela artista, com seguro"], ["Entregue", "Certificado emitido"],
];
export const EVENT_LABEL: Record<string, string> = {
  offer: "Proposta", counter: "Contraproposta", decline: "Recusa", accept: "Aceite", close: "Encerrada", withdraw: "Retirada",
};
/* Comissão: cada venda guarda o percentual do momento (orders.commission_pct, ver regras comerciais).
   Vendas lidas antes dessa migração não trazem a coluna; todas elas foram feitas com 15%. */
type WithPct = { amount: number; commission_pct?: number | string | null };
export const orderPct = (o: { commission_pct?: number | string | null }) => (o.commission_pct == null ? 15 : Number(o.commission_pct));
/** Comissão em reais, arredondada como no contrato. */
export const commissionOf = (o: WithPct) => Math.round((o.amount * orderPct(o)) / 100);
/** Valor líquido do artista. */
export const netOf = (o: WithPct) => o.amount - commissionOf(o);
/** 15 -> "15", 12.5 -> "12,5" */
export const fmtPct = (p: number) => String(Math.round(p * 100) / 100).replace(".", ",");

/* ---------- prints (valores em centavos) ---------- */
/** 21695 -> "R$ 216,95" */
export const brlCents = (c: number) => "R$ " + ((c || 0) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
/** "R$ 1.234,5" / "1234,50" / "60" -> centavos (null se vazio ou inválido) */
export const parseCents = (v: unknown): number | null => {
  const s = String(v ?? "").replace(/[^\d,.]/g, "");
  if (!s) return null;
  const norm = s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : /\.\d{1,2}$/.test(s) ? s : s.replace(/\./g, "");
  const n = Number(norm);
  return Number.isFinite(n) ? Math.round(n * 100) : null;
};
/** Pixels mínimos do arquivo-mestre para um papel (lado maior, lado menor), como o banco confere. */
export const masterPxNeeded = (wCm: number, hCm: number, dpi: number): [number, number] => {
  const px = dpi / 2.54; return [Math.ceil(Math.max(wCm, hCm) * px), Math.ceil(Math.min(wCm, hCm) * px)];
};
export const masterFits = (w: number, h: number, need: [number, number]) => Math.max(w, h) >= need[0] && Math.min(w, h) >= need[1];
export const cm = (n: number) => String(Math.round(n * 10) / 10).replace(".", ",");
