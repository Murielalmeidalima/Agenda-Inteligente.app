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
BEGIN
  -- 1. Get product details and price
  SELECT name, 
         CASE WHEN NEW.type = 'out' THEN sale_price ELSE cost_price END
  INTO v_product_name, v_amount
  FROM products WHERE id = NEW.product_id;

  -- 2. Skip if price is null or zero (avoid cluttering finance with non-financial moves)
  IF v_amount IS NULL OR v_amount = 0 THEN
    RETURN NEW;
  END IF;

  -- 3. Determine Category Name
  v_category_name := CASE WHEN NEW.type = 'out' THEN 'Venda Produtos' ELSE 'Produtos' END;

  -- 4. Find Category
  SELECT id INTO v_category_id 
  FROM financial_categories 
  WHERE company_id = NEW.company_id 
  AND (name = v_category_name OR name = 'Outros')
  ORDER BY (CASE WHEN name = v_category_name THEN 0 ELSE 1 END) ASC
  LIMIT 1;

  -- 5. Find Default Account (First one created)
  SELECT id INTO v_account_id 
  FROM financial_accounts 
  WHERE company_id = NEW.company_id 
  ORDER BY created_at ASC LIMIT 1;

  -- 6. Insert Financial Transaction
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
      (CASE WHEN NEW.type = 'out' THEN 'income' ELSE 'expense' END),
      CURRENT_DATE
    );
    
    -- 7. Update Account Balance (Matching the application logic)
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
