-- ==============================================================================
-- MIGRAÇÃO DE BANCO DE DADOS: SISTEMA ANTIFRAUDE E CONTROLE DE TESTE GRÁTIS
-- Execute este script no SQL Editor do Supabase para atualizar a base de dados.
-- ==============================================================================

-- 1. TABELA DE AUDITORIA E LOG ANTIFRAUDE DE CADASTROS
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

-- Indexação para otimizar as buscas por duplicidade
CREATE INDEX IF NOT EXISTS idx_antifraud_cpf ON public.trial_antifraud_records(cpf);
CREATE INDEX IF NOT EXISTS idx_antifraud_email ON public.trial_antifraud_records(email);
CREATE INDEX IF NOT EXISTS idx_antifraud_phone ON public.trial_antifraud_records(phone);
CREATE INDEX IF NOT EXISTS idx_antifraud_card_hash ON public.trial_antifraud_records(card_hash);
CREATE INDEX IF NOT EXISTS idx_antifraud_cnpj ON public.trial_antifraud_records(cnpj);
CREATE INDEX IF NOT EXISTS idx_antifraud_ip ON public.trial_antifraud_records(ip_address);
CREATE INDEX IF NOT EXISTS idx_antifraud_device ON public.trial_antifraud_records(device_fingerprint);

-- Habilitar Row Level Security (RLS) para a nova tabela
ALTER TABLE public.trial_antifraud_records ENABLE ROW LEVEL SECURITY;

-- Política: Apenas administradores do SaaS podem visualizar logs antifraude
DROP POLICY IF EXISTS "SaaS admins can view antifraud logs" ON public.trial_antifraud_records;
CREATE POLICY "SaaS admins can view antifraud logs" ON public.trial_antifraud_records
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- 2. ATUALIZAÇÃO DA TABELA DE CONSENTIMENTOS LGPD (CONSENT_LOGS)
-- Adiciona o tipo de consentimento para prevenção de fraudes na tabela consent_logs.
-- Para evitar erros caso o constraint seja diferente ou já exista, removemos e recriamos.
ALTER TABLE public.consent_logs DROP CONSTRAINT IF EXISTS consent_logs_document_type_check;
ALTER TABLE public.consent_logs ADD CONSTRAINT consent_logs_document_type_check 
    CHECK (document_type in ('TERMS_OF_USE', 'PRIVACY_POLICY', 'ANAMNESIS', 'FRAUD_PREVENTION_AND_BILLING'));

-- 3. ADICIONAR VALORES AO ENUM DE STATUS DA ASSINATURA (SE NECESSÁRIO)
-- O tipo subscription_status em PostgreSQL suporta adição de novos valores
ALTER TYPE public.subscription_status ADD VALUE IF NOT EXISTS 'expired';
ALTER TYPE public.subscription_status ADD VALUE IF NOT EXISTS 'cancelled';
