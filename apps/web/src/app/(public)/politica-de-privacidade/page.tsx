import { Metadata } from 'next';
import { PublicNavbar } from '@/components/landing/PublicNavbar';
import { FooterSection } from '@/components/landing/sections/FooterSection';

export const metadata: Metadata = {
  title: 'Política de Privacidade | Agenda Inteligente',
  description: 'Saiba como o Agenda Inteligente coleta, utiliza e protege os seus dados pessoais e de seus pacientes em conformidade com a LGPD.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#2C2825]">
      <PublicNavbar />
      
      <main className="pt-32 pb-24 px-4 max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-black mb-8 font-serif text-[#2C2825]">Política de Privacidade</h1>
        <p className="text-sm text-[#8A847C] mb-12 uppercase tracking-widest font-bold">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

        <div className="prose prose-lg prose-amber max-w-none text-[#5C5855]">
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-[#2C2825] mb-4">1. Introdução</h2>
            <p>O <strong>Agenda Inteligente</strong> tem o compromisso de proteger a privacidade e os dados pessoais de nossos clientes (clínicas e profissionais) e dos seus respectivos pacientes. Esta política explica de forma transparente como coletamos, usamos, armazenamos e protegemos suas informações em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).</p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-[#2C2825] mb-4">2. Dados Coletados</h2>
            <p>Coletamos diferentes tipos de informações para o funcionamento adequado da plataforma:</p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li><strong>Dados da Clínica:</strong> Razão social, CNPJ, endereço, telefone de contato e configurações do sistema.</li>
              <li><strong>Dados dos Usuários:</strong> Nome completo, CPF, e-mail, senhas criptografadas e logs de acesso.</li>
              <li><strong>Dados dos Clientes/Pacientes:</strong> Nome, telefone, e-mail, data de nascimento e observações cadastrais inseridas pela clínica.</li>
              <li><strong>Dados de Agendamento:</strong> Histórico de consultas, procedimentos realizados, status de comparecimento.</li>
              <li><strong>Dados Financeiros:</strong> Registros de transações, faturamento e contas a pagar. Não armazenamos dados completos de cartão de crédito.</li>
              <li><strong>Dados de Comunicação:</strong> Registros de envios de WhatsApp, SMS e e-mails enviados através da plataforma.</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-[#2C2825] mb-4">3. Finalidade dos Dados</h2>
            <p>Os dados coletados são utilizados exclusivamente para:</p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Fornecer, operar e manter os serviços do SaaS Agenda Inteligente.</li>
              <li>Permitir o gerenciamento de agendas, prontuários e finanças pela clínica contratante.</li>
              <li>Enviar notificações automáticas de lembretes aos pacientes (se autorizado).</li>
              <li>Prestar suporte técnico e resolver problemas operacionais.</li>
              <li>Cumprir obrigações legais e regulatórias.</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-[#2C2825] mb-4">4. Compartilhamento</h2>
            <p>O Agenda Inteligente atua como <strong>Operador</strong> dos dados dos pacientes inseridos pelas clínicas (que atuam como Controladoras). Nós <strong>não vendemos, não alugamos e não compartilhamos</strong> os dados dos seus pacientes com terceiros para fins de marketing.</p>
            <p className="mt-4">O compartilhamento ocorre estritamente com fornecedores de infraestrutura essenciais (ex: Amazon Web Services, Supabase) e gateways de pagamento homologados, que também cumprem rigorosas normas de segurança.</p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-[#2C2825] mb-4">5. Segurança</h2>
            <p>Implementamos medidas de segurança técnicas e organizacionais rígidas:</p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li><strong>Criptografia:</strong> Dados sensíveis e senhas são criptografados em repouso e em trânsito (HTTPS/SSL).</li>
              <li><strong>Autenticação:</strong> Controle de acesso seguro e políticas de isolamento de dados (Row Level Security - RLS), garantindo que uma clínica jamais acesse dados de outra.</li>
              <li><strong>Backups:</strong> Cópias de segurança diárias e automatizadas para prevenção de perda de dados.</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-[#2C2825] mb-4">6. Direitos do Titular (LGPD)</h2>
            <p>Você tem total controle sobre seus dados e pode exercer os seguintes direitos a qualquer momento:</p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li><strong>Acesso e Transparência:</strong> Saber quais dados temos sobre você.</li>
              <li><strong>Correção:</strong> Atualizar dados incompletos ou incorretos diretamente no painel.</li>
              <li><strong>Exportação (Portabilidade):</strong> Baixar um arquivo CSV com os dados da sua clínica.</li>
              <li><strong>Exclusão:</strong> Solicitar o apagamento total dos seus dados e dos seus pacientes de nossos servidores, ressalvadas as obrigações legais de retenção.</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-[#2C2825] mb-4">7. Contato de Privacidade</h2>
            <p>Para dúvidas, requisições de dados ou solicitações de exclusão, entre em contato com nosso Encarregado de Proteção de Dados (DPO) através do e-mail:</p>
            <p className="font-bold text-[#D4AF37] mt-2">privacidade@agendainteligente.com.br</p>
          </section>
        </div>
      </main>
      
      <FooterSection />
    </div>
  );
}
