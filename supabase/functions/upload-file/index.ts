// Supabase Edge Function for file uploads
// Deploy: supabase functions deploy upload-file

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get auth token from header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Verify user
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get form data
    const formData = await req.formData()
    const file = formData.get('file') as File
    const folderId = formData.get('folder_id') as string

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get folder info
    let folderName = 'uncategorized'
    let resolvedFolderId: string | null = null

    if (folderId) {
      const { data: folder } = await supabase
        .from('folders')
        .select('id, name')
        .eq('id', folderId)
        .single()

      if (folder) {
        folderName = folder.name.toLowerCase().replace(/[^a-z0-9-_]/g, '-')
        resolvedFolderId = folder.id
      }
    }

    // Generate unique filename
    const uuid = crypto.randomUUID()
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storagePath = `${folderName}/${uuid}_${safeName}`

    // Upload to storage
    const fileBuffer = await file.arrayBuffer()
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, fileBuffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      })

    if (uploadError) {
      return new Response(
        JSON.stringify({ error: `Upload failed: ${uploadError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Save to database
    const { data: fileRecord, error: dbError } = await supabase
      .from('files')
      .insert({
        name: file.name,
        folder_id: resolvedFolderId,
        storage_path: storagePath,
        uploaded_by: user.id,
      })
      .select()
      .single()

    if (dbError) {
      // Clean up uploaded file
      await supabase.storage.from('documents').remove([storagePath])
      return new Response(
        JSON.stringify({ error: dbError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user profile for audit log
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single()

    // Create audit log
    await supabase.from('audit_logs').insert({
      actor_id: user.id,
      actor_name: profile?.username ?? null,
      action: 'UPLOAD',
      detail: `File "${file.name}" uploaded to folder "${folderName}".`,
    })

    return new Response(
      JSON.stringify(fileRecord),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
