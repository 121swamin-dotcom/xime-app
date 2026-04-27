import { TrendingUp, Users } from 'lucide-react';
import PageHeader from '../components/shared/PageHeader.jsx';
import { ScoreCard } from '../components/shared/ScoreCard.jsx';
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

  const { peer_count, my_scores, peer_avg, my_rank, total_ranked } = data;

  const rankColor = my_rank <= Math.ceil(total_ranked * 0.33)
    ? '#16a34a' : my_rank <= Math.ceil(total_ranked * 0.66)
    ? '#d97706' : '#CC0000';

  const ScoreBar = ({ label, mine, avg }) => {
    const mineColor = mine >= 70 ? '#16a34a' : mine >= 40 ? '#d97706' : '#CC0000';
    return (
      <div className="mb-5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-medium text-slate-600">{label}</span>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-slate-400">Peer avg: <strong className="text-slate-600">{avg}%</strong></span>
            <span className="font-bold" style={{ color: mineColor }}>You: {mine}%</span>
          </div>
        </div>
        {/* Your bar */}
        <div className="relative h-5 bg-slate-100 rounded-full overflow-hidden mb-1">
          <div className="h-full rounded-full transition-all"
            style={{ width: `${mine}%`, backgroundColor: mineColor, opacity: 0.85 }} />
          {/* Peer avg marker */}
          <div className="absolute top-0 bottom-0 w-0.5 bg-slate-500 z-10"
            style={{ left: `${avg}%` }} />
        </div>
        <div className="flex justify-between text-[10px] text-slate-400 px-1">
          <span>0%</span>
          <span>Peer avg at {avg}%</span>
          <span>100%</span>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <PageHeader
        title="Peer Benchmarking"
        subtitle={`Compared against ${peer_count} peers targeting the same role category`}
      />

      {/* Rank + summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-5 text-center">
          <p className="text-4xl font-extrabold leading-none" style={{ color: rankColor }}>
            #{my_rank}
          </p>
          <p className="text-sm text-slate-500 mt-2 font-medium">Your Rank</p>
          <p className="text-xs text-slate-400 mt-0.5">out of {total_ranked} students</p>
        </div>
        <div className="card p-5 text-center">
          <p className="text-4xl font-extrabold leading-none text-[#CC0000]">{my_scores.overall}%</p>
          <p className="text-sm text-slate-500 mt-2 font-medium">Your Overall</p>
          <p className="text-xs text-slate-400 mt-0.5">Peer avg: {peer_avg.overall}%</p>
        </div>
        <div className="card p-5 text-center">
          <p className="text-4xl font-extrabold leading-none text-slate-700">{peer_count}</p>
          <p className="text-sm text-slate-500 mt-2 font-medium">Peers</p>
          <p className="text-xs text-slate-400 mt-0.5">Same role target</p>
        </div>
      </div>

      {/* Score bars */}
      <div className="card p-6 mb-6">
        <h3 className="text-sm font-semibold text-slate-600 mb-5 flex items-center gap-2">
          <TrendingUp size={16} className="text-[#CC0000]" /> Score Comparison
          <span className="text-xs text-slate-400 font-normal ml-2">
            Vertical line = peer average
          </span>
        </h3>
        <ScoreBar label="Overall Readiness"  mine={my_scores.overall}    avg={peer_avg.overall} />
        <ScoreBar label="Competency Score"   mine={my_scores.competency} avg={peer_avg.competency} />
        <ScoreBar label="TTF Score"          mine={my_scores.ttf}        avg={peer_avg.ttf} />
      </div>

      {/* Your scores vs peer avg — ScoreCards */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm font-semibold text-[#CC0000] text-center mb-3">
            Your Scores — {user?.name?.split(' ')[0]}
          </p>
          <div className="grid grid-cols-3 gap-2">
            <ScoreCard label="Overall"      pct={my_scores.overall} />
            <ScoreCard label="Competency"   pct={my_scores.competency} />
            <ScoreCard label="TTFs"         pct={my_scores.ttf} />
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-500 text-center mb-3">Peer Average</p>
          <div className="grid grid-cols-3 gap-2">
            <ScoreCard label="Overall"      pct={peer_avg.overall} />
            <ScoreCard label="Competency"   pct={peer_avg.competency} />
            <ScoreCard label="TTFs"         pct={peer_avg.ttf} />
          </div>
        </div>
      </div>
    </div>
  );
}
