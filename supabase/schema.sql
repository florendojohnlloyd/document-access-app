-- ============================================================
-- Document Access System — Supabase Schema
-- Run this in the Supabase SQL Editor: https://app.supabase.com
-- ============================================================

-- ============================================================
-- 1. PROFILES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id            uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username      text        UNIQUE NOT NULL,
  full_name     text,
  role          text        NOT NULL DEFAULT 'user' CHECK (role IN ('manager', 'user')),
  name_locked   boolean     NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies: profiles
CREATE POLICY "Authenticated users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role can insert profiles"
  ON public.profiles FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can delete profiles"
  ON public.profiles FOR DELETE
  TO service_role
  USING (true);

-- ============================================================
-- 2. FOLDERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.folders (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        UNIQUE NOT NULL,
  created_by  uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

-- Policies: folders
CREATE POLICY "Authenticated users can view folders"
  ON public.folders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers can create folders"
  ON public.folders FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

CREATE POLICY "Managers can update folders"
  ON public.folders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

CREATE POLICY "Managers can delete folders"
  ON public.folders FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- ============================================================
-- 3. FILES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.files (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text        NOT NULL,
  folder_id     uuid        REFERENCES public.folders(id) ON DELETE RESTRICT,
  storage_path  text        NOT NULL,
  uploaded_by   uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- Policies: files
CREATE POLICY "Authenticated users can view files"
  ON public.files FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can upload files"
  ON public.files FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Managers can update files"
  ON public.files FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

CREATE POLICY "Managers can delete files"
  ON public.files FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
  );

-- ============================================================
-- 4. AUDIT LOGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_name  text,
  action      text        NOT NULL,
  detail      text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies: audit_logs
CREATE POLICY "Authenticated users can insert audit logs"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Service role can insert audit logs"
  ON public.audit_logs FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Managers can view all audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'manager'
    )
    OR actor_id = auth.uid()
  );

-- ============================================================
-- 5. TRIGGER: auto-create profile on new auth user
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, role)
  VALUES (
    new.id,
    split_part(new.email, '@', 1),  -- extracts username from email
    'user'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 6. STORAGE BUCKET
-- Create this manually in Supabase Dashboard → Storage:
--   Bucket name: documents
--   Public: NO (private)
-- Or run:
-- ============================================================
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('documents', 'documents', false)
-- ON CONFLICT DO NOTHING;

-- Storage RLS policies (run separately if needed):
-- CREATE POLICY "Authenticated users can upload"
--   ON storage.objects FOR INSERT
--   TO authenticated
--   WITH CHECK (bucket_id = 'documents');
--
-- CREATE POLICY "Authenticated users can read"
--   ON storage.objects FOR SELECT
--   TO authenticated
--   USING (bucket_id = 'documents');
--
-- CREATE POLICY "Managers can delete"
--   ON storage.objects FOR DELETE
--   TO authenticated
--   USING (
--     bucket_id = 'documents' AND
--     EXISTS (
--       SELECT 1 FROM public.profiles
--       WHERE id = auth.uid() AND role = 'manager'
--     )
--   );

-- ============================================================
-- 7. SEED DATA (uncomment to run)
-- Creates initial manager and user accounts.
-- IMPORTANT: After running this SQL, create the corresponding
-- Supabase Auth users in Dashboard → Authentication → Users
-- with emails: manager@docaccess.local and user1@docaccess.local
-- OR use the app's Add User feature after logging in as manager.
-- ============================================================

-- INSERT INTO public.profiles (id, username, role, full_name, name_locked)
-- VALUES
--   ('YOUR-MANAGER-UUID', 'manager', 'manager', 'System Manager', true),
--   ('YOUR-USER1-UUID',   'user1',   'user',    null,              false)
-- ON CONFLICT DO NOTHING;

-- ============================================================
-- END OF SCHEMA
-- ============================================================
