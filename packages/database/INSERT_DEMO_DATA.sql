-- ============================================
-- DADOS DE DEMONSTRAÇÃO - INSERÇÃO AUTOMÁTICA
-- ============================================
-- Este script insere dados de teste automaticamente
-- Ele busca o company_id da primeira empresa ativa

-- ============================================
-- VARIÁVEL PARA ARMAZENAR COMPANY_ID
-- ============================================
DO $$
DECLARE
  v_company_id uuid;
  v_client_maria uuid;
  v_client_joao uuid;
  v_client_ana uuid;
  v_client_pedro uuid;
  v_client_juliana uuid;
  v_proc_consulta uuid;
  v_proc_limpeza uuid;
  v_proc_botox uuid;
  v_proc_preenchimento uuid;
  v_proc_peeling uuid;
  v_professional_id uuid;
  v_account_caixa uuid;
  v_account_banco uuid;
  v_category_procedimentos uuid;
  v_category_materiais uuid;
BEGIN
  -- Buscar o primeiro company_id ativo
  SELECT id INTO v_company_id FROM companies WHERE active = true LIMIT 1;
  
  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Nenhuma empresa ativa encontrada. Crie uma empresa primeiro.';
  END IF;
  
  RAISE NOTICE 'Usando company_id: %', v_company_id;
  
  -- ============================================
  -- 1. INSERIR CLIENTES
  -- ============================================
  
  INSERT INTO clients (company_id, full_name, email, phone, birth_date, instagram, address_street, address_city, address_state, address_zip)
  VALUES 
    (v_company_id, 'Maria Silva', 'maria.silva@email.com', '(11) 98765-4321', '1985-03-15', '@mariasilva', 'Rua das Flores, 123', 'São Paulo', 'SP', '01234-567')
  RETURNING id INTO v_client_maria;
  
  INSERT INTO clients (company_id, full_name, email, phone, birth_date, instagram, address_street, address_city, address_state, address_zip)
  VALUES 
    (v_company_id, 'João Santos', 'joao.santos@email.com', '(11) 97654-3210', '1978-07-22', '@joaosantos', 'Av. Paulista, 456', 'São Paulo', 'SP', '01310-100')
  RETURNING id INTO v_client_joao;
  
  INSERT INTO clients (company_id, full_name, email, phone, birth_date, instagram, address_street, address_city, address_state, address_zip)
  VALUES 
    (v_company_id, 'Ana Costa', 'ana.costa@email.com', '(11) 96543-2109', '1992-11-08', '@anacosta', 'Rua Augusta, 789', 'São Paulo', 'SP', '01305-000')
  RETURNING id INTO v_client_ana;
  
  INSERT INTO clients (company_id, full_name, email, phone, birth_date, instagram, address_street, address_city, address_state, address_zip)
  VALUES 
    (v_company_id, 'Pedro Oliveira', 'pedro.oliveira@email.com', '(11) 95432-1098', '1988-05-30', NULL, 'Rua Oscar Freire, 321', 'São Paulo', 'SP', '01426-001')
  RETURNING id INTO v_client_pedro;
  
  INSERT INTO clients (company_id, full_name, email, phone, birth_date, instagram, address_street, address_city, address_state, address_zip)
  VALUES 
    (v_company_id, 'Juliana Mendes', 'juliana.mendes@email.com', '(11) 94321-0987', '1995-09-12', '@jumendes', 'Rua Haddock Lobo, 654', 'São Paulo', 'SP', '01414-001')
  RETURNING id INTO v_client_juliana;
  
  RAISE NOTICE 'Clientes inseridos com sucesso!';
  
  -- ============================================
  -- 2. INSERIR PROCEDIMENTOS
  -- ============================================
  
  INSERT INTO procedures (company_id, name, duration_minutes, price, description, category)
  VALUES 
    (v_company_id, 'Consulta Dermatológica', 30, 250.00, 'Consulta completa com avaliação de pele', 'Consulta')
  RETURNING id INTO v_proc_consulta;
  
  INSERT INTO procedures (company_id, name, duration_minutes, price, description, category)
  VALUES 
    (v_company_id, 'Limpeza de Pele Profunda', 60, 180.00, 'Limpeza facial completa com extração', 'Estética')
  RETURNING id INTO v_proc_limpeza;
  
  INSERT INTO procedures (company_id, name, duration_minutes, price, description, category)
  VALUES 
    (v_company_id, 'Aplicação de Botox', 45, 800.00, 'Aplicação de toxina botulínica', 'Procedimento')
  RETURNING id INTO v_proc_botox;
  
  INSERT INTO procedures (company_id, name, duration_minutes, price, description, category)
  VALUES 
    (v_company_id, 'Preenchimento Labial', 40, 1200.00, 'Preenchimento com ácido hialurônico', 'Procedimento')
  RETURNING id INTO v_proc_preenchimento;
  
  INSERT INTO procedures (company_id, name, duration_minutes, price, description, category)
  VALUES 
    (v_company_id, 'Peeling Químico', 50, 350.00, 'Peeling facial para rejuvenescimento', 'Estética')
  RETURNING id INTO v_proc_peeling;
  
  RAISE NOTICE 'Procedimentos inseridos com sucesso!';
  
  -- ============================================
  -- 3. BUSCAR PROFISSIONAL E CONTAS
  -- ============================================
  
  SELECT id INTO v_professional_id 
  FROM profiles 
  WHERE company_id = v_company_id 
    AND role IN ('admin', 'professional') 
  LIMIT 1;
  
  IF v_professional_id IS NULL THEN
    RAISE EXCEPTION 'Nenhum profissional encontrado. Certifique-se de ter um usuário admin ou professional.';
  END IF;
  
  -- Buscar contas financeiras
  SELECT id INTO v_account_caixa 
  FROM financial_accounts 
  WHERE company_id = v_company_id AND is_default = true 
  LIMIT 1;
  
  SELECT id INTO v_account_banco 
  FROM financial_accounts 
  WHERE company_id = v_company_id AND is_default = false 
  LIMIT 1;
  
  -- Buscar categorias
  SELECT id INTO v_category_procedimentos 
  FROM financial_categories 
  WHERE company_id = v_company_id AND name = 'Procedimentos' 
  LIMIT 1;
  
  SELECT id INTO v_category_materiais 
  FROM financial_categories 
  WHERE company_id = v_company_id AND name = 'Materiais' 
  LIMIT 1;
  
  -- ============================================
  -- 4. INSERIR AGENDAMENTOS
  -- ============================================
  
  -- Hoje
  INSERT INTO appointments (company_id, client_id, procedure_id, professional_id, appointment_date, start_time, end_time, status, notes)
  VALUES 
    (v_company_id, v_client_maria, v_proc_consulta, v_professional_id, CURRENT_DATE, '09:00:00', '09:30:00', 'confirmed', 'Primeira consulta - Avaliação geral'),
    (v_company_id, v_client_joao, v_proc_limpeza, v_professional_id, CURRENT_DATE, '14:00:00', '15:00:00', 'confirmed', 'Cliente retorno');
  
  -- Amanhã
  INSERT INTO appointments (company_id, client_id, procedure_id, professional_id, appointment_date, start_time, end_time, status, notes)
  VALUES 
    (v_company_id, v_client_ana, v_proc_botox, v_professional_id, CURRENT_DATE + INTERVAL '1 day', '10:00:00', '10:45:00', 'confirmed', 'Aplicação na testa e glabela');
  
  -- Próxima semana
  INSERT INTO appointments (company_id, client_id, procedure_id, professional_id, appointment_date, start_time, end_time, status, notes)
  VALUES 
    (v_company_id, v_client_pedro, v_proc_preenchimento, v_professional_id, CURRENT_DATE + INTERVAL '7 days', '15:00:00', '15:40:00', 'pending', 'Aguardando confirmação do cliente'),
    (v_company_id, v_client_juliana, v_proc_peeling, v_professional_id, CURRENT_DATE + INTERVAL '7 days', '16:00:00', '16:50:00', 'confirmed', 'Primeiro peeling - Protocolo suave');
  
  RAISE NOTICE 'Agendamentos inseridos com sucesso!';
  
  -- ============================================
  -- 5. INSERIR TRANSAÇÕES FINANCEIRAS
  -- ============================================
  
  IF v_account_caixa IS NOT NULL AND v_category_procedimentos IS NOT NULL THEN
    -- Receitas
    INSERT INTO transactions (company_id, account_id, category_id, type, amount, description, transaction_date, status)
    VALUES 
      (v_company_id, v_account_caixa, v_category_procedimentos, 'income', 250.00, 'Consulta Dermatológica - Maria Silva', CURRENT_DATE - INTERVAL '2 days', 'completed'),
      (v_company_id, v_account_caixa, v_category_procedimentos, 'income', 800.00, 'Aplicação de Botox - Ana Costa', CURRENT_DATE - INTERVAL '1 day', 'completed'),
      (v_company_id, v_account_caixa, v_category_procedimentos, 'income', 180.00, 'Limpeza de Pele - João Santos', CURRENT_DATE, 'completed');
    
    RAISE NOTICE 'Receitas inseridas com sucesso!';
  END IF;
  
  IF v_account_banco IS NOT NULL AND v_category_materiais IS NOT NULL THEN
    -- Despesas
    INSERT INTO transactions (company_id, account_id, category_id, type, amount, description, transaction_date, status)
    VALUES 
      (v_company_id, v_account_banco, v_category_materiais, 'expense', 450.00, 'Compra de materiais descartáveis', CURRENT_DATE - INTERVAL '5 days', 'completed'),
      (v_company_id, v_account_banco, v_category_materiais, 'expense', 120.00, 'Produtos de limpeza', CURRENT_DATE - INTERVAL '3 days', 'completed'),
      (v_company_id, v_account_banco, v_category_materiais, 'expense', 85.00, 'Material de escritório', CURRENT_DATE - INTERVAL '1 day', 'completed');
    
    RAISE NOTICE 'Despesas inseridas com sucesso!';
  END IF;
  
  -- ============================================
  -- 6. INSERIR PRODUTOS EM ESTOQUE
  -- ============================================
  
  INSERT INTO products (company_id, name, category, quantity, min_stock, unit_cost, unit_price, supplier, notes)
  VALUES 
    (v_company_id, 'Luvas Descartáveis (Caixa 100un)', 'Materiais', 50, 10, 45.00, 80.00, 'MedSupply', 'Tamanho M'),
    (v_company_id, 'Máscaras Cirúrgicas (Caixa 50un)', 'Materiais', 100, 20, 35.00, 60.00, 'MedSupply', 'Tripla camada'),
    (v_company_id, 'Álcool Gel 70% (500ml)', 'Higiene', 15, 10, 12.00, 25.00, 'CleanPro', 'Alerta: Estoque baixo'),
    (v_company_id, 'Seringas Descartáveis 3ml', 'Materiais', 80, 30, 0.80, 2.50, 'MedSupply', 'Estéril'),
    (v_company_id, 'Algodão Hidrófilo (500g)', 'Materiais', 25, 8, 18.00, 35.00, 'FarmaMed', NULL),
    (v_company_id, 'Ácido Hialurônico (1ml)', 'Insumos', 8, 5, 280.00, 600.00, 'DermaLab', 'Refrigerar');
  
  RAISE NOTICE 'Produtos em estoque inseridos com sucesso!';
  
  -- ============================================
  -- RESUMO FINAL
  -- ============================================
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'DADOS DE DEMONSTRAÇÃO INSERIDOS!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ 5 Clientes cadastrados';
  RAISE NOTICE '✅ 5 Procedimentos criados';
  RAISE NOTICE '✅ 5 Agendamentos marcados';
  RAISE NOTICE '✅ 6 Transações financeiras';
  RAISE NOTICE '✅ 6 Produtos em estoque';
  RAISE NOTICE '========================================';
  
END $$;

-- ============================================
-- VERIFICAÇÃO DOS DADOS INSERIDOS
-- ============================================

SELECT 
  'Clientes' as tabela,
  COUNT(*) as total
FROM clients 
WHERE company_id = (SELECT id FROM companies WHERE active = true LIMIT 1)

UNION ALL

SELECT 
  'Procedimentos' as tabela,
  COUNT(*) as total
FROM procedures 
WHERE company_id = (SELECT id FROM companies WHERE active = true LIMIT 1)

UNION ALL

SELECT 
  'Agendamentos' as tabela,
  COUNT(*) as total
FROM appointments 
WHERE company_id = (SELECT id FROM companies WHERE active = true LIMIT 1)

UNION ALL

SELECT 
  'Transações' as tabela,
  COUNT(*) as total
FROM transactions 
WHERE company_id = (SELECT id FROM companies WHERE active = true LIMIT 1)

UNION ALL

SELECT 
  'Produtos' as tabela,
  COUNT(*) as total
FROM products 
WHERE company_id = (SELECT id FROM companies WHERE active = true LIMIT 1);
