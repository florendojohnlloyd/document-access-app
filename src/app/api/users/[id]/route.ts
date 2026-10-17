import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: actorProfile } = await supabase
      .from('profiles').select('*').eq('id', session.user.id).single();

    if (!actorProfile || actorProfile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden. Super Admins only.' }, { status: 403 });
    }

    const body = await request.json() as { role?: string; branch?: string | null; full_name?: string | null };
    const updates: Record<string, unknown> = {};

    if (body.role !== undefined) {
      if (!['super_admin', 'admin', 'user'].includes(body.role)) {
        return NextResponse.json({ error: 'Invalid role.' }, { status: 400 });
      }
      updates.role = body.role;
      if (body.role === 'admin' || body.role === 'super_admin') {
        updates.branch = null;
      }
    }
    if (body.branch !== undefined && updates.branch === undefined) {
      updates.branch = body.branch;
    }
    if (body.full_name !== undefined) updates.full_name = body.full_name;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });
    }

    // Use supabase (user client) — RLS allows super_admin to update any profile
    // Use service client to bypass RLS restrictions on profile updates
    const serviceClient = createServiceClient();
    const { data: updated, error } = await serviceClient
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select('id, username, full_name, role, branch, name_locked, created_at')
      .limit(1)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await supabase.from('audit_logs').insert({
      actor_id: session.user.id,
      actor_name: actorProfile.username,
      action: 'USER_UPDATE',
      detail: `User "${updated.username}" updated: ${JSON.stringify(updates)}.`,
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: actorProfile } = await supabase
      .from('profiles').select('*').eq('id', session.user.id).single();

    if (!actorProfile || actorProfile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden. Super Admins only.' }, { status: 403 });
    }

    if (id === session.user.id) {
      return NextResponse.json({ error: 'You cannot delete your own account.' }, { status: 400 });
    }

    const { data: targetProfile } = await supabase
      .from('profiles').select('*').eq('id', id).single();

    if (!targetProfile) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    if (targetProfile.role === 'super_admin' && actorProfile.username !== 'manager') {
      return NextResponse.json({ error: 'Cannot delete a Super Admin account.' }, { status: 403 });
    }

    const serviceClient = createServiceClient();
    const { error: deleteError } = await serviceClient.auth.admin.deleteUser(id);
    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

    await supabase.from('audit_logs').insert({
      actor_id: session.user.id,
      actor_name: actorProfile.username,
      action: 'USER_DELETE',
      detail: `User "${targetProfile.username}" deleted.`,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
