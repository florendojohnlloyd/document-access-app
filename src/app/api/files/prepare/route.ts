import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';

const ALLOWED_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg', 'doc', 'docx', 'xls', 'xlsx', 'zip'];

function getExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() ?? '';
}

// Prepare upload metadata - returns signed upload URL for direct Supabase upload (bypasses 4.5MB Vercel limit)
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

    const body = await request.json() as { filename?: string; folder_id?: string };
    const { filename, folder_id } = body;

    if (!filename) {
      return NextResponse.json({ error: 'Filename is required.' }, { status: 400 });
    }

    const ext = getExtension(filename);
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { error: `File type .${ext} is not allowed. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}` },
        { status: 400 }
      );
    }

    // Get folder name for path
    let folderName = 'uncategorized';
    let resolvedFolderId: string | null = null;

    if (folder_id) {
      const { data: folder } = await supabase
        .from('folders')
        .select('id, name')
        .eq('id', folder_id)
        .single();

      if (folder) {
        folderName = folder.name.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
        resolvedFolderId = folder.id;
      }
    }

    const uuid = uuidv4();
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${folderName}/${uuid}_${safeName}`;

    // Create a signed upload URL via service role so client can upload directly without limits
    const adminSupabase = createServiceClient();
    const { data: signData, error: signError } = await adminSupabase.storage
      .from('documents')
      .createSignedUploadUrl(storagePath);

    if (signError || !signData) {
      console.error('Failed to create signed upload URL:', signError);
      return NextResponse.json({ error: `Upload prep failed: ${signError?.message ?? 'Unknown'}` }, { status: 500 });
    }

    return NextResponse.json({
      storagePath,
      signedUrl: signData.signedUrl,
      token: signData.token,
      folder_id: resolvedFolderId,
      filename,
    });
  } catch (error) {
    console.error('Prepare upload error:', error);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}

