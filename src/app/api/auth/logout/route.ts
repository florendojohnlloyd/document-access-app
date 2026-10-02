import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      // Log the logout action
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        await supabase.from('audit_logs').insert({
          actor_id: session.user.id,
          actor_name: profile.username,
          action: 'LOGOUT',
          detail: `User ${profile.username} logged out.`,
        });
      }
    }

    await supabase.auth.signOut();

    // Use request.url as base so the redirect always points back to the app,
    // never to the Supabase project URL.
    return NextResponse.redirect(new URL('/login', request.url));
  } catch {
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
