-- Configurações de Avaliação Híbrida
CREATE TABLE IF NOT EXISTS public.review_settings (
    company_id UUID PRIMARY KEY REFERENCES public.companies(id) ON DELETE CASCADE,
    google_review_url TEXT,
    enable_google_review BOOLEAN DEFAULT false,
    feedback_type TEXT DEFAULT 'internal' CHECK (feedback_type IN ('internal', 'external_forms')),
    external_forms_url TEXT,
    min_rating_for_google INTEGER DEFAULT 4,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.review_settings ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Clínicas podem ver suas próprias configurações"
    ON public.review_settings FOR SELECT
    USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Clínicas podem gerenciar suas próprias configurações"
    ON public.review_settings FOR ALL
    USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Permitir leitura pública limitada (via token de agendamento na API)
-- Isso será tratado via API route com service role ou por token.

-- Trigger para atualizar o updated_at
CREATE OR REPLACE FUNCTION update_review_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_review_settings_timestamp
    BEFORE UPDATE ON public.review_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_review_settings_updated_at();

-- Garantir que a tabela de reviews tenha mês e ano para facilitar queries
ALTER TABLE public.appointment_reviews 
ADD COLUMN IF NOT EXISTS review_month INTEGER DEFAULT EXTRACT(MONTH FROM NOW()),
ADD COLUMN IF NOT EXISTS review_year INTEGER DEFAULT EXTRACT(YEAR FROM NOW());

COMMENT ON COLUMN public.appointment_reviews.review_month IS 'Mês da avaliação para métricas agrupadas';
COMMENT ON COLUMN public.appointment_reviews.review_year IS 'Ano da avaliação para métricas agrupadas';
