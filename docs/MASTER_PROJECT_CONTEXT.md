# DOCUMENTO MESTRE OFICIAL — AGENDA INTELIGENTE

A partir de agora, este documento deve ser tratado como a fonte oficial de contexto do projeto.

Sempre que iniciar uma nova análise, implementação ou auditoria:
1. Ler este documento primeiro.
2. Validar se as alterações propostas estão alinhadas com ele.
3. Atualizar este documento quando houver mudanças estruturais relevantes.
4. Nunca assumir arquitetura diferente da descrita aqui sem justificar.

## IDENTIDADE DO PROJETO
- **Nome:** Agenda Inteligente
- **Tipo:** SaaS Web Multi-Tenant para Clínicas e Consultórios
- **Mercado:** Brasil
- **Idioma:** Português Brasileiro

## DECISÃO ESTRATÉGICA
O projeto **NÃO** terá:
- Aplicativo Android
- Aplicativo iOS
- APK
- React Native

O projeto será exclusivamente: **SaaS Web Responsivo**
Funcionando perfeitamente em:
- Desktop
- Tablet
- Navegador Mobile

## MÓDULOS EXISTENTES
- Dashboard
- Agenda
- Clientes
- Procedimentos
- Financeiro
- Estoque
- Marketing
- Funcionários
- Configurações
- Relatórios
- Anamnese
- Avaliações
- Notificações
- Assinaturas

## REGRA IMPORTANTE
Antes de qualquer implementação:
- verificar impacto na segurança
- verificar impacto no banco
- verificar impacto no multi-tenant
- verificar impacto na escalabilidade

## PROCEDIMENTO OBRIGATÓRIO
Sempre iniciar novas tarefas respondendo:
1. O que será alterado?
2. Qual impacto no banco?
3. Qual impacto na segurança?
4. Qual impacto na escalabilidade?
5. Existe risco para produção?

Somente depois propor implementação.

## OBJETIVO FINAL
Construir um SaaS profissional, seguro, escalável e preparado para centenas ou milhares de clínicas sem necessidade de reestruturação futura.
