-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Sistema Multi-Tenant - Agenda Inteligente
-- =====================================================
-- CRÍTICO: Este arquivo implementa isolamento de dados
-- entre empresas/clínicas diferentes no sistema.
-- =====================================================

-- =====================================================
-- 1. COMPANIES TABLE
-- =====================================================
-- Usuários só podem ver/editar dados da própria empresa

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Policy: Ver apenas a própria empresa
CREATE POLICY "users_view_own_company"
ON companies
FOR SELECT
USING (
  id IN (
    SELECT company_id 
    FROM profiles 
    WHERE id = auth.uid()
  )
);

-- Policy: Apenas admins podem atualizar empresa
CREATE POLICY "admins_update_own_company"
ON companies
FOR UPDATE
USING (
  id IN (
    SELECT company_id 
    FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Policy: Criação de empresa (permitir durante registro)
CREATE POLICY "allow_insert_company_on_signup"
ON companies
FOR INSERT
WITH CHECK (true); -- Será restrito por lógica de aplicação


-- =====================================================
-- 2. PROFILES TABLE
-- =====================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Ver perfis da mesma empresa
CREATE POLICY "users_view_same_company_profiles"
ON profiles
FOR SELECT
USING (
  company_id IN (
    SELECT company_id 
    FROM profiles 
    WHERE id = auth.uid()
  )
  OR id = auth.uid() -- Sempre pode ver o próprio perfil
);

-- Policy: Atualizar apenas o próprio perfil (ou admin pode atualizar todos da empresa)
CREATE POLICY "users_update_own_profile"
ON profiles
FOR UPDATE
USING (
  id = auth.uid()
  OR (
    company_id IN (
      SELECT company_id 
      FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
);

-- Policy: Inserir perfil (permitir durante registro)
CREATE POLICY "allow_insert_profile_on_signup"
ON profiles
FOR INSERT
WITH CHECK (
  id = auth.uid() -- Apenas criar perfil para si mesmo
);

-- Policy: Admins podem deletar usuários da própria empresa
CREATE POLICY "admins_delete_company_profiles"
ON profiles
FOR DELETE
USING (
  company_id IN (
    SELECT company_id 
    FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
  AND id != auth.uid() -- Não pode deletar a si mesmo
);


-- =====================================================
-- 3. CLIENTS TABLE
-- =====================================================

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Policy: Ver apenas clientes da própria empresa
CREATE POLICY "users_view_own_company_clients"
ON clients
FOR SELECT
USING (
  company_id IN (
    SELECT company_id 
    FROM profiles 
    WHERE id = auth.uid()
  )
);

-- Policy: Criar clientes apenas para a própria empresa
CREATE POLICY "users_insert_own_company_clients"
ON clients
FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT company_id 
    FROM profiles 
    WHERE id = auth.uid()
  )
);

-- Policy: Atualizar clientes da própria empresa
CREATE POLICY "users_update_own_company_clients"
ON clients
FOR UPDATE
USING (
  company_id IN (
    SELECT company_id 
    FROM profiles 
    WHERE id = auth.uid()
  )
);

-- Policy: Deletar clientes (apenas admins)
CREATE POLICY "admins_delete_own_company_clients"
ON clients
FOR DELETE
USING (
  company_id IN (
    SELECT company_id 
    FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);


-- =====================================================
-- 4. PROCEDURES TABLE
-- =====================================================

ALTER TABLE procedures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_own_company_procedures"
ON procedures
FOR SELECT
USING (
  company_id IN (
    SELECT company_id 
    FROM profiles 
    WHERE id = auth.uid()
  )
);

CREATE POLICY "admins_manage_own_company_procedures"
ON procedures
FOR ALL
USING (
  company_id IN (
    SELECT company_id 
    FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);


-- =====================================================
-- 5. APPOINTMENTS TABLE
-- =====================================================

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Policy: Ver agendamentos da própria empresa
CREATE POLICY "users_view_own_company_appointments"
ON appointments
FOR SELECT
USING (
  company_id IN (
    SELECT company_id 
    FROM profiles 
    WHERE id = auth.uid()
  )
);

-- Policy: Criar agendamentos
CREATE POLICY "users_insert_own_company_appointments"
ON appointments
FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT company_id 
    FROM profiles 
    WHERE id = auth.uid()
  )
);

-- Policy: Atualizar agendamentos
CREATE POLICY "users_update_own_company_appointments"
ON appointments
FOR UPDATE
USING (
  company_id IN (
    SELECT company_id 
    FROM profiles 
    WHERE id = auth.uid()
  )
);

-- Policy: Deletar agendamentos (admins e profissionais)
CREATE POLICY "authorized_delete_own_company_appointments"
ON appointments
FOR DELETE
USING (
  company_id IN (
    SELECT company_id 
    FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'professional')
  )
);


-- =====================================================
-- 6. TRANSACTIONS TABLE
-- =====================================================

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_own_company_transactions"
ON transactions
FOR SELECT
USING (
  company_id IN (
    SELECT company_id 
    FROM profiles 
    WHERE id = auth.uid()
  )
);

-- Apenas admins podem gerenciar transações
CREATE POLICY "admins_manage_own_company_transactions"
ON transactions
FOR ALL
USING (
  company_id IN (
    SELECT company_id 
    FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);


-- =====================================================
-- 7. ANAMNESE TABLES (Se existirem)
-- =====================================================
-- Adicione políticas similares para:
-- - anamnese_templates
-- - anamnese_questions
-- - anamnese_responses
-- - anamnese_answers
-- - anamnese_tokens

-- Exemplo para anamnese_templates:
-- ALTER TABLE anamnese_templates ENABLE ROW LEVEL SECURITY;
-- 
-- CREATE POLICY "users_view_own_company_templates"
-- ON anamnese_templates
-- FOR SELECT
-- USING (
--   company_id IN (
--     SELECT company_id 
--     FROM profiles 
--     WHERE id = auth.uid()
--   )
-- );
-- 
-- CREATE POLICY "admins_manage_own_company_templates"
-- ON anamnese_templates
-- FOR ALL
-- USING (
--   company_id IN (
--     SELECT company_id 
--     FROM profiles 
--     WHERE id = auth.uid() AND role = 'admin'
--   )
-- );


-- =====================================================
-- 8. INVENTORY TABLES (Se existirem)
-- =====================================================
-- Exemplo para inventory_items:
-- ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
-- 
-- CREATE POLICY "users_view_own_company_inventory"
-- ON inventory_items
-- FOR SELECT
-- USING (
--   company_id IN (
--     SELECT company_id 
--     FROM profiles 
--     WHERE id = auth.uid()
--   )
-- );


-- =====================================================
-- 9. NOTIFICATIONS TABLE (Se existir)
-- =====================================================
-- ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
-- 
-- CREATE POLICY "users_view_own_notifications"
-- ON notifications
-- FOR SELECT
-- USING (
--   user_id = auth.uid()
--   OR company_id IN (
--     SELECT company_id 
--     FROM profiles 
--     WHERE id = auth.uid()
--   )
-- );


-- =====================================================
-- VERIFICAÇÃO
-- =====================================================
-- Executar para verificar se todas as políticas foram criadas:

-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;


-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================
-- 1. Teste todas as políticas após aplicar
-- 2. Verifique se usuários não conseguem acessar dados de outras empresas
-- 3. Service Role Key ainda bypassará RLS (use com cuidado)
-- 4. Para endpoints públicos (anamnese), use service role mas valide tokens
-- 5. Monitore performance - índices podem ser necessários em company_id
