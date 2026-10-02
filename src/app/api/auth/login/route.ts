import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { usernameToEmail } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { username?: string; password?: string };
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ error: 'Username at password ay required.' }, { status: 400 });
    }

    const email = usernameToEmail(username);
    const supabase = createClient();

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return NextResponse.json(
        { error: 'Mali ang username o password.' },
        { status: 401 }
      );
    }

    // Fetch the profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    // Log the login action
    if (profile) {
      const serviceClient = createServiceClient();
      await serviceClient.from('audit_logs').insert({
        actor_id: data.user.id,
        actor_name: profile.username,
        action: 'LOGIN',
        detail: `User ${profile.username} logged in.`,
      });
    }

    return NextResponse.json({ success: true, profile });
  } catch {
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
