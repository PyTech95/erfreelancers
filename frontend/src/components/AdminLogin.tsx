import React, { useState } from 'react';
import { Lock, LogIn, ShieldCheck } from 'lucide-react';
import { apiFetch, setAdminToken } from '../api';

interface AdminLoginProps {
  onSuccess: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        const detail = data?.detail;
        setError(typeof detail === 'string' ? detail : 'Login failed. Please check your credentials.');
        return;
      }
      setAdminToken(data.token);
      onSuccess();
    } catch {
      setError('Unable to reach the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-slate-50 px-4 py-16" data-testid="admin-login-page">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl text-left"
        data-testid="admin-login-form"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">Founder Access</p>
            <h1 className="font-display text-2xl font-extrabold text-slate-900">Admin Dashboard Login</h1>
          </div>
        </div>

        <label className="block text-xs font-semibold text-slate-600 mb-1.5" htmlFor="admin-email">Email</label>
        <input
          id="admin-email"
          data-testid="admin-login-email"
          type="email"
          required
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          placeholder="admin@erfreelancer.com"
        />

        <label className="block text-xs font-semibold text-slate-600 mb-1.5" htmlFor="admin-password">Password</label>
        <input
          id="admin-password"
          data-testid="admin-login-password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-5 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          placeholder="••••••••"
        />

        {error && (
          <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700" data-testid="admin-login-error">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          data-testid="admin-login-submit"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-indigo-600 disabled:opacity-60"
        >
          {loading ? <Lock className="h-4 w-4 animate-pulse" /> : <LogIn className="h-4 w-4" />}
          {loading ? 'Verifying…' : 'Sign in to Dashboard'}
        </button>
        <p className="mt-4 text-center text-[11px] text-slate-400">
          Protected area. 5 failed attempts lock the account for 15 minutes.
        </p>
      </form>
    </div>
  );
};
