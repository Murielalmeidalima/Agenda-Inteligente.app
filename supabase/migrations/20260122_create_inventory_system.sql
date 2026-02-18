-- Migration: Create inventory tables
-- Description: Supports stock management for the clinic.

-- 1. Table for Products/Items
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  unit TEXT DEFAULT 'un',
  current_stock NUMERIC DEFAULT 0,
  min_stock NUMERIC DEFAULT 0,
  cost_price NUMERIC,
  sale_price NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Table for Inventory Transactions
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('in', 'out')), -- in = increment, out = decrement
  quantity NUMERIC NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

-- Policies for Products
CREATE POLICY "Users can view products from their company"
  ON products FOR SELECT
  USING (auth.uid() IN (SELECT id FROM profiles WHERE company_id = products.company_id));

CREATE POLICY "Users can manage products from their company"
  ON products FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE company_id = products.company_id));

-- Policies for Transactions
CREATE POLICY "Users can view transactions from their company"
  ON inventory_transactions FOR SELECT
  USING (auth.uid() IN (SELECT id FROM profiles WHERE company_id = inventory_transactions.company_id));

CREATE POLICY "Users can create transactions for their company"
  ON inventory_transactions FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE company_id = inventory_transactions.company_id));

-- Function to update stock automatically on transaction
CREATE OR REPLACE FUNCTION update_stock_level()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.type = 'in') THEN
    UPDATE products SET current_stock = current_stock + NEW.quantity WHERE id = NEW.product_id;
  ELSIF (NEW.type = 'out') THEN
    UPDATE products SET current_stock = current_stock - NEW.quantity WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_stock_on_transaction
AFTER INSERT ON inventory_transactions
FOR EACH ROW EXECUTE FUNCTION update_stock_level();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_company ON products(company_id);
CREATE INDEX IF NOT EXISTS idx_transactions_product ON inventory_transactions(product_id);
