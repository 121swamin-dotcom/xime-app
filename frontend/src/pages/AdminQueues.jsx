// AdminQueues.jsx — Activations, Evidence, Elective Changes, Counselling, Mentoring queues

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Star, Search } from 'lucide-react';
import PageHeader from '../components/shared/PageHeader.jsx';
import { Alert, Spinner } from '../components/shared/FormComponents.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { adminService, mentoringService, counsellingService } from '../services/admin.service.js';

// ── Activation Queue ──────────────────────────────────────────────────────────
export function AdminActivationsPage() {
  const { data, loading, error } = useFetch(adminService.getActivations);
  const [processing, setProcessing] = useState({});
  const [done, setDone] = useState({});

  async function handle(id, action) {
    setProcessing((p) => ({ ...p, [id]: true }));
    try {
      if (action === 'approve') await adminService.approveActivation(id);
      else                      await adminService.rejectActivation(id);
      setDone((d) => ({ ...d, [id]: action }));
    } catch { /* silent */ } finally {
      setProcessing((p) => ({ ...p, [id]: false }));
    }
  }

  if (loading) return <QueueLoading title="Activation Queue" />;
  if (error)   return <div className="p-6 text-red-500">{error}</div>;

  const pending = data?.filter((s) => !done[s.id]) || [];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <PageHeader title="Activation Queue" subtitle={`${pending.length} pending`} />
      {pending.length === 0 && <EmptyQueue />}
      <div className="space-y-3">
        {pending.map((s) => (
          <div key={s.id} className="card p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="font-semibold text-slate-800">{s.name}</p>
                <p className="text-sm text-slate-500 font-mono">{s.roll_number} · {s.section}</p>
                <p className="text-xs text-slate-400">{s.email}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handle(s.id, 'approve')} disabled={processing[s.id]}
                  className="flex items-center gap-1.5 bg-green-50 hover:bg-green-100 text-green-700
                             border border-green-200 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
                  {processing[s.id] ? <Spinner /> : <CheckCircle size={14} />} Approve
                </button>
                <button onClick={() => handle(s.id, 'reject')} disabled={processing[s.id]}
                  className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-700
                             border border-red-200 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
                  <XCircle size={14} /> Reject
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Evidence Queue ────────────────────────────────────────────────────────────
export function AdminEvidencePage() {
  const { data, loading } = useFetch(adminService.getEvidenceQueue);
  const [processing, setProcessing] = useState({});
  const [done, setDone]       = useState({});
  const [ratings, setRatings] = useState({});
  const [comments, setComments] = useState({});

  async function handleApprove(id) {
    if (!ratings[id]) return;
    setProcessing((p) => ({ ...p, [id]: true }));
    try {
      await adminService.approveEvidence(id, { confirmed_rating: ratings[id] });
      setDone((d) => ({ ...d, [id]: 'approved' }));
    } catch { /* silent */ } finally {
      setProcessing((p) => ({ ...p, [id]: false }));
    }
  }

  async function handleReject(id) {
    if (!comments[id]) return;
    setProcessing((p) => ({ ...p, [id]: true }));
    try {
      await adminService.rejectEvidence(id, { professor_comment: comments[id] });
      setDone((d) => ({ ...d, [id]: 'rejected' }));
    } catch { /* silent */ } finally {
      setProcessing((p) => ({ ...p, [id]: false }));
    }
  }

  if (loading) return <QueueLoading title="Evidence Queue" />;
  const pending = data?.filter((e) => !done[e.id]) || [];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <PageHeader title="Evidence Queue" subtitle={`${pending.length} pending review`} />
      {pending.length === 0 && <EmptyQueue />}
      <div className="space-y-4">
        {pending.map((ev) => (
          <div key={ev.id} className="card p-5">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <p className="font-semibold text-slate-800">{ev.student_name}
                  <span className="font-mono text-xs text-slate-400 ml-2">{ev.roll_number}</span>
                </p>
                <p className="text-sm text-slate-600 mt-0.5">
                  {ev.competency_description || ev.ttf_description}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {ev.evidence_type} · Self-rated: {ev.self_rating}/5
                </p>
                <p className="text-sm text-slate-500 mt-1">{ev.description}</p>
                <a href={ev.evidence_link} target="_blank" rel="noreferrer"
                  className="text-xs text-brand-500 hover:underline mt-1 block">
                  View evidence →
                </a>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100">
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Confirm Rating</p>
                <div className="flex items-center gap-1 mb-2">
                  {[1,2,3,4,5].map((s) => (
                    <button key={s} onClick={() => setRatings((r) => ({ ...r, [ev.id]: s }))}>
                      <Star size={18}
                        className={s <= (ratings[ev.id] || 0)
                          ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'} />
                    </button>
                  ))}
                </div>
                <button onClick={() => handleApprove(ev.id)}
                  disabled={!ratings[ev.id] || processing[ev.id]}
                  className="flex items-center gap-1.5 bg-green-50 hover:bg-green-100 text-green-700
                             border border-green-200 px-3 py-1.5 rounded-lg text-sm font-medium
                             transition-colors disabled:opacity-40">
                  {processing[ev.id] ? <Spinner /> : <CheckCircle size={14} />} Approve
                </button>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Reject with comment</p>
                <textarea value={comments[ev.id] || ''}
                  onChange={(e) => setComments((c) => ({ ...c, [ev.id]: e.target.value }))}
                  rows={2} className="input-field resize-none text-xs mb-2"
                  placeholder="Reason for rejection…" />
                <button onClick={() => handleReject(ev.id)}
                  disabled={!comments[ev.id] || processing[ev.id]}
                  className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-700
                             border border-red-200 px-3 py-1.5 rounded-lg text-sm font-medium
                             transition-colors disabled:opacity-40">
                  <XCircle size={14} /> Reject
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Elective Changes Queue ────────────────────────────────────────────────────
export function AdminElectiveChangesPage() {
  const { data, loading } = useFetch(adminService.getElectiveChanges);
  const [processing, setProcessing] = useState({});
  const [done, setDone]     = useState({});
  const [comments, setComments] = useState({});

  async function handle(id, action) {
    setProcessing((p) => ({ ...p, [id]: true }));
    try {
      if (action === 'approve') await adminService.approveElectiveChange(id, { professor_comment: comments[id] });
      else {
        if (!comments[id]) { setProcessing((p) => ({ ...p, [id]: false })); return; }
        await adminService.rejectElectiveChange(id, { professor_comment: comments[id] });
      }
      setDone((d) => ({ ...d, [id]: action }));
    } catch { /* silent */ } finally {
      setProcessing((p) => ({ ...p, [id]: false }));
    }
  }

  if (loading) return <QueueLoading title="Elective Change Requests" />;
  const pending = data?.filter((r) => !done[r.id]) || [];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <PageHeader title="Elective Change Requests" subtitle={`${pending.length} pending`} />
      {pending.length === 0 && <EmptyQueue />}
      <div className="space-y-4">
        {pending.map((r) => (
          <div key={r.id} className="card p-5">
            <p className="font-semibold text-slate-800">{r.student_name}
              <span className="font-mono text-xs text-slate-400 ml-2">{r.roll_number}</span>
            </p>
            <p className="text-sm text-slate-600 mt-1">
              Drop <span className="font-medium">{r.drop_course}</span> — {r.drop_course_name}
            </p>
            <p className="text-sm text-slate-600">
              Add <span className="font-medium">{r.add_course}</span> — {r.add_course_name}
            </p>
            <p className="text-xs text-slate-400 mt-1 italic">"{r.reason}"</p>
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-100">
              <textarea value={comments[r.id] || ''}
                onChange={(e) => setComments((c) => ({ ...c, [r.id]: e.target.value }))}
                rows={1} className="input-field resize-none text-xs flex-1"
                placeholder="Optional comment…" />
              <button onClick={() => handle(r.id, 'approve')} disabled={processing[r.id]}
                className="flex items-center gap-1 bg-green-50 text-green-700 border border-green-200
                           px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors">
                {processing[r.id] ? <Spinner /> : <CheckCircle size={14} />} Approve
              </button>
              <button onClick={() => handle(r.id, 'reject')} disabled={processing[r.id]}
                className="flex items-center gap-1 bg-red-50 text-red-700 border border-red-200
                           px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors">
                <XCircle size={14} /> Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Counselling Queue ─────────────────────────────────────────────────────────
export function AdminCounsellingPage() {
  const { data, loading } = useFetch(counsellingService.getAll);
  const [processing, setProcessing] = useState({});
  const [done, setDone]     = useState({});
  const [comments, setComments] = useState({});

  async function handle(id, action) {
    if (action === 'decline' && !comments[id]) return;
    setProcessing((p) => ({ ...p, [id]: true }));
    try {
      if (action === 'confirm') await counsellingService.confirm(id, { professor_comment: comments[id] });
      else                      await counsellingService.decline(id, { professor_comment: comments[id] });
      setDone((d) => ({ ...d, [id]: action }));
    } catch { /* silent */ } finally {
      setProcessing((p) => ({ ...p, [id]: false }));
    }
  }

  if (loading) return <QueueLoading title="Counselling Queue" />;
  const pending = data?.filter((r) => r.status === 'PENDING' && !done[r.id]) || [];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <PageHeader title="Counselling Queue" subtitle={`${pending.length} pending`} />
      {pending.length === 0 && <EmptyQueue />}
      <div className="space-y-4">
        {pending.map((r) => (
          <div key={r.id} className="card p-5">
            <p className="font-semibold text-slate-800">{r.student_name}
              <span className="font-mono text-xs text-slate-400 ml-2">{r.roll_number}</span>
            </p>
            <p className="text-sm text-slate-600 mt-1">
              {new Date(r.preferred_date).toLocaleDateString('en-IN', {
                weekday: 'long', day: 'numeric', month: 'long'
              })} at {r.preferred_time} IST
            </p>
            <p className="text-xs text-slate-400 mt-1 italic">"{r.agenda}"</p>
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-100">
              <textarea value={comments[r.id] || ''}
                onChange={(e) => setComments((c) => ({ ...c, [r.id]: e.target.value }))}
                rows={1} className="input-field resize-none text-xs flex-1"
                placeholder="Comment (required for decline)…" />
              <button onClick={() => handle(r.id, 'confirm')} disabled={processing[r.id]}
                className="flex items-center gap-1 bg-green-50 text-green-700 border border-green-200
                           px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors">
                {processing[r.id] ? <Spinner /> : <CheckCircle size={14} />} Confirm
              </button>
              <button onClick={() => handle(r.id, 'decline')} disabled={processing[r.id] || !comments[r.id]}
                className="flex items-center gap-1 bg-red-50 text-red-700 border border-red-200
                           px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors
                           disabled:opacity-40">
                <XCircle size={14} /> Decline
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Mentoring Queue ───────────────────────────────────────────────────────────
export function AdminMentoringPage() {
  const { data: requests, loading } = useFetch(mentoringService.getRequests);
  const { data: mentors }           = useFetch(mentoringService.getMentors);
  const { data: allPairs }          = useFetch(mentoringService.getAll);
  const [selected, setSelected]     = useState({});
  const [processing, setProcessing] = useState({});
  const [done, setDone]             = useState({});
  const [tab, setTab]               = useState('requests');

  async function handleAssign(requestId) {
    if (!selected[requestId]) return;
    setProcessing((p) => ({ ...p, [requestId]: true }));
    try {
      await mentoringService.assign({ request_id: requestId, mentor_id: selected[requestId] });
      setDone((d) => ({ ...d, [requestId]: true }));
    } catch { /* silent */ } finally {
      setProcessing((p) => ({ ...p, [requestId]: false }));
    }
  }

  if (loading) return <QueueLoading title="Mentoring" />;
  const pending = requests?.filter((r) => !done[r.id]) || [];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <PageHeader title="Mentoring" />
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit mb-6">
        {[['requests','Pending Requests'],['pairs','All Pairs']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors
              ${tab === id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'requests' && (
        <>
          {pending.length === 0 && <EmptyQueue />}
          <div className="space-y-4">
            {pending.map((r) => (
              <div key={r.id} className="card p-5">
                <p className="font-semibold text-slate-800">{r.student_name}
                  <span className="font-mono text-xs text-slate-400 ml-2">{r.roll_number} · {r.section}</span>
                </p>
                <p className="text-sm text-slate-500 mt-1 italic">"{r.goals}"</p>
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-100">
                  <select value={selected[r.id] || ''}
                    onChange={(e) => setSelected((s) => ({ ...s, [r.id]: e.target.value }))}
                    className="input-field flex-1">
                    <option value="">Select mentor…</option>
                    {mentors?.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} — {m.designation}, {m.company}
                      </option>
                    ))}
                  </select>
                  <button onClick={() => handleAssign(r.id)}
                    disabled={!selected[r.id] || processing[r.id]}
                    className="flex items-center gap-1 btn-primary text-sm px-4 disabled:opacity-40">
                    {processing[r.id] ? <Spinner /> : <CheckCircle size={14} />} Assign
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'pairs' && (
        <div className="space-y-2">
          {allPairs?.map((p) => (
            <div key={p.id} className="card p-4 text-sm">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-semibold text-slate-800">{p.student_name}
                    <span className="font-mono text-xs text-slate-400 ml-2">{p.roll_number}</span>
                  </p>
                  <p className="text-slate-500">Mentor: {p.mentor_name} · {p.designation}, {p.company}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-slate-700">{p.session_count} sessions</p>
                  {p.last_session && (
                    <p className="text-xs text-slate-400">
                      Last: {new Date(p.last_session).toLocaleDateString('en-IN')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Student Search ────────────────────────────────────────────────────────────
export function AdminStudentsPage() {
  const navigate = useNavigate();
  const [query, setQuery]   = useState('');
  const [search, setSearch] = useState('');
  const { data, loading }   = useFetch(() => adminService.getStudents(search), [search]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <PageHeader title="Student Search" subtitle="Search by name or roll number" />
      <div className="relative mb-6 max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={query} onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && setSearch(query)}
          placeholder="Name or roll number… (press Enter)"
          className="input-field pl-9" />
      </div>
      {loading && <div className="text-slate-400 text-sm">Searching…</div>}
      <div className="space-y-2">
        {data?.map((s) => (
          <button key={s.id} onClick={() => navigate(`/admin/students/${s.id}`)}
            className="card p-4 w-full text-left hover:border-brand-500 hover:shadow-sm transition-all group">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-slate-800">{s.name}
                  <span className="font-mono text-xs text-slate-400 ml-2">{s.roll_number}</span>
                  <span className="text-xs text-slate-400 ml-1">· {s.section}</span>
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {s.primary_description || 'No target set'} ·
                  {s.elective_count} electives · {s.approved_evidence} approved evidence
                </p>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full border
                ${s.status === 'ACTIVE' ? 'text-green-600 bg-green-50 border-green-200' :
                  'text-slate-400 bg-slate-50 border-slate-200'}`}>
                {s.status}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Student Profile ───────────────────────────────────────────────────────────
export function AdminStudentProfilePage() {
  const navigate = useNavigate();
  const id = window.location.pathname.split('/').pop();
  const { data, loading } = useFetch(() => adminService.getStudentProfile(id), [id]);

  if (loading) return <div className="p-6 text-slate-400">Loading…</div>;
  if (!data)   return <div className="p-6 text-red-500">Student not found</div>;

  const { student, targets, electives, evidence, counselling, mentoring } = data;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button onClick={() => navigate('/admin/students')}
        className="text-sm text-slate-500 hover:text-slate-700 mb-5 block">
        ← Back to Student Search
      </button>

      <div className="card p-5 mb-5">
        <h1 className="text-xl font-semibold text-slate-800">{student.name}</h1>
        <p className="text-sm text-slate-400 font-mono mt-0.5">{student.roll_number} · {student.section}</p>
        <p className="text-xs text-slate-400">{student.email}</p>
        {targets && (
          <div className="mt-3 pt-3 border-t border-slate-100 text-sm">
            <span className="text-brand-500 font-medium">Primary:</span> {targets.primary_description}
            {targets.secondary_description && (
              <> · <span className="text-slate-500 font-medium">Secondary:</span> {targets.secondary_description}</>
            )}
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <Section title={`Electives (${electives.length})`}>
          {electives.length === 0 ? <Empty /> : electives.map((e) => (
            <div key={e.course_code} className="text-sm text-slate-600 py-1 border-b border-slate-50 last:border-0">
              <span className="font-mono text-slate-400 mr-2">{e.course_code}</span>{e.description}
              <span className="text-xs text-slate-400 ml-1">T{e.term_code}</span>
            </div>
          ))}
        </Section>

        <Section title={`Evidence (${evidence.length})`}>
          {evidence.length === 0 ? <Empty /> : evidence.map((ev) => (
            <div key={ev.id} className="text-sm py-1 border-b border-slate-50 last:border-0">
              <div className="flex justify-between">
                <span className="text-slate-600">{ev.comp_desc || ev.ttf_desc}</span>
                <span className={`text-xs font-medium ${ev.status === 'APPROVED' ? 'text-green-600' :
                  ev.status === 'REJECTED' ? 'text-red-500' : 'text-amber-500'}`}>{ev.status}</span>
              </div>
            </div>
          ))}
        </Section>

        <Section title={`Counselling (${counselling.length})`}>
          {counselling.length === 0 ? <Empty /> : counselling.map((c) => (
            <div key={c.id} className="text-sm text-slate-600 py-1 border-b border-slate-50 last:border-0">
              {new Date(c.preferred_date).toLocaleDateString('en-IN')} {c.preferred_time}
              <span className={`ml-2 text-xs font-medium ${c.status === 'CONFIRMED' ? 'text-green-600' :
                c.status === 'DECLINED' ? 'text-red-500' : 'text-amber-500'}`}>{c.status}</span>
            </div>
          ))}
        </Section>

        <Section title="Mentoring">
          {!mentoring ? <Empty text="No mentor assigned" /> : (
            <div className="text-sm">
              <p className="font-medium text-slate-700">{mentoring.mentor_name}</p>
              <p className="text-slate-500">{mentoring.designation} · {mentoring.company}</p>
              <p className="text-xs text-slate-400 mt-1">
                {mentoring.sessions?.length || 0} sessions logged
              </p>
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div className="card p-5">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">{title}</h3>
      {children}
    </div>
  );
}
function EmptyQueue() {
  return <p className="text-slate-400 text-sm text-center py-8">All caught up — nothing pending.</p>;
}
function Empty({ text = 'None' }) {
  return <p className="text-xs text-slate-300 italic">{text}</p>;
}
function QueueLoading({ title }) {
  return (
    <div className="p-6 max-w-4xl mx-auto animate-pulse">
      <div className="h-7 w-48 bg-slate-200 rounded mb-6" />
      {[1,2,3].map((i) => <div key={i} className="card p-5 h-24 mb-3" />)}
    </div>
  );
}
