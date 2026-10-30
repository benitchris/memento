'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/logo';
import { useMemento } from '@/lib/context/memento-context';
import { UserRole } from '@/lib/types';
import { Lock, Mail, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { switchRole } = useMemento();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulating login & redirect
    setTimeout(() => {
      setIsSubmitting(false);
      switchRole('traveller');
      router.push('/dashboard');
    }, 600);
  };

  const handleOAuthLogin = (provider: 'google' | 'apple') => {
    // In production with Supabase configured, calls supabase.auth.signInWithOAuth({ provider })
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      switchRole('traveller');
      router.push('/dashboard');
    }, 600);
  };

  const handleQuickDemoLogin = (role: UserRole) => {
    switchRole(role);
    if (role === 'host') router.push('/host');
    else if (role === 'admin') router.push('/admin');
    else router.push('/dashboard');
  };

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4 py-12 sm:px-6">
      <div className="text-center">
        <Logo className="justify-center" showTagline={false} />
        <h2 className="mt-6 text-2xl font-bold font-serif text-stone-900">
          Welcome back to Memento
        </h2>
        <p className="mt-1 text-xs text-stone-500">
          Sign in to manage your bookings or your Rwandan accommodation listings.
        </p>
      </div>

      <div className="mt-8 rounded-3xl border border-stone-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
        {/* Quick Demo Logins for Tester */}
        <div className="rounded-2xl bg-orange-50/80 p-3.5 border border-orange-100 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-[#b94726]">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Instant Demo Sign-In (1-Click)</span>
          </div>
          <div className="mt-2.5 grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('traveller')}
              className="rounded-xl bg-white border border-stone-200 p-2 text-center text-[11px] font-bold text-stone-800 hover:border-[#b94726] shadow-sm transition-colors"
            >
              Traveller
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('host')}
              className="rounded-xl bg-white border border-stone-200 p-2 text-center text-[11px] font-bold text-[#b94726] hover:border-[#b94726] shadow-sm transition-colors"
            >
              Host
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('admin')}
              className="rounded-xl bg-white border border-stone-200 p-2 text-center text-[11px] font-bold text-[#1f4e3d] hover:border-[#1f4e3d] shadow-sm transition-colors"
            >
              Admin
            </button>
          </div>
        </div>

        {/* OAuth Buttons */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={() => handleOAuthLogin('google')}
            className="flex w-full items-center justify-center gap-3 rounded-2xl border border-stone-300 bg-white py-2.5 px-4 text-xs font-bold text-stone-700 shadow-sm hover:bg-stone-50 transition-colors"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <button
            type="button"
            onClick={() => handleOAuthLogin('apple')}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-black py-2.5 px-4 text-xs font-bold text-white shadow-sm hover:bg-stone-900 transition-colors"
          >
            <svg className="h-4 w-4 fill-current" viewBox="0 0 170 170">
              <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.69-7.79-11.97-14.24-6.84-10.37-12.02-21.68-15.54-33.93-3.52-12.24-5.28-23.77-5.28-34.6 0-14.77 3.75-26.96 11.26-36.56 7.51-9.6 16.79-14.49 27.84-14.67 4.13 0 9.07 1.09 14.83 3.27 5.76 2.18 9.38 3.32 10.87 3.42 2.06 0 5.86-1.25 11.39-3.74 5.53-2.49 10.34-3.64 14.42-3.46 13.48.65 24.08 5.76 31.81 15.33-11.75 7.07-17.48 16.89-17.18 29.47.22 9.79 3.96 17.88 11.22 24.28 7.26 6.4 15.93 10.02 26.01 10.87-2.39 7.4-5.32 14.99-8.79 22.77zM119.22 31.85c0-7.72 2.76-15.01 8.28-21.88 5.52-6.87 12.44-11.08 20.76-12.63.11 1.09.16 2.06.16 2.93 0 7.72-2.93 15.17-8.8 22.35-5.87 7.18-12.87 11.46-21 12.84-.22-1.2-.4-2.4-.4-3.61z" />
            </svg>
            <span>Sign in with Apple</span>
          </button>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="w-full border-t border-stone-200"></div>
          <span className="bg-white px-3 text-[11px] font-bold uppercase text-stone-400">
            or with email
          </span>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
              Email Address
            </label>
            <div className="mt-1 flex items-center rounded-xl border border-stone-300 p-2.5 focus-within:border-stone-800">
              <Mail className="h-4 w-4 text-stone-400 mr-2" />
              <input
                type="email"
                value={email}
                placeholder="name@example.com"
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-transparent text-xs text-stone-900 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
                Password
              </label>
              <Link href="#" className="text-[11px] text-[#b94726] hover:underline">
                Forgot?
              </Link>
            </div>
            <div className="mt-1 flex items-center rounded-xl border border-stone-300 p-2.5 focus-within:border-stone-800">
              <Lock className="h-4 w-4 text-stone-400 mr-2" />
              <input
                type="password"
                value={password}
                placeholder="••••••••"
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-transparent text-xs text-stone-900 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#b94726] py-3 text-xs font-bold text-white shadow-md hover:bg-[#9e3b1e] active:scale-95 disabled:opacity-50"
          >
            <span>{isSubmitting ? 'Signing in...' : 'Sign In'}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </form>

        <p className="text-center text-xs text-stone-500">
          Don&apos;t have an account?{' '}
          <Link href="/auth/register" className="font-bold text-[#b94726] hover:underline">
            Register now
          </Link>
        </p>
      </div>
    </div>
  );
}
