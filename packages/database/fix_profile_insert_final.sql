-- Comprehensive RLS Fix for Registration and Service Creation

-- 1. Ensure Users can create their own Company
DROP POLICY IF EXISTS "Users can create company" ON companies;
CREATE POLICY "Users can create company"
ON companies FOR INSERT
WITH CHECK ( auth.role() = 'authenticated' );

-- 2. Ensure Users can create their own Profile
DROP POLICY IF EXISTS "Users can create own profile" ON profiles;
CREATE POLICY "Users can create own profile"
ON profiles FOR INSERT
WITH CHECK ( auth.uid() = id );

-- 3. Procedures (Services) - Allow creation if company_id matches profile
-- The existing "for all" policy using get_my_company_id() might be insufficient if the user context isn't perfectly set during insert?
-- Actually "for all" should cover it, BUT let's be explicit to avoid confusion.
DROP POLICY IF EXISTS "Users can view company procedures" ON procedures;

-- Split into specific policies for clarity and robustness
CREATE POLICY "Users can view company procedures"
ON procedures FOR SELECT
USING ( company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()) );

CREATE POLICY "Users can insert company procedures"
ON procedures FOR INSERT
WITH CHECK ( company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()) );

CREATE POLICY "Users can update company procedures"
ON procedures FOR UPDATE
USING ( company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()) );

CREATE POLICY "Users can delete company procedures"
ON procedures FOR DELETE
USING ( company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()) );

-- 4. Verify Function get_my_company_id (optional, but good to ensure it exists for other queries)
CREATE OR REPLACE FUNCTION get_my_company_id()
RETURNS uuid AS $$
  select company_id from profiles where id = auth.uid();
$$ language sql stable security definer;
