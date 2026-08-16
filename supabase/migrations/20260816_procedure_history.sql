-- =====================================================================
-- AGENDA INTELIGENTE — HISTÓRICO TÉCNICO DO PROCEDIMENTO
-- Data: 16/08/2026
-- Aplicar no SQL Editor do Supabase (projeto: nvcmrsvrezjetppopjwy)
--
-- OBJETIVO:
--   Suportar a funcionalidade de "Observação técnica do procedimento":
--   registrar (clinical_notes / materials_used / complications) por
--   atendimento e consultar a última observação do MESMO cliente +
--   procedimento.
--
-- DECISÃO DE AUDITORIA:
--   REUTILIZA a tabela `appointment_medical_records` (Ficha de Atendimento)
--   já usada pelo app (edit-appointment-modal.tsx). NENHUMA tabela nova.
--
-- DIFERENÇAS EM RELAÇÃO ÀS MIGRATIONS PENDENTES:
--   1. `client_id` torna-se NULLABLE nas tabelas médicas para permitir que a
--      exclusão de cliente preserve o histórico (mesma política das
--      transações: client_id = NULL em vez de apagar).
--   2. Garante índices para as buscas do histórico por cliente/procedimento.
--   3. 100% IDEMPOTENTE: pode rodar de uma vez, sem perda de dados.
-- =====================================================================

BEGIN;

-- =====================================================================
-- PASSO 1 — HELPERS DE SEGURANÇA (idempotentes; redefinem se já existirem)
-- =====================================================================
CREATE OR REPLACE FUNCTION public.get_my_company_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_approved()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT COALESCE(approved, false) FROM public.profiles WHERE id = auth.uid();
$$;

-- =====================================================================
-- PASSO 2 — TABELA appointment_medical_records (Ficha de Atendimento)
-- Contém a OBSERVAÇÃO TÉCNICA do procedimento:
--   • clinical_notes  -> técnica utilizada, preferências, cuidados, observações
--   • materials_used  -> produto, quantidade, cor, número/lote
--   • complications   -> reações ou informações relevantes
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.appointment_medical_records (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE CASCADE,
  professional_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  clinical_notes text,
  materials_used text,
  complications text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- client_id NULLABLE: permite preservar o histórico ao excluir o cliente
ALTER TABLE public.appointment_medical_records
  ALTER COLUMN client_id DROP NOT NULL;

-- Mesma garantia nas demais tabelas médicas (consistência da política)
ALTER TABLE IF EXISTS public.patient_progress_notes
  ALTER COLUMN client_id DROP NOT NULL;
ALTER TABLE IF EXISTS public.medical_records
  ALTER COLUMN client_id DROP NOT NULL;
ALTER TABLE IF EXISTS public.medical_attachments
  ALTER COLUMN client_id DROP NOT NULL;

-- Índices de busca do histórico (cliente -> atendimentos -> fichas)
CREATE INDEX IF NOT EXISTS idx_amr_company ON public.appointment_medical_records(company_id);
CREATE INDEX IF NOT EXISTS idx_amr_client ON public.appointment_medical_records(client_id);
CREATE INDEX IF NOT EXISTS idx_amr_appointment ON public.appointment_medical_records(appointment_id);

-- =====================================================================
-- PASSO 3 — RLS (isolamento multi-tenant + aprovação)
-- =====================================================================
ALTER TABLE public.appointment_medical_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "amr_select_own" ON public.appointment_medical_records;
DROP POLICY IF EXISTS "amr_insert_own" ON public.appointment_medical_records;
DROP POLICY IF EXISTS "amr_update_own" ON public.appointment_medical_records;
DROP POLICY IF EXISTS "amr_delete_own" ON public.appointment_medical_records;
DROP POLICY IF EXISTS "Users can view medical records of their company" ON public.appointment_medical_records;
DROP POLICY IF EXISTS "Users can insert medical records to their company" ON public.appointment_medical_records;
DROP POLICY IF EXISTS "Users can update medical records of their company" ON public.appointment_medical_records;
DROP POLICY IF EXISTS "Users can delete medical records of their company" ON public.appointment_medical_records;

CREATE POLICY "amr_select_own"
  ON public.appointment_medical_records FOR SELECT
  USING (company_id = public.get_my_company_id() AND public.is_approved());
CREATE POLICY "amr_insert_own"
  ON public.appointment_medical_records FOR INSERT
  WITH CHECK (company_id = public.get_my_company_id() AND public.is_approved());
CREATE POLICY "amr_update_own"
  ON public.appointment_medical_records FOR UPDATE
  USING (company_id = public.get_my_company_id() AND public.is_approved());
CREATE POLICY "amr_delete_own"
  ON public.appointment_medical_records FOR DELETE
  USING (company_id = public.get_my_company_id() AND public.is_approved());

-- =====================================================================
-- PASSO 4 — TRIGGER updated_at
-- =====================================================================
CREATE OR REPLACE FUNCTION public.update_amr_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_amr_updated_at ON public.appointment_medical_records;
CREATE TRIGGER update_amr_updated_at
  BEFORE UPDATE ON public.appointment_medical_records
  FOR EACH ROW EXECUTE FUNCTION public.update_amr_updated_at();

-- =====================================================================
-- VERIFICAÇÃO (rodar após aplicar)
-- =====================================================================
-- 1. Tabela e colunas:
--    SELECT table_name, column_name, is_nullable FROM information_schema.columns
--    WHERE table_schema = 'public' AND table_name = 'appointment_medical_records'
--    ORDER BY ordinal_position;
-- 2. Policies:
--    SELECT policyname FROM pg_policies
--    WHERE schemaname = 'public' AND tablename = 'appointment_medical_records';

COMMIT;
