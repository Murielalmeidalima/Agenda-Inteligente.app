
-- 1. APPROVE ALL USERS (Emergency Unblock)
-- This fixes the infinite redirect loop by making everyone "approved"
UPDATE public.profiles 
SET approved = true;

-- 2. REMOVE EXTRA COLUMNS (Restore Schema)
-- Removing 'preferences' if it exists, as the original code doesn't use it
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS preferences;

-- 3. RESTORE FOREIGN KEYS (Fix Relationships)
-- Dropping any temporary constraints we made
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_users_fkey;

-- Re-adding the standard reference to auth.users
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_id_fkey 
FOREIGN KEY (id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- 4. FIX RLS POLICIES (Ensure Access)
-- Drop potentially conflicting policies (Variations)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Add basic policies compatible with original code
CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = id);
