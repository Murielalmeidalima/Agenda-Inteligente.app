-- Correção Crítica: Permitir que o usuário atualize os dados da sua empresa (Ex: Logo, Endereço)

-- Sem isso, o upload da imagem funciona no Storage, mas falha ao tentar salvar o Link no Banco de Dados.
CREATE POLICY "Users can update own company"
ON companies FOR UPDATE
USING ( id = get_my_company_id() )
WITH CHECK ( id = get_my_company_id() );
