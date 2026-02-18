-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. COMPANIES (Multi-tenancy)
create table companies (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  cnpj text,
  address_street text,
  address_number text,
  address_complement text,
  address_neighborhood text,
  address_city text,
  address_state text,
  address_zip_code text,
  logo_url text,
  phone text,
  email text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 2. PROFILES (Users linked to Auth and Company)
create type user_role as enum ('admin', 'professional', 'receptionist');

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  company_id uuid references companies(id) on delete set null,
  role user_role default 'professional',
  full_name text,
  cpf text,
  phone text,
  email text,
  specialty text,
  hire_date date,
  salary decimal(10,2),
  status text default 'active',
  created_at timestamp with time zone default now()
);

-- 3. CLIENTS
create table clients (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) not null,
  full_name text not null,
  phone text,
  email text,
  birth_date date,
  observations text,
  created_at timestamp with time zone default now()
);

-- 4. PROCEDURES (Services)
create table procedures (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) not null,
  name text not null,
  duration_minutes int not null default 60,
  price decimal(10,2) not null default 0.00,
  description text,
  maintenance_required boolean default false,
  maintenance_days_limit int, -- Max days to return for maintenance (e.g., 30 days)
  created_at timestamp with time zone default now()
);

-- 5. APPOINTMENTS (Agenda)
create type appointment_status as enum ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show', 'rescheduled');

create table appointments (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) not null,
  client_id uuid references clients(id) not null,
  professional_id uuid references profiles(id) not null,
  procedure_id uuid references procedures(id) not null,
  
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  
  status appointment_status default 'scheduled',
  
  -- Maintenance Logic
  is_maintenance boolean default false,
  parent_appointment_id uuid references appointments(id), -- If this IS a maintenance, link to original
  
  notes text,
  created_at timestamp with time zone default now()
);

-- 6. TRANSACTIONS (Financials - Basic)
create type transaction_type as enum ('income', 'expense');

create table transactions (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) not null,
  appointment_id uuid references appointments(id), -- Optional link
  amount decimal(10,2) not null,
  type transaction_type not null,
  description text,
  date timestamp with time zone default now(),
  created_at timestamp with time zone default now()
);

-- RLS POLICIES (Row Level Security)
alter table companies enable row level security;
alter table profiles enable row level security;
alter table clients enable row level security;
alter table procedures enable row level security;
alter table appointments enable row level security;
alter table transactions enable row level security;

-- 1. Profiles: Users can read and update their own profile
create policy "Users can view own profile" on profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

-- 2. Multi-tenant access: Filter by company_id
-- We use a function to get the company_id of the current user for efficiency
create or replace function get_my_company_id()
returns uuid as $$
  select company_id from profiles where id = auth.uid();
$$ language sql stable security definer;

-- Companies: Users can only see their own company
create policy "Users can view own company" on companies
  for select using (id = get_my_company_id());

-- Clients: Filter by company_id
create policy "Users can view company clients" on clients
  for all using (company_id = get_my_company_id());

-- Procedures: Filter by company_id
create policy "Users can view company procedures" on procedures
  for all using (company_id = get_my_company_id());

-- Appointments: Filter by company_id
create policy "Users can view company appointments" on appointments
  for all using (company_id = get_my_company_id());

-- Transactions: Filter by company_id
create policy "Users can view company transactions" on transactions
  for all using (company_id = get_my_company_id());

-- 7. PRODUCTS (Inventory)
create table products (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) not null,
  name text not null,
  description text,
  current_stock int not null default 0,
  min_stock int not null default 0,
  unit text default 'un',
  price decimal(10,2) default 0.00,
  created_at timestamp with time zone default now()
);

alter table products enable row level security;
create policy "Users can view company products" on products
  for all using (company_id = get_my_company_id());
