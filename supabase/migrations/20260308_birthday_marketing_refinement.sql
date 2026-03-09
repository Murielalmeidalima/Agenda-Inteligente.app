-- Add benefit_text column to automation_rules
ALTER TABLE public.automation_rules 
ADD COLUMN IF NOT EXISTS benefit_text TEXT;

-- Update existing birthday rules if any (optional)
COMMENT ON COLUMN public.automation_rules.benefit_text IS 'Texto do benefício ou desconto oferecido na campanha';
