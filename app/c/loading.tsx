/** Esqueleto da grade: aparece no mesmo instante do toque. */
export default function Loading() {
  const h = [1.25, .9, 1.1, 1.3, .8, 1.15];
  return (
    <div className="rn-wrap" aria-busy="true" aria-label="Carregando">
      <div className="rn-grid" style={{ ["--cols" as any]: 2 }}>
        {[0, 1].map((c) => <div key={c} className="rn-col">{h.filter((_, i) => i % 2 === c).map((x, i) => (
          <div key={i} className="rn-card"><div className="skel" style={{ aspectRatio: `${1 / x}` }} /><span className="skel" style={{ height: 14, width: "80%" }} /><span className="skel" style={{ height: 12, width: "50%" }} /></div>))}</div>)}
      </div>
    </div>
  );
}
