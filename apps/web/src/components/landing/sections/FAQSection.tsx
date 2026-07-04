'use client';

import { ChevronDown } from 'lucide-react';

export function FAQSection() {
  const faqs = [
    {
      q: "Consigo acessar o sistema pelo celular ou tablet?",
      a: "Sim! O Agenda Inteligente é 100% responsivo e otimizado para dispositivos móveis. Você pode gerenciar seus agendamentos, clientes e financeiro de qualquer lugar, direto do celular."
    },
    {
      q: "Preciso instalar algum software ou aplicativo?",
      a: "Não. Nossa plataforma funciona inteiramente na nuvem. Você só precisa de um navegador com acesso à internet para utilizar o sistema em qualquer computador ou dispositivo."
    },
    {
      q: "Como funciona o período de teste gratuito?",
      a: "Você pode testar a nossa plataforma por 7 dias inteiramente grátis, sem precisar cadastrar cartão de crédito. É a oportunidade ideal para você conhecer todos os recursos na prática."
    },
    {
      q: "Meus dados de clientes e prontuários estão seguros?",
      a: "Com certeza. A segurança e privacidade dos seus dados são nossa prioridade. Todas as informações são criptografadas em servidores seguros e em estrita conformidade com a LGPD."
    },
    {
      q: "Consigo importar dados de outro sistema ou planilha?",
      a: "Sim! Facilitamos a importação dos seus cadastros de clientes. Nossa equipe de suporte está à disposição para ajudar você a migrar suas informações sem perda de dados."
    },
    {
      q: "Como funciona o suporte ao cliente?",
      a: "Oferecemos suporte humanizado em português de segunda a sexta em horário comercial. Você pode entrar em contato conosco diretamente pelo WhatsApp ou por e-mail."
    }
  ];

  return (
    <section className="bg-[#FAF6F0] py-24 px-4 md:px-10" id="faq">
      <div className="max-w-3xl mx-auto font-sans">
        <div className="text-center mb-16 animate-fade-in-up">
          <span className="text-[#D4AF37] font-bold tracking-widest uppercase text-xs sm:text-sm mb-3 block">
            DÚVIDAS FREQUENTES
          </span>
          <h2 className="font-serif text-3xl md:text-[38px] font-bold text-[#2C2825] leading-[1.3]">
            Perguntas Frequentes
          </h2>
          <p className="text-[#5C5855] mt-3 text-sm sm:text-base">
            Esclareça suas principais dúvidas sobre o Agenda Inteligente e veja como é fácil começar.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <details 
              key={idx} 
              className="group bg-white border border-[#FAF6F0] shadow-[0_4px_20px_rgba(44,40,37,0.01)] rounded-2xl overflow-hidden transition-all duration-300 [&_summary::-webkit-details-marker]:hidden hover:border-[#D4AF37]/20"
            >
              <summary className="flex justify-between items-center p-6 cursor-pointer list-none font-bold text-[#2C2825] font-serif text-base md:text-lg select-none hover:text-[#D4AF37] transition-colors duration-300">
                {faq.q}
                <ChevronDown className="w-5 h-5 text-[#D4AF37] transition-transform duration-300 group-open:rotate-180 shrink-0 ml-4" />
              </summary>
              <div className="p-6 pt-0 text-[#5C5855] text-sm sm:text-base border-t border-[#FAF6F0] leading-relaxed font-sans">
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

