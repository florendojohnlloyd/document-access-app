import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (error || !profile) {
      return NextResponse.json({ error: 'Profile not found.' }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch {
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json() as { full_name?: string };
    const { full_name } = body;

    if (!full_name || full_name.trim().length === 0) {
      return NextResponse.json({ error: 'Full name is required.' }, { status: 400 });
    }

    // Get current profile
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (!currentProfile) {
      return NextResponse.json({ error: 'Profile not found.' }, { status: 404 });
    }

    // Regular users cannot change name once locked
    if (currentProfile.role === 'user' && currentProfile.name_locked) {
      return NextResponse.json({ error: 'Ang pangalan ay naka-lock na at hindi na mababago.' }, { status: 403 });
    }

    const { data: updated, error } = await supabase
      .from('profiles')
      .update({ full_name: full_name.trim(), name_locked: true })
      .eq('id', session.user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log the action
    await supabase.from('audit_logs').insert({
      actor_id: session.user.id,
      actor_name: currentProfile.username,
      action: 'NAME_SET',
      detail: `User ${currentProfile.username} set full name to "${full_name.trim()}".`,
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
