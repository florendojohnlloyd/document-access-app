import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: actorProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    // Only super_admin can delete users
    if (!actorProfile || actorProfile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden. Super Admins only.' }, { status: 403 });
    }

    // Prevent self-deletion
    if (id === session.user.id) {
      return NextResponse.json({ error: 'Hindi mo mabubura ang sarili mong account.' }, { status: 400 });
    }

    // Get target user info
    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (!targetProfile) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // Prevent deleting other super_admins — only the 'manager' account (Angelica) can do this
    if (targetProfile.role === 'super_admin' && actorProfile.username !== 'manager') {
      return NextResponse.json({ error: 'Hindi mabubura ang isang Super Admin account.' }, { status: 403 });
    }

    const serviceClient = createServiceClient();

    // Delete auth user (profile will cascade due to FK)
    const { error: deleteError } = await serviceClient.auth.admin.deleteUser(id);
    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

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
