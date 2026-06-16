-- Migration: Sync Inventory to Finance
-- Description: Automatically creates a financial transaction when inventory changes.

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

-- Trigger
DROP TRIGGER IF EXISTS trigger_sync_inventory_to_finance ON inventory_transactions;
CREATE TRIGGER trigger_sync_inventory_to_finance
AFTER INSERT ON inventory_transactions
FOR EACH ROW EXECUTE FUNCTION sync_inventory_to_finance();
