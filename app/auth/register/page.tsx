'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/logo';
import { useMemento } from '@/lib/context/memento-context';
import { Lock, Mail, User, Phone, ArrowRight, ShieldCheck } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { switchRole } = useMemento();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      switchRole('traveller');
      router.push('/dashboard');
    }, 600);
  };

  return (
    <div className="mx-auto flex min-h-[85vh] max-w-md flex-col justify-center px-4 py-12 sm:px-6">
      <div className="text-center">
        <Logo className="justify-center" showTagline={false} />
        <h2 className="mt-6 text-2xl font-bold font-serif text-stone-900">
          Create your Memento account
        </h2>
        <p className="mt-1 text-xs text-stone-500">
          One single account for discovering, booking or hosting accommodation in Rwanda.
        </p>
      </div>

      <div className="mt-8 rounded-3xl border border-stone-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
              Full Name
            </label>
            <div className="mt-1 flex items-center rounded-xl border border-stone-300 p-2.5 focus-within:border-stone-800">
              <User className="h-4 w-4 text-stone-400 mr-2" />
              <input
                type="text"
                value={fullName}
                placeholder="David Karemera"
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full bg-transparent text-xs text-stone-900 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
              Email Address
            </label>
            <div className="mt-1 flex items-center rounded-xl border border-stone-300 p-2.5 focus-within:border-stone-800">
              <Mail className="h-4 w-4 text-stone-400 mr-2" />
              <input
                type="email"
                value={email}
                placeholder="david@example.rw"
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-transparent text-xs text-stone-900 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
              Phone Number
            </label>
            <div className="mt-1 flex items-center rounded-xl border border-stone-300 p-2.5 focus-within:border-stone-800">
              <Phone className="h-4 w-4 text-stone-400 mr-2" />
              <input
                type="tel"
                value={phone}
                placeholder="+250 788 000 000"
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-transparent text-xs text-stone-900 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
              Password
            </label>
            <div className="mt-1 flex items-center rounded-xl border border-stone-300 p-2.5 focus-within:border-stone-800">
              <Lock className="h-4 w-4 text-stone-400 mr-2" />
              <input
                type="password"
                value={password}
                placeholder="At least 8 characters"
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-transparent text-xs text-stone-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="rounded-xl bg-stone-50 p-3 text-[11px] text-stone-500 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#1f4e3d] shrink-0" />
            <span>
              Unified Account: You can use this account as both a traveller and register as a host anytime.
            </span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#b94726] py-3 text-xs font-bold text-white shadow-md hover:bg-[#9e3b1e] active:scale-95 disabled:opacity-50"
          >
            <span>{isSubmitting ? 'Creating account...' : 'Create Memento Account'}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </form>

        <p className="text-center text-xs text-stone-500">
          Already have an account?{' '}
          <Link href="/auth/login" className="font-bold text-[#b94726] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
