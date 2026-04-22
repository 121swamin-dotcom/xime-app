import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, ArrowRight, RefreshCw } from 'lucide-react';
import PageHeader from '../components/shared/PageHeader.jsx';
import { Badge, TermBadge } from '../components/shared/Badge.jsx';
import { Alert, Spinner } from '../components/shared/FormComponents.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { electivesService } from '../services/electives.service.js';
import { rolesService } from '../services/catalogue.service.js';
import { coursesService } from '../services/catalogue.service.js';

const TERMS = [4, 5, 6];

export default function ElectivesPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState('targets'); // targets | register | fit | changes

  const { data: categories }    = useFetch(rolesService.getCategories);
  const { data: allCourses }    = useFetch(coursesService.getAll);
  const { data: target, loading: tLoading } = useFetch(electivesService.getTargets);
  const { data: registered }    = useFetch(electivesService.getRegistrations);
  const { data: roleFit }       = useFetch(electivesService.getRoleFit);
  const { data: changeRequests }= useFetch(electivesService.getChangeRequests);

  // Once we know the target, set starting step
  useEffect(() => {
    if (!tLoading) {
      setStep(target ? 'register' : 'targets');
    }
  }, [tLoading, target]);

  const tabs = [
    { id: 'targets',  label: 'Targets' },
    { id: 'register', label: 'Register' },
    { id: 'fit',      label: 'Role Fit' },
    { id: 'changes',  label: 'Change Requests' },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader title="Electives" subtitle="Set targets, register courses, and track your role fit." />

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit mb-6">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setStep(t.id)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors
              ${step === t.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {step === 'targets'  && <TargetsStep categories={categories} current={target} onSaved={() => setStep('register')} />}
      {step === 'register' && <RegisterStep allCourses={allCourses} registered={registered} target={target} />}
      {step === 'fit'      && <RoleFitStep roleFit={roleFit} />}
      {step === 'changes'  && <ChangeRequestsStep registered={registered} allCourses={allCourses} changeRequests={changeRequests} />}
    </div>
  );
}

