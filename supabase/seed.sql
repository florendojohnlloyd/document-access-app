-- ============================================================
-- DocuVault — Seed: First Manager Account
-- ============================================================
-- INSTRUCTIONS:
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Click "Add User" → "Create new user"
-- 3. Email: manager@docaccess.local
-- 4. Password: Manager@123  (change this after first login!)
-- 5. Check "Auto Confirm User" → click "Create User"
-- 6. Copy the UUID of the newly created user
-- 7. Replace 'PASTE-UUID-HERE' below with that UUID
-- 8. Run this SQL in the Supabase SQL Editor
-- ============================================================

-- Step 1: Update the auto-created profile to manager role
-- (The trigger already created a 'user' profile — we just upgrade it)
UPDATE public.profiles
SET
  role        = 'manager',
  full_name   = 'System Manager',
  name_locked = true
WHERE username = 'manager';

-- ============================================================
-- OPTIONAL: Create a test user account
-- Do the same steps above but with email: user1@docaccess.local
-- Then run:
-- UPDATE public.profiles SET full_name = 'Test User', name_locked = false WHERE username = 'user1';
-- ============================================================
