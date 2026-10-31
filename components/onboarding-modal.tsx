'use client';

import React, { useEffect, useState } from 'react';
import { useMemento } from '@/lib/context/memento-context';
import { isSupabaseConfigured } from '@/lib/data/service';
import { createClient } from '@/lib/supabase/client';
import { UserRole } from '@/lib/types';
import { Logo } from './logo';
import { MapPin, Briefcase, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';

/**
 * OnboardingModal — shown once after a user's very first sign-in.
 * Asks for a display name (pre-filled from OAuth) and primary role.
 * Saves to the profiles table and hides forever after.
 */
export function OnboardingModal() {
  const { supabaseUser, isAuthenticated, isLoadingAuth, refresh } = useMemento();
  const [show, setShow] = useState(false);
  const [step, setStep] = useState<'name' | 'role' | 'done'>('name');
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState<'traveller' | 'host' | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || isLoadingAuth || !supabaseUser || !isSupabaseConfigured()) return;

    // Check if the profile is "new" — created_at within the last 60 seconds
    // and onboarding_complete flag is not set
    const supabase = createClient();
    supabase
      .from('profiles')
      .select('onboarding_complete, full_name')
      .eq('id', supabaseUser.id)
      .single()
      .then(({ data }) => {
        if (!data?.onboarding_complete) {
          // Pre-fill name from OAuth metadata
          const metaName =
            supabaseUser.user_metadata?.full_name ||
            supabaseUser.user_metadata?.name ||
            supabaseUser.email?.split('@')[0] ||
            '';
          setFullName(data?.full_name || metaName);
          setShow(true);
        }
      });
  }, [isAuthenticated, isLoadingAuth, supabaseUser]);

  const handleSave = async () => {
    if (!supabaseUser || !selectedRole) return;
    setSaving(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim() || supabaseUser.email?.split('@')[0] || 'Memento Guest',
          role: selectedRole as UserRole,
          onboarding_complete: true,
        })
        .eq('id', supabaseUser.id);

      if (updateError) throw updateError;

      setStep('done');
      await refresh();
      setTimeout(() => setShow(false), 1800);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(message);
      setSaving(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-br from-[#1f4e3d] to-[#2d6b54] px-8 py-6 text-white">
          <Logo className="justify-center" showTagline={false} />
          <p className="mt-3 text-center text-sm text-white/80">
            Let&apos;s set up your Memento account
          </p>
        </div>

        <div className="px-8 py-6">
          {step === 'done' ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <CheckCircle2 className="h-14 w-14 text-[#1f4e3d]" />
              <h3 className="text-lg font-bold text-stone-900">Welcome to Memento!</h3>
              <p className="text-sm text-stone-500">Your account is ready. Enjoy exploring Rwanda.</p>
            </div>
          ) : (
            <>
              {/* Step 1 — Name */}
              {step === 'name' && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-lg font-bold text-stone-900">What should we call you?</h3>
                    <p className="mt-1 text-xs text-stone-500">
                      This is the name guests and hosts will see.
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Jean-Paul Habimana"
                      className="w-full rounded-xl border border-stone-300 px-4 py-3 text-sm text-stone-900 focus:border-[#b94726] focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={() => setStep('role')}
                    disabled={!fullName.trim()}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#b94726] py-3 text-sm font-bold text-white disabled:opacity-40 hover:bg-[#9e3b1e] transition-colors"
                  >
                    <span>Continue</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Step 2 — Role */}
              {step === 'role' && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-lg font-bold text-stone-900">How will you use Memento?</h3>
                    <p className="mt-1 text-xs text-stone-500">
                      You can always switch between traveller and host mode later.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setSelectedRole('traveller')}
                      className={`flex flex-col items-center gap-3 rounded-2xl border-2 p-5 text-center transition-all ${
                        selectedRole === 'traveller'
                          ? 'border-[#b94726] bg-orange-50'
                          : 'border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <MapPin
                        className={`h-8 w-8 ${
                          selectedRole === 'traveller' ? 'text-[#b94726]' : 'text-stone-400'
                        }`}
                      />
                      <div>
                        <p className="font-bold text-stone-900 text-sm">Traveller</p>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          Find and book accommodation
                        </p>
                      </div>
                      {selectedRole === 'traveller' && (
                        <CheckCircle2 className="h-5 w-5 text-[#b94726]" />
                      )}
                    </button>

                    <button
                      onClick={() => setSelectedRole('host')}
                      className={`flex flex-col items-center gap-3 rounded-2xl border-2 p-5 text-center transition-all ${
                        selectedRole === 'host'
                          ? 'border-[#1f4e3d] bg-emerald-50'
                          : 'border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <Briefcase
                        className={`h-8 w-8 ${
                          selectedRole === 'host' ? 'text-[#1f4e3d]' : 'text-stone-400'
                        }`}
                      />
                      <div>
                        <p className="font-bold text-stone-900 text-sm">Host</p>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          List and manage properties
                        </p>
                      </div>
                      {selectedRole === 'host' && (
                        <CheckCircle2 className="h-5 w-5 text-[#1f4e3d]" />
                      )}
                    </button>
                  </div>

                  <p className="text-center text-[11px] text-stone-400 flex items-center justify-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    One account works for both roles — you can switch anytime
                  </p>

                  {error && (
                    <p className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 text-center">
                      {error}
                    </p>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep('name')}
                      className="flex-1 rounded-2xl border border-stone-200 py-3 text-sm font-semibold text-stone-600 hover:bg-stone-50 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={!selectedRole || saving}
                      className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-[#b94726] py-3 text-sm font-bold text-white disabled:opacity-40 hover:bg-[#9e3b1e] transition-colors"
                    >
                      {saving ? 'Saving...' : 'Get started'}
                      {!saving && <ArrowRight className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
