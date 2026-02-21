-- ================================================================
-- SCRIPT 2: CONFIGURAR SUPER ADMIN
-- Email: almeidalima0110@gmail.com
--
-- ▶ Execute APÓS fazer o cadastro com esse e-mail na plataforma.
--   Ou use o Passo 1 abaixo para criar diretamente pelo SQL.
-- ================================================================

-- ─── OPÇÃO A: Aprovar e promover após cadastro normal ─────────────────────────
-- 1. Cadastre com o e-mail almeidalima0110@gmail.com em /auth/register
-- 2. Execute este SQL no Supabase SQL Editor:

UPDATE public.profiles
SET 
  approved = true,
  role = 'super_admin'
WHERE email = 'almeidalima0110@gmail.com';

-- Verificar se funcionou:
SELECT id, email, role, approved FROM public.profiles 
WHERE email = 'almeidalima0110@gmail.com';
-- Deve retornar: role = super_admin | approved = true ✅

-- ================================================================
-- CONFIGURAR TRIGGER: Auto-notificação de novos cadastros
-- Sempre que uma nova clínica se cadastrar, inserir notificação
-- na tabela de notifications para o super admin ver no painel.
-- ================================================================

-- Criar a função do trigger
CREATE OR REPLACE FUNCTION notify_super_admin_on_new_registration()
RETURNS TRIGGER AS $$
DECLARE
  v_super_admin_id UUID;
  v_company_id UUID;
BEGIN
  -- Encontrar o super admin (almeidalima0110@gmail.com)
  SELECT id, company_id INTO v_super_admin_id, v_company_id
  FROM public.profiles
  WHERE role = 'super_admin'
  ORDER BY created_at ASC
  LIMIT 1;

  -- Só notifica se encontrou o super admin
  IF v_super_admin_id IS NOT NULL THEN
    INSERT INTO public.notifications (
      company_id,
      title,
      message,
      type,
      is_read,
      created_at
    ) VALUES (
      v_company_id,
      '🏥 Nova clínica aguardando aprovação',
      'O e-mail ' || NEW.email || ' se cadastrou e aguarda aprovação.',
      'info',
      false,
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS on_new_profile_notify_admin ON public.profiles;

-- Criar o trigger: dispara após INSERT em profiles, quando approved = false
CREATE TRIGGER on_new_profile_notify_admin
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  WHEN (NEW.approved = false)
  EXECUTE FUNCTION notify_super_admin_on_new_registration();

-- ================================================================
-- CONFIGURAR TRIGGER: Auto-aprovação do próprio super admin
-- Garante que almeidalima0110@gmail.com seja sempre aprovado
-- automaticamente, mesmo que cadastre do zero.
-- ================================================================

CREATE OR REPLACE FUNCTION auto_approve_super_admin()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o e-mail for o do super admin, aprovar automaticamente
  IF NEW.email = 'almeidalima0110@gmail.com' THEN
    NEW.approved := true;
    NEW.role := 'super_admin';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS auto_approve_super_admin_trigger ON public.profiles;

-- Criar o trigger: dispara ANTES de INSERT em profiles
CREATE TRIGGER auto_approve_super_admin_trigger
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_approve_super_admin();

-- ================================================================
-- DASHBOARD DE APROVAÇÃO: Policy RLS para super admin ver todos
-- ================================================================

-- Permitir que o super_admin veja todos os perfis (para aprovar)
DROP POLICY IF EXISTS "Super admin pode ver todos os perfis" ON public.profiles;

CREATE POLICY "Super admin pode ver todos os perfis"
ON public.profiles
FOR SELECT
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE role = 'super_admin'
  )
  OR auth.uid() = id  -- usuário vê o próprio perfil
);

-- Permitir que o super_admin atualize qualquer perfil (para aprovar)
DROP POLICY IF EXISTS "Super admin pode aprovar perfis" ON public.profiles;

CREATE POLICY "Super admin pode aprovar perfis"
ON public.profiles
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE role = 'super_admin'
  )
  OR auth.uid() = id  -- usuário atualiza o próprio perfil
);

-- ─── CONFIRMAÇÃO FINAL ────────────────────────────────────────────────────────
SELECT 
  'Triggers ativos' AS status,
  trigger_name
FROM information_schema.triggers
WHERE trigger_name IN (
  'on_new_profile_notify_admin',
  'auto_approve_super_admin_trigger'
);
