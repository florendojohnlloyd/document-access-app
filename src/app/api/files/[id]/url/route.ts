import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: file } = await supabase
      .from('files')
      .select('storage_path, name')
      .eq('id', id)
      .single();

    if (!file) {
      return NextResponse.json({ error: 'File not found.' }, { status: 404 });
    }

    const { createServiceClient } = await import('@/lib/supabase/server');
    const adminSupabase = createServiceClient();

    // Check if this is a multipart file with a manifest
    const { data: manifestBlob } = await adminSupabase.storage
      .from('documents')
      .download(`${file.storage_path}.manifest.json`);

    let isMultipart = false;
    let manifestData = null;
    let signedUrls: string[] = [];

    if (manifestBlob) {
      try {
        const text = await manifestBlob.text();
        manifestData = JSON.parse(text);
        if (manifestData?.totalParts && manifestData.totalParts > 0) {
          isMultipart = true;
          for (let i = 0; i < manifestData.totalParts; i++) {
            const { data: partSign } = await adminSupabase.storage
              .from('documents')
              .createSignedUrl(`${file.storage_path}.part_${i}`, 3600);
            if (partSign?.signedUrl) {
              signedUrls.push(partSign.signedUrl);
            }
          }
        }
      } catch (err) {
        console.warn('Failed to parse multipart manifest:', err);
      }
    }

    let singleUrl = '';
    if (!isMultipart) {
      const { data: signedUrlData, error } = await adminSupabase.storage
        .from('documents')
        .createSignedUrl(file.storage_path, 3600);

      if (error || !signedUrlData) {
        return NextResponse.json({ error: 'Could not generate signed URL.' }, { status: 500 });
      }
      singleUrl = signedUrlData.signedUrl;
    }

    // Log the VIEW action in the audit trail
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, full_name')
      .eq('id', session.user.id)
      .single();

    await supabase.from('audit_logs').insert({
      actor_id: session.user.id,
      actor_name: profile?.full_name || profile?.username || session.user.id,
      action: 'VIEW',
      detail: `Viewed file: ${file.name}`,
    });

    if (isMultipart) {
      return NextResponse.json({
        isMultipart: true,
        manifest: manifestData,
        signedUrls,
        name: file.name,
      });
    }

    return NextResponse.json({
      isMultipart: false,
      url: singleUrl,
      name: file.name,
    });
  } catch {
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
