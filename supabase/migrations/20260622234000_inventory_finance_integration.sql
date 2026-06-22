-- Migration: Integration of Inventory and Finance modules
-- Description: Create product_sales table, links transactions to sales, and overrides the sync trigger to skip sales.

CREATE TABLE IF NOT EXISTS product_sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  quantity NUMERIC NOT NULL,
  unit_price NUMERIC NOT NULL,
  total_amount NUMERIC NOT NULL,
  paid_amount NUMERIC NOT NULL DEFAULT 0.00,
  pending_balance NUMERIC NOT NULL DEFAULT 0.00,
  payment_method TEXT,
  payment_status TEXT NOT NULL CHECK (payment_status IN ('paid', 'pending', 'partial')),
  account_id UUID REFERENCES financial_accounts(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'cancelled')),
  sale_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE product_sales ENABLE ROW LEVEL SECURITY;

-- Policies for product_sales
DROP POLICY IF EXISTS "Users can view company product sales" ON product_sales;
CREATE POLICY "Users can view company product sales" ON product_sales
  FOR SELECT USING (company_id = get_my_company_id());

DROP POLICY IF EXISTS "Users can manage company product sales" ON product_sales;
CREATE POLICY "Users can manage company product sales" ON product_sales
  FOR ALL USING (company_id = get_my_company_id());

-- Add sale_id column to transactions
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS sale_id UUID REFERENCES product_sales(id) ON DELETE SET NULL;

-- Redefine sync_inventory_to_finance trigger function to ignore sales
CREATE OR REPLACE FUNCTION sync_inventory_to_finance()
RETURNS TRIGGER AS $$
DECLARE
  v_category_id UUID;
  v_account_id UUID;
  v_amount NUMERIC;
  v_product_name TEXT;
  v_category_name TEXT;
  v_type TEXT;
BEGIN
  -- Ignorar se a transação for uma venda (pois vendas geram transações financeiras diretamente e com controle refinado)
  IF NEW.reason ILIKE 'Venda%' THEN
    RETURN NEW;
  END IF;

  -- 1. Obter detalhes do produto e o preço apropriado
  SELECT name, 
         CASE WHEN NEW.type = 'out' THEN sale_price ELSE cost_price END
  INTO v_product_name, v_amount
  FROM products WHERE id = NEW.product_id;

  -- 2. Ignorar se o valor for nulo ou zero (evita poluir o financeiro com movimentações sem valor comercial)
  IF v_amount IS NULL OR v_amount = 0 THEN
    RETURN NEW;
  END IF;

  -- 3. Definir nomes de categorias e tipo de transação
  IF NEW.type = 'out' THEN
    v_category_name := 'Venda de Produtos';
    v_type := 'income';
  ELSE
    v_category_name := 'Materiais';
    v_type := 'expense';
  END IF;

  -- 4. Encontrar a Categoria Financeira (busca por nome exato, nome alternativo, ou fallback para qualquer categoria daquele tipo)
  SELECT id INTO v_category_id 
  FROM financial_categories 
  WHERE company_id = NEW.company_id 
  AND (
    name ILIKE v_category_name 
    OR name ILIKE 'Venda Produtos' 
    OR name ILIKE 'Produtos'
    OR name ILIKE 'Outros'
    OR type = v_type::financial_category_type
  )
  ORDER BY (
    CASE 
      WHEN name ILIKE v_category_name THEN 0 
      WHEN name ILIKE 'Venda Produtos' THEN 1
      WHEN name ILIKE 'Produtos' THEN 2
      ELSE 3 
    END
  ) ASC
  LIMIT 1;

  -- 5. Encontrar a Conta Padrão (Caixa Clínica ou primeira criada)
  SELECT id INTO v_account_id 
  FROM financial_accounts 
  WHERE company_id = NEW.company_id 
  ORDER BY (CASE WHEN name = 'Caixa Clínica' THEN 0 ELSE 1 END) ASC, created_at ASC 
  LIMIT 1;

  -- 6. Inserir a Transação Financeira se categoria e conta forem válidas
  IF v_category_id IS NOT NULL AND v_account_id IS NOT NULL THEN
    INSERT INTO transactions (
      company_id,
      category_id,
      account_id,
      description,
      amount,
      type,
      date
    ) VALUES (
      NEW.company_id,
      v_category_id,
      v_account_id,
      (CASE WHEN NEW.type = 'out' THEN 'Venda: ' ELSE 'Compra: ' END) || v_product_name,
      v_amount * NEW.quantity,
      v_type::transaction_type,
      CURRENT_DATE
    );
    
    -- 7. Atualizar o saldo da conta financeira
    UPDATE financial_accounts 
    SET balance = balance + (CASE WHEN NEW.type = 'out' THEN 1 ELSE -1 END) * (v_amount * NEW.quantity)
    WHERE id = v_account_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
