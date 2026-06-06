# GUIA DE DEPLOY

## Repositório e Integração Contínua (CI)
O processo de deploy do Agenda Inteligente é 100% automatizado a partir da branch `main` no GitHub.

1. **Commit e Push:** Qualquer código enviado via Push ou Merge de um Pull Request na branch `main` engatilha uma Action (`.github/workflows/ci.yml`).
2. **Testes Obrigatórios:** A Action executará o Lint e o Build do pacote `web`. Se houver qualquer falha ou erro tipográfico no TypeScript, o processo é abortado.

## Vercel (Frontend e Backend Serverless)
1. Conecte sua conta da Vercel ao repositório do GitHub.
2. Defina o **Root Directory** para `apps/web`.
3. Certifique-se de preencher todas as Variáveis de Ambiente requeridas (Supabase URL/Key, Asaas Tokens, etc) na aba Settings da Vercel.
4. Qualquer push validado na branch `main` refletirá imediatamente em produção.

## VPS Hostinger (WhatsApp Evolution API)
1. O deploy da API de WhatsApp não segue o fluxo da Vercel.
2. Acessando a VPS via SSH, utilize os arquivos fornecidos em `packages/infrastructure/`.
3. Suba o sistema rodando `docker-compose up -d`.
4. Garanta que o Nginx/Traefik está mapeando as portas com SSL renovado (Let's Encrypt).

## Banco de Dados Supabase
- Migrações (`migration_saas_billing.sql`, etc) devem ser executadas manualmente ou via CLI do Supabase contra o ambiente de Produção ANTES do deploy da Vercel caso existam quebras de contrato de dados.
