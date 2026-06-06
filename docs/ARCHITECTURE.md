# ARQUITETURA DO PROJETO

## Frontend
- **Framework:** Next.js 14+ (App Router)
- **Linguagem:** TypeScript
- **Estilização:** TailwindCSS / CSS Modules / UI Components Customizados
- **Responsividade:** Mobile-first approach para funcionar perfeitamente em browsers móveis.

## Backend
- **Framework:** Route Handlers do Next.js (`app/api/*`)
- **Linguagem:** TypeScript
- **Integrações Externas:** Asaas (Cobranças/SaaS), Evolution API (WhatsApp)

## Banco de Dados
- **Provider:** Supabase
- **Tecnologia:** PostgreSQL
- **Padrão:** Multi-Tenant (Isolamento via `company_id`)
- **Acesso:** SDK do Supabase Client/Server

## Infraestrutura do WhatsApp (Mensageria)
- **Motor:** Evolution API
- **Cache:** Redis
- **Hospedagem:** VPS Hostinger Dedicada
- **Conectividade:** Webhooks configurados para disparar eventos para a Vercel.

## Deploy & DNS
- **Hospedagem Principal:** Vercel (Produção e Previews)
- **Gerenciador de DNS:** Cloudflare (Proteção DDoS, Proxy Reverso)
- **Versionamento:** GitHub (Monorepo via Turborepo)
