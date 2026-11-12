/** Esqueleto mostrado na hora do toque, enquanto a página chega (sem tela congelada). */
export function PageSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div className="wrap skel-page" role="status" aria-live="polite" aria-label="Carregando">
      <div className="skel skel-eyebrow" />
      <div className="skel skel-title" />
      <div className="skel skel-line" /><div className="skel skel-line short" />
      <div className="skel-grid">{Array.from({ length: cards }, (_, i) => <div key={i} className="skel skel-card" />)}</div>
    </div>
  );
}
