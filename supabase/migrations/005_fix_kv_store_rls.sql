-- Drop the insecure policy that relies on user_metadata
DROP POLICY IF EXISTS "Admins have full access on kv_store" ON public.kv_store_2a4be611;

-- Enable RLS just in case it wasn't
ALTER TABLE public.kv_store_2a4be611 ENABLE ROW LEVEL SECURITY;

-- Create a secure policy that checks the admin_users table instead of user_metadata
CREATE POLICY "Admins have full access on kv_store" 
ON public.kv_store_2a4be611 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE id = auth.uid()::text 
      AND role IN ('admin', 'super-admin') 
      AND status = 'active'
  )
);
