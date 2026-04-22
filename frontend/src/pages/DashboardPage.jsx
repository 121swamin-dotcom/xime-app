import { useNavigate } from 'react-router-dom';
import {
  BarChart2, Calendar, Users, ChevronRight, AlertCircle, Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { electivesService } from '../services/electives.service.js';
import ReadinessRing from '../components/shared/ReadinessRing.jsx';
import { TermBadge } from '../components/shared/Badge.jsx';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, loading, error } = useFetch(electivesService.getDashboard);

  if (loading) return <LoadingState />;
  if (error)   return <div className="p-6 text-red-500">{error}</div>;

  const { target, electives, readiness, evidence, pending_counselling, mentor } = data;

  const byTerm = [4, 5, 6].reduce((acc, t) => {
    acc[t] = electives?.filter((e) => e.term_code === t) || [];
    return acc;
  }, {});

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-800">
          Welcome back, {user?.name.split(' ')[0]} 👋
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">
          {user?.roll_number} · {user?.section}
        </p>
      </div>

      {/* No target — prompt */}
      {!target && (
        <div className="card p-5 mb-5 border-amber-200 bg-amber-50 flex items-start gap-3">
          <AlertCircle size={20} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800">Set your role targets to get started</p>
            <p className="text-sm text-amber-600 mt-0.5">
              Your readiness score and elective badges are driven by your targets.
            </p>
            <button onClick={() => navigate('/electives')}
              className="mt-3 btn-primary text-sm px-4 py-1.5">
              Set Targets and Register Electives
            </button>
          </div>
        </div>
      )}

      {/* Targets + Readiness */}
      {target && (
        <div className="grid md:grid-cols-2 gap-5 mb-5">
          <div className="card p-5">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
              Role Targets
            </h2>
            <div className="space-y-2">
              <button onClick={() => navigate(`/roles/${target.primary_category}`)}
                className="flex items-center justify-between w-full group">
                <div className="text-left">
                  <span className="text-xs font-medium text-brand-500">PRIMARY</span>
                  <p className="font-semibold text-slate-800 text-sm mt-0.5">
                    {target.primary_description}
                  </p>
                </div>
                <ChevronRight size={14} className="text-slate-300 group-hover:text-brand-500 transition-colors" />
              </button>
              {target.secondary_category && (
                <button onClick={() => navigate(`/roles/${target.secondary_category}`)}
                  className="flex items-center justify-between w-full group pt-2 border-t border-slate-100">
                  <div className="text-left">
                    <span className="text-xs font-medium text-slate-400">SECONDARY</span>
                    <p className="font-medium text-slate-600 text-sm mt-0.5">
                      {target.secondary_description}
                    </p>
                  </div>
                  <ChevronRight size={14} className="text-slate-300 group-hover:text-brand-500 transition-colors" />
                </button>
              )}
            </div>
            <button onClick={() => navigate('/electives')}
              className="mt-4 text-xs text-brand-500 hover:underline">
              Change targets
            </button>
          </div>

          <div className="card p-5">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">
              Readiness — {target.primary_description}
            </h2>
            <div className="flex items-center justify-around">
              <ReadinessRing pct={readiness.overall}    label="Overall"      size={100} />
              <ReadinessRing pct={readiness.competency} label="Competencies"  size={80} />
              <ReadinessRing pct={readiness.ttf}        label="TTFs"          size={80} />
            </div>
            <p className="text-xs text-slate-400 text-center mt-3">
              Overall = Competency 60% + TTF 40%
            </p>
            <button onClick={() => navigate('/competencies')}
              className="mt-2 text-xs text-brand-500 hover:underline block text-center">
              Update ratings
            </button>
          </div>
        </div>
      )}

      {/* Electives */}
      <div className="card p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            My Electives
          </h2>
          <button onClick={() => navigate('/electives')}
            className="text-xs text-brand-500 hover:underline">
            {electives?.length ? 'Manage' : 'Register'}
          </button>
        </div>
        {electives?.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">No electives registered yet.</p>
        ) : (
          <div className="grid sm:grid-cols-3 gap-4">
            {[4, 5, 6].map((term) => (
              <div key={term}>
                <div className="flex items-center gap-2 mb-2">
                  <TermBadge termCode={term} />
                  <span className="text-xs text-slate-400">{byTerm[term].length}/4</span>
                </div>
                <div className="space-y-1.5">
                  {byTerm[term].length === 0
                    ? <p className="text-xs text-slate-300 italic">None</p>
                    : byTerm[term].map((e) => (
                        <div key={e.course_code}
                          className="text-xs bg-slate-50 border border-slate-100 rounded-md
                                     px-2.5 py-1.5 text-slate-600">
                          <span className="font-mono text-slate-400 mr-1">{e.course_code}</span>
                          {e.description}
                        </div>
                      ))
                  }
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<BarChart2 size={18} />} label="Evidence Submitted"
          value={evidence.approved + evidence.pending + evidence.rejected}
          sub={`${evidence.approved} approved`} color="brand"
          onClick={() => navigate('/competencies')} />
        <StatCard icon={<Clock size={18} />} label="Evidence Pending"
          value={evidence.pending} sub="Awaiting review" color="amber"
          onClick={() => navigate('/competencies')} />
        <StatCard icon={<Calendar size={18} />} label="Counselling"
          value={pending_counselling} sub="Pending sessions" color="violet"
          onClick={() => navigate('/counselling')} />
        <StatCard icon={<Users size={18} />} label="Mentor"
          value={mentor ? mentor.name.split(' ')[0] : 'None'}
          sub={mentor ? `${mentor.session_count} sessions` : 'Not assigned'} color="emerald"
          onClick={() => navigate('/mentoring')} />
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, color, onClick }) {
  const colors = {
    brand:   'bg-brand-50 text-brand-500',
    amber:   'bg-amber-50 text-amber-500',
    violet:  'bg-violet-50 text-violet-500',
    emerald: 'bg-emerald-50 text-emerald-500',
  };
  return (
    <button onClick={onClick}
      className="card p-4 text-left hover:shadow-md hover:border-slate-300 transition-all duration-150">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${colors[color]}`}>
        {icon}
      </div>
      <p className="text-xl font-bold text-slate-800 leading-none">{value}</p>
      <p className="text-xs font-medium text-slate-500 mt-1">{label}</p>
      <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
    </button>
  );
}

function LoadingState() {
  return (
    <div className="p-6 max-w-5xl mx-auto animate-pulse">
      <div className="h-8 w-56 bg-slate-200 rounded mb-6" />
      <div className="grid md:grid-cols-2 gap-5 mb-5">
        <div className="card p-5 h-40" />
        <div className="card p-5 h-40" />
      </div>
      <div className="card p-5 h-32 mb-5" />
      <div className="grid sm:grid-cols-4 gap-4">
        {[1,2,3,4].map((i) => <div key={i} className="card p-4 h-28" />)}
      </div>
    </div>
  );
}
