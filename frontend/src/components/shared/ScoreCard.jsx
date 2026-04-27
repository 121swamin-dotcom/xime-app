// ScoreCard — replaces circular rings with clean card + bar design
export function ScoreCard({ label, pct, sublabel, size = 'normal' }) {
  const color = pct >= 70 ? '#16a34a' : pct >= 40 ? '#d97706' : '#CC0000';
  const status = pct >= 70 ? 'On Track' : pct >= 40 ? 'Developing' : 'Needs Work';
  const isLarge = size === 'large';

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-center">
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">
        {label}
      </p>
      <p className={`font-extrabold leading-none mb-2 ${isLarge ? 'text-4xl' : 'text-3xl'}`}
        style={{ color }}>
        {pct}%
      </p>
      {/* Progress bar */}
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-2">
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <p className="text-[11px] font-semibold" style={{ color }}>
        {sublabel || status}
      </p>
    </div>
  );
}

// ScoreRow — a row of 3 or 4 ScoreCards
export function ScoreRow({ overall, competency, ttf, extra }) {
  return (
    <div className={`grid gap-3 ${extra ? 'grid-cols-4' : 'grid-cols-3'}`}>
      <ScoreCard label="Overall Readiness" pct={overall}    size="large" />
      <ScoreCard label="Competencies"      pct={competency} />
      <ScoreCard label="TTFs"              pct={ttf} />
      {extra && <ScoreCard label={extra.label} pct={extra.pct} sublabel={extra.sublabel} />}
    </div>
  );
}
