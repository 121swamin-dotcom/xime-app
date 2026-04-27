import { useNavigate } from 'react-router-dom';
import { TrendingUp, BookOpen, Brain, Wrench, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import PageHeader from '../components/shared/PageHeader.jsx';
import { ScoreCard } from '../components/shared/ScoreCard.jsx';
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
        <button onClick={() => navigate('/electives')} className="mt-4 btn-primary text-sm px-6">
          Go to Electives
        </button>
      </div>
    </div>
  );

  const { target, courses, competencies, ttfs, recommendations } = data;
  const mandatory     = courses?.filter((c) => c.type === 'M') || [];
  const recommended   = courses?.filter((c) => c.type === 'R') || [];
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

      {/* Score Cards row */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <ScoreCard label="Overall Readiness"  pct={overall}       size="large" />
        <ScoreCard label="Competencies"        pct={avgComp} />
        <ScoreCard label="TTFs"                pct={avgTTF} />
        <ScoreCard label="Mandatory Courses"   pct={mandatoryPct} sublabel={`${mandatoryDone} of ${mandatory.length} done`} />
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
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-slate-400">{r.course_code}</span>
                  <span className="text-sm font-medium text-slate-700">{r.description}</span>
                  <TermBadge termCode={r.term_code} />
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
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4 flex items-center gap-2">
            <BookOpen size={14} className="text-[#CC0000]" /> Elective Progress
          </h3>
          <p className="text-[10px] font-semibold text-slate-400 uppercase mb-2">Mandatory</p>
          {mandatory.map((c) => (
            <div key={c.course_code} className="flex items-center gap-2 py-1.5 border-b border-slate-50 last:border-0">
              {c.registered
                ? <CheckCircle size={15} className="text-green-500 shrink-0" />
                : <div className="w-4 h-4 rounded-full border-2 border-slate-300 shrink-0" />}
              <span className="font-mono text-xs text-slate-400">{c.course_code}</span>
              <span className={`text-sm flex-1 ${c.registered ? 'text-slate-600' : 'text-slate-400'}`}>
                {c.description}
              </span>
              <TermBadge termCode={c.term_code} />
            </div>
          ))}
          {recommended.length > 0 && (
            <>
              <p className="text-[10px] font-semibold text-slate-300 uppercase mt-3 mb-2">Recommended</p>
              {recommended.map((c) => (
                <div key={c.course_code} className="flex items-center gap-2 py-1.5 border-b border-slate-50 last:border-0">
                  {c.registered
                    ? <CheckCircle size={15} className="text-green-400 shrink-0" />
                    : <div className="w-4 h-4 rounded-full border-2 border-slate-200 shrink-0" />}
                  <span className="font-mono text-xs text-slate-300">{c.course_code}</span>
                  <span className={`text-sm flex-1 ${c.registered ? 'text-slate-500' : 'text-slate-300'}`}>
                    {c.description}
                  </span>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Competency progress */}
        <div className="card p-5">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4 flex items-center gap-2">
            <Brain size={14} className="text-[#CC0000]" /> Competency Progress
          </h3>
          <div className="space-y-3">
            {competencies?.map((c) => {
              const pct = Math.round((Number(c.rating) / 5) * 100);
              const color = pct >= 60 ? '#16a34a' : pct >= 40 ? '#d97706' : '#CC0000';
              return (
                <div key={c.competency_code}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-600 truncate mr-2 flex-1">{c.description}</span>
                    <span className="text-xs font-semibold shrink-0" style={{ color }}>
                      {c.rating > 0 ? DREYFUS[Math.round(c.rating)] : '—'}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* TTF progress */}
        <div className="card p-5 md:col-span-2">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4 flex items-center gap-2">
            <Wrench size={14} className="text-[#CC0000]" /> TTF Progress
          </h3>
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-3">
            {ttfs?.map((t) => {
              const pct = Math.round((Number(t.rating) / 5) * 100);
              const color = pct >= 60 ? '#16a34a' : pct >= 40 ? '#d97706' : '#CC0000';
              return (
                <div key={t.ttf_code}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-600 truncate mr-2 flex-1">{t.description}</span>
                    <span className="text-xs font-semibold shrink-0" style={{ color }}>
                      {t.rating > 0 ? DREYFUS[Math.round(t.rating)] : '—'}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: color }} />
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
