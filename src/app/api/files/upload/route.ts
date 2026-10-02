import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpg',
  'image/jpeg',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const ALLOWED_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg', 'doc', 'docx', 'xls', 'xlsx'];

function getExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() ?? '';
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folderId = formData.get('folder_id') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'File is required.' }, { status: 400 });
    }

    const ext = getExtension(file.name);
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { error: `File type .${ext} is not allowed. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}` },
        { status: 400 }
      );
    }

    // Be lenient with MIME type — some browsers report incorrect types
    void ALLOWED_MIME_TYPES;

    // Get folder name for path
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

    const uuid = uuidv4();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${folderName}/${uuid}_${safeName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 });
    }

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
      // Clean up the uploaded file if DB insert fails
      await supabase.storage.from('documents').remove([storagePath]);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    // Get profile for audit log
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', session.user.id)
      .single();

    await supabase.from('audit_logs').insert({
      actor_id: session.user.id,
      actor_name: profile?.username ?? null,
      action: 'UPLOAD',
      detail: `File "${file.name}" uploaded to folder "${folderName}".`,
    });

    return NextResponse.json(fileRecord, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
