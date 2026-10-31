'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useMemento } from '@/lib/context/memento-context';
import { isSupabaseConfigured } from '@/lib/data/service';
import { Loader2 } from 'lucide-react';

/**
 * Protects account-only routes. In production (Supabase configured) a visitor
 * without a session is sent to sign in and returned to the same page.
 * When the app runs without credentials for local preview, demo mode is allowed.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoadingAuth } = useMemento();
  const router = useRouter();
  const pathname = usePathname();
  const requiresAuth = isSupabaseConfigured();

  useEffect(() => {
    if (requiresAuth && !isLoadingAuth && !isAuthenticated) {
      router.replace(`/auth/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [requiresAuth, isLoadingAuth, isAuthenticated, pathname, router]);

  if (requiresAuth && (isLoadingAuth || !isAuthenticated)) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-stone-500">
        <Loader2 className="h-6 w-6 animate-spin text-[#b94726]" />
        <p className="text-xs font-medium">
          {isLoadingAuth ? 'Checking your Memento account…' : 'Redirecting to sign in…'}
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
