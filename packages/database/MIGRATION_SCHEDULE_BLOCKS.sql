-- 1. Tabela de Bloqueios de Agenda
create table if not exists schedule_blocks (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) not null,
  title text not null, 
  type text not null, -- 'manual', 'holiday', 'vacation', 'recurring'
  start_date timestamp with time zone not null,
  end_date timestamp with time zone, 
  start_time time, -- Hora de início (opcional para bloqueio parcial)
  end_time time,   -- Hora de fim (opcional para bloqueio parcial)
  is_full_day boolean default true,
  recurring_day int, -- 0-6 (Domingo-Sábado)
  is_active boolean default true,
  notes text,
  created_at timestamp with time zone default now()
);

-- Habilitar RLS
alter table schedule_blocks enable row level security;

-- 4. Reabilita o RLS e a Política
ALTER TABLE schedule_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage company schedule blocks" ON schedule_blocks
  FOR ALL USING (company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- 5. Política para permitir atualizar configurações da empresa (Apenas Administrador ou Chefe)
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can update own company" ON companies;
CREATE POLICY "Users can update own company" ON companies
  FOR UPDATE USING (
    id IN (
      SELECT company_id 
      FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'chefe')
    )
  );

-- 6. Garante campo de configurações na tabela companies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='settings') THEN
        ALTER TABLE companies ADD COLUMN settings jsonb DEFAULT '{}'::jsonb;
    END IF;
END $$;
