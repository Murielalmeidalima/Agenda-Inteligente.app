-- 1. TEMPLATES DE ANAMNESE
create table if not exists anamnese_templates (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) not null,
  name text not null,
  description text,
  is_active boolean default true,
  version int default 1,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 2. PERGUNTAS DA ANAMNESE
create type question_type as enum ('text_short', 'text_long', 'multiple_choice', 'checkbox', 'date', 'number', 'yes_no');

create table if not exists anamnese_questions (
  id uuid primary key default uuid_generate_v4(),
  template_id uuid references anamnese_templates(id) on delete cascade not null,
  question_text text not null,
  type question_type not null,
  options jsonb, -- Para múltipla escolha/checkbox: ["Opção A", "Opção B"]
  is_required boolean default false,
  "order" int not null default 0,
  conditional_logic jsonb, -- Ex: { "depends_on": "uuid_q1", "value": "Sim" }
  created_at timestamp with time zone default now()
);

-- 3. RESPOSTAS (Cabeçalho)
create type anamnese_status as enum ('pending', 'completed_client', 'completed_internal');

create table if not exists anamnese_responses (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) not null,
  client_id uuid references clients(id) not null,
  appointment_id uuid references appointments(id), -- Opcional, pode ser avulsa
  template_id uuid references anamnese_templates(id) not null,
  status anamnese_status default 'pending',
  completed_at timestamp with time zone,
  ip_address text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 4. RESPOSTAS DETALHADAS (Item a Item)
create table if not exists anamnese_answers (
  id uuid primary key default uuid_generate_v4(),
  response_id uuid references anamnese_responses(id) on delete cascade not null,
  question_id uuid references anamnese_questions(id) not null,
  answer_value jsonb, -- Pode ser string, array, number, etc.
  created_at timestamp with time zone default now()
);

-- 5. TOKENS DE ACESSO PÚBLICO
create table if not exists anamnese_tokens (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) not null,
  response_id uuid references anamnese_responses(id) on delete cascade not null,
  token text not null unique, -- Hash seguro, não sequencial
  expires_at timestamp with time zone not null,
  used_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- 6. ALTERAÇÃO EM PROCEDIMENTOS
alter table procedures add column if not exists requires_anamnese boolean default false;
alter table procedures add column if not exists anamnese_template_id uuid references anamnese_templates(id);

-- 7. RLS POLICIES

-- Templates
alter table anamnese_templates enable row level security;
create policy "Users can view company templates" on anamnese_templates
  for all using (company_id = (select company_id from profiles where id = auth.uid()));

-- Questions (Herda acesso do template, mas como não tem company_id direto, fazemos join ou confiamos no acesso ao template pai via app)
-- Melhor: adicionar RLS baseada em exists na tabela pai ou permitir leitura pública autenticada se o template for da empresa.
-- Simplificação: Users authenticated can read questions if they can read the template.
alter table anamnese_questions enable row level security;
create policy "Users can view questions of company templates" on anamnese_questions
  for select using (
    exists (
      select 1 from anamnese_templates t
      join profiles p on p.company_id = t.company_id
      where t.id = anamnese_questions.template_id and p.id = auth.uid()
    )
  );

create policy "Users can edit questions of company templates" on anamnese_questions
  for all using (
    exists (
      select 1 from anamnese_templates t
      join profiles p on p.company_id = t.company_id
      where t.id = anamnese_questions.template_id and p.id = auth.uid()
    )
  );

-- Responses
alter table anamnese_responses enable row level security;
create policy "Users can view company responses" on anamnese_responses
  for all using (company_id = (select company_id from profiles where id = auth.uid()));

-- Answers
alter table anamnese_answers enable row level security;
create policy "Users can view answers of company responses" on anamnese_answers
  for select using (
    exists (
      select 1 from anamnese_responses r
      join profiles p on p.company_id = r.company_id
      where r.id = anamnese_answers.response_id and p.id = auth.uid()
    )
  );

-- Tokens
alter table anamnese_tokens enable row level security;
create policy "Users can view company tokens" on anamnese_tokens
  for all using (company_id = (select company_id from profiles where id = auth.uid()));

-- POLÍTICA PÚBLICA PARA RESPOSTA EXTERNA (Importante!)
-- O cliente anônimo não tem auth.uid(). Ele acessa via Token na API.
-- A API (Server-Side) usará a "Service Role" do Supabase para validar o token e salvar a resposta, 
-- ignorando RLS ou agindo como admin. 
-- Portanto, não precisamos de políticas "anon" permissivas demais aqui, mantendo a segurança.
