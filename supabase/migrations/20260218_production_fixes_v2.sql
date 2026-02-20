
-- 1. ADD PREFERENCES COLUMN
-- Adding JSONB column for user settings (theme, notifications, etc)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{"theme": "system", "notifications": {"email": true, "push": true}}'::jsonb;

-- 2. FIX NOTIFICATIONS RLS (If needed)
-- Ensure users can read notifications for their company
DROP POLICY IF EXISTS "Users can view company notifications" ON notifications;

CREATE POLICY "Users can view company notifications"
ON notifications FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
);

-- 3. ENSURE PROFILES RLS ALLOWS UPDATE
-- (Already handled by restore script, but reinforcing for preferences)
DROP POLICY IF EXISTS "Users can update own preferences" ON profiles;

CREATE POLICY "Users can update own preferences"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
