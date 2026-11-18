import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import { X, Lock, Mail, Shield, UserCheck, KeyRound } from 'lucide-react';
import { ZiraLogo } from './ZiraLogo';

interface AuthModalProps {
  onClose: () => void;
  onLoginSuccess: (user: any, token: string) => void;
}

export function AuthModal({ onClose, onLoginSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'bootstrap'>('login');
  const [bootstrapAvailable, setBootstrapAvailable] = useState(false);
  const [requiresSetupToken, setRequiresSetupToken] = useState(false);

  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('ZIRA Chief Administrator');
  const [password, setPassword] = useState('');
  const [setupToken, setSetupToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    apiFetch('/api/auth/admin-status')
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (!active || !data) return;
        setBootstrapAvailable(Boolean(data.bootstrapAvailable));
        setRequiresSetupToken(Boolean(data.requiresSetupToken));
        if (data.configuredAdminEmail && !email) {
          setEmail(data.configuredAdminEmail);
        }
        if (data.bootstrapAvailable) {
          setMode('bootstrap');
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = mode === 'bootstrap' ? '/api/auth/bootstrap-admin' : '/api/auth/login';
      const payload =
        mode === 'bootstrap'
          ? { email, password, displayName, setupToken: setupToken || undefined }
          : { email, password };

      const res = await apiFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Administrator authentication failed');
      }

      if (!data.user || !['ADMIN', 'SUPER_ADMIN', 'EDITOR'].includes(data.user.role)) {
        throw new Error('Administrator privileges are required to access the ZIRA Admin Console.');
      }

      localStorage.setItem('zira_token', data.token);
      onLoginSuccess(data.user, data.token);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-5">
        <button
          onClick={onClose}
          aria-label="Close Administrator Sign In"
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <ZiraLogo size="lg" showTagline={true} />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-950/60 border border-red-800/60 text-red-400 text-xs font-bold mt-2">
            <Shield className="w-3.5 h-3.5" />
            Protected Administration Area
          </div>
          <h2 className="text-xl font-bold text-white pt-1">
            {mode === 'bootstrap' ? 'Initialize First Administrator' : 'Administrator Sign In'}
          </h2>
          <p className="text-xs text-neutral-400">
            {mode === 'bootstrap'
              ? 'No administrator account exists in the database yet. Create your initial SUPER_ADMIN credentials below to unlock and secure the ZIRA Admin Console.'
              : 'Public streaming on ZIRA requires no account. Sign in below with your authorized administrator credentials.'}
          </p>
        </div>

        {(bootstrapAvailable || requiresSetupToken) && (
          <div className="flex rounded-xl bg-neutral-950 p-1 border border-neutral-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className={`flex-1 py-2 rounded-lg transition-all ${
                mode === 'login' ? 'bg-red-600 text-white font-bold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('bootstrap');
                setError('');
              }}
              className={`flex-1 py-2 rounded-lg transition-all ${
                mode === 'bootstrap' ? 'bg-red-600 text-white font-bold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              First-Time Admin Setup
            </button>
          </div>
        )}

        {error && (
          <div role="alert" className="p-3 rounded-lg bg-red-950/80 border border-red-800 text-red-300 text-xs text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'bootstrap' && (
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">Administrator Name</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  minLength={2}
                  placeholder="ZIRA Chief Administrator"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-red-600"
                />
                <UserCheck className="absolute left-3 top-3 w-4 h-4 text-neutral-500" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">Administrator Email</label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="you@yourdomain.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-red-600"
              />
              <Mail className="absolute left-3 top-3 w-4 h-4 text-neutral-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">
              {mode === 'bootstrap' ? 'Create Strong Password (10+ characters)' : 'Password'}
            </label>
            <div className="relative">
              <input
                type="password"
                required
                minLength={mode === 'bootstrap' ? 10 : 1}
                placeholder="••••••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-red-600"
              />
              <Lock className="absolute left-3 top-3 w-4 h-4 text-neutral-500" />
            </div>
          </div>

          {mode === 'bootstrap' && requiresSetupToken && (
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">Setup Token (ADMIN_SETUP_TOKEN)</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="Enter server ADMIN_SETUP_TOKEN"
                  value={setupToken}
                  onChange={e => setSetupToken(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-red-600"
                />
                <KeyRound className="absolute left-3 top-3 w-4 h-4 text-neutral-500" />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm shadow-xl shadow-red-950 transition-all disabled:opacity-50"
          >
            {loading
              ? 'Verifying Credentials...'
              : mode === 'bootstrap'
                ? 'Create Administrator & Open Console'
                : 'Sign In to Admin Console'}
          </button>

          {!bootstrapAvailable && mode === 'login' && (
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setMode('bootstrap');
                  setError('');
                }}
                className="text-[11px] text-neutral-500 hover:text-neutral-300 underline"
              >
                First-time setup or have an ADMIN_SETUP_TOKEN?
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
