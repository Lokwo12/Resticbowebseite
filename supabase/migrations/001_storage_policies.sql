-- ============================================================
-- Storage Security Policies
-- Run this migration in the Supabase Dashboard → SQL Editor
-- or apply via: supabase db push
-- ============================================================

-- 1. Create public-assets bucket (public read, admin write)
-- Contains: website images, gallery photos, hero images, partner logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'public-assets',
  'public-assets',
  true,
  5242880,  -- 5 MB per file
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Public read: anyone can read public-assets
CREATE POLICY IF NOT EXISTS "Public read on public-assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'public-assets');

-- Admin write: only authenticated admins can upload/update/delete
CREATE POLICY IF NOT EXISTS "Admin insert on public-assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'public-assets'
    AND auth.role() = 'authenticated'
    AND public.is_active_admin()
  );

CREATE POLICY IF NOT EXISTS "Admin update on public-assets"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'public-assets'
    AND auth.role() = 'authenticated'
    AND public.is_active_admin()
  );

CREATE POLICY IF NOT EXISTS "Admin delete on public-assets"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'public-assets'
    AND auth.role() = 'authenticated'
    AND public.is_active_admin()
  );

-- 2. Create private-documents bucket (no public access, admin only)
-- Contains: financial reports, donation receipts, sensitive documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'private-documents',
  'private-documents',
  false,  -- NOT public: objects require signed URLs
  20971520,  -- 20 MB per file
  ARRAY[
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/csv'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Admin-only access to private documents
CREATE POLICY IF NOT EXISTS "Admin full access on private-documents"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'private-documents'
    AND auth.role() = 'authenticated'
    AND public.is_active_admin()
  )
  WITH CHECK (
    bucket_id = 'private-documents'
    AND auth.role() = 'authenticated'
    AND public.is_active_admin()
  );

-- 3. Remove or secure the old general uploads bucket if it exists
-- If you have an existing 'make-2a4be611-uploads' bucket, run:
-- DELETE FROM storage.buckets WHERE id = 'make-2a4be611-uploads';
-- Or restrict it to admin-only if you need to keep it:

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'make-2a4be611-uploads') THEN
    -- Make it non-public first
    UPDATE storage.buckets SET public = false WHERE id = 'make-2a4be611-uploads';

    -- Drop any existing open policies on the old bucket
    DROP POLICY IF EXISTS "Public read" ON storage.objects;
    DROP POLICY IF EXISTS "Public Access" ON storage.objects;

    -- Add admin-only policy
    EXECUTE $policy$
      CREATE POLICY "Admin access make-2a4be611-uploads"
        ON storage.objects FOR ALL
        USING (
          bucket_id = 'make-2a4be611-uploads'
          AND auth.role() = 'authenticated'
          AND public.is_active_admin()
        )
    $policy$;
  END IF;
END;
$$;
