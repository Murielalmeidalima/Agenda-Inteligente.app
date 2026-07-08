-- =========================================================================
-- MIGRATION: REMOVE DUPLICATE PROCEDURES & ENFORCE UNIQUE NAME PER COMPANY
-- =========================================================================
-- Execute este script no SQL Editor do Supabase para limpar duplicatas e
-- evitar que novos procedimentos com o mesmo nome sejam criados.
-- =========================================================================

-- 1. Identificar e mesclar procedimentos duplicados
DO $$
DECLARE
    r RECORD;
    v_keep_id UUID;
BEGIN
    FOR r IN 
        SELECT company_id, lower(trim(name)) as cleaned_name, array_agg(id ORDER BY created_at ASC) as ids
        FROM procedures
        GROUP BY company_id, lower(trim(name))
        HAVING count(*) > 1
    LOOP
        -- Mantemos o procedimento mais antigo (índice 1)
        v_keep_id := r.ids[1];
        
        -- Atualiza os agendamentos que usam as duplicatas para apontar ao procedimento principal
        UPDATE appointments 
        SET procedure_id = v_keep_id
        WHERE procedure_id = ANY(r.ids[2:array_length(r.ids, 1)]);
        
        -- Atualiza os reviews se a tabela existir no banco de dados
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'reviews') THEN
            EXECUTE 'UPDATE reviews SET procedure_id = $1 WHERE procedure_id = ANY($2)'
            USING v_keep_id, r.ids[2:array_length(r.ids, 1)];
        END IF;
        
        -- Remove os procedimentos duplicados restantes
        DELETE FROM procedures
        WHERE id = ANY(r.ids[2:array_length(r.ids, 1)]);
    END LOOP;
END $$;

-- 2. Criar restrição de unicidade para evitar futuras duplicidades por empresa e nome
CREATE UNIQUE INDEX IF NOT EXISTS unique_company_procedure_name_idx 
ON procedures (company_id, lower(trim(name)));
