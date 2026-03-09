
-- Script para verificar as colunas reais da tabela transactions
SELECT 
    column_name, 
    data_type, 
    column_default, 
    is_nullable
FROM 
    information_schema.columns 
WHERE 
    table_name = 'transactions'
ORDER BY 
    ordinal_position;
