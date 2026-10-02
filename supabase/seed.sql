-- ============================================================
-- DocuVault — Create First Manager Account
-- ============================================================
-- STEP 1: Go to Supabase Dashboard → Authentication → Users
--         → Add User → Create new user
--         Email:    manager@docuvault.app
--         Password: Manager@123
--         ✅ Check "Auto Confirm User" → Create User
--
-- STEP 2: Run this SQL in Supabase SQL Editor
-- ============================================================

-- Upgrade the auto-created profile to manager role
UPDATE public.profiles
SET
  role        = 'manager',
  full_name   = 'System Manager',
  name_locked = true
WHERE username = 'manager';

-- Verify it worked (should return 1 row with role = 'manager')
SELECT username, role, full_name FROM public.profiles WHERE username = 'manager';

-- ============================================================
-- Login credentials for the app:
--   Username: manager
--   Password: Manager@123
-- ============================================================
