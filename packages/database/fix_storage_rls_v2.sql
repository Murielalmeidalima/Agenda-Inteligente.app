-- Execute no SQL Editor do Supabase para corrigir DEFINITIVAMENTE o erro de permissão

-- 1. Remove policies antigas que podem estar conflitando
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update Access" ON storage.objects;
DROP POLICY IF EXISTS "Permitir Upload Logos" ON storage.objects;
DROP POLICY IF EXISTS "Permitir Visualizar Logos" ON storage.objects;
DROP POLICY IF EXISTS "Give me access" ON storage.objects; -- Nome comum de policy genérica

-- 2. Recria as regras do zero para o bucket 'logos'

-- Regra: Todo mundo pode VER
CREATE POLICY "Logos Public View"
ON storage.objects FOR SELECT
USING ( bucket_id = 'logos' );

-- Regra: Usuário logado pode FAZER UPLOAD
CREATE POLICY "Logos Auth Upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'logos' AND auth.role() = 'authenticated' );

-- Regra: Usuário logado pode ATUALIZAR/SUBSTITUIR
CREATE POLICY "Logos Auth Update"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'logos' AND auth.role() = 'authenticated' );
