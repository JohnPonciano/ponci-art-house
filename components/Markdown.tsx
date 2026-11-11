import type { ReactNode } from "react";

/** Markdown mínimo para documentos e contratos: #, ##, >, listas, tabelas, **negrito**. */
function inline(t: string, key = 0): ReactNode[] {
  const out: ReactNode[] = []; const re = /(?<!\*)\*\*(?!\*)(.+?)(?<!\*)\*\*(?!\*)/g; let last = 0, m: RegExpExecArray | null, i = 0;
  while ((m = re.exec(t))) { if (m.index > last) out.push(t.slice(last, m.index)); out.push(<b key={`${key}-${i++}`}>{m[1]}</b>); last = re.lastIndex; }
  if (last < t.length) out.push(t.slice(last));
  return out;
}
export function Markdown({ text }: { text: string }) {
  const lines = text.replace(/\r/g, "").split("\n"); const out: ReactNode[] = []; let i = 0, k = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (!l.trim()) { i++; continue; }
    if (l.startsWith("# ")) { out.push(<h1 key={k++} className="md-h1">{inline(l.slice(2), k)}</h1>); i++; continue; }
    if (l.startsWith("## ")) { out.push(<h2 key={k++} className="md-h2">{inline(l.slice(3), k)}</h2>); i++; continue; }
    if (l.startsWith("> ")) { const b: string[] = []; while (i < lines.length && lines[i].startsWith("> ")) b.push(lines[i++].slice(2)); out.push(<blockquote key={k++} className="md-note">{inline(b.join(" "), k)}</blockquote>); continue; }
    if (l.startsWith("- ")) { const b: string[] = []; while (i < lines.length && lines[i].startsWith("- ")) b.push(lines[i++].slice(2)); out.push(<ul key={k++} className="md-ul">{b.map((x, j) => <li key={j}>{inline(x, j)}</li>)}</ul>); continue; }
    if (l.startsWith("|")) {
      const rows: string[][] = []; while (i < lines.length && lines[i].startsWith("|")) { const r = lines[i++].split("|").slice(1, -1).map((c) => c.trim()); if (!r.every((c) => /^-+$/.test(c))) rows.push(r); }
      out.push(<div key={k++} className="md-table"><table><thead><tr>{rows[0].map((c, j) => <th key={j}>{inline(c, j)}</th>)}</tr></thead><tbody>{rows.slice(1).map((r, j) => <tr key={j}>{r.map((c, n) => <td key={n}>{inline(c, n)}</td>)}</tr>)}</tbody></table></div>);
      continue;
    }
    const b: string[] = []; while (i < lines.length && lines[i].trim() && !/^(#|> |- |\|)/.test(lines[i])) b.push(lines[i++]);
    out.push(<p key={k++}>{inline(b.join(" "), k)}</p>);
  }
  return <div className="md">{out}</div>;
}
