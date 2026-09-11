-- ============================================================
-- Promote User to Super Admin
-- Run this script in your Supabase SQL Editor
-- ============================================================

-- This script promotes any user with 'denis' in their name or email
-- to be an active super-admin, granting them full access to all
-- dashboard features (create, edit, delete, etc.) without failure.

-- First, ensure all auth.users are copied into admin_users if missing
INSERT INTO public.admin_users (id, email, name, role, status)
SELECT 
  id::text, 
  email, 
  COALESCE(raw_user_meta_data->>'name', split_part(email, '@', 1)), 
  'viewer', 
  'pending'
FROM auth.users
WHERE email ILIKE '%denis%' OR raw_user_meta_data->>'name' ILIKE '%denis%'
ON CONFLICT (id) DO NOTHING;

-- Then, promote them to super-admin and active
UPDATE public.admin_users
SET 
  role = 'super-admin',
  status = 'active',
  updated_at = NOW()
WHERE 
  name ILIKE '%denis%' OR 
  email ILIKE '%denis%';

-- Verify the update
SELECT id, email, name, role, status FROM public.admin_users WHERE name ILIKE '%denis%' OR email ILIKE '%denis%';
