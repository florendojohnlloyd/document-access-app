import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

async function getSession() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return { supabase, session };
}

async function getProfile(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
  return data;
}

// GET /api/folders — returns all folders (flat list, client builds tree)
// GET /api/folders?parent_id=xxx — returns subfolders of a parent
export async function GET(request: NextRequest) {
  try {
    const { supabase, session } = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get('parent_id');

    let query = supabase
      .from('folders')
      .select('*')
      .order('name');

    if (parentId === 'root') {
      query = query.is('parent_folder_id', null);
    } else if (parentId) {
      query = query.eq('parent_folder_id', parentId);
    }

    const { data: folders, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(folders);
  } catch {
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}

// POST /api/folders — create folder (optionally nested)
export async function POST(request: NextRequest) {
  try {
    const { supabase, session } = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const profile = await getProfile(supabase, session.user.id);
    if (!profile || !['super_admin', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    const body = await request.json() as { name?: string; parent_folder_id?: string | null };
    const { name, parent_folder_id } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Folder name is required.' }, { status: 400 });
    }

    // Only allow 2 levels deep (root → subfolder)
    if (parent_folder_id) {
      const { data: parent } = await supabase
        .from('folders')
        .select('parent_folder_id')
        .eq('id', parent_folder_id)
        .single();

      if (parent?.parent_folder_id) {
        return NextResponse.json(
          { error: 'Maximum 2 levels of folders allowed.' },
          { status: 400 }
        );
      }
    }

    const { data: folder, error } = await supabase
      .from('folders')
      .insert({
        name: name.trim(),
        created_by: session.user.id,
        parent_folder_id: parent_folder_id ?? null,
      })
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
      detail: parent_folder_id
        ? `Sub-folder "${name.trim()}" created.`
        : `Folder "${name.trim()}" created.`,
    });

    return NextResponse.json(folder, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}

// PATCH /api/folders?id=xxx — rename folder (super_admin only)
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

// DELETE /api/folders?id=xxx — delete folder (admin + super_admin)
export async function DELETE(request: NextRequest) {
  try {
    const { supabase, session } = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const profile = await getProfile(supabase, session.user.id);
    if (!profile || !['super_admin', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Folder ID is required.' }, { status: 400 });

    // Check if folder has files
    const { count: fileCount } = await supabase
      .from('files')
      .select('id', { count: 'exact', head: true })
      .eq('folder_id', id);

    if (fileCount && fileCount > 0) {
      return NextResponse.json(
        { error: 'Hindi mabubura ang folder na may laman na files. Burahin muna ang mga files.' },
        { status: 409 }
      );
    }

    // Check if folder has subfolders
    const { count: subCount } = await supabase
      .from('folders')
      .select('id', { count: 'exact', head: true })
      .eq('parent_folder_id', id);

    if (subCount && subCount > 0) {
      return NextResponse.json(
        { error: 'Hindi mabubura ang folder na may sub-folder. Burahin muna ang mga sub-folder.' },
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
