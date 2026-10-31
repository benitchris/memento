import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const requestedNextRaw = searchParams.get('next');
  // Only allow same-site relative paths to prevent open redirects.
  const requestedNext =
    requestedNextRaw && requestedNextRaw.startsWith('/') && !requestedNextRaw.startsWith('//')
      ? requestedNextRaw
      : null;

  if (code) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error && data?.user) {
        // Ensure profile exists in profiles table
        const user = data.user;
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id, role')
          .eq('id', user.id)
          .single();

        if (!existingProfile) {
          await supabase.from('profiles').insert({
            id: user.id,
            email: user.email ?? '',
            full_name:
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              user.email?.split('@')[0] ||
              'Memento Guest',
            avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
            role: 'traveller',
            preferred_currency: 'RWF',
          });
        }

        // Explicit ?next= wins; otherwise administrators land in the admin console.
        const role = existingProfile?.role ?? 'traveller';
        const destination = requestedNext ?? (role === 'admin' ? '/admin' : '/dashboard');

        const forwardedHost = request.headers.get('x-forwarded-host');
        const isLocalEnv = process.env.NODE_ENV === 'development';
        if (isLocalEnv) {
          return NextResponse.redirect(`${origin}${destination}`);
        } else if (forwardedHost) {
          return NextResponse.redirect(`https://${forwardedHost}${destination}`);
        } else {
          return NextResponse.redirect(`${origin}${destination}`);
        }
      }
    } catch (err) {
      console.error('OAuth Callback Error:', err);
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=oauth_error`);
}

