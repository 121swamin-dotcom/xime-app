import { ExternalLink, Award, Star, CheckCircle } from 'lucide-react';
import PageHeader from '../components/shared/PageHeader.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { analyticsService } from '../services/analytics.service.js';

const TYPE_COLORS = {
  'Certification':  'bg-blue-50 text-blue-700 border-blue-200',
  'Live Project':   'bg-green-50 text-green-700 border-green-200',
  'Mock Project':   'bg-violet-50 text-violet-700 border-violet-200',
  'Internship':     'bg-amber-50 text-amber-700 border-amber-200',
};

const DREYFUS = ['','Novice','Adv Beginner','Competent','Proficient','Expert'];

export default function EvidenceGalleryPage() {
  const { data, loading, error } = useFetch(analyticsService.getEvidenceGallery);

  if (loading) return <div className="p-6 text-slate-400 animate-pulse">Loading gallery…</div>;
  if (error)   return <div className="p-6 text-red-500">{error}</div>;

  const { evidence, summary } = data;

  if (!evidence?.length) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <PageHeader title="Evidence Gallery" subtitle="Your approved evidence portfolio." />
        <div className="card p-12 text-center text-slate-400">
          <Award size={48} className="mx-auto mb-4 text-slate-200" />
          <p className="font-medium">No approved evidence yet.</p>
          <p className="text-sm mt-1">Submit evidence in the Competencies page — once the professor approves it, it appears here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader
        title="Evidence Gallery"
        subtitle={`${summary.total} approved items — your professional portfolio`}
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Certifications',  count: summary.certifications, color: 'blue' },
          { label: 'Live Projects',   count: summary.live_projects,  color: 'green' },
          { label: 'Mock Projects',   count: summary.mock_projects,  color: 'violet' },
          { label: 'Internships',     count: summary.internships,    color: 'amber' },
        ].map(({ label, count, color }) => (
          <div key={label} className="card p-4 text-center">
            <p className={`text-2xl font-bold text-${color}-600`}>{count}</p>
            <p className="text-xs text-slate-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Evidence cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        {evidence.map((ev) => (
          <div key={ev.id} className="card p-5 hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="min-w-0">
                <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full border mb-2
                  ${TYPE_COLORS[ev.evidence_type] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                  {ev.evidence_type}
                </span>
                <p className="font-semibold text-slate-800 text-sm leading-snug">
                  {ev.competency_description || ev.ttf_description}
                </p>
                <p className="text-xs text-slate-400 mt-0.5 uppercase tracking-wide">
                  {ev.target_type}
                </p>
              </div>
              <div className="flex items-center gap-0.5 shrink-0">
                {[1,2,3,4,5].map((s) => (
                  <Star key={s} size={14}
                    className={s <= ev.confirmed_rating
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-slate-100 fill-slate-100'} />
                ))}
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-slate-600 leading-relaxed mb-3 line-clamp-3">
              {ev.description}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <div className="flex items-center gap-1.5 text-green-600 text-xs font-medium">
                <CheckCircle size={13} />
                Confirmed — {DREYFUS[ev.confirmed_rating]}
              </div>
              <a href={ev.evidence_link} target="_blank" rel="noreferrer"
                className="flex items-center gap-1 text-xs text-[#CC0000] hover:underline font-medium">
                <ExternalLink size={12} /> View Evidence
              </a>
            </div>

            {ev.professor_comment && (
              <div className="mt-3 bg-slate-50 rounded-lg px-3 py-2 text-xs text-slate-500 italic">
                Prof: "{ev.professor_comment}"
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
