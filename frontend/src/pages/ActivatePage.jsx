import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';
import AuthLayout from '../components/layout/AuthLayout.jsx';
import { FormField, Alert, Spinner } from '../components/shared/FormComponents.jsx';
import { authService } from '../services/auth.service.js';

const rules = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'Contains a number',     test: (p) => /\d/.test(p) },
];

export default function ActivatePage() {
  const [form, setForm]       = useState({ roll_number: '', email: '', password: '', confirm: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.roll_number || !form.email || !form.password || !form.confirm) {
      return setError('All fields are required.');
    }
    if (!rules.every((r) => r.test(form.password))) {
      return setError('Password does not meet the requirements below.');
    }
    if (form.password !== form.confirm) {
      return setError('Passwords do not match.');
    }

    setLoading(true);
    try {
      const { data } = await authService.activate({
        roll_number: form.roll_number.toUpperCase(),
        email:       form.email.toLowerCase(),
        password:    form.password,
      });
      setSuccess(data.message);
    } catch (err) {
      setError(err.response?.data?.error || 'Activation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <AuthLayout title="Request Submitted">
        <div className="text-center py-4">
          <CheckCircle className="mx-auto mb-4 text-green-500" size={48} />
          <p className="text-slate-700 text-sm leading-relaxed">{success}</p>
          <Link to="/login"
            className="mt-6 inline-block btn-primary px-8">
            Back to Login
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Activate Account"
      subtitle="Set your password to request access"
    >
      <form onSubmit={handleSubmit} noValidate>
        <Alert type="error" message={error} />

        <FormField label="Roll Number">
          <input
            name="roll_number"
            value={form.roll_number}
            onChange={handleChange}
            placeholder="e.g. C09/042"
            className="input-field font-mono uppercase"
            autoFocus
          />
        </FormField>

        <FormField label="XIME Email">
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="yourname09che@xime.org"
            className="input-field"
          />
        </FormField>

        <FormField label="Password">
          <div className="relative">
            <input
              name="password"
              type={showPwd ? 'text' : 'password'}
              value={form.password}
              onChange={handleChange}
              placeholder="Choose a password"
              className="input-field pr-10"
            />
            <button type="button" onClick={() => setShowPwd((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400
                         hover:text-slate-600 transition-colors">
              {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {/* Password strength checklist */}
          <ul className="mt-2 space-y-1">
            {rules.map((r) => (
              <li key={r.label}
                className={`flex items-center gap-1.5 text-xs transition-colors
                  ${r.test(form.password) ? 'text-green-600' : 'text-slate-400'}`}>
                <CheckCircle size={12} />
                {r.label}
              </li>
            ))}
          </ul>
        </FormField>

        <FormField label="Confirm Password">
          <input
            name="confirm"
            type={showPwd ? 'text' : 'password'}
            value={form.confirm}
            onChange={handleChange}
            placeholder="Repeat password"
            className="input-field"
          />
        </FormField>

        <button type="submit" disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
          {loading ? <><Spinner /> Submitting…</> : 'Request Activation'}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-slate-500">
        Already active?{' '}
        <Link to="/login" className="text-brand-500 hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