// ── Step 1: Set Targets ───────────────────────────────────────────────────────
function TargetsStep({ categories, current, onSaved }) {
  const [primary,   setPrimary]   = useState(current?.primary_category   || '');
  const [secondary, setSecondary] = useState(current?.secondary_category || '');
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');

  async function handleSave() {
    if (!primary) return setError('Please select a primary target.');
    setSaving(true); setError('');
    try {
      await electivesService.setTargets({ primary_category: primary, secondary_category: secondary || null });
      setSuccess('Targets saved.');
      setTimeout(onSaved, 800);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save targets.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl">
      <Alert type="error"   message={error} />
      <Alert type="success" message={success} />

      <div className="card p-5 mb-4">
        <label className="label">Primary Role Target <span className="text-red-500">*</span></label>
        <select value={primary} onChange={(e) => setPrimary(e.target.value)}
          className="input-field">
          <option value="">Select a role category…</option>
          {categories?.map((c) => (
            <option key={c.category_code} value={c.category_code}>{c.description}</option>
          ))}
        </select>
        <p className="text-xs text-slate-400 mt-1">
          Drives M/R badges, readiness score, and evidence scope.
        </p>
      </div>

      <div className="card p-5 mb-5">
        <label className="label">Secondary Role Target <span className="text-slate-400">(optional)</span></label>
        <select value={secondary} onChange={(e) => setSecondary(e.target.value)}
          className="input-field">
          <option value="">None</option>
          {categories?.filter((c) => c.category_code !== primary).map((c) => (
            <option key={c.category_code} value={c.category_code}>{c.description}</option>
          ))}
        </select>
      </div>

      <button onClick={handleSave} disabled={saving}
        className="btn-primary flex items-center gap-2">
        {saving ? <Spinner /> : <ArrowRight size={16} />}
        Save Targets and Continue
      </button>
    </div>
  );
}

// ── Step 2: Register Electives ────────────────────────────────────────────────
function RegisterStep({ allCourses, registered, target }) {
  const [selected, setSelected] = useState([]);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');

  const registeredCodes = registered?.map((r) => r.course_code) || [];
  const electives = allCourses?.filter((c) => c.term_code !== 3) || [];

  function toggle(code) {
    setSelected((s) =>
      s.includes(code) ? s.filter((c) => c !== code) : [...s, code]
    );
    setError('');
  }

  // Per-term count check
  function termCount(term) {
    const already = registeredCodes.filter((c) =>
      electives.find((e) => e.course_code === c && e.term_code === term)
    ).length;
    const selecting = selected.filter((c) =>
      electives.find((e) => e.course_code === c && e.term_code === term)
    ).length;
    return already + selecting;
  }

  async function handleRegister() {
    if (!selected.length) return setError('Select at least one course.');
    for (const term of TERMS) {
      if (termCount(term) > 4) {
        return setError(`Term ${term} exceeds 4 electives.`);
      }
    }
    setSaving(true); setError('');
    try {
      await electivesService.register({ course_codes: selected });
      setSuccess('Electives registered successfully.');
      setSelected([]);
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <Alert type="error"   message={error} />
      <Alert type="success" message={success} />

      {!target && (
        <Alert type="info" message="Set your role targets first to see M/R badges." />
      )}

      {TERMS.map((term) => {
        const termCourses = electives.filter((c) => c.term_code === term);
        const count = termCount(term);
        return (
          <div key={term} className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <TermBadge termCode={term} />
              <span className={`text-xs font-medium ${count > 4 ? 'text-red-500' : 'text-slate-400'}`}>
                {count}/4 selected
              </span>
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              {termCourses.map((course) => {
                const isRegistered = registeredCodes.includes(course.course_code);
                const isSelected   = selected.includes(course.course_code);

                return (
                  <button key={course.course_code}
                    disabled={isRegistered}
                    onClick={() => toggle(course.course_code)}
                    className={`card p-3 text-left transition-all duration-150
                      ${isRegistered ? 'opacity-60 cursor-default bg-slate-50' : 'hover:border-brand-500'}
                      ${isSelected   ? 'border-brand-500 bg-brand-50' : ''}
                    `}>
                    <div className="flex items-start gap-2">
                      <div className={`w-4 h-4 rounded border-2 shrink-0 mt-0.5 flex items-center justify-center
                        ${isRegistered || isSelected ? 'border-brand-500 bg-brand-500' : 'border-slate-300'}`}>
                        {(isRegistered || isSelected) && (
                          <CheckCircle size={10} className="text-white" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-xs text-slate-400">{course.course_code}</span>
                          {isRegistered && <span className="text-xs text-green-600 font-medium">Registered</span>}
                        </div>
                        <p className="text-sm text-slate-700 font-medium mt-0.5 leading-snug">
                          {course.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {selected.length > 0 && (
        <div className="sticky bottom-4 flex justify-end">
          <button onClick={handleRegister} disabled={saving}
            className="btn-primary flex items-center gap-2 shadow-lg">
            {saving ? <Spinner /> : <CheckCircle size={16} />}
            Register {selected.length} course{selected.length > 1 ? 's' : ''}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Step 3: Role Fit ──────────────────────────────────────────────────────────
function RoleFitStep({ roleFit }) {
  if (!roleFit) return <div className="text-slate-400 text-sm">Loading role fit…</div>;

  return (
    <div className="space-y-2">
      {roleFit.map((cat) => (
        <div key={cat.category_code}
          className={`card p-4 ${cat.is_primary ? 'border-brand-500 bg-brand-50' :
            cat.is_secondary ? 'border-amber-300 bg-amber-50' : ''}`}>
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-slate-800 text-sm">{cat.description}</p>
                {cat.is_primary   && <Badge type="M" />}
                {cat.is_secondary && <Badge type="R" />}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Mandatory: {cat.mandatory_hit}/{cat.mandatory_total} ·
                Recommended: {cat.recommended_hit}/{cat.recommended_total}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className={`text-xl font-bold
                ${cat.overall_pct >= 70 ? 'text-green-600' :
                  cat.overall_pct >= 40 ? 'text-amber-600' : 'text-slate-400'}`}>
                {cat.overall_pct}%
              </p>
              {/* Mini bar */}
              <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                <div className={`h-full rounded-full transition-all
                  ${cat.overall_pct >= 70 ? 'bg-green-500' :
                    cat.overall_pct >= 40 ? 'bg-amber-500' : 'bg-slate-300'}`}
                  style={{ width: `${cat.overall_pct}%` }} />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Step 4: Change Requests ───────────────────────────────────────────────────
function ChangeRequestsStep({ registered, allCourses, changeRequests }) {
  const [form, setForm]     = useState({ drop_course: '', add_course: '', reason: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState('');

  const registeredCodes = registered?.map((r) => r.course_code) || [];
  const electives = allCourses?.filter((c) => c.term_code !== 3) || [];
  const hasPending = changeRequests?.some((r) => r.status === 'PENDING');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.drop_course || !form.add_course || !form.reason) {
      return setError('All fields are required.');
    }
    setSaving(true); setError('');
    try {
      await electivesService.requestChange(form);
      setSuccess('Change request submitted. The professor will review it.');
      setForm({ drop_course: '', add_course: '', reason: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit request.');
    } finally {
      setSaving(false);
    }
  }

  const statusColors = { PENDING: 'text-amber-600', APPROVED: 'text-green-600', REJECTED: 'text-red-600' };

  return (
    <div className="max-w-xl">
      {/* History */}
      {changeRequests?.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-slate-600 mb-3">Request History</h3>
          <div className="space-y-2">
            {changeRequests.map((r) => (
              <div key={r.id} className="card p-4 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-slate-600">
                      Drop <span className="font-mono font-medium">{r.drop_course}</span> →
                      Add <span className="font-mono font-medium">{r.add_course}</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{r.reason}</p>
                    {r.professor_comment && (
                      <p className="text-xs text-slate-500 mt-1 italic">"{r.professor_comment}"</p>
                    )}
                  </div>
                  <span className={`text-xs font-semibold shrink-0 ${statusColors[r.status]}`}>
                    {r.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New request form */}
      {hasPending ? (
        <div className="card p-4 flex items-center gap-2 text-amber-600 text-sm">
          <AlertCircle size={16} />
          You have a pending change request. Wait for the professor to review it before submitting another.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">New Change Request</h3>
          <Alert type="error"   message={error} />
          <Alert type="success" message={success} />

          <div className="mb-3">
            <label className="label">Course to Drop</label>
            <select value={form.drop_course}
              onChange={(e) => setForm((f) => ({ ...f, drop_course: e.target.value }))}
              className="input-field">
              <option value="">Select registered course…</option>
              {registered?.map((r) => (
                <option key={r.course_code} value={r.course_code}>
                  {r.course_code} — {r.course_description}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="label">Course to Add</label>
            <select value={form.add_course}
              onChange={(e) => setForm((f) => ({ ...f, add_course: e.target.value }))}
              className="input-field">
              <option value="">Select course to add…</option>
              {electives?.filter((c) => !registeredCodes.includes(c.course_code)).map((c) => (
                <option key={c.course_code} value={c.course_code}>
                  {c.course_code} — {c.description} (T{c.term_code})
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="label">Reason</label>
            <textarea value={form.reason}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              placeholder="Explain why you want to make this change…"
              rows={3}
              className="input-field resize-none" />
          </div>

          <button type="submit" disabled={saving}
            className="btn-primary flex items-center gap-2">
            {saving ? <Spinner /> : <RefreshCw size={16} />}
            Submit Change Request
          </button>
        </form>
      )}
    </div>
  );
}
