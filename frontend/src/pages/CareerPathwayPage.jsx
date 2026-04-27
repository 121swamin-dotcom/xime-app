import { useNavigate } from 'react-router-dom';
import { TrendingUp, BookOpen, Brain, Wrench, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import PageHeader from '../components/shared/PageHeader.jsx';
import ReadinessRing from '../components/shared/ReadinessRing.jsx';
import { Badge, TermBadge } from '../components/shared/Badge.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { analyticsService } from '../services/analytics.service.js';

const DREYFUS = ['','Novice','Adv Beginner','Competent','Proficient','Expert'];

export default function CareerPathwayPage() {
  const navigate = useNavigate();
  const { data, loading, error } = useFetch(analyticsService.getCareerPathway);

  if (loading) return <div className="p-6 text-slate-400 animate-pulse">Building your pathway…</div>;
  if (error)   return <div className="p-6 text-red-500">{error}</div>;
  if (!data?.target) return (
    <div className="p-6 max-w-4xl mx-auto">
      <PageHeader title="Career Pathway" />
      <div className="card p-8 text-center text-slate-400">
        <AlertCircle size={40} className="mx-auto mb-3 text-amber-300" />
        <p className="font-medium">Set your role targets first</p>
        <button onClick={() => navigate('/electives')}
          className="mt-4 btn-primary text-sm px-6">Go to Electives</button>
      </div>
    </div>
  );

  const { target, courses, competencies, ttfs, recommendations } = data;
  const mandatory   = courses?.filter((c) => c.type === 'M') || [];
  const recommended = courses?.filter((c) => c.type === 'R') || [];
  const mandatoryDone = mandatory.filter((c) => c.registered).length;
  const mandatoryPct  = mandatory.length ? Math.round((mandatoryDone / mandatory.length) * 100) : 0;

  const avgComp = competencies?.length
    ? Math.round(competencies.reduce((s, c) => s + Number(c.rating), 0) / (competencies.length * 5) * 100) : 0;
  const avgTTF  = ttfs?.length
    ? Math.round(ttfs.reduce((s, t) => s + Number(t.rating), 0) / (ttfs.length * 5) * 100) : 0;
  const overall = Math.round(avgComp * 0.6 + avgTTF * 0.4);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader
        title="Career Pathway"
        subtitle={`Your progress toward ${target.primary_description}`}
      />

      {/* Progress overview */}
      <div className="card p-6 mb-6">
        <div className="flex items-center justify-around flex-wrap gap-6">
          <div className="text-center">
            <ReadinessRing pct={overall} label="Overall Readiness" size={110} />
          </div>
          <div className="text-center">
            <ReadinessRing pct={avgComp} label="Competencies" size={90} />
          </div>
          <div className="text-center">
            <ReadinessRing pct={avgTTF} label="TTFs" size={90} />
          </div>
          <div className="text-center">
            <div className="relative inline-block">
              <svg width="90" height="90" className="-rotate-90">
                <circle cx="45" cy="45" r="37" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                <circle cx="45" cy="45" r="37" fill="none"
                  stroke={mandatoryPct >= 70 ? '#16a34a' : mandatoryPct >= 40 ? '#d97706' : '#CC0000'}
                  strokeWidth="8"
                  strokeDasharray={232.5}
                  strokeDashoffset={232.5 - (mandatoryPct / 100) * 232.5}
                  strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold"
                  style={{ color: mandatoryPct >= 70 ? '#16a34a' : mandatoryPct >= 40 ? '#d97706' : '#CC0000' }}>
                  {mandatoryPct}%
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-1 text-center">Mandatory Courses<br/>
              <span className="font-medium text-slate-700">{mandatoryDone}/{mandatory.length} done</span>
            </p>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {recommendations?.length > 0 && (
        <div className="card p-5 mb-6 border-amber-200 bg-amber-50">
          <h3 className="text-sm font-semibold text-amber-800 flex items-center gap-2 mb-3">
            <AlertCircle size={16} /> Recommended Actions
          </h3>
          <div className="space-y-2">
            {recommendations.map((r) => (
              <div key={r.course_code}
                className="flex items-center justify-between bg-white rounded-lg px-4 py-2.5 border border-amber-100">
                <div>
                  <span className="font-mono text-xs text-slate-400 mr-2">{r.course_code}</span>
                  <span className="text-sm font-medium text-slate-700">{r.description}</span>
                  <span className="ml-2"><TermBadge termCode={r.term_code} /></span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge type="M" />
                  <button onClick={() => navigate('/electives')}
                    className="text-xs text-[#CC0000] hover:underline flex items-center gap-1">
                    Register <ArrowRight size={10} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-5">
        {/* Elective progress */}
        <div className="card p-5">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2">
            <BookOpen size={14} /> Elective Progress
          </h3>
          <div className="mb-3">
            <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Mandatory</p>
            {mandatory.map((c) => (
              <div key={c.course_code} className="flex items-center gap-2 py-1.5 border-b border-slate-50 last:border-0">
                {c.registered
                  ? <CheckCircle size={14} className="text-green-500 shrink-0" />
                  : <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 shrink-0" />}
                <span className="font-mono text-xs text-slate-400">{c.course_code}</span>
                <span className={`text-sm ${c.registered ? 'text-slate-600' : 'text-slate-400'}`}>
                  {c.description}
                </span>
                <TermBadge termCode={c.term_code} />
              </div>
            ))}
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Recommended</p>
            {recommended.map((c) => (
              <div key={c.course_code} className="flex items-center gap-2 py-1.5 border-b border-slate-50 last:border-0">
                {c.registered
                  ? <CheckCircle size={14} className="text-green-400 shrink-0" />
                  : <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-200 shrink-0" />}
                <span className="font-mono text-xs text-slate-300">{c.course_code}</span>
                <span className={`text-sm ${c.registered ? 'text-slate-500' : 'text-slate-300'}`}>
                  {c.description}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Competency progress */}
        <div className="card p-5">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Brain size={14} /> Competency Progress
          </h3>
          <div className="space-y-2">
            {competencies?.map((c) => {
              const pct = Math.round((Number(c.rating) / 5) * 100);
              return (
                <div key={c.competency_code}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs text-slate-600 truncate mr-2">{c.description}</span>
                    <span className={`text-xs font-semibold shrink-0 ${c.is_confirmed ? 'text-green-600' : 'text-slate-400'}`}>
                      {c.rating > 0 ? DREYFUS[Math.round(c.rating)] : '—'}
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all
                      ${c.is_confirmed ? 'bg-green-500' : 'bg-[#CC0000]/60'}`}
                      style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* TTF progress */}
        <div className="card p-5 md:col-span-2">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Wrench size={14} /> TTF Progress
          </h3>
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2">
            {ttfs?.map((t) => {
              const pct = Math.round((Number(t.rating) / 5) * 100);
              return (
                <div key={t.ttf_code}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs text-slate-600 truncate mr-2">{t.description}</span>
                    <span className={`text-xs font-semibold shrink-0 ${t.is_confirmed ? 'text-green-600' : 'text-slate-400'}`}>
                      {t.rating > 0 ? DREYFUS[Math.round(t.rating)] : '—'}
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all
                      ${t.is_confirmed ? 'bg-green-500' : 'bg-[#CC0000]/60'}`}
                      style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
