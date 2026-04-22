import { useState } from 'react';
import { Brain, Wrench, FileCheck, Star, ExternalLink } from 'lucide-react';
import PageHeader from '../components/shared/PageHeader.jsx';
import { Alert, Spinner } from '../components/shared/FormComponents.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { competenciesService } from '../services/admin.service.js';

const DREYFUS = ['','Novice','Advanced Beginner','Competent','Proficient','Expert'];
const EVIDENCE_TYPES = ['Certification','Live Project','Mock Project','Internship'];

export default function CompetenciesPage() {
  const [tab, setTab] = useState('competencies');
  const { data, loading, error, } = useFetch(competenciesService.getMyCompetencies);
  const { data: evidence } = useFetch(competenciesService.getEvidence);

  if (loading) return <div className="p-6 text-slate-400 animate-pulse">Loading…</div>;
  if (error)   return <div className="p-6 text-red-500">{error}</div>;
  if (!data?.target) return (
    <div className="p-6">
      <p className="text-slate-500">Set your role targets first to see competencies.</p>
    </div>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader title="Competencies & Evidence"
        subtitle="Rate yourself on each competency and TTF. Submit evidence to get professor-confirmed ratings." />

      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit mb-6">
        {[['competencies','Competencies'],['ttfs','TTFs'],['evidence','Evidence']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors
              ${tab === id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'competencies' && (
        <RatingList items={data.competencies} type="COMPETENCY" target={data.target} />
      )}
      {tab === 'ttfs' && (
        <RatingList items={data.ttfs} type="TTF" target={data.target} />
      )}
      {tab === 'evidence' && (
        <EvidenceTab evidence={evidence} competencies={data.competencies} ttfs={data.ttfs} />
      )}
    </div>
  );
}

// ── Rating list ───────────────────────────────────────────────────────────────
function RatingList({ items, type, target }) {
  const [saving, setSaving] = useState({});
  const [ratings, setRatings] = useState({});

  async function handleRate(code, rating) {
    setSaving((s) => ({ ...s, [code]: true }));
    try {
      if (type === 'COMPETENCY') {
        await competenciesService.rateCompetency({ competency_code: code, self_rating: rating });
      } else {
        await competenciesService.rateTTF({ ttf_code: code, self_rating: rating });
      }
      setRatings((r) => ({ ...r, [code]: rating }));
    } catch {
      // silent
    } finally {
      setSaving((s) => ({ ...s, [code]: false }));
    }
  }

  // Group by category
  const groups = items.reduce((acc, item) => {
    const key = item.category_description || 'Baseline (T3 Core)';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(groups).map(([group, groupItems]) => (
        <div key={group}>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">{group}</h3>
          <div className="space-y-2">
            {groupItems.map((item) => {
              const code = type === 'COMPETENCY' ? item.competency_code : item.ttf_code;
              const current = ratings[code] || item.self_rating || 0;
              const confirmed = item.confirmed_rating;
              return (
                <div key={code} className="card p-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-slate-400">{code}</span>
                        {confirmed && (
                          <span className="text-xs text-green-600 font-medium bg-green-50
                                         border border-green-200 px-2 py-0.5 rounded-full">
                            Confirmed: {DREYFUS[confirmed]}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-700 font-medium mt-0.5">{item.description}</p>
                      {current > 0 && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          Self-rated: {DREYFUS[current]}
                        </p>
                      )}
                    </div>
                    {/* Star rating */}
                    <div className="flex items-center gap-1 shrink-0">
                      {[1,2,3,4,5].map((star) => (
                        <button key={star}
                          onClick={() => handleRate(code, star)}
                          disabled={saving[code]}
                          className="transition-transform hover:scale-110">
                          <Star size={20}
                            className={star <= current
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-200 fill-slate-200'}
                          />
                        </button>
                      ))}
                      {saving[code] && <Spinner />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Evidence tab ──────────────────────────────────────────────────────────────
function EvidenceTab({ evidence, competencies, ttfs }) {
  const [form, setForm] = useState({
    target_type: 'COMPETENCY', competency_code: '', ttf_code: '',
    evidence_type: '', description: '', evidence_link: '', self_rating: 3,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState('');

  const STATUS_COLORS = {
    PENDING:  'text-amber-600 bg-amber-50 border-amber-200',
    APPROVED: 'text-green-600 bg-green-50 border-green-200',
    REJECTED: 'text-red-600 bg-red-50 border-red-200',
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.evidence_type || !form.description || !form.evidence_link) {
      return setError('All fields are required.');
    }
    if (form.target_type === 'COMPETENCY' && !form.competency_code) {
      return setError('Select a competency.');
    }
    if (form.target_type === 'TTF' && !form.ttf_code) {
      return setError('Select a TTF.');
    }
    setSaving(true);
    try {
      await competenciesService.submitEvidence(form);
      setSuccess('Evidence submitted. Professor will review it.');
      setForm({ target_type: 'COMPETENCY', competency_code: '', ttf_code: '',
        evidence_type: '', description: '', evidence_link: '', self_rating: 3 });
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Submission failed.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Submit form */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <FileCheck size={16} /> Submit Evidence
        </h3>
        <Alert type="error"   message={error} />
        <Alert type="success" message={success} />
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="label">Target Type</label>
            <select value={form.target_type}
              onChange={(e) => setForm((f) => ({ ...f, target_type: e.target.value, competency_code: '', ttf_code: '' }))}
              className="input-field">
              <option value="COMPETENCY">Competency</option>
              <option value="TTF">TTF</option>
            </select>
          </div>
          {form.target_type === 'COMPETENCY' ? (
            <div>
              <label className="label">Competency</label>
              <select value={form.competency_code}
                onChange={(e) => setForm((f) => ({ ...f, competency_code: e.target.value }))}
                className="input-field">
                <option value="">Select…</option>
                {competencies?.map((c) => (
                  <option key={c.competency_code} value={c.competency_code}>
                    {c.competency_code} — {c.description}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="label">TTF</label>
              <select value={form.ttf_code}
                onChange={(e) => setForm((f) => ({ ...f, ttf_code: e.target.value }))}
                className="input-field">
                <option value="">Select…</option>
                {ttfs?.map((t) => (
                  <option key={t.ttf_code} value={t.ttf_code}>
                    {t.ttf_code} — {t.description}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="label">Evidence Type</label>
            <select value={form.evidence_type}
              onChange={(e) => setForm((f) => ({ ...f, evidence_type: e.target.value }))}
              className="input-field">
              <option value="">Select…</option>
              {EVIDENCE_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Description <span className="text-slate-400">(max 500 chars)</span></label>
            <textarea value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              maxLength={500} rows={3} className="input-field resize-none"
              placeholder="Describe what you did and what you learned…" />
          </div>
          <div>
            <label className="label">Evidence Link</label>
            <input value={form.evidence_link}
              onChange={(e) => setForm((f) => ({ ...f, evidence_link: e.target.value }))}
              type="url" className="input-field"
              placeholder="https://drive.google.com/…" />
            <p className="text-xs text-slate-400 mt-1">
              Ensure you have shared with swaminathann@xime.org
            </p>
          </div>
          <div>
            <label className="label">Self Rating</label>
            <div className="flex items-center gap-2">
              {[1,2,3,4,5].map((s) => (
                <button type="button" key={s}
                  onClick={() => setForm((f) => ({ ...f, self_rating: s }))}>
                  <Star size={22}
                    className={s <= form.self_rating
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-slate-200 fill-slate-200'} />
                </button>
              ))}
              <span className="text-xs text-slate-400 ml-1">{DREYFUS[form.self_rating]}</span>
            </div>
          </div>
          <button type="submit" disabled={saving}
            className="btn-primary flex items-center gap-2 w-full justify-center">
            {saving ? <Spinner /> : <FileCheck size={16} />} Submit Evidence
          </button>
        </form>
      </div>

      {/* History */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Submission History</h3>
        {!evidence?.length
          ? <p className="text-sm text-slate-400">No evidence submitted yet.</p>
          : (
            <div className="space-y-2">
              {evidence.map((ev) => (
                <div key={ev.id} className="card p-4 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-700">
                        {ev.competency_description || ev.ttf_description}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">{ev.evidence_type} · Self: {ev.self_rating}/5
                        {ev.confirmed_rating && ` · Confirmed: ${ev.confirmed_rating}/5`}
                      </p>
                      {ev.professor_comment && (
                        <p className="text-xs text-slate-500 mt-1 italic">"{ev.professor_comment}"</p>
                      )}
                      <a href={ev.evidence_link} target="_blank" rel="noreferrer"
                        className="text-xs text-brand-500 hover:underline mt-1 flex items-center gap-1">
                        <ExternalLink size={10} /> View evidence
                      </a>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border shrink-0
                      ${STATUS_COLORS[ev.status]}`}>
                      {ev.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )
        }
      </div>
    </div>
  );
}
