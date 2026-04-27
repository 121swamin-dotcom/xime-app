import { Star, TrendingUp, Users } from 'lucide-react';
import PageHeader from '../components/shared/PageHeader.jsx';
import ReadinessRing from '../components/shared/ReadinessRing.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { analyticsService } from '../services/analytics.service.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function PeerBenchmarkingPage() {
  const { user } = useAuth();
  const { data, loading, error } = useFetch(analyticsService.getPeerBenchmark);

  if (loading) return <div className="p-6 text-slate-400 animate-pulse">Computing benchmarks…</div>;
  if (error)   return <div className="p-6 text-red-500">{error}</div>;

  if (!data?.my_scores) return (
    <div className="p-6 max-w-4xl mx-auto">
      <PageHeader title="Peer Benchmarking" />
      <div className="card p-8 text-center text-slate-400">
        <Users size={40} className="mx-auto mb-3 text-slate-200" />
        <p className="font-medium">Set your role targets to see peer comparisons.</p>
      </div>
    </div>
  );

  const { peer_count, my_scores, peer_avg, my_rank, total_ranked, primary_category } = data;

  const ScoreBar = ({ label, mine, avg, color }) => (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-slate-600">{label}</span>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-400">Peer avg: <strong>{avg}%</strong></span>
          <span style={{ color }} className="font-bold">You: {mine}%</span>
        </div>
      </div>
      {/* My bar */}
      <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden mb-1">
        <div className="h-full rounded-full transition-all"
          style={{ width: `${mine}%`, backgroundColor: color, opacity: 0.9 }} />
        {/* Peer avg marker */}
        <div className="absolute top-0 bottom-0 w-0.5 bg-slate-400"
          style={{ left: `${avg}%` }} />
      </div>
      <div className="flex justify-between text-[10px] text-slate-400">
        <span>0%</span>
        <span className="text-slate-500" style={{ marginLeft: `${avg}%`, transform: 'translateX(-50%)' }}>
          Peer avg
        </span>
        <span>100%</span>
      </div>
    </div>
  );

  const rankColor = my_rank <= Math.ceil(total_ranked * 0.33)
    ? '#16a34a' : my_rank <= Math.ceil(total_ranked * 0.66)
    ? '#d97706' : '#CC0000';

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <PageHeader
        title="Peer Benchmarking"
        subtitle={`Compared against ${peer_count} peers targeting the same role category`}
      />

      {/* Rank card */}
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div className="card p-5 text-center">
          <p className="text-4xl font-bold" style={{ color: rankColor }}>#{my_rank}</p>
          <p className="text-sm text-slate-500 mt-1">Your Rank</p>
          <p className="text-xs text-slate-400">out of {total_ranked} students</p>
        </div>
        <div className="card p-5 text-center">
          <p className="text-4xl font-bold text-[#CC0000]">{my_scores.overall}%</p>
          <p className="text-sm text-slate-500 mt-1">Your Overall</p>
          <p className="text-xs text-slate-400">Peer avg: {peer_avg.overall}%</p>
        </div>
        <div className="card p-5 text-center">
          <p className="text-4xl font-bold text-slate-700">{peer_count}</p>
          <p className="text-sm text-slate-500 mt-1">Peers</p>
          <p className="text-xs text-slate-400">Same role target</p>
        </div>
      </div>

      {/* Score comparison */}
      <div className="card p-6 mb-6">
        <h3 className="text-sm font-semibold text-slate-600 mb-5 flex items-center gap-2">
          <TrendingUp size={16} className="text-[#CC0000]" /> Score Comparison
        </h3>
        <ScoreBar label="Overall Readiness"  mine={my_scores.overall}    avg={peer_avg.overall}    color="#CC0000" />
        <ScoreBar label="Competency Score"   mine={my_scores.competency} avg={peer_avg.competency} color="#d97706" />
        <ScoreBar label="TTF Score"          mine={my_scores.ttf}        avg={peer_avg.ttf}        color="#7c3aed" />
        <p className="text-xs text-slate-400 mt-4 text-center">
          Vertical line shows peer average. Your score is shown as the coloured bar.
        </p>
      </div>

      {/* Readiness rings comparison */}
      <div className="card p-6">
        <h3 className="text-sm font-semibold text-slate-600 mb-5">Visual Comparison</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-center text-sm font-semibold text-[#CC0000] mb-4">You — {user?.name?.split(' ')[0]}</p>
            <div className="flex justify-around">
              <ReadinessRing pct={my_scores.overall}    label="Overall"      size={90} />
              <ReadinessRing pct={my_scores.competency} label="Competencies"  size={72} />
              <ReadinessRing pct={my_scores.ttf}        label="TTFs"          size={72} />
            </div>
          </div>
          <div>
            <p className="text-center text-sm font-semibold text-slate-500 mb-4">Peer Average</p>
            <div className="flex justify-around">
              <ReadinessRing pct={peer_avg.overall}    label="Overall"      size={90} />
              <ReadinessRing pct={peer_avg.competency} label="Competencies"  size={72} />
              <ReadinessRing pct={peer_avg.ttf}        label="TTFs"          size={72} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
