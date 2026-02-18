-- 1. Add 'approved' column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS approved boolean DEFAULT false;

-- 2. Set the Super Admin (almeidalima0110@gmail.com) as Approved and Admin
-- Note: User must verify their email in Auth first, or we assume they will match by email.
-- Since auth.users and public.profiles are linked, we update the profile where the email matches.
UPDATE profiles 
SET 
  role = 'admin',
  approved = true 
WHERE email = 'almeidalima0110@gmail.com';

-- 3. Update RLS Policies for Profiles
-- 3. Update RLS Policies for Profiles
-- Allow admins to see ALL profiles (Review pending users)
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" 
ON profiles 
FOR SELECT 
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Allow admins to update profiles (Approve/Block users)
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
CREATE POLICY "Admins can update profiles" 
ON profiles 
FOR UPDATE 
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- Ensure default policy still works for self (already exists: "Users can view own profile")
