-- Migration: Create strategic goals system
-- Description: Supports goal setting and strategic planning for the clinic.

-- 1. Table for Strategic Goals
CREATE TABLE IF NOT EXISTS strategic_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('revenue', 'appointments', 'procedures', 'products')),
  period TEXT NOT NULL CHECK (period IN ('daily', 'monthly', 'yearly')),
  target_value NUMERIC NOT NULL DEFAULT 0,
  target_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Ensure unique goals per category/period/date/company
  UNIQUE(company_id, category, period, target_date)
);

-- Enable RLS
ALTER TABLE strategic_goals ENABLE ROW LEVEL SECURITY;

-- Policies for Strategic Goals
CREATE POLICY "Users can view goals from their company"
  ON strategic_goals FOR SELECT
  USING (auth.uid() IN (SELECT id FROM profiles WHERE company_id = strategic_goals.company_id));

CREATE POLICY "Users can manage goals from their company"
  ON strategic_goals FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE company_id = strategic_goals.company_id));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_strategic_goals_company ON strategic_goals(company_id);
CREATE INDEX IF NOT EXISTS idx_strategic_goals_category ON strategic_goals(category);
CREATE INDEX IF NOT EXISTS idx_strategic_goals_period ON strategic_goals(period);
