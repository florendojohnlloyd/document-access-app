import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { usernameToEmail } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { username?: string; password?: string };
    const { username: rawUsername, password } = body;
    const username = rawUsername?.trim().toLowerCase();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required.' }, { status: 400 });
    }

    const email = usernameToEmail(username);
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      console.error('[LOGIN] Supabase auth error:', error.message, '| email tried:', email);
      return NextResponse.json(
        { error: `Login failed: ${error.message}` },
        { status: 401 }
      );
    }

    // Fetch the profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError || !profile) {
      console.error('[LOGIN] Profile not found:', profileError?.message, '| user id:', data.user.id);
      return NextResponse.json(
        { error: `Profile not found. Please contact your administrator.` },
        { status: 404 }
      );
    }

    // Log the login action
    const serviceClient = createServiceClient();
    await serviceClient.from('audit_logs').insert({
      actor_id: data.user.id,
      actor_name: profile.username,
      action: 'LOGIN',
      detail: `User ${profile.username} logged in.`,
    });

    return NextResponse.json({ success: true, profile });
  } catch (err) {
    console.error('[LOGIN] Unexpected error:', err);
    return NextResponse.json({ error: 'Server error. Please try again.' }, { status: 500 });
  }
}
