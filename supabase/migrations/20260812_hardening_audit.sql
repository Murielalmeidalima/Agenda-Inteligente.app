-- =====================================================================
-- AGENDA INTELIGENTE — HARDENING PÓS-AUDITORIA DE SEGURANÇA
-- Data: 12/08/2026
--
-- Aplicar no SQL Editor do Supabase (projeto: nvcmrsvrezjetppopjwy)
--
-- IMPORTANTE:
--   • 100% INCREMENTAL — nenhuma tabela é recriada/apagada. SEM perda de dados.
--   • Pode ser executado de uma vez ou passo a passo (está dividido em PASSOs).
--   • Todos os comandos usam IF EXISTS / são idempotentes onde possível.
--
-- Corresponde aos achados do relatório de auditoria:
--   [1] CRÍTICA  RLS aberto em companies (SELECT + INSERT anônimos)
--   [2] ALTA     IDOR/BOLA — qualquer autenticado lia todas as empresas
--   [3] MÉDIA    Signup aberto (parte SQL: gate de aprovação no RLS)
--   [5] BAIXA    Storage 'logos' com listagem aberta
-- =====================================================================

BEGIN;

-- =====================================================================
-- PASSO 0 — LIMPEZA DOS ARTEFATOS DEIXADOS PELA AUDITORIA
-- (registro de teste criado sem autenticação + conta de teste)
-- =====================================================================
DELETE FROM public.companies
WHERE id = '50400cd5-621a-45f5-a4d3-863278ecb988';

-- O profile herda a deleção via FK (ON DELETE CASCADE)
DELETE FROM auth.users
WHERE email = 'testevacilo12345@proton.me';

-- =====================================================================
-- PASSO 1 — HELPERS DE SEGURANÇA REUTILIZADOS NAS POLICIES
-- =====================================================================

-- Garante a coluna de aprovação (idempotente)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS approved boolean DEFAULT false;

-- Empresa do usuário autenticado (mantida; usada por todas as policies)
CREATE OR REPLACE FUNCTION public.get_my_company_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid();
$$;

-- True somente se o usuário foi aprovado por um admin
CREATE OR REPLACE FUNCTION public.is_approved()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT COALESCE(approved, false) FROM public.profiles WHERE id = auth.uid();
$$;

-- Papel (role) do usuário autenticado
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT role::text FROM public.profiles WHERE id = auth.uid();
$$;

-- =====================================================================
-- PASSO 2 — ACHADOS [1] e [2]: BLOQUEIO TOTAL DO RLS EM companies
-- =====================================================================

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Remove QUALQUER policy existente em companies (abertas/antigas/duplicadas),
-- incluindo "allow_insert_company_on_signup" (WITH CHECK true) e variants anon.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'companies'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.companies', r.policyname);
  END LOOP;
END $$;

-- SELECT: apenas a PRÓPRIA empresa E usuário aprovado
CREATE POLICY "companies_select_own_approved"
ON public.companies FOR SELECT
USING (
  id = public.get_my_company_id()
  AND public.is_approved()
);

-- UPDATE: apenas ADMIN da própria empresa E aprovado
CREATE POLICY "companies_update_own_admin"
ON public.companies FOR UPDATE
USING (
  id = public.get_my_company_id()
  AND public.is_approved()
  AND public.get_my_role() = 'admin'
)
WITH CHECK (
  id = public.get_my_company_id()
  AND public.is_approved()
);

-- NÃO criamos policies de INSERT nem DELETE:
--   • INSERT  → bloqueado (default deny). A criação de empresa passa 100%
--               pelo service role (/api/auth/setup-tenant ou RPC
--               register_company_and_user), que ignora RLS.
--   • DELETE  → bloqueado (default deny).

-- Defense in depth: revoga INSERT/DELETE do anon/authenticated em companies
-- (mantém SELECT/UPDATE para o authenticated, necessário no dashboard).
REVOKE INSERT, DELETE ON public.companies FROM anon, authenticated;

