-- ==============================================================================
-- MIGRAÇÃO DE BANCO DE DADOS: LGPD, PRIVACIDADE E AUDITORIA
-- Execute este script no SQL Editor do Supabase
-- ==============================================================================

-- 1. TABELA DE REGISTRO DE CONSENTIMENTOS JURÍDICOS (TERMOS E POLÍTICAS)
create table if not exists consent_logs (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade not null,
    document_type text not null check (document_type in ('TERMS_OF_USE', 'PRIVACY_POLICY', 'ANAMNESIS')),
    version text not null default '1.0',
    ip_address text,
    created_at timestamp with time zone default now()
);

-- Segurança para consent_logs (Apenas leitura/inserção do próprio usuário)
alter table consent_logs enable row level security;
create policy "Users can insert own consent logs" on consent_logs for insert with check (auth.uid() = user_id);
create policy "Users can view own consent logs" on consent_logs for select using (auth.uid() = user_id);

-- 2. TABELA DE AUDITORIA DE ACESSOS E ALTERAÇÕES (RASTREABILIDADE)
create table if not exists audit_logs (
    id uuid primary key default uuid_generate_v4(),
    company_id uuid references companies(id) on delete cascade,
    user_id uuid references auth.users(id) on delete set null,
    action_type text not null check (action_type in ('LOGIN', 'LOGOUT', 'DATA_EXPORT', 'DATA_DELETION', 'UPDATE', 'DELETE')),
    table_name text,
    record_id uuid,
    description text,
    created_at timestamp with time zone default now()
);

alter table audit_logs enable row level security;
-- Apenas admins da empresa podem visualizar os logs de auditoria
create policy "Company admins can view audit logs" on audit_logs for select using (
    company_id in (select company_id from profiles where id = auth.uid() and role = 'admin')
);

-- 3. ATUALIZAÇÃO DA TABELA DE CLIENTES (OPÇÕES DE MARKETING / LGPD)
-- Adicionando campos booleanos para controle granular de comunicações
alter table clients add column if not exists consent_email boolean default false;
alter table clients add column if not exists consent_whatsapp boolean default false;
alter table clients add column if not exists consent_sms boolean default false;

-- 4. ATUALIZAÇÃO PARA ANAMNESE E DIREITO AO ESQUECIMENTO (EMPRESAS)
-- Permite marcar uma empresa para exclusão (processo de esquecimento controlado)
alter table companies add column if not exists deletion_requested_at timestamp with time zone;
alter table companies add column if not exists deletion_status text default 'active' check (deletion_status in ('active', 'pending_deletion', 'deleted'));
