-- ================================================================
-- SCRIPT 1: RESET COMPLETO DO BANCO DE DADOS
-- Agenda Inteligente — Ambiente de Produção
-- 
-- ⚠️ ATENÇÃO: Este script APAGA TODOS os dados do banco.
--    Execute no Supabase SQL Editor com cuidado.
--    Acesse: supabase.com > SQL Editor > New Query
-- ================================================================

-- ─── PASSO 1: Limpar dados das tabelas de aplicação ───────────────────────────
-- (Na ordem correta para respeitar foreign keys)

TRUNCATE TABLE 
  anamnese_responses,
  anamnese_questions,
  anamnese_templates,
  automation_logs,
  automation_rules,
  email_logs,
  inventory_transactions,
  medical_records,
  notifications,
  products,
  push_tokens,
  reviews,
  appointments,
  clients,
  procedures,
  profiles,
  companies
RESTART IDENTITY CASCADE;

-- ─── PASSO 2: Apagar todos os usuários do Auth ───────────────────────────────
-- Isso apaga todos os usuários de auth.users (login/senha).
-- Os profiles em cascade já foram removidos no passo anterior,
-- mas ON DELETE CASCADE também funcionaria aqui.
DELETE FROM auth.users;

-- ─── PASSO 3: Limpar sessões e tokens órfãos ─────────────────────────────────
DELETE FROM auth.sessions;
DELETE FROM auth.refresh_tokens;
DELETE FROM auth.mfa_factors;

-- ─── CONFIRMAÇÃO ─────────────────────────────────────────────────────────────
SELECT 
  'users'::text AS tabela, COUNT(*) AS total FROM auth.users
UNION ALL
SELECT 'profiles', COUNT(*) FROM profiles
UNION ALL
SELECT 'companies', COUNT(*) FROM companies
UNION ALL
SELECT 'appointments', COUNT(*) FROM appointments;
-- Todos devem retornar 0 ✅
