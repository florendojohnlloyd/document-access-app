import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: file } = await supabase
      .from('files')
      .select('storage_path, name')
      .eq('id', params.id)
      .single();

    if (!file) {
      return NextResponse.json({ error: 'File not found.' }, { status: 404 });
    }

    const { data: signedUrlData, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(file.storage_path, 3600); // 1 hour expiry

    if (error || !signedUrlData) {
      return NextResponse.json({ error: 'Could not generate signed URL.' }, { status: 500 });
    }

    return NextResponse.json({ url: signedUrlData.signedUrl, name: file.name });
  } catch {
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
