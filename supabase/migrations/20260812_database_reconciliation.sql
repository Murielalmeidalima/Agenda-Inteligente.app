-- =====================================================================
-- AGENDA INTELIGENTE — RECONCILIAÇÃO DO BANCO COM O CÓDIGO DO APP
-- Data: 12/08/2026
-- Aplicar no SQL Editor do Supabase (projeto: nvcmrsvrezjetppopjwy)
--
-- CORRIGE o "schema drift" detectado nos testes de fluxo:
--   • tabelas usadas pelo app que NÃO existem em produção
--   • colunas usadas pelo app que NÃO existem em produção
--
-- 100% IDEMPOTENTE: pode rodar de uma vez, sem perda de dados.
-- Divide em PASSOs para facilitar a leitura.
-- =====================================================================

BEGIN;

-- =====================================================================
-- PASSO 1 — COLUNAS FALTANTES EM appointments
-- (Cancelamento e reagendamento quebravam sem estas colunas)
-- =====================================================================
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS cancellation_reason text;
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS cancelled_at timestamp with time zone;
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS cancelled_by uuid REFERENCES public.profiles(id);

-- =====================================================================
-- PASSO 2 — COLUNAS FALTANTES EM anamnese_templates
-- (Validade de dias/meses/anos — usada no check-status e no template)
-- =====================================================================
ALTER TABLE public.anamnese_templates
  DROP COLUMN IF EXISTS validity_months;
ALTER TABLE public.anamnese_templates
  ADD COLUMN IF NOT EXISTS validity_value integer DEFAULT 6;
ALTER TABLE public.anamnese_templates
  ADD COLUMN IF NOT EXISTS validity_unit text DEFAULT 'months'
    CHECK (validity_unit IN ('days', 'months', 'years'));
ALTER TABLE public.anamnese_templates
  ADD COLUMN IF NOT EXISTS external_form_url text;

-- =====================================================================
-- PASSO 3 — COLUNAS FALTANTES EM anamnese_responses
-- (LGPD/consentimento + assinatura + PDF — o envio do formulário
--  público falhava silenciosamente sem estas colunas)
-- =====================================================================
ALTER TABLE public.anamnese_responses
  ADD COLUMN IF NOT EXISTS consent_accepted boolean DEFAULT false;
ALTER TABLE public.anamnese_responses
  ADD COLUMN IF NOT EXISTS consent_text text;
ALTER TABLE public.anamnese_responses
  ADD COLUMN IF NOT EXISTS consent_timestamp timestamp with time zone;
ALTER TABLE public.anamnese_responses
  ADD COLUMN IF NOT EXISTS consent_ip text;
ALTER TABLE public.anamnese_responses
  ADD COLUMN IF NOT EXISTS consent_user_agent text;
ALTER TABLE public.anamnese_responses
  ADD COLUMN IF NOT EXISTS signature_image_url text;
ALTER TABLE public.anamnese_responses
  ADD COLUMN IF NOT EXISTS signature_hash text;
ALTER TABLE public.anamnese_responses
  ADD COLUMN IF NOT EXISTS signature_timestamp timestamp with time zone;
ALTER TABLE public.anamnese_responses
  ADD COLUMN IF NOT EXISTS pdf_url text;

-- =====================================================================
-- PASSO 4 — COLUNAS FALTANTES EM appointment_reviews
-- (Métricas agrupadas por mês/ano no Marketing)
-- =====================================================================
ALTER TABLE public.appointment_reviews
  ADD COLUMN IF NOT EXISTS review_month integer DEFAULT EXTRACT(MONTH FROM NOW());
ALTER TABLE public.appointment_reviews
  ADD COLUMN IF NOT EXISTS review_year integer DEFAULT EXTRACT(YEAR FROM NOW());

-- =====================================================================
-- PASSO 5 — COLUNAS FALTANTES EM automation_rules E message_queue
-- =====================================================================
ALTER TABLE public.automation_rules
  ADD COLUMN IF NOT EXISTS benefit_text text;

ALTER TABLE public.message_queue
  ADD COLUMN IF NOT EXISTS appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL;

