import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart2, ChevronUp, ChevronDown, ExternalLink } from 'lucide-react';
import PageHeader from '../components/shared/PageHeader.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { analyticsService } from '../services/analytics.service.js';

function ScorePill({ pct }) {
  const color = pct >= 70 ? 'text-green-600 bg-green-50' : pct >= 40 ? 'text-amber-600 bg-amber-50' : 'text-red-600 bg-red-50';
  return (
    <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full ${color}`}>
      {pct}%
    </span>
  );
}

export default function AdminRoleAnalyticsPage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState('');
  const [sortKey, setSortKey]   = useState('overall');
  const [sortDir, setSortDir]   = useState('desc');

  const { data, loading } = useFetch(
    () => analyticsService.getRoleAnalytics(selected),
    [selected]
  );

  function toggleSort(key) {
    if (sortKey === key) setSortDir((d) => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setSortDir('desc'); }
  }

  const sorted = [...(data?.students || [])].sort((a, b) => {
    const v = sortDir === 'desc' ? b[sortKey] - a[sortKey] : a[sortKey] - b[sortKey];
    return v;
  });

  const SortIcon = ({ col }) => {
    if (sortKey !== col) return <ChevronUp size={12} className="text-slate-300" />;
    return sortDir === 'desc'
      ? <ChevronDown size={12} className="text-[#CC0000]" />
      : <ChevronUp size={12} className="text-[#CC0000]" />;
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader
        title="Role Analytics"
        subtitle="Select a role category to see all students targeting it and their readiness scores."
      />

      {/* Category selector */}
      <div className="card p-5 mb-6">
        <label className="label">Select Role Category</label>
        <select value={selected} onChange={(e) => setSelected(e.target.value)}
          className="input-field max-w-md">
          <option value="">Choose a category…</option>
          {data?.categories?.map((c) => (
            <option key={c.category_code} value={c.category_code}>{c.description}</option>
          ))}
        </select>
      </div>

      {/* Results */}
      {selected && (
        <>
          {loading && <div className="text-slate-400 text-sm">Computing…</div>}

          {!loading && data?.students && (
            <>
              {/* Averages */}
              {data.averages && (
                <div className="grid grid-cols-3 gap-4 mb-5">
                  {[
                    { label: 'Class Average — Overall',       val: data.averages.overall,    color: '#CC0000' },
                    { label: 'Class Average — Competencies',  val: data.averages.competency, color: '#d97706' },
                    { label: 'Class Average — TTFs',          val: data.averages.ttf,        color: '#7c3aed' },
                  ].map(({ label, val, color }) => (
                    <div key={label} className="card p-4 text-center">
                      <p className="text-3xl font-bold" style={{ color }}>{val}%</p>
                      <p className="text-xs text-slate-500 mt-1">{label}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Table */}
              <div className="card overflow-hidden">
                <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700">
                    {sorted.length} students — {data.category_description}
                  </p>
                  <p className="text-xs text-slate-400">Click column headers to sort</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">#</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Student</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Target</th>
                        {['overall','competency','ttf'].map((col) => (
                          <th key={col}
                            className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase cursor-pointer hover:text-[#CC0000] select-none"
                            onClick={() => toggleSort(col)}>
                            <span className="flex items-center gap-1">
                              {col === 'overall' ? 'Overall' : col === 'competency' ? 'Competency' : 'TTF'}
                              <SortIcon col={col} />
                            </span>
                          </th>
                        ))}
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Profile</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sorted.map((s, i) => (
                        <tr key={s.id}
                          className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 text-slate-400 text-xs">{i + 1}</td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-slate-800">{s.name}</p>
                            <p className="text-xs text-slate-400 font-mono">{s.roll_number} · {s.section}</p>
                          </td>
                          <td className="px-4 py-3">
                            {s.is_primary && (
                              <span className="text-xs bg-[#CC0000]/10 text-[#CC0000] font-semibold px-2 py-0.5 rounded-full">
                                Primary
                              </span>
                            )}
                            {s.is_secondary && (
                              <span className="text-xs bg-slate-100 text-slate-500 font-semibold px-2 py-0.5 rounded-full">
                                Secondary
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <ScorePill pct={s.overall} />
                              <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full rounded-full"
                                  style={{
                                    width: `${s.overall}%`,
                                    backgroundColor: s.overall >= 70 ? '#16a34a' : s.overall >= 40 ? '#d97706' : '#CC0000'
                                  }} />
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3"><ScorePill pct={s.competency} /></td>
                          <td className="px-4 py-3"><ScorePill pct={s.ttf} /></td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => navigate(`/admin/students/${s.id}`)}
                              className="text-xs text-[#CC0000] hover:underline flex items-center gap-1">
                              View <ExternalLink size={10} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
