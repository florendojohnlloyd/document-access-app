import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { usernameToEmail } from '@/lib/utils';

async function getSessionAndProfile() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return { supabase, session: null, profile: null };

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  return { supabase, session, profile };
}

export async function GET() {
  try {
    const { supabase, session, profile } = await getSessionAndProfile();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // Both super_admin and admin can list users (admin is view-only)
    if (!profile || !['super_admin', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    const { data: users, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(users);
  } catch {
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, session, profile } = await getSessionAndProfile();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // Only super_admin can create users
    if (!profile || profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden. Super Admins only.' }, { status: 403 });
    }

    const body = await request.json() as { username?: string; password?: string; role?: string };
    const { username, password, role } = body;

    if (!username || !password) {
      return NextResponse.json({ error: 'Username at password ay required.' }, { status: 400 });
    }

    if (!role || !['super_admin', 'admin', 'user'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role. Use "super_admin", "admin", or "user".' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
    }

    const email = usernameToEmail(username);
    const serviceClient = createServiceClient();

    // Create Supabase auth user
    const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
        return NextResponse.json({ error: 'Username already exists.' }, { status: 409 });
      }
      return NextResponse.json({ error: authError.message }, { status: 500 });
    }

    // Create profile
    const { data: newProfile, error: profileError } = await serviceClient
      .from('profiles')
      .upsert({
        id: authData.user.id,
        username,
        role,
        full_name: null,
        name_locked: false,
      })
      .select()
      .single();

    if (profileError) {
      // Rollback auth user
      await serviceClient.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    await supabase.from('audit_logs').insert({
      actor_id: session.user.id,
      actor_name: profile.username,
      action: 'USER_CREATE',
      detail: `User "${username}" created with role "${role}".`,
    });

    return NextResponse.json(newProfile, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
