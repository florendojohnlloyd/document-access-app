import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile, error } = await supabase
      .from('profiles').select('*').eq('id', session.user.id).single();

    if (error || !profile) return NextResponse.json({ error: 'Profile not found.' }, { status: 404 });
    return NextResponse.json(profile);
  } catch {
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json() as { full_name?: string };
    const { full_name } = body;

    if (!full_name || full_name.trim().length === 0) {
      return NextResponse.json({ error: 'Full name is required.' }, { status: 400 });
    }

    const { data: currentProfile } = await supabase
      .from('profiles').select('*').eq('id', session.user.id).single();

    if (!currentProfile) return NextResponse.json({ error: 'Profile not found.' }, { status: 404 });

    // super_admin can always edit name; admin and user are subject to name_locked
    if (currentProfile.role !== 'super_admin' && currentProfile.name_locked) {
      return NextResponse.json({ error: 'Your name is locked and cannot be changed.' }, { status: 403 });
    }

    const { data: updated, error } = await supabase
      .from('profiles')
      .update({
        full_name: full_name.trim(),
        // Lock name for non-super_admin users after first set
        name_locked: currentProfile.role !== 'super_admin' ? true : currentProfile.name_locked,
      })
      .eq('id', session.user.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await supabase.from('audit_logs').insert({
      actor_id: session.user.id,
      actor_name: currentProfile.username,
      action: 'PROFILE_UPDATE',
      detail: `${currentProfile.username} updated full name to "${full_name.trim()}".`,
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
