# Deploy Supabase Edge Function for Unlimited File Uploads

## Your Project Details
- **Project Ref**: `oidcihmopmkhjqoxrbot`
- **Edge Function URL**: `https://oidcihmopmkhjqoxrbot.supabase.co/functions/v1/upload-file`

## Prerequisites
1. Install Supabase CLI: https://supabase.com/docs/guides/cli
   ```powershell
   npm install -g supabase
   ```

2. Login to Supabase:
   ```powershell
   supabase login
   ```

3. Link your project:
   ```powershell
   cd "c:\Users\flore\OneDrive\Desktop\System\Jaloy system\Document Access - Sample\document-access-app"
   supabase link --project-ref oidcihmopmkhjqoxrbot
   ```

## Deploy the Edge Function

```powershell
supabase functions deploy upload-file
```

## Verify Deployment

1. Go to: https://supabase.com/dashboard/project/oidcihmopmkhjqoxrbot/functions
2. You should see `upload-file` function listed
3. Status should be "Active"

## Test Upload

After deployment, the app will automatically use:
```
https://oidcihmopmkhjqoxrbot.supabase.co/functions/v1/upload-file
```

## Benefits

✅ **NO FILE SIZE LIMIT** - Supabase Edge Functions can handle files up to 50GB
✅ **No Vercel 4.5MB limit** - Bypasses Next.js/Vercel completely
✅ **Better performance** - Direct upload to Supabase infrastructure
✅ **Progress tracking** - Still supported with XMLHttpRequest
