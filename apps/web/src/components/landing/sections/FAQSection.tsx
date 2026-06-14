'use client';

import { ChevronDown } from 'lucide-react';

export function FAQSection() {
  const faqs = [
    {
      q: "Consigo usar no celular ou tablet?",
      a: "Sim! Nossa plataforma é 100% responsiva e otimizada para dispositivos móveis, permitindo que você gerencie sua clínica de qualquer lugar com acesso à internet."
    },
    {
      q: "Preciso instalar algum software?",
      a: "Não. O Agenda Inteligente funciona inteiramente na nuvem. Basta acessar através do seu navegador preferido em qualquer computador."
    },
    {
      q: "Como funciona o suporte técnico?",
      a: "Oferecemos suporte humano em português via WhatsApp, E-mail e Chat em horário comercial. Nossa equipe está pronta para ajudar você em cada etapa."
    }
  ];

  return (
    <section className="bg-[#fbf1f2] py-24 px-4 md:px-10" id="faq">
      <div className="max-w-3xl mx-auto font-sans">
        <div className="text-center mb-16 animate-fade-in-up">
          <h2 className="font-playfair-display text-3xl md:text-[32px] font-bold text-[#7d525f] leading-[1.3]">
            Perguntas Frequentes
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <details 
              key={idx} 
              className="group bg-white/80 backdrop-blur-md border border-white/50 shadow-[0_4px_12px_rgba(201,125,149,0.05)] rounded-2xl overflow-hidden transition-all duration-300 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex justify-between items-center p-6 cursor-pointer list-none font-bold text-[#7d525f] font-playfair-display text-base md:text-lg select-none">
                {faq.q}
                <ChevronDown className="w-5 h-5 text-[#504446] transition-transform duration-300 group-open:rotate-180 shrink-0 ml-4" />
              </summary>
              <div className="p-6 pt-0 text-[#504446] text-sm border-t border-[#d4c2c5]/30 leading-relaxed font-sans">
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

