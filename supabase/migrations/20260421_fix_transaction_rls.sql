-- Migration: Fix Transaction RLS
-- Description: Allow all authenticated users within a company to insert transactions, 
--              so that professionals and receptionists can record payments.

-- 1. Check if the policy already exists to avoid errors
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'transactions' AND policyname = 'users_insert_own_company_transactions'
    ) THEN
        CREATE POLICY "users_insert_own_company_transactions"
        ON transactions FOR INSERT
        WITH CHECK (
          company_id IN (
            SELECT company_id FROM profiles WHERE id = auth.uid()
          )
        );
    END IF;
END $$;

-- 2. Ensure existing policies are not blocking
-- The policy "admins_manage_own_company_transactions" is FOR ALL, 
-- but since policies are additive (OR), adding the INSERT policy above 
-- is enough to grant access to non-admins.

-- 3. Optional: Add UPDATE policy if you want staff to be able to edit their own entries
-- For now, we'll keep UPDATE restricted to admins as per the original design, 
-- unless specifically requested otherwise.
