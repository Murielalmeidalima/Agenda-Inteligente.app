-- =========================================================================
-- MIGRATION: ADD COLUMNS FOR MULTIPLE PROCEDURES IN APPOINTMENTS
-- =========================================================================
-- Execute este script no SQL Editor do Supabase para suportar
-- múltiplos procedimentos em um único agendamento e o total financeiro.
-- =========================================================================

-- Adiciona a coluna para procedimentos adicionais se ela não existir
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS additional_procedure_ids uuid[] DEFAULT '{}';

-- Adiciona a coluna para armazenar o valor total (sobrescrevendo o preço do procedimento primário se necessário)
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS price_override decimal(10,2);
