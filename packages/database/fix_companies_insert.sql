-- Correção para permitir cadastro de novas empresas e usuários

-- 1. Permite que qualquer usuário logado crie uma nova empresa
-- Isso é fundamental para o fluxo de "Sign Up" de uma nova clínica
CREATE POLICY "Users can create company"
ON companies FOR INSERT
WITH CHECK ( auth.role() = 'authenticated' );

-- 2. Permite que o usuário crie seu próprio perfil (caso não seja criado via trigger)
-- Garante que o usuário só possa criar um perfil com seu próprio ID
CREATE POLICY "Users can create own profile"
ON profiles FOR INSERT
WITH CHECK ( auth.uid() = id );

-- Nota: A policy de UPDATE para profiles já existe e permite vincular a empresa depois.
