const imageUrl = (path: string) => `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/works/${path}`;

/** A obra em escala, ao lado de uma pessoa de 1,70 m: ajuda a imaginar o tamanho na parede. */
export function Scale({ a }: { a: { h: number; w: number; title: string; image_path?: string | null } }) {
  const P = 170, floor = 232, W = Math.max(300, a.w + 150), H = 250;
  const cy = Math.max(a.h / 2 + 8, Math.min(150, floor - a.h / 2 - 12));   // centro na altura dos olhos, sem sair da parede
  const ax = 20, ay = floor - (floor - cy) - a.h / 2, px = Math.min(W - 40, ax + a.w + 55);
  const src = a.image_path ? imageUrl(a.image_path.replace(/\.jpg$/, /\/(diario|obras-gen)\//.test(a.image_path) ? "-t.jpg" : ".jpg")) : null;
  return (
    <figure className="scale">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${a.title} tem ${a.h} por ${a.w} centímetros, ao lado de uma pessoa de 1,70 metro`}>
        <line x1="0" y1={floor} x2={W} y2={floor} className="sc-floor" />
        <rect x={ax + 3} y={ay + 4} width={a.w} height={a.h} className="sc-shadow" />
        {src ? <image href={src} x={ax} y={ay} width={a.w} height={a.h} preserveAspectRatio="xMidYMid slice" /> : null}
        <rect x={ax} y={ay} width={a.w} height={a.h} className={"sc-work" + (src ? " img" : "")} />
        <g className="sc-person" transform={`translate(${px},${floor - P})`}>
          <circle cx="0" cy="11" r="11" /><path d="M-19 30 q0 -7 8 -7 h22 q8 0 8 7 v52 q0 4 -4 4 h-3 v80 q0 4 -4 4 h-5 q-3 0 -3 -4 v-70 h-0 v70 q0 4 -3 4 h-5 q-4 0 -4 -4 v-80 h-3 q-4 0 -4 -4z" />
        </g>
        <g className="sc-dim"><line x1={px + 30} y1={floor - P} x2={px + 30} y2={floor} /><text x={px + 36} y={floor - P / 2} dominantBaseline="middle">1,70 m</text></g>
      </svg>
      <figcaption>{a.h} × {a.w} cm · pessoa de 1,70 m para referência</figcaption>
    </figure>
  );
}
