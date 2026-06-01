-- =====================================================
-- CORREÇÕES DE SEGURANÇA E ARQUITETURA
-- Execute este arquivo no SQL Editor do Supabase para corrigir falhas críticas.
-- =====================================================

-- 1. FUNÇÃO RPC PARA CADASTRO SEGURO E ATÔMICO
-- Essa função garante que a criação de company e profile ocorra numa mesma transação
-- pelo usuário que acabou de se registrar no Auth.
CREATE OR REPLACE FUNCTION register_company_and_user(p_company_name TEXT, p_full_name TEXT)
RETURNS json AS $$
DECLARE
  v_user_id UUID;
  v_company_id UUID;
  v_user_email TEXT;
BEGIN
  -- Obter o ID do usuário que está chamando a função
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Obter o e-mail do auth.users
  SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;

  -- Verificar se o usuário já tem um profile
  IF EXISTS (SELECT 1 FROM profiles WHERE id = v_user_id) THEN
    RAISE EXCEPTION 'Usuário já possui um perfil cadastrado';
  END IF;

  -- 1. Criar a empresa
  INSERT INTO companies (name)
  VALUES (p_company_name)
  RETURNING id INTO v_company_id;

  -- 2. Criar o perfil vinculado (como admin)
  INSERT INTO profiles (id, company_id, full_name, email, role)
  VALUES (v_user_id, v_company_id, p_full_name, v_user_email, 'admin');

  -- Retornar sucesso
  RETURN json_build_object(
    'success', true,
    'company_id', v_company_id,
    'profile_id', v_user_id
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. REMOVER PERMISSÕES INSEGURAS DE INSERÇÃO DIRETA
DROP POLICY IF EXISTS "allow_insert_company_on_signup" ON companies;
DROP POLICY IF EXISTS "Users can create company" ON companies;
DROP POLICY IF EXISTS "allow_insert_profile_on_signup" ON profiles;
DROP POLICY IF EXISTS "Users can create own profile" ON profiles;


-- 3. BLOQUEAR ESCALONAMENTO DE PRIVILÉGIOS (TRIGGER)
-- Criar uma função e uma trigger para impedir que um usuário eleve seu próprio cargo
CREATE OR REPLACE FUNCTION prevent_role_escalation_fn()
RETURNS TRIGGER AS $$
BEGIN
  -- Se for o próprio usuário editando o seu próprio perfil (o que é permitido pelo RLS):
  IF auth.uid() = NEW.id THEN
    -- Ele não pode alterar o próprio papel (role) e o ID da empresa (company_id)
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Não é permitido alterar o próprio nível de acesso (role)';
    END IF;
    
    IF NEW.company_id IS DISTINCT FROM OLD.company_id THEN
      RAISE EXCEPTION 'Não é permitido alterar a própria clínica (company_id)';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_prevent_role_escalation ON profiles;
CREATE TRIGGER trigger_prevent_role_escalation
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION prevent_role_escalation_fn();


-- 4. SEGURANÇA DE STORAGE (PASTAS POR EMPRESA)
-- Corrigindo a política para impedir overwrite de outras empresas.
-- Apenas permite upload se o nome da pasta principal iniciar com o company_id do usuário.
DROP POLICY IF EXISTS "Logos Auth Upload" ON storage.objects;
DROP POLICY IF EXISTS "Logos Auth Upload Secure" ON storage.objects;
CREATE POLICY "Logos Auth Upload Secure"
ON storage.objects FOR INSERT
WITH CHECK ( 
  bucket_id = 'logos' 
  AND auth.role() = 'authenticated' 
  AND (storage.foldername(name))[1] = get_my_company_id()::text
);

DROP POLICY IF EXISTS "Logos Auth Update" ON storage.objects;
DROP POLICY IF EXISTS "Logos Auth Update Secure" ON storage.objects;
CREATE POLICY "Logos Auth Update Secure"
ON storage.objects FOR UPDATE
USING ( 
  bucket_id = 'logos' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = get_my_company_id()::text
);

-- FIM DA MIGRAÇÃO
