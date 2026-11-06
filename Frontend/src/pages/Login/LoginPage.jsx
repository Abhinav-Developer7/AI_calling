import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Lock, Mail, AlertCircle } from 'lucide-react';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-app px-4 font-sans text-ink">
      <div className="max-w-sm w-full bg-surface rounded-[28px] md:rounded-[32px] shadow-soft p-8 border border-black/[0.04] dark:border-white/[0.06]">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-full bg-accent/20 text-accent-ink flex items-center justify-center font-bold text-sm tracking-wider mb-3 shadow-soft">
            AJ
          </div>
          <h1 className="text-lg font-bold text-ink tracking-tight">Aurum Jewellery</h1>
          <p className="text-xs text-ink-soft mt-0.5">Post-Purchase Feedback Portal</p>
        </div>

        {error && (
          <div className="mb-4 p-3.5 bg-status-danger-bg border border-rose-500/20 rounded-2xl flex items-center gap-2.5 text-status-danger-ink text-xs shadow-soft font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 stroke-[2]" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-medium text-ink-soft mb-1.5 ml-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3 text-ink-soft stroke-[1.75]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@aurumjewellery.com"
                className="w-full bg-surface-muted border border-black/[0.04] dark:border-white/[0.06] rounded-pill pl-10 pr-4 py-2.5 text-xs text-ink placeholder-ink-soft/40 focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-ink-soft mb-1.5 ml-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-ink-soft stroke-[1.75]" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-surface-muted border border-black/[0.04] dark:border-white/[0.06] rounded-pill pl-10 pr-4 py-2.5 text-xs text-ink placeholder-ink-soft/40 focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 bg-accent text-accent-ink font-semibold rounded-pill shadow-soft hover:brightness-105 active:scale-[0.98] transition disabled:opacity-50 text-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-accent-ink border-t-transparent rounded-full animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-black/[0.04] dark:border-white/[0.06] text-center">
          <p className="text-[11px] text-ink-soft">Authorized showroom personnel only.</p>
        </div>
      </div>
    </div>
  );
}
