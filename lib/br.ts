const only = (s: string) => (s || "").replace(/\D/g, "");
export function cpfValid(v: string) {
  const c = only(v); if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false;
  for (const k of [9, 10]) { let s = 0; for (let i = 0; i < k; i++) s += +c[i] * (k + 1 - i); let d = (s * 10) % 11; if (d === 10) d = 0; if (d !== +c[k]) return false; }
  return true;
}
/** CNPJ numérico ou alfanumérico (valor = código ASCII − 48). */
export function cnpjValid(v: string) {
  const c = (v || "").toUpperCase().replace(/[^0-9A-Z]/g, ""); if (!/^[0-9A-Z]{12}\d{2}$/.test(c) || /^(.)\1{13}$/.test(c)) return false;
  const val = (ch: string) => ch.charCodeAt(0) - 48;
  const dv = (n: number) => { const w = n === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]; let s = 0; for (let i = 0; i < n; i++) s += val(c[i]) * w[i]; const r = s % 11; return r < 2 ? 0 : 11 - r; };
  return dv(12) === +c[12] && dv(13) === +c[13];
}
export const maskCpf = (v: string) => only(v).slice(0, 11).replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
export const maskCnpj = (v: string) => (v || "").toUpperCase().replace(/[^0-9A-Z]/g, "").slice(0, 14)
  .replace(/^(\w{2})(\w)/, "$1.$2").replace(/^(\w{2})\.(\w{3})(\w)/, "$1.$2.$3").replace(/\.(\w{3})(\w)/, ".$1/$2").replace(/(\w{4})(\d{1,2})$/, "$1-$2");
export const maskPhone = (v: string) => { let d = only(v); if (d.startsWith("55") && d.length > 11) d = d.slice(2); d = d.slice(0, 11);
  return d.length > 10 ? d.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3") : d.replace(/(\d{2})(\d{0,4})(\d{0,4})/, (m, a, b, c) => `(${a}) ${b}${c ? "-" + c : ""}`).replace(/[\s-]+$/, ""); };
export const maskCep = (v: string) => only(v).slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2");
export const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
