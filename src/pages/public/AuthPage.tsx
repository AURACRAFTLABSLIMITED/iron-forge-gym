/**
 * Created by AURA CRAFT LABS LIMITED.
 * File: src/pages/public/AuthPage.tsx
 * Purpose: Unified Login, Member Registration, and Forgot Password page supporting
 *          Google Sign-In and Email/Password authentication.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  loginWithEmail,
  registerWithEmail,
  resetPassword,
  signInWithGoogle,
  signInWithFacebook,
  signInWithTwitter,
} from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';
import { useSite } from '../../context/SiteContext';
import { Button } from '../../components/common/Button';
import { isValidEmail } from '../../utils/validators';

type AuthMode = 'login' | 'register' | 'reset';

export default function AuthPage({ defaultMode = 'login' }: { defaultMode?: AuthMode }) {
  const { user, isAdmin } = useAuth();
  const { settings, showToast } = useSite();
  const navigate = useNavigate();

  const [mode, setMode] = useState<AuthMode>(defaultMode);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setMode(defaultMode);
  }, [defaultMode]);

  useEffect(() => {
    if (user) {
      navigate(isAdmin ? '/admin' : '/member', { replace: true });
    }
  }, [user, isAdmin, navigate]);

  const handleGoogle = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      await signInWithGoogle();
      showToast('Signed in with Google.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Google sign-in failed.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSocial = async (
    providerName: 'Facebook' | 'X (Twitter)',
    signIn: () => Promise<unknown>
  ) => {
    setErrorMsg(null);
    setLoading(true);
    try {
      await signIn();
      showToast(`Signed in with ${providerName}.`);
    } catch (err) {
      const raw = err instanceof Error ? err.message : '';
      if (raw.includes('auth/operation-not-allowed')) {
        setErrorMsg(
          `${providerName} sign-in is not enabled yet in Firebase Console (Authentication -> Sign-in method).`
        );
      } else if (raw.includes('auth/account-exists-with-different-credential')) {
        setErrorMsg(
          'An account with this email already exists. Please sign in with the method you used before (Google or Email/Password).'
        );
      } else if (raw.includes('auth/popup-closed-by-user') || raw.includes('auth/cancelled-popup-request')) {
        setErrorMsg(null);
      } else {
        setErrorMsg(raw || `${providerName} sign-in failed.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!isValidEmail(email)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
        showToast('Welcome back.');
      } else if (mode === 'register') {
        if (password.length < 6) {
          setErrorMsg('Password must be at least 6 characters.');
          setLoading(false);
          return;
        }
        await registerWithEmail(name, email, password, phone);
        showToast('Member account created.');
      } else {
        await resetPassword(email);
        showToast('Password reset link sent to your email.');
        setMode('login');
      }
    } catch (err) {
      const raw = err instanceof Error ? err.message : 'Authentication error.';
      if (raw.includes('auth/operation-not-allowed')) {
        setErrorMsg(
          'Email/Password sign-in is not yet enabled in Firebase Console (Authentication -> Sign-in method -> Email/Password). Use Google Sign-In below or enable the provider.'
        );
      } else {
        setErrorMsg(raw);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-club py-16 flex justify-center">
      <div className="w-full max-w-md p-7 sm:p-9 rounded-lg bg-[#14171A] border border-white/10 space-y-6">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
            {settings.gymName}
          </p>
          <h1 className="font-display text-3xl font-extrabold uppercase text-white">
            {mode === 'login'
              ? 'Member Sign In'
              : mode === 'register'
              ? 'Create Member Account'
              : 'Reset Password'}
          </h1>
        </div>

        {/* Mode Switcher */}
        <div className="grid grid-cols-3 gap-1 p-1 rounded bg-[#0B0D0E] border border-white/10">
          {(['login', 'register', 'reset'] as AuthMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setErrorMsg(null);
              }}
              className={`min-h-[38px] text-xs font-semibold uppercase rounded transition-colors ${
                mode === m
                  ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {m === 'login' ? 'Sign In' : m === 'register' ? 'Register' : 'Forgot'}
            </button>
          ))}
        </div>

        {errorMsg ? (
          <div className="p-3 rounded bg-red-500/10 border border-red-500/30 text-xs text-red-300 leading-relaxed">
            {errorMsg}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' ? (
            <>
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white focus:border-[var(--accent)] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="03XX XXXXXXX"
                  className="w-full min-h-[44px] px-3.5 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white focus:border-[var(--accent)] focus:outline-none"
                />
              </div>
            </>
          ) : null}

          <div>
            <label className="block text-xs text-neutral-400 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full min-h-[44px] px-3.5 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white focus:border-[var(--accent)] focus:outline-none"
            />
          </div>

          {mode !== 'reset' ? (
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full min-h-[44px] px-3.5 rounded bg-[#0B0D0E] border border-white/15 text-sm text-white focus:border-[var(--accent)] focus:outline-none"
              />
            </div>
          ) : null}

          <Button type="submit" fullWidth loading={loading}>
            {mode === 'login'
              ? 'Sign In'
              : mode === 'register'
              ? 'Create Account'
              : 'Send Reset Email'}
          </Button>
        </form>

        <div className="relative py-2">
          <div className="border-t border-white/10" />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-3 bg-[#14171A] text-xs text-neutral-500">
            or
          </span>
        </div>

        <Button variant="secondary" fullWidth loading={loading} onClick={handleGoogle}>
          Continue With Google
        </Button>
        <Button
          variant="secondary"
          fullWidth
          loading={loading}
          onClick={() => handleSocial('Facebook', signInWithFacebook)}
        >
          Continue With Facebook
        </Button>
        <Button
          variant="secondary"
          fullWidth
          loading={loading}
          onClick={() => handleSocial('X (Twitter)', signInWithTwitter)}
        >
          Continue With X (Twitter)
        </Button>
      </div>
    </div>
  );
}
