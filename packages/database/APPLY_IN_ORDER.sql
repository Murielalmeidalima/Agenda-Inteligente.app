-- ============================================
-- MIGRATION FINANCE MODULE - APPLY IN ORDER
-- ============================================
-- Execute este arquivo completo no SQL Editor do Supabase
-- Ordem de execução: Tipos → Tabelas → Políticas → Funções → Seed

-- ============================================
-- STEP 1: Create ENUM Type
-- ============================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'financial_category_type') THEN
        CREATE TYPE financial_category_type AS ENUM ('income', 'expense');
    END IF;
END $$;

-- ============================================
-- STEP 2: Create FINANCIAL_CATEGORIES table
-- ============================================
CREATE TABLE IF NOT EXISTS financial_categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(id) NOT NULL,
  name text NOT NULL,
  type financial_category_type NOT NULL,
  icon text, -- Lucide icon name
  color text, -- Tailwind color class or hex
  is_default boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- ============================================
-- STEP 3: Create FINANCIAL_ACCOUNTS table
-- ============================================
CREATE TABLE IF NOT EXISTS financial_accounts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(id) NOT NULL,
  name text NOT NULL,
  bank_name text,
  balance decimal(10,2) DEFAULT 0.00,
  is_default boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- ============================================
-- STEP 4: Modify TRANSACTIONS table
-- ============================================
-- Add foreign key columns to link with categories and accounts
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES financial_categories(id);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES financial_accounts(id);

-- ============================================
-- STEP 5: Enable Row Level Security (RLS)
-- ============================================
ALTER TABLE financial_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_accounts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 6: Create RLS Policies
-- ============================================
-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view company categories" ON financial_categories;
DROP POLICY IF EXISTS "Users can view company accounts" ON financial_accounts;

-- Create policies
CREATE POLICY "Users can view company categories" ON financial_categories
  FOR ALL USING (company_id = get_my_company_id());

CREATE POLICY "Users can view company accounts" ON financial_accounts
  FOR ALL USING (company_id = get_my_company_id());

-- ============================================
-- STEP 7: Create Helper Functions
-- ============================================

-- Function to update account balance
CREATE OR REPLACE FUNCTION update_account_balance(target_account_id uuid, amount_diff decimal)
RETURNS void AS $$
BEGIN
  UPDATE financial_accounts
  SET balance = balance + amount_diff
  WHERE id = target_account_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to seed default categories and accounts for a company
CREATE OR REPLACE FUNCTION seed_company_finance_defaults(target_company_id uuid)
RETURNS void AS $$
BEGIN
  -- Insert default accounts
  INSERT INTO financial_accounts (company_id, name, bank_name, balance, is_default)
  VALUES 
  (target_company_id, 'Caixa Clínica', 'Interno', 0.00, true),
  (target_company_id, 'Banco Principal', 'Inter', 0.00, false)
  ON CONFLICT DO NOTHING;

  -- Insert default income categories
  INSERT INTO financial_categories (company_id, name, type, icon, color)
  VALUES
  (target_company_id, 'Procedimentos', 'income', 'zap', 'emerald'),
  (target_company_id, 'Consultas', 'income', 'users', 'blue'),
  (target_company_id, 'Venda de Produtos', 'income', 'shopping-bag', 'purple')
  ON CONFLICT DO NOTHING;

  -- Insert default expense categories
  INSERT INTO financial_categories (company_id, name, type, icon, color)
  VALUES
  (target_company_id, 'Aluguel/Condomínio', 'expense', 'home', 'red'),
  (target_company_id, 'Materiais', 'expense', 'package', 'orange'),
  (target_company_id, 'Pessoal', 'expense', 'user-check', 'yellow'),
  (target_company_id, 'Marketing', 'expense', 'megaphone', 'pink')
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 8: Seed Data for Current Company
-- ============================================
-- Execute this to create default categories and accounts for your company
-- Uncomment the line below after applying the migration:
-- SELECT seed_company_finance_defaults(get_my_company_id());

-- ============================================
-- VERIFICATION QUERIES (Optional)
-- ============================================
-- Run these to verify the migration was successful:

-- Check if tables exist
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('financial_categories', 'financial_accounts');

-- Check if columns were added to transactions
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'transactions' AND column_name IN ('category_id', 'account_id');

-- Check RLS policies
-- SELECT tablename, policyname FROM pg_policies WHERE tablename IN ('financial_categories', 'financial_accounts');
