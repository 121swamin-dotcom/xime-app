import { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';
import AuthLayout from '../components/layout/AuthLayout.jsx';
import { FormField, Alert, Spinner } from '../components/shared/FormComponents.jsx';
import { authService } from '../services/auth.service.js';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [form, setForm]       = useState({ password: '', confirm: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <AuthLayout title="Invalid Link">
        <p className="text-slate-600 text-sm text-center">
          This reset link is missing or malformed.{' '}
          <Link to="/forgot-password" className="text-brand-500 hover:underline">
            Request a new one.
          </Link>
        </p>
      </AuthLayout>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.password.length < 8 || !/\d/.test(form.password)) {
      return setError('Password must be at least 8 characters and contain a digit.');
    }
    if (form.password !== form.confirm) {
      return setError('Passwords do not match.');
    }
    setLoading(true);
    try {
      await authService.resetPassword({ token, password: form.password });
      navigate('/login', { state: { flash: 'Password reset successful. Please log in.' } });
    } catch (err) {
      setError(err.response?.data?.error || 'Reset failed. The link may have expired.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Reset Password" subtitle="Choose a new password">
      <form onSubmit={handleSubmit} noValidate>
        <Alert type="error" message={error} />

        <FormField label="New Password">
          <div className="relative">
            <input
              type={showPwd ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="New password"
              className="input-field pr-10"
              autoFocus
            />
            <button type="button" onClick={() => setShowPwd((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400
                         hover:text-slate-600 transition-colors">
              {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <ul className="mt-2 space-y-1">
            {[
              { label: 'At least 8 characters', ok: form.password.length >= 8 },
              { label: 'Contains a number',     ok: /\d/.test(form.password) },
            ].map((r) => (
              <li key={r.label}
                className={`flex items-center gap-1.5 text-xs transition-colors
                  ${r.ok ? 'text-green-600' : 'text-slate-400'}`}>
                <CheckCircle size={12} />
                {r.label}
              </li>
            ))}
          </ul>
        </FormField>

        <FormField label="Confirm Password">
          <input
            type={showPwd ? 'text' : 'password'}
            value={form.confirm}
            onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
            placeholder="Repeat new password"
            className="input-field"
          />
        </FormField>

        <button type="submit" disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
          {loading ? <><Spinner /> Resetting…</> : 'Reset Password'}
        </button>
      </form>
    </AuthLayout>
  );
}
