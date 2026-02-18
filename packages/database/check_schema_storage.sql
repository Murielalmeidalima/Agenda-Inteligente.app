-- Check companies table schema
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'companies';

-- Check existing buckets
SELECT id, name, public FROM storage.buckets;

-- Check existing storage policies
SELECT * FROM pg_policies WHERE schemaname = 'storage';
