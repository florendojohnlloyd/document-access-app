# Deploy Supabase Edge Function for Unlimited File Uploads

## Prerequisites
1. Install Supabase CLI: https://supabase.com/docs/guides/cli
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```
   Get YOUR_PROJECT_REF from: https://supabase.com/dashboard/project/_/settings/general

## Deploy the Edge Function

```bash
cd "c:\Users\flore\OneDrive\Desktop\System\Jaloy system\Document Access - Sample\document-access-app"
supabase functions deploy upload-file
```

## Verify Deployment

1. Go to: https://supabase.com/dashboard/project/_/functions
2. You should see `upload-file` function listed
3. Status should be "Active"

## Test the Function

The upload endpoint will be:
```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/upload-file
```

The app will automatically use this endpoint after deployment.

## Benefits

✅ **NO FILE SIZE LIMIT** - Supabase Edge Functions can handle files up to 50GB
✅ **No Vercel 4.5MB limit** - Bypasses Next.js/Vercel completely
✅ **Better performance** - Direct upload to Supabase infrastructure
✅ **Progress tracking** - Still supported with XMLHttpRequest
