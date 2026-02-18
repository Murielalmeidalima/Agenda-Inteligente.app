-- ============================================
-- SEED FINANCE DATA - Execute AFTER migration
-- ============================================
-- Este arquivo cria as categorias e contas padrão para sua empresa

-- ============================================
-- OPTION 1: Automatic (finds your company_id from profile)
-- ============================================
DO $$
DECLARE
  my_company_id uuid;
BEGIN
  -- Get company_id from current user's profile
  SELECT company_id INTO my_company_id
  FROM profiles
  WHERE id = auth.uid()
  LIMIT 1;

  -- Check if company_id was found
  IF my_company_id IS NULL THEN
    RAISE EXCEPTION 'Company ID not found for current user. Please check your profile.';
  END IF;

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

  RAISE NOTICE 'Finance defaults created successfully for company: %', my_company_id;
END $$;

-- ============================================
-- OPTION 2: Manual (if Option 1 fails)
-- ============================================
-- If the above doesn't work, find your company_id first:
-- SELECT company_id FROM profiles WHERE id = auth.uid();
-- Then replace 'YOUR_COMPANY_ID_HERE' below and uncomment:

/*
DO $$
DECLARE
  my_company_id uuid := 'YOUR_COMPANY_ID_HERE'; -- Replace with your actual company_id
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
END $$;
*/

-- ============================================
-- VERIFICATION - Check created data
-- ============================================

-- View created categories
SELECT id, name, type, icon, color 
FROM financial_categories 
WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
ORDER BY type, name;

-- View created accounts
SELECT id, name, bank_name, balance, is_default
FROM financial_accounts
WHERE company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
ORDER BY is_default DESC, name;

