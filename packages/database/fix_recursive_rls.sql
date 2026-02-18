-- FIX: Infinite Recursion in RLS Policies

-- 1. Create a secure function to check Admin role WITHOUT triggering RLS
-- SECURITY DEFINER means this function runs with the privileges of the creator (postgres/admin),
-- bypassing row-level security checks on the tables it accesses.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
DECLARE
  current_role text;
BEGIN
  SELECT role INTO current_role FROM profiles WHERE id = auth.uid();
  RETURN current_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop the broken recursive policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;

-- 3. Re-create policies using the safe function
CREATE POLICY "Admins can view all profiles" 
ON profiles FOR SELECT 
USING ( public.is_admin() );

CREATE POLICY "Admins can update profiles" 
ON profiles FOR UPDATE 
USING ( public.is_admin() );

-- 4. Ensure "Users can view own profile" is active
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT 
USING ( auth.uid() = id );
