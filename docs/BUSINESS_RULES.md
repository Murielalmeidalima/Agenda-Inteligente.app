# REGRAS DE NEGÓCIO E ASSINATURA

## Fluxo de Onboarding e Trial (Teste Grátis)
1. **Fricção Zero:** Uma clínica se cadastra no site e não depende de aprovação humana.
2. **Setup Automático:** O sistema cria o `company_id`, gera um Customer no gateway (Asaas), e cria uma assinatura local com status de `trial`.
3. **Duração:** O teste grátis tem duração padrão de 7 dias, contados a partir da data de cadastro.
4. **Fim do Trial:** O sistema deve exigir a escolha de um plano pago para manter o acesso às telas do sistema.

## Gateway e Pagamento (Asaas)
- **Cobrança Recorrente:** Totalmente gerenciada via Webhooks do Asaas (`/api/webhooks/asaas/route.ts`).
- **Inadimplência:** Se o Asaas notificar `PAYMENT_OVERDUE`, o status da assinatura local vai para `past_due` e o painel da clínica deve exibir uma tela de bloqueio com link para pagamento, preservando os dados (NUNCA deletar dados por inadimplência).

## Planos e Limites de Funcionários (Assentos)
A precificação do SaaS baseia-se unicamente na quantidade máxima de usuários que a clínica cadastra:
- **Plano Inicial:** Permite no máximo 1 usuário (O dono/Admin).
- **Plano Profissional:** Permite até 3 usuários (ex: Admin, Dentista, Recepcionista).
- **Plano Empresarial:** Permite até 10 usuários.
- **Plano Premium:** Sem limite restritivo de assentos.

O Backend/Frontend da aba "Equipes" obrigatoriamente fará a leitura de `max_users` do plano ativo e **bloqueará** novos cadastros caso a cota já esteja completa, exigindo que a clínica pague por um plano superior.

## Regras de Permissões
- **Administrador:** Acesso global à clínica. (Normalmente o titular da assinatura).
- **Chefe:** Nível tático, acesso global, mas sem controle da assinatura no Asaas.
- **Profissional / Dentista / Médico:** Acesso apenas às SUAS agendas e SEUS pacientes, não visualiza o faturamento da clínica.
- **Financeiro:** Acesso aos relatórios, contas a pagar/receber e assinatura.
- **Recepção:** Acesso à agenda de todos os profissionais para marcações, não tem acesso aos balanços financeiros de longo prazo.
