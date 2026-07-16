-- 1. Alter public.procedures to add maintenance_price
ALTER TABLE public.procedures ADD COLUMN IF NOT EXISTS maintenance_price decimal(10,2);

-- 2. Alter public.appointments to add discount and promotion columns
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS discount_type text;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS discount_name text;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS discount_value decimal(10,2);
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS discount_percentage decimal(5,2);
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS discount_notes text;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS original_price decimal(10,2);
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS rule_applied text;

-- 3. Create public.procedure_promotions table
CREATE TABLE IF NOT EXISTS public.procedure_promotions (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references public.companies(id) on delete cascade not null,
  procedure_id uuid references public.procedures(id) on delete cascade not null,
  name text not null,
  type text not null check (type in ('value', 'percentage')),
  value decimal(10,2) not null,
  start_date timestamp with time zone not null,
  end_date timestamp with time zone not null,
  is_active boolean not null default true,
  created_at timestamp with time zone default now()
);

-- Enable RLS
ALTER TABLE public.procedure_promotions ENABLE ROW LEVEL SECURITY;

-- Drop policy if exists and create
DROP POLICY IF EXISTS "Users can view company promotions" ON public.procedure_promotions;
CREATE POLICY "Users can view company promotions" ON public.procedure_promotions
  FOR ALL USING (company_id = get_my_company_id());
