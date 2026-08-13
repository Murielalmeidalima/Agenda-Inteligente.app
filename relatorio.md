# Relatório de Alterações e Ajustes

**Projeto:** Agenda-Inteligente.app
**Data:** 13/08/2026
**Branches/commits:** `main` — `54b8b65`, `22ec507`, `c875784`, `9908866`

---

## 1. Integração com Cloudflare Turnstile (CAPTCHA no login)

- **O que foi feito:**
  - Adicionado componente `Turnstile` no formulário de login (`apps/web/src/components/auth/Turnstile.tsx`).
  - Criada função de verificação de token no servidor (`apps/web/src/lib/captcha.ts`) e API de validação.
  - Corrigida a **CSP** em `apps/web/next.config.ts` para liberar `https://challenges.cloudflare.com` em `script-src`, `connect-src` e `frame-src` (sem isso o CAPTCHA nunca carregava).
- **Para ativar em produção:**
  - Cadastrar no Vercel a variável `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (guia salvo em `~/Downloads/configurar-vercel-turnstile.txt`).
  - Ajustar o site key de teste (sitekey do dashboard Cloudflare) pela chave real do domínio.

## 2. Melhorias na Agenda (as 4 pedidas)

| # | Pedido | Status | O que foi feito |
|---|--------|--------|-----------------|
| 1 | Notificação de manutenção recorrente | ✅ | `createMaintenanceAppointment` agora retorna `alreadyExists` e `futureDate`; toasts informativos no modal de edição e na criação |
| 2 | Símbolo de aniversário 🎂 | ✅ | Indicador de aniversário (±1 dia, via `lib/birthday.ts`) no dropdown de clientes, nos cards da visão Semana/Dia e no Mês |
| 3 | Cadastro rápido de cliente | ✅ | Já existia (nome, sobrenome, e-mail, WhatsApp, nascimento, Instagram) no formulário de novo agendamento |
| 4 | Dias da semana fixos | ✅ | Faixa de dias fixa + cabeçalho "sticky" na visão Semana/Dia (`DayWeekView.tsx`) |

## 3. Correção de Bugs

### 3.1 Agendamentos sobrepostos escondidos ("Branquela")
- **Sintoma:** ao finalizar um atendimento (ex.: cílios de 2h30/3h) e agendar outra cliente no mesmo horário, o segundo card ficava **escondido embaixo** do primeiro. Apagar o primeiro revelava o segundo.
- **Causa:** os cards usavam `absolute left-1.5 right-1.5` (largura total), então dois agendamentos no mesmo horário se empilhavam exatamente por cima.
- **Correção:** função `buildOverlapLayout()` em `DayWeekView.tsx` que divide os agendamentos sobrepostos em **colunas lado a lado** (`left` e `width` calculados em %), como em calendars modernos (Google Calendar). Todos os cards ficam visíveis.

### 3.2 Banco de dados (reconciliação)
- Migrations `20260812_database_reconciliation.sql` e `20260812_hardening_audit.sql` criadas para sanear inconsistências (agendamentos, manutenção, segurança de RLS).
- ⚠️ **Pendência:** aplicá-las no SQL Editor do Supabase (projeto `nvcmrsvrezjetppopjwy`) — sem isso, a manutenção automática pode falhar silenciosamente.

## 4. Recurso novo: "Encaixe" — finalizar antes do previsto

**Motivo:** a profissional termina os procedimentos antes do tempo previsto e quer liberar o restante do horário para outra cliente.

**Como funciona (modal de edição do agendamento):**
1. Clique em **Concluído**.
2. Aparece o campo **"⚡ Finalizou antes do previsto?"** com um seletor de horário (pré-preenchido com o horário original de término).
3. Informe o **horário real de término** e salve.
4. O `end_time` é reduzido para o horário real → o card **encolhe** na agenda e o tempo restante fica livre/visível para novos agendamentos.

**Regras:**
- Só aplica quando o horário informado é **anterior** ao previsto (não estende).
- Só aparece quando o status é `completed` e o modal está no modo de gerenciamento (não em edição).

## 5. Bloqueio de horários duplicados — verificação

**Confirmado: o sistema JÁ impede dois agendamentos no mesmo horário**, desde que estejam ativos:

- **Criação** (`schedule-calendar-client.tsx:762`): consulta o banco por conflitos do mesmo `professional_id`, excluindo status `cancelled` e `completed`, com sobreposição de tempo.
- **Edição** (`edit-appointment-modal.tsx:612`): mesma verificação, excluindo o próprio agendamento sendo editado.
- Se houver conflito: `"Este profissional já possui um agendamento ativo com <cliente> neste horário."`

**Comportamento intencional:**
- Agendamento **Concluído** ou **Cancelado** não bloqueia novos agendamentos (o horário fica livre). É exatamente o que permite o "encaixe".
- **Limitação:** a verificação é feita no cliente (não há constraint no banco). Duas abas abertas simultaneamente podem gerar um conflito raro; mitigável no futuro com uma `EXCLUDE constraint` no PostgreSQL (plano opcional).

## 6. Pendências / Próximos passos

- [ ] **Autenticar GitHub** (SSH ou token) para publicar os 4 commits no remoto (`git push origin main`).
- [ ] **Aplicar as 2 migrations** no Supabase (SQL Editor).
- [ ] **Cadastrar `NEXT_PUBLIC_TURNSTILE_SITE_KEY`** no Vercel e validar o CAPTCHA em produção.
- [ ] Deploy automático do Vercel após o push.
- [ ] Opcional: `EXCLUDE constraint` no banco para blindar o bloqueio de horário contra concorrência.

---

### Commits
```
54b8b65  feat(auth): integrate Cloudflare Turnstile CAPTCHA and fix database reconciliation
22ec507  fix(schedule): improve maintenance follow-up notifications and birthday indicators
c875784  fix(schedule): render overlapping appointments side-by-side in week/day view
9908866  feat(schedule): 'encaixe' - finalizar atendimento antes do previsto libera o horário
```
