import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import AuthLayout from '../components/layout/AuthLayout.jsx';
import { FormField, Alert, Spinner } from '../components/shared/FormComponents.jsx';
import { authService } from '../services/auth.service.js';

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email) return setError('Email is required.');
    setLoading(true);
    try {
      const { data } = await authService.forgotPassword({ email });
      setSuccess(data.message);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Forgot Password"
      subtitle="Enter your registered XIME email"
    >
      {success ? (
        <div className="text-center py-4">
          <Mail className="mx-auto mb-4 text-brand-500" size={48} />
          <p className="text-slate-700 text-sm">{success}</p>
          <Link to="/login"
            className="mt-6 inline-block btn-primary px-8">
            Back to Login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <Alert type="error" message={error} />
          <FormField label="Email">
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              placeholder="yourname09che@xime.org"
              className="input-field"
              autoFocus
            />
          </FormField>
          <button type="submit" disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
            {loading ? <><Spinner /> Sending…</> : 'Send Reset Link'}
          </button>
          <p className="mt-4 text-center text-sm text-slate-500">
            <Link to="/login" className="text-brand-500 hover:underline">
              Back to Login
            </Link>
          </p>
        </form>
      )}
    </AuthLayout>
  );
}
