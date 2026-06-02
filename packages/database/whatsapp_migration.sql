-- Migration: Adicionar colunas do WhatsApp na tabela companies

ALTER TABLE companies
ADD COLUMN IF NOT EXISTS whatsapp_instance_name text,
ADD COLUMN IF NOT EXISTS whatsapp_status text DEFAULT 'disconnected';
