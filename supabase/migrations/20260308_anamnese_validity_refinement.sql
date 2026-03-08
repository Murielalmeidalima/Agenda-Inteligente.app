-- Refinando validade da anamnese para permitir dias, meses ou anos
ALTER TABLE anamnese_templates 
DROP COLUMN IF EXISTS validity_months,
ADD COLUMN validity_value INTEGER DEFAULT 6,
ADD COLUMN validity_unit TEXT DEFAULT 'months' CHECK (validity_unit IN ('days', 'months', 'years'));

-- Atualizando as respostas existentes se houver (opcional, mas bom pra consistência)
UPDATE anamnese_templates SET validity_value = 6, validity_unit = 'months' WHERE validity_value IS NULL;
