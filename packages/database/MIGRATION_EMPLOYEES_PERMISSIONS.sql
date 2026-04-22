-- MIGRATION: Employee Management & Permissions System

-- 1. Extend PROFILES table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{
  "agenda": {"view": true, "create": true, "edit": true, "delete": false},
  "clients": {"view": true, "create": true, "edit": true, "delete": false},
  "finance": {"view": false, "create": false, "edit": false, "delete": false},
  "marketing": {"view": false, "create": false, "edit": false, "delete": false},
  "inventory": {"view": false, "create": false, "edit": false, "delete": false},
  "reports": {"view": false, "create": false, "edit": false, "delete": false},
  "settings": {"view": false, "create": false, "edit": false, "delete": false}
}'::jsonb;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS authorized_by_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_access TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cargo TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_by_id UUID REFERENCES profiles(id);

-- 2. ACCESS LOGS
CREATE TABLE IF NOT EXISTS employee_access_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'login', 'page_view', 'action_denied'
  resource TEXT, -- 'agenda', 'finance', etc.
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. RLS POLICIES for Access Logs
ALTER TABLE employee_access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own company access logs" ON employee_access_logs
  FOR SELECT USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert own access logs" ON employee_access_logs
  FOR INSERT WITH CHECK (profile_id = auth.uid());

-- 4. Update existing profiles with default permissions if empty
UPDATE profiles 
SET permissions = '{
  "agenda": {"view": true, "create": true, "edit": true, "delete": true},
  "clients": {"view": true, "create": true, "edit": true, "delete": true},
  "finance": {"view": true, "create": true, "edit": true, "delete": true},
  "marketing": {"view": true, "create": true, "edit": true, "delete": true},
  "inventory": {"view": true, "create": true, "edit": true, "delete": true},
  "reports": {"view": true, "create": true, "edit": true, "delete": true},
  "settings": {"view": true, "create": true, "edit": true, "delete": true}
}'::jsonb
WHERE role = 'admin' AND (permissions IS NULL OR permissions = '{}'::jsonb);
