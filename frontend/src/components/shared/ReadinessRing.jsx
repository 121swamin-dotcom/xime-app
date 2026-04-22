export default function ReadinessRing({ pct = 0, label, size = 120, confirmed = false }) {
  const r      = (size / 2) - 10;
  const circum = 2 * Math.PI * r;
  const offset = circum - (pct / 100) * circum;

  const color = pct >= 70 ? '#16a34a' : pct >= 40 ? '#d97706' : '#dc2626';

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r}
          fill="none" stroke="#f1f5f9" strokeWidth="8" />
        <circle cx={size/2} cy={size/2} r={r}
          fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circum}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
      </svg>
      <div className="text-center -mt-1" style={{ marginTop: `-${size * 0.72}px`, height: `${size * 0.72}px`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span className="text-2xl font-bold text-slate-800" style={{ color }}>{pct}%</span>
        {confirmed && <span className="text-xs text-green-600 font-medium">Confirmed</span>}
      </div>
      {label && <p className="text-xs text-slate-500 text-center mt-1 leading-tight">{label}</p>}
    </div>
  );
}
