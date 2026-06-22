-- MIGRATION: Create Logos Bucket and Storage Policies

-- 1. Create 'logos' bucket as public
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Select policy: allow public read access
DROP POLICY IF EXISTS "Public access to logos" ON storage.objects;
CREATE POLICY "Public access to logos" ON storage.objects
  FOR SELECT USING (bucket_id = 'logos');

-- 3. Insert policy: allow authenticated users to upload
DROP POLICY IF EXISTS "Authenticated users can upload logos" ON storage.objects;
CREATE POLICY "Authenticated users can upload logos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'logos' AND auth.role() = 'authenticated');

-- 4. Update policy: allow authenticated users to edit
DROP POLICY IF EXISTS "Authenticated users can update logos" ON storage.objects;
CREATE POLICY "Authenticated users can update logos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'logos' AND auth.role() = 'authenticated');

-- 5. Delete policy: allow authenticated users to remove logos
DROP POLICY IF EXISTS "Authenticated users can delete logos" ON storage.objects;
CREATE POLICY "Authenticated users can delete logos" ON storage.objects
  FOR DELETE USING (bucket_id = 'logos' AND auth.role() = 'authenticated');
