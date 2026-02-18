-- 1. INVENTORY TRANSACTIONS (Correção para módulo de Estoque)
create table if not exists inventory_transactions (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) not null,
  product_id uuid references products(id) not null,
  professional_id uuid references profiles(id) not null,
  type text not null check (type in ('in', 'out')), -- 'in' (entrada), 'out' (saída)
  quantity int not null,
  reason text,
  created_at timestamp with time zone default now()
);

-- RLS para Inventory Transactions
alter table inventory_transactions enable row level security;

create policy "Users can view company inventory transactions"
  on inventory_transactions for select
  using (company_id = (select company_id from profiles where id = auth.uid()));

create policy "Users can insert company inventory transactions"
  on inventory_transactions for insert
  with check (company_id = (select company_id from profiles where id = auth.uid()));


-- 2. GARANTIA DE TABELAS FINANCEIRAS (Caso migration_finance_v1 não tenha rodado)
do $$
begin
  if not exists (select 1 from pg_type where typname = 'financial_category_type') then
    create type financial_category_type as enum ('income', 'expense');
  end if;
end $$;

create table if not exists financial_categories (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) not null,
  name text not null,
  type financial_category_type not null,
  icon text,
  color text,
  is_default boolean default false,
  created_at timestamp with time zone default now()
);

create table if not exists financial_accounts (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) not null,
  name text not null,
  bank_name text,
  balance decimal(10,2) default 0.00,
  is_default boolean default false,
  created_at timestamp with time zone default now()
);

-- RLS para Finanças
alter table financial_categories enable row level security;
alter table financial_accounts enable row level security;

create policy "Users can view company categories" on financial_categories
  for all using (company_id = (select company_id from profiles where id = auth.uid()));

create policy "Users can view company accounts" on financial_accounts
  for all using (company_id = (select company_id from profiles where id = auth.uid()));


-- 3. GARANTIA DE TABELAS DE AUTOMAÇÃO (Caso migration_automation não tenha rodado)
do $$
begin
  if not exists (select 1 from pg_type where typname = 'automation_trigger_type') then
    create type automation_trigger_type as enum ('birthday', 'pre_appointment', 'post_appointment', 'holiday');
  end if;
end $$;

create table if not exists automation_rules (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  trigger_type automation_trigger_type NOT NULL,
  time_offset_minutes INTEGER NOT NULL DEFAULT 0,
  message_template TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

create table if not exists automation_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  rule_id UUID REFERENCES automation_rules(id) ON DELETE SET NULL,
  recipient_phone TEXT,
  recipient_name TEXT,
  status TEXT DEFAULT 'sent',
  error_message TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para Automação
alter table automation_rules enable row level security;
alter table automation_logs enable row level security;

create policy "Users can view rules from their company"
  on automation_rules for select
  using (company_id = (select company_id from profiles where id = auth.uid()));

create policy "Users can view logs from their company"
  on automation_logs for select
  using (company_id = (select company_id from profiles where id = auth.uid()));
