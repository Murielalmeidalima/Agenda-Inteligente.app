# DIRETRIZES DE SEGURANÇA

## 1. Multi-Tenancy Isolamento de Dados (RLS)
O núcleo de segurança do Agenda Inteligente depende estritamente do **Row Level Security (RLS)** do PostgreSQL via Supabase.
- **Regra de Ouro:** NENHUMA tabela de negócio pode ser criada sem habilitar o RLS.
- Todo acesso autenticado deve obrigatoriamente validar o `company_id`.
- A função `get_my_company_id()` é utilizada nas Policies para garantir que o usuário só enxergue dados da própria clínica.

## 2. Autenticação e Autorização (JWT)
- **Provedor:** Supabase Auth.
- **Custom Claims:** Utilizamos um Auth Hook Customizado no Supabase para injetar o `company_id` e `role` do usuário diretamente no Token JWT.
- **Validação de Rota:** O middleware do Next.js bloqueia rotas privadas (`/dashboard/*`) caso o JWT não esteja presente ou expirado.

## 3. Webhooks (Asaas e Evolution)
- Requisições que chegam do Asaas ou da Evolution API em `/api/webhooks/*` devem obrigatoriamente validar o Header de Segurança/Token fornecido na payload ou nas variáveis de ambiente, para evitar requisições forjadas.

## 4. Proteção de Borda (Headers)
- Configurados no `vercel.json` e Cloudflare.
- Política de CORS estrita.
- Proteção contra Clickjacking e XSS garantidas via headers HTTP padrão.
