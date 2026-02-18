-- CORREÇÃO DE PERMISSÕES DE CADASTRO
-- Execute este script no SQL Editor do Supabase para corrigir o erro de criação de perfil.

-- 1. Permitir que usuários autenticados criem empresas
DROP POLICY IF EXISTS "Users can create company" ON companies;
CREATE POLICY "Users can create company"
ON companies FOR INSERT
WITH CHECK ( auth.role() = 'authenticated' );

-- 2. Permitir que usuários autenticados criem seus próprios perfis
DROP POLICY IF EXISTS "Users can create own profile" ON profiles;
CREATE POLICY "Users can create own profile"
ON profiles FOR INSERT
WITH CHECK ( auth.uid() = id );

-- 3. Garantir que Policy de Select de empresas e profiles esteja ok
-- (Reafirmando policies existentes para evitar problemas ocultos)

-- Companies: Users sees own company (already in schema.sql but making sure)
DROP POLICY IF EXISTS "Users can view own company" ON companies;
CREATE POLICY "Users can view own company"
ON companies FOR SELECT
USING (id = (select company_id from profiles where id = auth.uid()));

-- Profiles: Users sees own profile
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- 4. Garantir Procedures (Serviços)
-- Caso o usuário vá criar procedimentos logo após o cadastro
DROP POLICY IF EXISTS "Users can insert company procedures" ON procedures;
CREATE POLICY "Users can insert company procedures"
ON procedures FOR INSERT
WITH CHECK ( company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()) );
