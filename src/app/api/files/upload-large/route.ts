import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Disable body parsing to handle large files
export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get multipart form data
    const contentType = request.headers.get('content-type') || '';
    
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Content-Type must be multipart/form-data' }, { status: 400 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folderId = formData.get('folder_id') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Get folder info
    let folderName = 'uncategorized';
    let resolvedFolderId: string | null = null;

    if (folderId) {
      const { data: folder } = await supabase
        .from('folders')
        .select('id, name')
        .eq('id', folderId)
        .single();

      if (folder) {
        folderName = folder.name.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
        resolvedFolderId = folder.id;
      }
    }

    // Generate unique path
    const uuid = crypto.randomUUID();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${folderName}/${uuid}_${safeName}`;

    // Upload to Supabase Storage
    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, arrayBuffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 });
    }

    // Save to database
    const { data: fileRecord, error: dbError } = await supabase
      .from('files')
      .insert({
        name: file.name,
        folder_id: resolvedFolderId,
        storage_path: storagePath,
        uploaded_by: session.user.id,
      })
      .select()
      .single();

    if (dbError) {
      await supabase.storage.from('documents').remove([storagePath]);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    // Audit log
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', session.user.id)
      .single();

    await supabase.from('audit_logs').insert({
      actor_id: session.user.id,
      actor_name: profile?.username ?? null,
      action: 'UPLOAD',
      detail: `File "${file.name}" uploaded.`,
    });

    return NextResponse.json(fileRecord, { status: 201 });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
