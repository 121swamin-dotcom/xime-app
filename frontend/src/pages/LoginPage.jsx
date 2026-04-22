import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import AuthLayout from '../components/layout/AuthLayout.jsx';
import { FormField, Alert, Spinner } from '../components/shared/FormComponents.jsx';
import { authService } from '../services/auth.service.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm]       = useState({ roll_number: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.roll_number || !form.password) {
      setError('Both fields are required.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await authService.login(form);
      login(data.token, data.user);
      navigate(data.user.role === 'ADMIN' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Sign in" subtitle="Use your roll number and password">
      <form onSubmit={handleSubmit} noValidate>
        <Alert type="error" message={error} />

        <FormField label="Roll Number">
          <input
            name="roll_number"
            value={form.roll_number}
            onChange={handleChange}
            placeholder="e.g. C09/042"
            className="input-field font-mono uppercase"
            autoComplete="username"
            autoFocus
          />
        </FormField>

        <FormField label="Password">
          <div className="relative">
            <input
              name="password"
              type={showPwd ? 'text' : 'password'}
              value={form.password}
              onChange={handleChange}
              placeholder="Your password"
              className="input-field pr-10"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400
                         hover:text-slate-600 transition-colors"
            >
              {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </FormField>

        <button type="submit" disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
          {loading ? <><Spinner /> Signing in…</> : 'Sign in'}
        </button>
      </form>

      <div className="mt-5 pt-5 border-t border-slate-100 space-y-2 text-sm text-center text-slate-500">
        <p>
          First time?{' '}
          <Link to="/activate" className="text-brand-500 hover:underline font-medium">
            Activate your account
          </Link>
        </p>
        <p>
          <Link to="/forgot-password" className="text-brand-500 hover:underline">
            Forgot password?
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
