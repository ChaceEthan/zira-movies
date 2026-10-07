import React, { useState } from 'react';
import { apiFetch } from '../api';
import { X, Lock, Mail, User as UserIcon } from 'lucide-react';
import { ZiraLogo } from './ZiraLogo';

interface AuthModalProps {
  onClose: () => void;
  onLoginSuccess: (user: any, token: string) => void;
}

export function AuthModal({ onClose, onLoginSuccess }: AuthModalProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const body = isRegister
        ? { email, password, displayName }
        : { email, password };

      const res = await apiFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      localStorage.setItem('zira_token', data.token);
      onLoginSuccess(data.user, data.token);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-neutral-800 text-neutral-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <ZiraLogo size="lg" showTagline={true} />
          </div>
          <h2 className="text-xl font-bold text-white pt-2">
            {isRegister ? 'Create Your Free ZIRA Account' : 'Welcome Back to ZIRA'}
          </h2>
          <p className="text-xs text-neutral-400">
            {isRegister
              ? 'Join free to save your watchlist and resume movies across devices.'
              : 'Sign in to access your personal watchlist and progress.'}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-950/80 border border-red-800 text-red-300 text-xs text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">Display Name</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. Divine Mutoni"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-red-600"
                />
                <UserIcon className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-red-600"
              />
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">Password</label>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-red-600"
              />
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm shadow-xl shadow-red-950 transition-all"
          >
            {loading ? 'Processing...' : isRegister ? 'Create Free Account' : 'Sign In'}
          </button>
        </form>

        <div className="text-center">
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-xs text-neutral-400 hover:text-white transition-colors"
          >
            {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Register Free"}
          </button>
        </div>
      </div>
    </div>
  );
}
