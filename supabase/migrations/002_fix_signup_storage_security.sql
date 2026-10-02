-- HatodJasaan - Migration 002
-- Run this AFTER 001_initial_schema.sql. Safe to run more than once.
--
-- What it fixes:
--   1. "Database error saving new user"  -> the sign-up trigger could not find the profiles table
--   2. Anyone being able to register as an admin (the browser could ask for role = 'admin')
--   3. Users approving themselves / promoting themselves by editing their own row
--   4. Missing storage buckets + upload rules (registration uploads ID documents)

DO $$
BEGIN
  IF to_regclass('public.profiles') IS NULL THEN
    RAISE EXCEPTION 'public.profiles not found - run 001_initial_schema.sql first, then run this file.';
  END IF;
END $$;

-- 1) Helper: is the signed-in user an admin?
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) AND role = 'admin'
  );
$$;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

-- 2) Sign-up trigger: create the profile row for every new auth user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  requested_role text := NEW.raw_user_meta_data ->> 'role';
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'full_name'), ''), 'User'),
    -- Only these three roles can be chosen at sign-up. 'admin' can never be requested from the browser.
    CASE WHEN requested_role IN ('customer', 'business', 'rider')
         THEN requested_role::public.user_role
         ELSE 'customer'::public.user_role END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Make sure the trigger exists (it normally does, from 001)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'on_auth_user_created' AND tgrelid = 'auth.users'::regclass
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- Give a profile to any auth user that is missing one
INSERT INTO public.profiles (id, email, full_name, role)
SELECT u.id, COALESCE(u.email, ''),
       COALESCE(NULLIF(BTRIM(u.raw_user_meta_data ->> 'full_name'), ''), 'User'),
       'customer'::public.user_role
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id);

-- 3) Only admins may change role / approval status
--    (the server's service-role key and the Supabase dashboard are still allowed)
CREATE OR REPLACE FUNCTION public.protect_profile_privileges()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  -- Nobody signed in = server key / dashboard / SQL editor: allowed. (Kept as its own IF so that
  -- visitors without a session never need permission to run is_admin().)
  IF (SELECT auth.uid()) IS NULL THEN
    RETURN NEW;
  END IF;
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;
  IF NEW.role IS DISTINCT FROM OLD.role OR NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'Only an admin can change role or approval status' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_privileges ON public.profiles;
CREATE TRIGGER protect_profile_privileges
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_privileges();

CREATE OR REPLACE FUNCTION public.protect_business_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    RETURN NEW;
  END IF;
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.status := 'pending';
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'Only an admin can change approval status' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_business_status ON public.businesses;
CREATE TRIGGER protect_business_status
  BEFORE INSERT OR UPDATE ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.protect_business_status();

-- 4) Storage buckets (documents is PRIVATE: IDs and selfies must not be public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
  ('avatars',    'avatars',    true,  5242880,  ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('businesses', 'businesses', true,  5242880,  ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('menu',       'menu',       true,  5242880,  ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('documents',  'documents',  false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Upload rules. Files live in a folder named after the owner:
--   avatars / documents -> <user id>/...      businesses / menu -> <business id>/...
DROP POLICY IF EXISTS "HJ users manage own avatar and document files" ON storage.objects;
CREATE POLICY "HJ users manage own avatar and document files" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id IN ('avatars', 'documents')
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  )
  WITH CHECK (
    bucket_id IN ('avatars', 'documents')
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

-- (objects.name = the file path; plain "name" would wrongly mean businesses.name inside the sub-query)
DROP POLICY IF EXISTS "HJ business owners manage logo, cover and menu images" ON storage.objects;
CREATE POLICY "HJ business owners manage logo, cover and menu images" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id IN ('businesses', 'menu')
    AND EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id::text = (storage.foldername(objects.name))[1] AND b.owner_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    bucket_id IN ('businesses', 'menu')
    AND EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id::text = (storage.foldername(objects.name))[1] AND b.owner_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "HJ admins can read verification documents" ON storage.objects;
CREATE POLICY "HJ admins can read verification documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'documents' AND public.is_admin());
