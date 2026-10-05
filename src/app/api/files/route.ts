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

export async function GET(request: NextRequest) {
  try {
    const { supabase, session } = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get('folder_id');

    let query = supabase
      .from('files')
      .select(`
        *,
        folder:folders(id, name, created_by, created_at),
        uploader:profiles!files_uploaded_by_fkey(id, username, full_name, role, name_locked, created_at)
      `)
      .order('created_at', { ascending: false });

    if (folderId) {
      query = query.eq('folder_id', folderId);
    }

    const { data: files, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(files);
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
    if (!id) return NextResponse.json({ error: 'File ID is required.' }, { status: 400 });

    const body = await request.json() as { name?: string };
    const { name } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'File name is required.' }, { status: 400 });
    }

    const { data: oldFile } = await supabase.from('files').select('name').eq('id', id).single();

    const { data: file, error } = await supabase
      .from('files')
      .update({ name: name.trim() })
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await supabase.from('audit_logs').insert({
      actor_id: session.user.id,
      actor_name: profile.username,
      action: 'FILE_RENAME',
      detail: `File renamed from "${oldFile?.name}" to "${name.trim()}".`,
    });

    return NextResponse.json(file);
  } catch {
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { supabase, session } = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const profile = await getProfile(supabase, session.user.id);
    if (!profile || profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden. Super Admins only.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'File ID is required.' }, { status: 400 });

    const { data: file } = await supabase.from('files').select('*').eq('id', id).single();
    if (!file) return NextResponse.json({ error: 'File not found.' }, { status: 404 });

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('documents')
      .remove([file.storage_path]);

    if (storageError) {
      console.error('Storage delete error:', storageError);
      // Continue with database delete even if storage delete fails
    }

    // Delete from database
    const { error: dbError } = await supabase.from('files').delete().eq('id', id);
    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

    await supabase.from('audit_logs').insert({
      actor_id: session.user.id,
      actor_name: profile.username,
      action: 'FILE_DELETE',
      detail: `File "${file.name}" deleted.`,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
