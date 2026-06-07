-- ==========================================================
-- MIGRATION: ATUALIZAÇÃO DE PLANOS (ABATE PAY)
-- Este script atualiza os planos na tabela `plans` com os novos valores
-- e remove os antigos que não serão mais utilizados.
-- ==========================================================

-- 1. Desativar os planos antigos (opcional, para manter histórico se alguém já assinou)
UPDATE public.plans SET is_active = false;

-- 2. Inserir os novos planos definidos para o Abate Pay
INSERT INTO public.plans (name, description, price, max_users, features, is_active)
VALUES 
  (
    'Básico', 
    'Ideal para profissionais autônomos.', 
    49.00, 
    1, 
    '["Agenda completa", "Cadastro de clientes ilimitado", "Prontuário simples"]', 
    true
  ),
  (
    'Profissional', 
    'Perfeito para pequenas clínicas ou estúdios.', 
    97.00, 
    5, 
    '["Tudo do Básico", "Até 5 profissionais", "Relatórios Financeiros", "500 Lembretes WhatsApp/mês"]', 
    true
  ),
  (
    'Empresarial', 
    'Gestão completa para clínicas maiores.', 
    197.00, 
    10, 
    '["Tudo do Profissional", "Até 10 profissionais", "Lembretes WhatsApp Ilimitados", "Campanhas de Marketing"]', 
    true
  );
