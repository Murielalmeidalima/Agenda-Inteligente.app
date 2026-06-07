import { Metadata } from 'next';
import { PublicNavbar } from '@/components/landing/PublicNavbar';
import { FooterSection } from '@/components/landing/sections/FooterSection';

export const metadata: Metadata = {
  title: 'Termos de Uso | Agenda Inteligente',
  description: 'Termos e Condições de Uso da plataforma Agenda Inteligente.',
};

export default function TermsOfUsePage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#2C2825]">
      <PublicNavbar />
      
      <main className="pt-32 pb-24 px-4 max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-black mb-8 font-serif text-[#2C2825]">Termos de Uso</h1>
        <p className="text-sm text-[#8A847C] mb-12 uppercase tracking-widest font-bold">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

        <div className="prose prose-lg prose-amber max-w-none text-[#5C5855]">
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-[#2C2825] mb-4">1. Aceitação dos Termos</h2>
            <p>Ao criar uma conta e utilizar a plataforma <strong>Agenda Inteligente</strong>, você concorda integralmente e sem ressalvas com os presentes Termos de Uso. Caso não concorde com qualquer disposição, você não deverá utilizar o sistema.</p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-[#2C2825] mb-4">2. Cadastro e Acesso</h2>
            <p>Para utilizar a plataforma, a clínica deve fornecer dados reais e atualizados. O acesso é pessoal e intransferível, sendo o titular da conta responsável por manter o sigilo de suas senhas de acesso. Qualquer atividade realizada na conta será de responsabilidade da clínica.</p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-[#2C2825] mb-4">3. Responsabilidades da Clínica</h2>
            <p>A clínica atua como Controladora dos dados de seus pacientes, cabendo a ela:</p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Garantir que possui a base legal (como o consentimento) para cadastrar pacientes na plataforma.</li>
              <li>Garantir que as comunicações via WhatsApp ou SMS feitas pelo sistema possuam autorização prévia dos destinatários (anti-spam).</li>
              <li>Manter a veracidade das informações financeiras e de prontuário lançadas no sistema.</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-[#2C2825] mb-4">4. Responsabilidades do Sistema</h2>
            <p>O Agenda Inteligente compromete-se a fornecer a infraestrutura tecnológica necessária para o funcionamento do SaaS, garantindo a integridade, segurança (via criptografia e RLS) e disponibilidade razoável dos dados hospedados.</p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-[#2C2825] mb-4">5. Planos, Assinaturas e Pagamentos</h2>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>O serviço é fornecido através de assinaturas recorrentes (mensais ou anuais), de acordo com o plano escolhido no momento da contratação.</li>
              <li>Os pagamentos são processados por gateways de pagamento homologados, sem que o sistema armazene o número completo de cartões de crédito.</li>
              <li>O atraso no pagamento poderá acarretar a suspensão temporária do acesso após aviso prévio de 5 (cinco) dias.</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-[#2C2825] mb-4">6. Cancelamentos</h2>
            <p>O assinante pode cancelar a renovação do serviço a qualquer momento, diretamente pelo painel administrativo da plataforma. O acesso permanecerá ativo até o final do período já faturado. Não efetuamos estornos de meses parcialmente utilizados.</p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-[#2C2825] mb-4">7. Disponibilidade do Serviço</h2>
            <p>Empenhamos nossos melhores esforços para manter a plataforma no ar 99% do tempo. No entanto, interrupções para manutenções programadas poderão ocorrer, sendo previamente comunicadas sempre que possível.</p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-[#2C2825] mb-4">8. Limitação de Responsabilidade</h2>
            <p>A plataforma não se responsabiliza por lucros cessantes, perda de receita ou danos indiretos resultantes do uso inadequado do sistema pela clínica ou falhas graves na infraestrutura de internet. O sistema fornece ferramentas de auxílio, mas as decisões de gestão clínica são exclusivas do contratante.</p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-[#2C2825] mb-4">9. Foro e Legislação</h2>
            <p>Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da comarca da sede da empresa para dirimir quaisquer controvérsias decorrentes deste documento.</p>
          </section>
        </div>
      </main>
      
      <FooterSection />
    </div>
  );
}
