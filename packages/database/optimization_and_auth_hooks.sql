-- =====================================================
-- OTIMIZAÇÃO DE SEGURANÇA E PERFORMANCE (MULTI-TENANT)
-- Execute este arquivo no SQL Editor do Supabase.
-- =====================================================

-- 1. AUTH HOOK PARA CUSTOM CLAIMS (JWT)
-- Injeta o `company_id` diretamente no Token JWT do usuário no momento do login.
-- Isso elimina a necessidade de fazer N+1 queries na tabela profiles durante checagens de RLS.

create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
security definer
as $$
  declare
    claims jsonb;
    user_company_id uuid;
  begin
    -- Buscar o company_id do usuário que está gerando o token
    select company_id into user_company_id from public.profiles where id = (event->>'user_id')::uuid;

    claims := event->'claims';

    if user_company_id is not null then
      -- Injetar no app_metadata
      claims := jsonb_set(claims, '{app_metadata, company_id}', to_jsonb(user_company_id));
    end if;

    -- Atualiza o token
    event := jsonb_set(event, '{claims}', claims);

    return event;
  end;
$$;

-- Permissões essenciais para o Auth Hook rodar pelo painel do Supabase
grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook from authenticated, anon, public;

-- ATENÇÃO: Para habilitar o Auth Hook no Supabase:
-- Vá em Authentication -> Hooks -> Custom access token -> Escolha "custom_access_token_hook"


-- 2. NOVA FUNÇÃO DE APOIO PARA RLS (Performance)
-- Atualizamos a função existente para buscar primariamente do JWT (0ms de custo de DB).
create or replace function get_my_company_id()
returns uuid 
language sql stable security definer
as $$
  -- Tenta pegar o company_id diretamente do JWT Claim
  select coalesce(
    nullif(current_setting('request.jwt.claims', true)::jsonb->'app_metadata'->>'company_id', '')::uuid,
    -- Fallback se o JWT for antigo (antes do login expirar)
    (select company_id from public.profiles where id = auth.uid())
  );
$$;


-- 3. ÍNDICES DE BANCO (PERFORMANCE B-TREE)
-- Essencial para queries multi-tenant não fazerem "Full Table Scan"

-- Dashboard Agenda (Filtragem por clínica e data)
create index if not exists idx_appointments_company_start on public.appointments (company_id, start_time);

-- Listagem de Clientes (Filtragem por clínica e ordem alfabética)
create index if not exists idx_clients_company_name on public.clients (company_id, full_name);

-- Outros índices essenciais de relacionamento
create index if not exists idx_profiles_company on public.profiles (company_id);
create index if not exists idx_procedures_company on public.procedures (company_id);
create index if not exists idx_transactions_company_date on public.transactions (company_id, date);
