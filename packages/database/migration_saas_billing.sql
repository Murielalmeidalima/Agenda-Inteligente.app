-- ==========================================================
-- MIGRATION: SAAS BILLING E ASSINATURAS (ASAAS)
-- Este script adiciona as tabelas necessárias para o modelo SaaS.
-- Execute no Supabase SQL Editor.
-- ==========================================================

-- 1. TABELA DE PLANOS (PLANS)
CREATE TABLE IF NOT EXISTS public.plans (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  price decimal(10,2) NOT NULL DEFAULT 0.00,
  max_users int NOT NULL DEFAULT 1,
  features jsonb DEFAULT '[]'::jsonb,
  asaas_plan_id text, -- Opcional, caso crie o plano no Asaas
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Inserir os planos iniciais
INSERT INTO public.plans (name, description, price, max_users, features)
VALUES 
  ('Inicial', 'Ideal para profissionais autônomos.', 97.00, 1, '["Agenda Ilimitada", "Até 100 pacientes", "Suporte Básico"]'),
  ('Profissional', 'Perfeito para clínicas em crescimento.', 197.00, 3, '["Tudo do Inicial", "Até 1000 pacientes", "Lembretes WhatsApp (limitado)", "Relatórios Financeiros"]'),
  ('Empresarial', 'Gestão completa para grandes equipes.', 297.00, 10, '["Tudo do Profissional", "Pacientes Ilimitados", "Lembretes WhatsApp Ilimitados", "Campanhas de Marketing"]'),
  ('Premium', 'Acesso total sem limites de usuários.', 497.00, 999, '["Tudo do Empresarial", "Acesso Multiprofissional Ilimitado"]')
ON CONFLICT DO NOTHING;

-- 2. TIPO DE STATUS DA ASSINATURA
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status') THEN
    CREATE TYPE subscription_status AS ENUM ('trial', 'active', 'pending', 'past_due', 'suspended', 'canceled');
  END IF;
END$$;

-- 3. TABELA DE ASSINATURAS (SUBSCRIPTIONS)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  plan_id uuid REFERENCES public.plans(id) ON DELETE RESTRICT,
  
  -- IDs do Gateway (Asaas)
  asaas_customer_id text,
  asaas_subscription_id text,
  
  status subscription_status DEFAULT 'trial',
  
  trial_start timestamp with time zone,
  trial_end timestamp with time zone,
  
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  
  canceled_at timestamp with time zone,
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Index para buscas rápidas por empresa
CREATE INDEX IF NOT EXISTS idx_subscriptions_company ON public.subscriptions(company_id);

-- 4. TABELA DE WEBHOOKS (LOGS)
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  processed boolean DEFAULT false,
  error_message text,
  created_at timestamp with time zone DEFAULT now()
);

-- 5. RLS (Row Level Security)

-- Planos: Visíveis para todos os usuários autenticados (ou anônimos no site)
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Planos visíveis para todos" ON public.plans
  FOR SELECT USING (true);

-- Assinaturas: Clínicas podem ver apenas a sua própria
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Empresas veem suas próprias assinaturas" ON public.subscriptions
  FOR SELECT USING (company_id = get_my_company_id());

-- Bloqueia inserção direta na tabela de assinaturas (deve ser feita pela API/Admin)
CREATE POLICY "Apenas admin e backend podem inserir assinaturas" ON public.subscriptions
  FOR INSERT WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    -- Nota: A API backend usa a service_role key, ignorando RLS.
  );

CREATE POLICY "Apenas admin e backend podem alterar assinaturas" ON public.subscriptions
  FOR UPDATE USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- 6. REMOVER A RESTRIÇÃO "APPROVED" DOS ACESSOS NORMAIS (Opcional, mas recomendado)
-- O acesso agora deve ser baseado no status da assinatura.
-- Como estamos em transição, vamos garantir que o middleware do site libere o acesso se tiver assinatura trial/active
-- O campo profiles.approved ainda pode existir, mas passará a ser gerenciado pelo sistema (auto-approval).
