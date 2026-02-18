-- 1. Create FINANCIAL_CATEGORIES table
create type financial_category_type as enum ('income', 'expense');

create table financial_categories (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) not null,
  name text not null,
  type financial_category_type not null,
  icon text, -- Lucide icon name
  color text, -- Tailwind color class or hex
  is_default boolean default false,
  created_at timestamp with time zone default now()
);

-- 2. Create FINANCIAL_ACCOUNTS table
create table financial_accounts (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) not null,
  name text not null,
  bank_name text,
  balance decimal(10,2) default 0.00,
  is_default boolean default false,
  created_at timestamp with time zone default now()
);

-- 3. Modify TRANSACTIONS table to link to new tables
-- We add columns first
alter table transactions add column if not exists category_id uuid references financial_categories(id);
alter table transactions add column if not exists account_id uuid references financial_accounts(id);

-- 4. RLS POLICIES
alter table financial_categories enable row level security;
alter table financial_accounts enable row level security;

create policy "Users can view company categories" on financial_categories
  for all using (company_id = get_my_company_id());

create policy "Users can view company accounts" on financial_accounts
  for all using (company_id = get_my_company_id());

-- 5. FUNCTION TO UPDATE ACCOUNT BALANCE
create or replace function update_account_balance(target_account_id uuid, amount_diff decimal)
returns void as $$
begin
  update financial_accounts
  set balance = balance + amount_diff
  where id = target_account_id;
end;
$$ language plpgsql security definer;

-- 6. SEED DEFAULT DATA (Run manually or via trigger)
-- Since we can't easily iterate all companies in a migration without a cursor, 
-- we will trust the application to create defaults or the user to create them.
-- However, for the 'demo' feel in production, we could insert a set of defaults for every NEW company.
-- For now, let's just ensure the tables exist.

-- Optional: Insert some global defaults if you had a 'template' system, but for multi-tenant 
-- usually we create these when the company is created. 
-- Let's create a helper function to seed defaults for a company.

create or replace function seed_company_finance_defaults(target_company_id uuid)
returns void as $$
begin
  -- Accounts
  insert into financial_accounts (company_id, name, bank_name, balance, is_default)
  values 
  (target_company_id, 'Caixa Clínica', 'Interno', 0.00, true),
  (target_company_id, 'Banco Principal', 'Inter', 0.00, false);

  -- Categories (Income)
  insert into financial_categories (company_id, name, type, icon, color)
  values
  (target_company_id, 'Procedimentos', 'income', 'zap', 'emerald'),
  (target_company_id, 'Consultas', 'income', 'users', 'blue'),
  (target_company_id, 'Venda de Produtos', 'income', 'shopping-bag', 'purple');

  -- Categories (Expense)
  insert into financial_categories (company_id, name, type, icon, color)
  values
  (target_company_id, 'Aluguel/Condomínio', 'expense', 'home', 'red'),
  (target_company_id, 'Materiais', 'expense', 'package', 'orange'),
  (target_company_id, 'Pessoal', 'expense', 'user-check', 'yellow'),
  (target_company_id, 'Marketing', 'expense', 'megaphone', 'pink');
end;
$$ language plpgsql;
