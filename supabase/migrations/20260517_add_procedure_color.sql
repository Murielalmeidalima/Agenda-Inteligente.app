-- Adiciona a coluna 'color' na tabela de procedures
ALTER TABLE "public"."procedures" ADD COLUMN IF NOT EXISTS "color" text;

-- Atualiza a view schema cache (recomendado aps alteraes DDL)
NOTIFY pgrst, 'reload schema';
