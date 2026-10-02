import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { usernameToEmail } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json() as { currentPassword?: string; newPassword?: string };
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Current and new password are required.' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters.' }, { status: 400 });
    }

    // Get profile to build email
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', session.user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found.' }, { status: 404 });
    }

    // Verify current password by re-signing in
    const email = usernameToEmail(profile.username);
    const { error: verifyError } = await supabase.auth.signInWithPassword({ email, password: currentPassword });

    if (verifyError) {
      return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 401 });
    }

    // Update to new password
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Audit log
    await supabase.from('audit_logs').insert({
      actor_id: session.user.id,
      actor_name: profile.username,
      action: 'PASSWORD_CHANGE',
      detail: `User ${profile.username} changed their password.`,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[PASSWORD] Error:', err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
