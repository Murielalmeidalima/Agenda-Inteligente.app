-- 1. NOTIFICATION RULES (Configuração de disparos)
create type notification_trigger_type as enum ('birthday', 'pre_appointment', 'post_appointment', 'holiday', 'manual');

create table notification_rules (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) not null,
  name text not null, -- Ex: "Lembrete 24h", "Pesquisa NPS"
  trigger_type notification_trigger_type not null,
  
  -- Para triggers de tempo (em minutos). Ex: -1440 (24h antes), 60 (1h depois)
  time_offset_minutes int default 0, 
  
  message_template text not null, -- Ex: "Olá {cliente}, seu agendamento é amanhã às {hora}."
  is_active boolean default true,
  
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 2. NOTIFICATIONS (Log de envios)
create type notification_status as enum ('pending', 'sent', 'delivered', 'read', 'failed', 'cancelled');
create type notification_channel as enum ('whatsapp', 'email', 'sms');

create table notifications (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) not null,
  
  -- Vínculos opcionais (pode ser um disparo avulso ou ligado a algo)
  client_id uuid references clients(id),
  appointment_id uuid references appointments(id),
  rule_id uuid references notification_rules(id),
  
  channel notification_channel default 'whatsapp',
  destination text not null, -- Número do telefone ou email
  message_content text not null,
  
  status notification_status default 'pending',
  scheduled_for timestamp with time zone, -- Quando deve ser enviado
  sent_at timestamp with time zone, -- Quando foi efetivamente enviado
  
  error_message text,
  external_id text, -- ID da mensagem no WhatsApp/Provider
  
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 3. REVIEWS (Avaliações Pós-Atendimento)
create table reviews (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) not null,
  
  appointment_id uuid references appointments(id) not null,
  -- Desnormalização útil para relatórios rápidos sem joins complexos
  client_id uuid references clients(id) not null,
  professional_id uuid references profiles(id) not null,
  procedure_id uuid references procedures(id) not null,
  
  rating int not null check (rating >= 1 and rating <= 5),
  comment text,
  
  is_public boolean default false, -- Se pode exibir no site/perfil
  
  created_at timestamp with time zone default now()
);

-- RLS POLICIES (Segurança Multi-tenant)
alter table notification_rules enable row level security;
alter table notifications enable row level security;
alter table reviews enable row level security;

-- Rules RLS
create policy "Users can view company rules" on notification_rules
  for all using (company_id = get_my_company_id());

-- Notifications RLS
create policy "Users can view company notifications" on notifications
  for all using (company_id = get_my_company_id());

-- Reviews RLS
create policy "Users can view company reviews" on reviews
  for all using (company_id = get_my_company_id());

-- Clients Extension: Add Check for WhatsApp Consent (LGPD)
-- Vamos adicionar uma coluna se ela não existir. 
-- Como SQL puro não tem "alter table if not exists column", isso geralmente é feito em migração separada ou manualmente.
-- Assumindo que a tabela clients já existe, vamos adicionar:
alter table clients add column if not exists whatsapp_consent boolean default true;
