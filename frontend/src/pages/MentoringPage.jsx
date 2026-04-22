import { useState } from 'react';
import { Users, PlusCircle, BookOpen } from 'lucide-react';
import PageHeader from '../components/shared/PageHeader.jsx';
import { Alert, Spinner } from '../components/shared/FormComponents.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { mentoringService } from '../services/admin.service.js';

export default function MentoringPage() {
  const { data, loading, error } = useFetch(mentoringService.getMy);
  const [showLog, setShowLog] = useState(false);

  if (loading) return <div className="p-6 text-slate-400">Loading…</div>;
  if (error)   return <div className="p-6 text-red-500">{error}</div>;

  const { request, assignment, sessions } = data;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <PageHeader title="Mentoring" subtitle="Industry mentor assigned by Prof Swaminathan." />

      {/* No assignment yet */}
      {!assignment && (
        <div className="grid md:grid-cols-2 gap-6">
          <RequestForm existing={request} />
          {request && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Request Status</h3>
              <p className="text-sm text-slate-500">
                Your request is <span className="font-medium text-amber-600">{request.status}</span>.
                The professor will assign a mentor from the industry roster.
              </p>
              <div className="mt-3 p-3 bg-slate-50 rounded-lg text-xs text-slate-500 leading-relaxed">
                <strong>Your goals:</strong> {request.goals}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Active assignment */}
      {assignment && (
        <div className="space-y-5">
          {/* Mentor card */}
          <div className="card p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
                <Users size={22} className="text-brand-500" />
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase font-semibold mb-0.5">Your Mentor</p>
                <h2 className="text-lg font-semibold text-slate-800">{assignment.name}</h2>
                <p className="text-sm text-slate-500">{assignment.designation} · {assignment.company}</p>
                <p className="text-xs text-slate-400 mt-1">
                  Assigned {new Date(assignment.assigned_at).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Sessions */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <BookOpen size={16} /> Session Log ({sessions.length})
              </h3>
              <button onClick={() => setShowLog((v) => !v)}
                className="btn-primary text-sm flex items-center gap-1.5 px-3 py-1.5">
                <PlusCircle size={14} /> Log Session
              </button>
            </div>

            {showLog && <LogSessionForm onDone={() => { setShowLog(false); window.location.reload(); }} />}

            {sessions.length === 0
              ? <p className="text-sm text-slate-400 text-center py-4">No sessions logged yet.</p>
              : (
                <div className="space-y-2 mt-3">
                  {sessions.map((s) => (
                    <div key={s.id} className="bg-slate-50 border border-slate-100 rounded-lg p-4 text-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-slate-700">
                          {new Date(s.session_date).toLocaleDateString('en-IN', {
                            weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
                          })}
                        </span>
                        {s.duration_mins && (
                          <span className="text-xs text-slate-400">{s.duration_mins} mins</span>
                        )}
                      </div>
                      <p className="text-slate-600"><strong>Topics:</strong> {s.topics_covered}</p>
                      {s.outcomes && (
                        <p className="text-slate-500 mt-1"><strong>Outcomes:</strong> {s.outcomes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )
            }
          </div>
        </div>
      )}
    </div>
  );
}

function RequestForm({ existing }) {
  const [goals, setGoals]     = useState(existing?.goals || '');
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!goals.trim()) return setError('Please describe your goals.');
    setSaving(true);
    try {
      await mentoringService.request({ goals });
      setSuccess('Request submitted. The professor will assign your mentor.');
    } catch (err) {
      setError(err.response?.data?.error || 'Submission failed.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
        <Users size={16} /> Request a Mentor
      </h3>
      <Alert type="error"   message={error} />
      <Alert type="success" message={success} />
      <form onSubmit={handleSubmit}>
        <label className="label">What do you hope to gain from mentoring?
          <span className="text-slate-400 font-normal"> (max 300 chars)</span>
        </label>
        <textarea value={goals} onChange={(e) => setGoals(e.target.value)}
          maxLength={300} rows={4} className="input-field resize-none mb-4"
          placeholder="e.g. Guidance on transitioning into data analytics roles, understanding industry expectations…" />
        <p className="text-xs text-slate-400 mb-3">{goals.length}/300</p>
        <button type="submit" disabled={saving}
          className="btn-primary w-full flex items-center justify-center gap-2">
          {saving ? <Spinner /> : <Users size={16} />}
          {existing ? 'Update Request' : 'Submit Request'}
        </button>
      </form>
    </div>
  );
}

function LogSessionForm({ onDone }) {
  const [form, setForm]     = useState({ session_date: '', duration_mins: '', topics_covered: '', outcomes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.session_date || !form.topics_covered) {
      return setError('Date and topics are required.');
    }
    setSaving(true);
    try {
      await mentoringService.logSession(form);
      onDone();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to log session.');
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4 space-y-3">
      <Alert type="error" message={error} />
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label">Session Date</label>
          <input type="date" value={form.session_date}
            max={new Date().toISOString().split('T')[0]}
            onChange={(e) => setForm((f) => ({ ...f, session_date: e.target.value }))}
            className="input-field" />
        </div>
        <div>
          <label className="label">Duration (mins)</label>
          <input type="number" value={form.duration_mins}
            onChange={(e) => setForm((f) => ({ ...f, duration_mins: e.target.value }))}
            placeholder="e.g. 60" className="input-field" />
        </div>
      </div>
      <div>
        <label className="label">Topics Covered</label>
        <textarea value={form.topics_covered}
          onChange={(e) => setForm((f) => ({ ...f, topics_covered: e.target.value }))}
          rows={2} className="input-field resize-none"
          placeholder="What did you discuss?" />
      </div>
      <div>
        <label className="label">Outcomes / Takeaways</label>
        <textarea value={form.outcomes}
          onChange={(e) => setForm((f) => ({ ...f, outcomes: e.target.value }))}
          rows={2} className="input-field resize-none"
          placeholder="What did you learn or decide to do?" />
      </div>
      <button type="submit" disabled={saving}
        className="btn-primary flex items-center gap-2">
        {saving ? <Spinner /> : <PlusCircle size={14} />} Save Session
      </button>
    </form>
  );
}
