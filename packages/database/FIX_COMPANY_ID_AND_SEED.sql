-- ============================================
-- STEP 1: Find your company_id
-- ============================================
-- Execute esta query primeiro para encontrar seu company_id:

SELECT 
  p.id as profile_id,
  p.company_id,
  c.name as company_name,
  p.email
FROM profiles p
LEFT JOIN companies c ON p.company_id = c.id
WHERE p.id = auth.uid();

-- ============================================
-- STEP 2: If company_id is NULL, find all companies
-- ============================================
-- Se o resultado acima mostrar company_id = NULL, execute esta query
-- para ver todas as empresas disponíveis:

SELECT id, name, created_at 
FROM companies 
ORDER BY created_at DESC;

-- ============================================
-- STEP 3: Update your profile with company_id (if needed)
-- ============================================
-- Se você encontrou uma empresa na query acima, atualize seu perfil:
-- Substitua 'YOUR_COMPANY_ID_HERE' pelo ID da empresa que você encontrou

/*
UPDATE profiles 
SET company_id = 'YOUR_COMPANY_ID_HERE'
WHERE id = auth.uid();
*/

-- ============================================
-- STEP 4: Seed finance data with your company_id
-- ============================================
-- Depois de confirmar que seu perfil tem company_id, 
-- substitua 'YOUR_COMPANY_ID_HERE' abaixo e execute:

DO $$
DECLARE
  my_company_id uuid := 'YOUR_COMPANY_ID_HERE'; -- ⚠️ SUBSTITUA AQUI
BEGIN
  -- Insert default accounts
  INSERT INTO financial_accounts (company_id, name, bank_name, balance, is_default)
  VALUES 
  (my_company_id, 'Caixa Clínica', 'Interno', 0.00, true),
  (my_company_id, 'Banco Principal', 'Inter', 0.00, false)
  ON CONFLICT DO NOTHING;

  -- Insert default income categories
  INSERT INTO financial_categories (company_id, name, type, icon, color)
  VALUES
  (my_company_id, 'Procedimentos', 'income', 'zap', 'emerald'),
  (my_company_id, 'Consultas', 'income', 'users', 'blue'),
  (my_company_id, 'Venda de Produtos', 'income', 'shopping-bag', 'purple')
  ON CONFLICT DO NOTHING;

  -- Insert default expense categories
  INSERT INTO financial_categories (company_id, name, type, icon, color)
  VALUES
  (my_company_id, 'Aluguel/Condomínio', 'expense', 'home', 'red'),
  (my_company_id, 'Materiais', 'expense', 'package', 'orange'),
  (my_company_id, 'Pessoal', 'expense', 'user-check', 'yellow'),
  (my_company_id, 'Marketing', 'expense', 'megaphone', 'pink')
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Finance defaults created successfully!';
END $$;

-- ============================================
-- VERIFICATION - Check created data
-- ============================================

-- View created categories
SELECT id, name, type, icon, color 
FROM financial_categories 
ORDER BY type, name;

-- View created accounts
SELECT id, name, bank_name, balance, is_default
FROM financial_accounts
ORDER BY is_default DESC, name;
