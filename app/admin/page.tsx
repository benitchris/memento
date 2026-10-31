import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/data/service';
import AdminDashboard from './admin-dashboard';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Marketplace administration — Memento',
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  // Without Supabase credentials the app runs in local demo mode.
  if (!isSupabaseConfigured()) {
    return <AdminDashboard />;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login?next=/admin');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 text-stone-500">
          <ShieldAlert className="h-7 w-7" />
        </span>
        <h1 className="mt-6 font-serif text-2xl font-bold text-stone-900">
          Administrator access required
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-stone-500">
          This area is restricted to the Memento marketplace team. Your account does not have
          administrator permissions.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#1f4e3d] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#173c2f] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Memento
        </Link>
      </div>
    );
  }

  return <AdminDashboard />;
}
