const imageUrl = (path: string) => `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/works/${path}`;
const n = (v: number) => String(Math.round(v * 10) / 10).replace(".", ",");
export type ScalePaper = { w: number; h: number; label: string };

/** A obra em escala, ao lado de uma pessoa de 1,70 m: ajuda a imaginar o tamanho na parede.
 *  Com `paper`, mostra o print: o papel no tamanho escolhido, na orientação da obra, com a imagem inteira e margem. */
export function Scale({ a, paper }: { a: { h: number; w: number; title: string; image_path?: string | null }; paper?: ScalePaper | null }) {
  // print: o papel acompanha a orientação da obra
  const land = a.w > a.h;
  const pw = paper ? (land ? Math.max(paper.w, paper.h) : Math.min(paper.w, paper.h)) : a.w;
  const ph = paper ? (land ? Math.min(paper.w, paper.h) : Math.max(paper.w, paper.h)) : a.h;
  const P = 170, floor = 232, W = Math.max(300, pw + 150), H = 250;
  const cy = Math.max(ph / 2 + 8, Math.min(150, floor - ph / 2 - 12));   // centro na altura dos olhos, sem sair da parede
  const ax = 20, ay = floor - (floor - cy) - ph / 2, px = Math.min(W - 40, ax + pw + 55);
  // imagem dentro do papel, sem corte, com margem de ~6% do lado menor
  const m = paper ? Math.min(pw, ph) * 0.06 : 0, r = a.w / a.h;
  let iw = pw - 2 * m, ih = ph - 2 * m;
  if (paper) { if (iw / ih > r) iw = ih * r; else ih = iw / r; }
  const ix = ax + (pw - iw) / 2, iy = ay + (ph - ih) / 2;
  const src = a.image_path ? imageUrl(a.image_path.replace(/\.jpg$/, /\/(diario|obras-gen)\//.test(a.image_path) ? "-t.jpg" : ".jpg")) : null;
  const what = paper ? `um print ${paper.label} de ${a.title}, ${n(ph)} por ${n(pw)} centímetros` : `${a.title} tem ${a.h} por ${a.w} centímetros`;
  return (
    <figure className={"scale" + (paper ? " is-print" : "")}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${what}, ao lado de uma pessoa de 1,70 metro`}>
        <line x1="0" y1={floor} x2={W} y2={floor} className="sc-floor" />
        <rect x={ax + 3} y={ay + 4} width={pw} height={ph} className="sc-shadow" />
        {paper && <rect x={ax} y={ay} width={pw} height={ph} className="sc-paper" />}
        {src ? <image href={src} x={ix} y={iy} width={iw} height={ih} preserveAspectRatio={paper ? "xMidYMid meet" : "xMidYMid slice"} /> : <rect x={ix} y={iy} width={iw} height={ih} className="sc-work" />}
        <rect x={ax} y={ay} width={pw} height={ph} className={"sc-work" + (src || paper ? " img" : "")} />
        <g className="sc-person" transform={`translate(${px},${floor - P})`}>
          <circle cx="0" cy="11" r="11" /><path d="M-19 30 q0 -7 8 -7 h22 q8 0 8 7 v52 q0 4 -4 4 h-3 v80 q0 4 -4 4 h-5 q-3 0 -3 -4 v-70 h-0 v70 q0 4 -3 4 h-5 q-4 0 -4 -4 v-80 h-3 q-4 0 -4 -4z" />
        </g>
        <g className="sc-dim"><line x1={px + 30} y1={floor - P} x2={px + 30} y2={floor} /><text x={px + 36} y={floor - P / 2} dominantBaseline="middle">1,70 m</text></g>
      </svg>
      <figcaption>{paper ? <><b>Print {paper.label}</b> · {n(ph)} × {n(pw)} cm · obra inteira, com margem</> : <><b>Obra original</b> · {a.h} × {a.w} cm</>} · pessoa de 1,70 m para referência</figcaption>
    </figure>
  );
}
