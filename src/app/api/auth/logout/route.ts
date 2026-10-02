import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = createClient();

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

    return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://localhost:3000'));
  } catch {
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
