-- Migração para Blindagem Máxima de RLS
-- Protege tabelas essenciais contra acesso público/não autorizado (IDOR/BAC)

-- 1. COMPANIES
ALTER TABLE IF EXISTS companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own company" ON companies;
CREATE POLICY "Users can view their own company"
ON companies FOR SELECT
USING (id = (SELECT company_id FROM profiles WHERE profiles.id = auth.uid()));

DROP POLICY IF EXISTS "Users can update their own company" ON companies;
CREATE POLICY "Users can update their own company"
ON companies FOR UPDATE
USING (id = (SELECT company_id FROM profiles WHERE profiles.id = auth.uid()));

-- 2. CLIENTS
ALTER TABLE IF EXISTS clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view clients of their company" ON clients;
CREATE POLICY "Users can view clients of their company"
ON clients FOR SELECT
USING (company_id = (SELECT company_id FROM profiles WHERE profiles.id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert clients to their company" ON clients;
CREATE POLICY "Users can insert clients to their company"
ON clients FOR INSERT
WITH CHECK (company_id = (SELECT company_id FROM profiles WHERE profiles.id = auth.uid()));

DROP POLICY IF EXISTS "Users can update clients of their company" ON clients;
CREATE POLICY "Users can update clients of their company"
ON clients FOR UPDATE
USING (company_id = (SELECT company_id FROM profiles WHERE profiles.id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete clients of their company" ON clients;
CREATE POLICY "Users can delete clients of their company"
ON clients FOR DELETE
USING (company_id = (SELECT company_id FROM profiles WHERE profiles.id = auth.uid()));

-- 3. APPOINTMENTS
ALTER TABLE IF EXISTS appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view appointments of their company" ON appointments;
CREATE POLICY "Users can view appointments of their company"
ON appointments FOR SELECT
USING (company_id = (SELECT company_id FROM profiles WHERE profiles.id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert appointments to their company" ON appointments;
CREATE POLICY "Users can insert appointments to their company"
ON appointments FOR INSERT
WITH CHECK (company_id = (SELECT company_id FROM profiles WHERE profiles.id = auth.uid()));

DROP POLICY IF EXISTS "Users can update appointments of their company" ON appointments;
CREATE POLICY "Users can update appointments of their company"
ON appointments FOR UPDATE
USING (company_id = (SELECT company_id FROM profiles WHERE profiles.id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete appointments of their company" ON appointments;
CREATE POLICY "Users can delete appointments of their company"
ON appointments FOR DELETE
USING (company_id = (SELECT company_id FROM profiles WHERE profiles.id = auth.uid()));

-- 4. TRANSACTIONS
ALTER TABLE IF EXISTS transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view transactions of their company" ON transactions;
CREATE POLICY "Users can view transactions of their company"
ON transactions FOR SELECT
USING (company_id = (SELECT company_id FROM profiles WHERE profiles.id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert transactions to their company" ON transactions;
CREATE POLICY "Users can insert transactions to their company"
ON transactions FOR INSERT
WITH CHECK (company_id = (SELECT company_id FROM profiles WHERE profiles.id = auth.uid()));

DROP POLICY IF EXISTS "Users can update transactions of their company" ON transactions;
CREATE POLICY "Users can update transactions of their company"
ON transactions FOR UPDATE
USING (company_id = (SELECT company_id FROM profiles WHERE profiles.id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete transactions of their company" ON transactions;
CREATE POLICY "Users can delete transactions of their company"
ON transactions FOR DELETE
USING (company_id = (SELECT company_id FROM profiles WHERE profiles.id = auth.uid()));

-- 5. SUBSCRIPTIONS
ALTER TABLE IF EXISTS subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view subscriptions of their company" ON subscriptions;
CREATE POLICY "Users can view subscriptions of their company"
ON subscriptions FOR SELECT
USING (company_id = (SELECT company_id FROM profiles WHERE profiles.id = auth.uid()));

-- 6. PAYMENTS
ALTER TABLE IF EXISTS payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view payments of their company" ON payments;
CREATE POLICY "Users can view payments of their company"
ON payments FOR SELECT
USING (company_id = (SELECT company_id FROM profiles WHERE profiles.id = auth.uid()));
