import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

async function getSession() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return { supabase, session };
}

async function getProfile(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
  return data;
}

export async function GET() {
  try {
    const { supabase, session } = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: folders, error } = await supabase
      .from('folders')
      .select('*')
      .order('name');

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(folders);
  } catch {
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, session } = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const profile = await getProfile(supabase, session.user.id);
    if (!profile || profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden. Super Admins only.' }, { status: 403 });
    }

    const body = await request.json() as { name?: string };
    const { name } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Folder name is required.' }, { status: 400 });
    }

    const { data: folder, error } = await supabase
      .from('folders')
      .insert({ name: name.trim(), created_by: session.user.id })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Folder with this name already exists.' }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await supabase.from('audit_logs').insert({
      actor_id: session.user.id,
      actor_name: profile.username,
      action: 'FOLDER_CREATE',
      detail: `Folder "${name.trim()}" created.`,
    });

    return NextResponse.json(folder, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { supabase, session } = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const profile = await getProfile(supabase, session.user.id);
    if (!profile || profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden. Super Admins only.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Folder ID is required.' }, { status: 400 });

    const body = await request.json() as { name?: string };
    const { name } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Folder name is required.' }, { status: 400 });
    }

    const { data: oldFolder } = await supabase.from('folders').select('name').eq('id', id).single();

    const { data: folder, error } = await supabase
      .from('folders')
      .update({ name: name.trim() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Folder with this name already exists.' }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await supabase.from('audit_logs').insert({
      actor_id: session.user.id,
      actor_name: profile.username,
      action: 'FOLDER_RENAME',
      detail: `Folder renamed from "${oldFolder?.name}" to "${name.trim()}".`,
    });

    return NextResponse.json(folder);
  } catch {
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { supabase, session } = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const profile = await getProfile(supabase, session.user.id);
    // Only super_admin can delete folders
    if (!profile || profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden. Super Admins only.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Folder ID is required.' }, { status: 400 });

    // Check if folder has files
    const { count } = await supabase
      .from('files')
      .select('id', { count: 'exact', head: true })
      .eq('folder_id', id);

    if (count && count > 0) {
      return NextResponse.json(
        { error: 'Hindi mabubura ang folder na may laman na files. Burahin muna ang mga files.' },
        { status: 409 }
      );
    }

    const { data: folder } = await supabase.from('folders').select('name').eq('id', id).single();

    const { error } = await supabase.from('folders').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await supabase.from('audit_logs').insert({
      actor_id: session.user.id,
      actor_name: profile.username,
      action: 'FOLDER_DELETE',
      detail: `Folder "${folder?.name}" deleted.`,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
