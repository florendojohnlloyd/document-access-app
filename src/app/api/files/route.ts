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

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, branch')
      .eq('id', session.user.id)
      .single();

    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get('folder_id');

    let query = supabase
      .from('files')
      .select(`
        *,
        folder:folders(id, name, parent_folder_id, created_by, created_at),
        uploader:profiles!files_uploaded_by_fkey(id, username, full_name, role, branch, name_locked, created_at)
      `)
      .order('created_at', { ascending: false });

    if (profile && profile.role !== 'super_admin' && profile.branch) {
      // Non-super_admin: only show files in their branch folder or sub-folders of their branch
      
      // Step 1: Get ALL folders with the branch name (at any level)
      const { data: branchFolders } = await supabase
        .from('folders')
        .select('id, name, parent_folder_id')
        .eq('name', profile.branch);

      if (!branchFolders || branchFolders.length === 0) {
        return NextResponse.json([]);
      }

      // Step 2: For each branch folder, get its children
      const branchFolderIds: string[] = [];
      for (const branchFolder of branchFolders) {
        branchFolderIds.push(branchFolder.id);
        
        // Get children of this branch folder
        const { data: childFolders } = await supabase
          .from('folders')
          .select('id')
          .eq('parent_folder_id', branchFolder.id);
        
        if (childFolders) {
          branchFolderIds.push(...childFolders.map((f) => f.id));
        }
      }

      if (folderId) {
        // If a specific folder is requested, verify it's within the user's branch
        if (!branchFolderIds.includes(folderId)) {
          return NextResponse.json([]);
        }
        query = query.eq('folder_id', folderId);
      } else {
        // Otherwise, show all files within the branch folders
        query = query.in('folder_id', branchFolderIds);
      }
    } else if (folderId) {
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
    if (!profile || !['super_admin', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
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
    if (!profile || !['super_admin', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const body = await request.json().catch(() => null) as { ids?: string[] } | null;

    let targetIds: string[] = [];
    if (body?.ids && Array.isArray(body.ids)) {
      targetIds = body.ids.filter((id): id is string => typeof id === 'string' && id.trim().length > 0);
    } else if (searchParams.get('ids')) {
      targetIds = searchParams.get('ids')!.split(',').map((s) => s.trim()).filter(Boolean);
    } else if (searchParams.get('id')) {
      targetIds = [searchParams.get('id')!.trim()];
    }

    if (targetIds.length === 0) {
      return NextResponse.json({ error: 'At least one file ID is required.' }, { status: 400 });
    }

    // Fetch the files to be deleted
    const { data: filesToDelete, error: fetchError } = await supabase
      .from('files')
      .select('*')
      .in('id', targetIds);

    if (fetchError || !filesToDelete || filesToDelete.length === 0) {
      return NextResponse.json({ error: 'No files found to delete.' }, { status: 404 });
    }

    // Branch check for non-super_admin: verify all target files belong to their branch
    if (profile.role !== 'super_admin' && profile.branch) {
      const { data: branchFolders } = await supabase
        .from('folders')
        .select('id, name, parent_folder_id')
        .eq('name', profile.branch);

      const branchFolderIds: string[] = [];
      if (branchFolders) {
        for (const branchFolder of branchFolders) {
          branchFolderIds.push(branchFolder.id);
          const { data: childFolders } = await supabase
            .from('folders')
            .select('id')
            .eq('parent_folder_id', branchFolder.id);
          if (childFolders) {
            branchFolderIds.push(...childFolders.map((f) => f.id));
          }
        }
      }

      const unauthorized = filesToDelete.some((f) => !f.folder_id || !branchFolderIds.includes(f.folder_id));
      if (unauthorized) {
        return NextResponse.json({ error: 'You can only delete files in your branch.' }, { status: 403 });
      }
    }

    // Prepare paths to delete from storage
    const { createServiceClient } = await import('@/lib/supabase/server');
    const adminSupabase = createServiceClient();

    const allPathsToDelete: string[] = [];
    for (const file of filesToDelete) {
      allPathsToDelete.push(file.storage_path, `${file.storage_path}.manifest.json`);
      try {
        const { data: manifestBlob } = await adminSupabase.storage
          .from('documents')
          .download(`${file.storage_path}.manifest.json`);

        if (manifestBlob) {
          const text = await manifestBlob.text();
          const manifest = JSON.parse(text);
          if (manifest?.totalParts) {
            for (let i = 0; i < manifest.totalParts; i++) {
              allPathsToDelete.push(`${file.storage_path}.part_${i}`);
            }
          }
        }
      } catch {}
    }

    // Remove from storage in batch
    if (allPathsToDelete.length > 0) {
      const { error: storageError } = await adminSupabase.storage
        .from('documents')
        .remove(allPathsToDelete);

      if (storageError) {
        console.error('Storage batch delete error:', storageError);
      }
    }

    // Delete records from database
    const actualDeletedIds = filesToDelete.map((f) => f.id);
    const { error: dbError } = await supabase
      .from('files')
      .delete()
      .in('id', actualDeletedIds);

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    // Audit log
    const fileNames = filesToDelete.map((f) => `"${f.name}"`).join(', ');
    await supabase.from('audit_logs').insert({
      actor_id: session.user.id,
      actor_name: profile.username,
      action: 'FILE_DELETE',
      detail: actualDeletedIds.length === 1
        ? `File ${fileNames} deleted.`
        : `${actualDeletedIds.length} files deleted: ${fileNames.length > 150 ? fileNames.substring(0, 150) + '...' : fileNames}`,
    });

    return NextResponse.json({ success: true, count: actualDeletedIds.length, deletedIds: actualDeletedIds });
  } catch (err) {
    console.error('DELETE files error:', err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}

