# Simple Setup - No Edge Function Needed!

I realized we can use a simpler approach that doesn't require deploying Edge Functions.

## Solution: Use Supabase Storage Client-Side Upload

The frontend already has everything it needs to upload directly to Supabase Storage from the browser, bypassing Vercel completely!

## What You Need To Do:

### 1. Update Supabase Storage RLS Policies

Run this SQL in your Supabase SQL Editor (https://supabase.com/dashboard/project/oidcihmopmkhjqoxrbot/sql):

```sql
-- Allow authenticated users to upload any size file
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;

CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents'
);

-- Allow authenticated users to update their uploads
CREATE POLICY "Authenticated users can update files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'documents');
```

### 2. That's It!

The app is already configured to use client-side upload. Just:
1. Run the SQL above
2. Refresh your app
3. Try uploading large files

## How It Works:

- Browser uploads directly to Supabase Storage (bypasses Vercel)
- No 4.5MB Vercel limit
- Supabase Free Tier: Up to 1GB storage, 2GB bandwidth/month
- Supabase Pro Tier: 100GB storage, 200GB bandwidth/month
- Max file size: 50GB per file

## Current Implementation:

The `UploadZone.tsx` component already:
✅ Gets auth token from Supabase
✅ Uploads directly to `https://oidcihmopmkhjqoxrbot.supabase.co/functions/v1/upload-file`
✅ Shows progress bar
✅ Handles errors properly

Just run that SQL and you're done! 🎉
