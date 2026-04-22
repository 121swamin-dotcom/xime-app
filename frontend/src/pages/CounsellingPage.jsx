import { useState } from 'react';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import PageHeader from '../components/shared/PageHeader.jsx';
import { Alert, Spinner } from '../components/shared/FormComponents.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { counsellingService } from '../services/admin.service.js';

const SLOTS = ['09:00','09:30','10:00','10:30','11:00','11:30',
               '12:00','12:30','13:00','13:30','14:00','14:30','15:00'];

const STATUS_ICON = {
  PENDING:   <AlertCircle size={14} className="text-amber-500" />,
  CONFIRMED: <CheckCircle size={14} className="text-green-500" />,
  DECLINED:  <XCircle    size={14} className="text-red-500"   />,
};

export default function CounsellingPage() {
  const { data: requests } = useFetch(counsellingService.getMy);
  const [form, setForm]   = useState({ preferred_date: '', preferred_time: '', agenda: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.preferred_date || !form.preferred_time || !form.agenda) {
      return setError('All fields are required.');
    }
    setSaving(true);
    try {
      await counsellingService.request(form);
      setSuccess('Request submitted. Prof Swaminathan will confirm via email.');
      setForm({ preferred_date: '', preferred_time: '', agenda: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Submission failed.');
    } finally {
      setSaving(false);
    }
  }

  // Min date = tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <PageHeader title="Counselling" subtitle="Book a 30-minute one-on-one slot with Prof Swaminathan N." />

      <div className="grid md:grid-cols-2 gap-6">
        {/* Request form */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Calendar size={16} /> Request a Slot
          </h3>
          <Alert type="error"   message={error} />
          <Alert type="success" message={success} />
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Preferred Date</label>
              <input type="date" min={minDate}
                value={form.preferred_date}
                onChange={(e) => setForm((f) => ({ ...f, preferred_date: e.target.value }))}
                className="input-field" />
              <p className="text-xs text-slate-400 mt-1">Weekdays only</p>
            </div>
            <div>
              <label className="label">Preferred Time (IST)</label>
              <select value={form.preferred_time}
                onChange={(e) => setForm((f) => ({ ...f, preferred_time: e.target.value }))}
                className="input-field">
                <option value="">Select a slot…</option>
                {SLOTS.map((s) => <option key={s} value={s}>{s} IST</option>)}
              </select>
            </div>
            <div>
              <label className="label">Agenda</label>
              <textarea value={form.agenda}
                onChange={(e) => setForm((f) => ({ ...f, agenda: e.target.value }))}
                rows={4} className="input-field resize-none"
                placeholder="What would you like to discuss?" />
            </div>
            <button type="submit" disabled={saving}
              className="btn-primary w-full flex items-center justify-center gap-2">
              {saving ? <Spinner /> : <Clock size={16} />} Submit Request
            </button>
          </form>
        </div>

        {/* My requests */}
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">My Requests</h3>
          {!requests?.length
            ? <p className="text-sm text-slate-400">No requests yet.</p>
            : (
              <div className="space-y-2">
                {requests.map((r) => (
                  <div key={r.id} className="card p-4 text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          {STATUS_ICON[r.status]}
                          <span className="font-medium text-slate-700">{r.status}</span>
                        </div>
                        <p className="text-slate-500">
                          {new Date(r.preferred_date).toLocaleDateString('en-IN', {
                            weekday: 'short', day: 'numeric', month: 'short'
                          })} at {r.preferred_time} IST
                        </p>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{r.agenda}</p>
                        {r.professor_comment && (
                          <p className="text-xs text-slate-500 mt-1 italic">
                            "{r.professor_comment}"
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          }
        </div>
      </div>
    </div>
  );
}