-- =====================================================================
-- PASSO 6 — TABELA reviews (avaliações)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES public.companies(id) NOT NULL,
  appointment_id uuid REFERENCES public.appointments(id) NOT NULL,
  client_id uuid REFERENCES public.clients(id) NOT NULL,
  professional_id uuid REFERENCES public.profiles(id) NOT NULL,
  procedure_id uuid REFERENCES public.procedures(id) NOT NULL,
  rating int NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  is_public boolean DEFAULT false,
  status text DEFAULT 'pending',
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view company reviews" ON public.reviews;
CREATE POLICY "reviews_select_own_approved"
  ON public.reviews FOR SELECT
  USING (company_id = public.get_my_company_id() AND public.is_approved());

DROP POLICY IF EXISTS "Users can manage company reviews" ON public.reviews;
CREATE POLICY "reviews_insert_own_approved"
  ON public.reviews FOR INSERT
  WITH CHECK (company_id = public.get_my_company_id() AND public.is_approved());

-- =====================================================================
-- PASSO 7 — TABELA review_settings (configurações de avaliação)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.review_settings (
  company_id uuid PRIMARY KEY REFERENCES public.companies(id) ON DELETE CASCADE,
  google_review_url text,
  enable_google_review boolean DEFAULT false,
  feedback_type text DEFAULT 'internal' CHECK (feedback_type IN ('internal', 'external_forms')),
  external_forms_url text,
  min_rating_for_google integer DEFAULT 4,
  created_at timestamp with time zone DEFAULT NOW(),
  updated_at timestamp with time zone DEFAULT NOW()
);

ALTER TABLE public.review_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Clínicas podem ver suas próprias configurações" ON public.review_settings;
CREATE POLICY "review_settings_select_own"
  ON public.review_settings FOR SELECT
  USING (company_id = public.get_my_company_id());

DROP POLICY IF EXISTS "Clínicas podem gerenciar suas próprias configurações" ON public.review_settings;
CREATE POLICY "review_settings_all_own"
  ON public.review_settings FOR ALL
  USING (company_id = public.get_my_company_id());

CREATE OR REPLACE FUNCTION public.update_review_settings_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_review_settings_timestamp ON public.review_settings;
CREATE TRIGGER update_review_settings_timestamp
  BEFORE UPDATE ON public.review_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_review_settings_updated_at();

-- =====================================================================
-- PASSO 8 — TABELA trial_antifraud_records (antifraude do trial)
-- (Sem ela, o cadastro de nova clínica QUEBRA no setup-tenant)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.trial_antifraud_records (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  email text NOT NULL,
  cpf text NOT NULL,
  phone text NOT NULL,
  cnpj text,
  card_hash text,
  ip_address text,
  device_fingerprint text,
  device_browser text,
  device_os text,
  score integer DEFAULT 0,
  is_blocked boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_antifraud_cpf ON public.trial_antifraud_records(cpf);
CREATE INDEX IF NOT EXISTS idx_antifraud_email ON public.trial_antifraud_records(email);
CREATE INDEX IF NOT EXISTS idx_antifraud_phone ON public.trial_antifraud_records(phone);
CREATE INDEX IF NOT EXISTS idx_antifraud_card_hash ON public.trial_antifraud_records(card_hash);
CREATE INDEX IF NOT EXISTS idx_antifraud_cnpj ON public.trial_antifraud_records(cnpj);
CREATE INDEX IF NOT EXISTS idx_antifraud_ip ON public.trial_antifraud_records(ip_address);
CREATE INDEX IF NOT EXISTS idx_antifraud_device ON public.trial_antifraud_records(device_fingerprint);

ALTER TABLE public.trial_antifraud_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "SaaS admins can view antifraud logs" ON public.trial_antifraud_records;
CREATE POLICY "SaaS admins can view antifraud logs" ON public.trial_antifraud_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'super_admin'
    )
  );

-- =====================================================================
-- PASSO 9 — TABELAS MÉDICAS (prontuário / ficha / evolução / anexos)
-- =====================================================================

