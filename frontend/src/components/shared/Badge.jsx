export function Badge({ type }) {
  const styles = {
    M:    'bg-blue-100 text-blue-700 border border-blue-200',
    R:    'bg-amber-100 text-amber-700 border border-amber-200',
    T3:   'bg-slate-100 text-slate-500 border border-slate-200',
    T4:   'bg-violet-100 text-violet-700 border border-violet-200',
    T5:   'bg-emerald-100 text-emerald-700 border border-emerald-200',
    T6:   'bg-rose-100 text-rose-700 border border-rose-200',
    CORE: 'bg-slate-100 text-slate-500 border border-slate-200',
  };
  const labels = { M: 'Mandatory', R: 'Recommended', T3: 'Term 3', T4: 'Term 4', T5: 'Term 5', T6: 'Term 6', CORE: 'Core' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[type] || styles.R}`}>
      {labels[type] || type}
    </span>
  );
}

export function TermBadge({ termCode }) {
  return <Badge type={`T${termCode}`} />;
}
