-- Execute no SQL Editor do Supabase para corrigir o erro "row-level security policy"

-- 1. Permite ver as imagens (Leitura Pública)
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'logos' );

-- 2. Permite enviar imagens (Upload para usuários logados)
CREATE POLICY "Authenticated Upload Access"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'logos' AND auth.role() = 'authenticated' );

-- 3. Permite atualizar imagens antigas
CREATE POLICY "Authenticated Update Access"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'logos' AND auth.role() = 'authenticated' );