-- 9.1 medical_records (prontuário geral)
CREATE TABLE IF NOT EXISTS public.medical_records (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  professional_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  content text NOT NULL,
  status text DEFAULT 'finalized' CHECK (status IN ('draft', 'finalized')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_medical_records_client ON public.medical_records(client_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_company ON public.medical_records(company_id);
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "medical_records_select_own" ON public.medical_records;
CREATE POLICY "medical_records_select_own"
  ON public.medical_records FOR SELECT
  USING (company_id = public.get_my_company_id() AND public.is_approved());
DROP POLICY IF EXISTS "medical_records_insert_own" ON public.medical_records;
CREATE POLICY "medical_records_insert_own"
  ON public.medical_records FOR INSERT
  WITH CHECK (company_id = public.get_my_company_id() AND public.is_approved());
DROP POLICY IF EXISTS "medical_records_update_own" ON public.medical_records;
CREATE POLICY "medical_records_update_own"
  ON public.medical_records FOR UPDATE
  USING (company_id = public.get_my_company_id() AND public.is_approved());

-- 9.2 appointment_medical_records (ficha de atendimento)
CREATE TABLE IF NOT EXISTS public.appointment_medical_records (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE CASCADE,
  professional_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  clinical_notes text,
  materials_used text,
  complications text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_amr_client ON public.appointment_medical_records(client_id);
CREATE INDEX IF NOT EXISTS idx_amr_appointment ON public.appointment_medical_records(appointment_id);
ALTER TABLE public.appointment_medical_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "amr_select_own" ON public.appointment_medical_records;
CREATE POLICY "amr_select_own"
  ON public.appointment_medical_records FOR SELECT
  USING (company_id = public.get_my_company_id() AND public.is_approved());
DROP POLICY IF EXISTS "amr_insert_own" ON public.appointment_medical_records;
CREATE POLICY "amr_insert_own"
  ON public.appointment_medical_records FOR INSERT
  WITH CHECK (company_id = public.get_my_company_id() AND public.is_approved());
DROP POLICY IF EXISTS "amr_update_own" ON public.appointment_medical_records;
CREATE POLICY "amr_update_own"
  ON public.appointment_medical_records FOR UPDATE
  USING (company_id = public.get_my_company_id() AND public.is_approved());

-- 9.3 patient_progress_notes (notas de evolução)
CREATE TABLE IF NOT EXISTS public.patient_progress_notes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  professional_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  progress_notes text,
  next_recommendation text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ppn_client ON public.patient_progress_notes(client_id);
ALTER TABLE public.patient_progress_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ppn_select_own" ON public.patient_progress_notes;
CREATE POLICY "ppn_select_own"
  ON public.patient_progress_notes FOR SELECT
  USING (company_id = public.get_my_company_id() AND public.is_approved());
DROP POLICY IF EXISTS "ppn_insert_own" ON public.patient_progress_notes;
CREATE POLICY "ppn_insert_own"
  ON public.patient_progress_notes FOR INSERT
  WITH CHECK (company_id = public.get_my_company_id() AND public.is_approved());
DROP POLICY IF EXISTS "ppn_update_own" ON public.patient_progress_notes;
CREATE POLICY "ppn_update_own"
  ON public.patient_progress_notes FOR UPDATE
  USING (company_id = public.get_my_company_id() AND public.is_approved());

-- 9.4 medical_attachments (anexos clínicos)
CREATE TABLE IF NOT EXISTS public.medical_attachments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  uploaded_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  file_url text NOT NULL,
  file_type text,
  description text,
  created_at timestamp with time zone DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ma_client ON public.medical_attachments(client_id);
ALTER TABLE public.medical_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ma_select_own" ON public.medical_attachments;
CREATE POLICY "ma_select_own"
  ON public.medical_attachments FOR SELECT
  USING (company_id = public.get_my_company_id() AND public.is_approved());
DROP POLICY IF EXISTS "ma_insert_own" ON public.medical_attachments;
CREATE POLICY "ma_insert_own"
  ON public.medical_attachments FOR INSERT
  WITH CHECK (company_id = public.get_my_company_id() AND public.is_approved());
DROP POLICY IF EXISTS "ma_delete_own" ON public.medical_attachments;
CREATE POLICY "ma_delete_own"
  ON public.medical_attachments FOR DELETE
  USING (company_id = public.get_my_company_id() AND public.is_approved());

-- =====================================================================
-- VERIFICAÇÃO (rodar após aplicar)
-- =====================================================================
-- 1. Tabelas que devem existir agora:
--    SELECT tablename FROM pg_tables WHERE schemaname='public'
--    AND tablename IN ('reviews','review_settings','trial_antifraud_records',
--      'medical_records','appointment_medical_records','patient_progress_notes',
--      'medical_attachments') ORDER BY tablename;
--
-- 2. Colunas que devem existir:
--    SELECT table_name, column_name FROM information_schema.columns
--    WHERE table_schema='public' AND column_name IN
--      ('cancellation_reason','validity_unit','consent_accepted',
--       'signature_hash','review_month','benefit_text','appointment_id')
--    ORDER BY table_name;

COMMIT;
