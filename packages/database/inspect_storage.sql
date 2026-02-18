-- Check if the 'logos' bucket exists
SELECT * FROM storage.buckets WHERE id = 'logos';

-- Check RLS policies on storage.objects
SELECT * FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects';
