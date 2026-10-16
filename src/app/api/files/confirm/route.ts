import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Confirm upload and save file record to database
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, username')
      .eq('id', session.user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found.' }, { status: 403 });
    }

    const body = await request.json() as {
      filename?: string;
      storage_path?: string;
      folder_id?: string;
    };

    const { filename, storage_path, folder_id } = body;

    if (!filename || !storage_path) {
      return NextResponse.json({ error: 'Filename and storage_path are required.' }, { status: 400 });
    }

    // Verify the file exists in storage using admin client to ensure check succeeds
    const firstSlashIndex = storage_path.indexOf('/');
    const folder = firstSlashIndex !== -1 ? storage_path.slice(0, firstSlashIndex) : '';
    const filePart = firstSlashIndex !== -1 ? storage_path.slice(firstSlashIndex + 1) : storage_path;

    const { createServiceClient } = await import('@/lib/supabase/server');
    const adminSupabase = createServiceClient();

    const { data: fileList, error: listError } = await adminSupabase.storage
      .from('documents')
      .list(folder, {
        search: filePart,
      });

    if (listError || !fileList || fileList.length === 0) {
      console.warn('File verification warning in confirm:', { listError, fileList, folder, filePart });
      // If search had formatting differences, also check if createSignedUrl works as fallback verification
      const { data: signedCheck } = await adminSupabase.storage
        .from('documents')
        .createSignedUrl(storage_path, 60);

      if (!signedCheck?.signedUrl) {
        return NextResponse.json({ error: 'File not found in storage.' }, { status: 404 });
      }
    }

    // Save to database
    const { data: fileRecord, error: dbError } = await supabase
      .from('files')
      .insert({
        name: filename,
        folder_id: folder_id || null,
        storage_path: storage_path,
        uploaded_by: session.user.id,
      })
      .select()
      .single();

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }


    // Audit log
    await supabase.from('audit_logs').insert({
      actor_id: session.user.id,
      actor_name: profile.username ?? null,
      action: 'UPLOAD',
      detail: `File "${filename}" uploaded.`,
    });

    return NextResponse.json(fileRecord, { status: 201 });
  } catch (error) {
    console.error('Upload confirmation error:', error);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