-- =====================================================================
-- PASSO 3 — ACHADO [2]/[3]: GATE DE APROVAÇÃO NAS TABELAS DE DADOS
-- Reforça que usuário NÃO aprovado não leia/escreva dados de clientes,
-- agenda, financeiro, serviços e produtos (defense in depth).
-- =====================================================================

DO $$
DECLARE t text;
DECLARE r record;
BEGIN
  FOREACH t IN ARRAY ARRAY['clients','appointments','transactions','procedures','products']
  LOOP
    -- Só processa se a tabela existir
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = t
    ) THEN
      -- Remove todas as policies atuais da tabela
      FOR r IN
        SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = t
      LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, t);
      END LOOP;

      -- Recria com isolamento por empresa E exigência de aprovação
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

      EXECUTE format('CREATE POLICY "%s_select_own_approved" ON public.%I FOR SELECT USING (company_id = public.get_my_company_id() AND public.is_approved())', t, t);
      EXECUTE format('CREATE POLICY "%s_insert_own_approved" ON public.%I FOR INSERT WITH CHECK (company_id = public.get_my_company_id() AND public.is_approved())', t, t);
      EXECUTE format('CREATE POLICY "%s_update_own_approved" ON public.%I FOR UPDATE USING (company_id = public.get_my_company_id() AND public.is_approved())', t, t);
      EXECUTE format('CREATE POLICY "%s_delete_own_approved" ON public.%I FOR DELETE USING (company_id = public.get_my_company_id() AND public.is_approved())', t, t);
    END IF;
  END LOOP;
END $$;

-- =====================================================================
-- PASSO 4 — ACHADO [5]: STORAGE 'logos'
-- Bloqueia a LISTAGEM do bucket mantendo a leitura pública por URL.
-- (Bucket público: objetos continuam acessíveis via URL pública mesmo sem
--  policy de SELECT; a listagem (/object/list) exige policy de SELECT.)
-- =====================================================================

-- Remove as policies de SELECT (leitura/listagem) do bucket logos
DROP POLICY IF EXISTS "Public access to logos" ON storage.objects;
DROP POLICY IF EXISTS "Logos Public View" ON storage.objects;
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;

-- Garante que o bucket continue público (necessário para exibir logo em
-- img tags, e-mails e landing) — não altera os objetos já armazenados.
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Garante policies de escrita simples (somente autenticado) SEM exigir pasta
-- (o app faz upload no caminho raiz "{companyId}-{timestamp}.jpg").
-- OBS: policies por pasta (storage.foldername) serão adotadas na Fase 2
-- junto com a mudança de caminho de upload no código do app.
DROP POLICY IF EXISTS "Logos Auth Upload Secure" ON storage.objects;
DROP POLICY IF EXISTS "Logos Auth Update Secure" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete logos" ON storage.objects;
CREATE POLICY "Authenticated users can upload logos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'logos' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update logos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'logos' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete logos" ON storage.objects
  FOR DELETE USING (bucket_id = 'logos' AND auth.role() = 'authenticated');

-- =====================================================================
-- VERIFICAÇÃO (rodar após aplicar)
-- =====================================================================
-- 1. Nenhuma policy anônima ou aberta deve restar:
--    SELECT schemaname, tablename, policyname, cmd
--    FROM pg_policies
--    WHERE schemaname = 'public' AND (policyname ILIKE '%anon%' OR policyname ILIKE '%open%');
--
-- 2. Estado do RLS nas tabelas principais:
--    SELECT relname, relrowsecurity
--    FROM pg_class
--    WHERE relname IN ('companies','clients','appointments','transactions','procedures','products');
--
-- 3. Policies de companies (deve haver apenas as 2 novas):
--    SELECT policyname, cmd, roles
--    FROM pg_policies
--    WHERE schemaname = 'public' AND tablename = 'companies';

COMMIT;
