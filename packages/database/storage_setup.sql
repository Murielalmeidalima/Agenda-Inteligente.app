-- 1. Create the 'logos' bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow Public Read Access (Anyone can view the logo)
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'logos' );

-- 3. Allow Authenticated Uploads (Only logged-in users can upload)
CREATE POLICY "Authenticated Upload Access"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'logos' AND auth.role() = 'authenticated' );

-- 4. Allow Updates (Optional, if you want users to replace files)
CREATE POLICY "Authenticated Update Access"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'logos' AND auth.role() = 'authenticated' );
