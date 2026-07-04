'use client';

export function HowItWorksSection() {
  const steps = [
    {
      num: '01',
      title: 'Crie sua conta em minutos',
      desc: 'Faça o cadastro gratuitamente de forma rápida. Sem burocracia e pronto para uso imediato.',
    },
    {
      num: '02',
      title: 'Configure seus serviços e equipe',
      desc: 'Cadastre os procedimentos oferecidos, associe os profissionais e defina os horários de atendimento.',
    },
    {
      num: '03',
      title: 'Cadastre ou importe seus clientes',
      desc: 'Organize sua base de clientes para ter acesso instantâneo a históricos de visitas, prontuários e contatos.',
    },
    {
      num: '04',
      title: 'Ative as automações inteligentes',
      desc: 'Habilite os lembretes de consulta por WhatsApp e e-mails automáticos para manter sua agenda sempre otimizada.',
    },
    {
      num: '05',
      title: 'Acompanhe o seu crescimento',
      desc: 'Acesse relatórios gerenciais e monitore suas metas estratégicas e financeiras em tempo real.',
    },
  ];

  return (
    <section id="how-it-works" className="py-20 md:py-28 px-4 bg-white relative overflow-hidden">
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#D4AF37]/5 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-4xl mx-auto font-sans">
        <div className="text-center mb-16">
          <span className="text-[#D4AF37] font-bold tracking-widest uppercase text-xs sm:text-sm mb-3 block">
            PASSO A PASSO
          </span>
          <h2 className="font-serif text-3xl md:text-5xl font-bold text-[#2C2825] mb-4">
            Simples como a sua gestão deve ser
          </h2>
          <p className="text-[#5C5855] text-base sm:text-lg">
            Em apenas 5 passos, sua clínica ou salão estará funcionando com tecnologia de ponta.
          </p>
        </div>

        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-6 md:left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#D4AF37] via-[#C5A028] to-[#2C2825] hidden md:block" />

          <div className="space-y-6 md:space-y-8">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className="flex items-start gap-5 md:gap-8 group"
              >
                {/* Number Circle */}
                <div className="relative z-10 w-12 h-12 md:w-16 md:h-16 shrink-0 rounded-2xl bg-white border-2 border-[#FAF6F0] group-hover:border-[#D4AF37] flex items-center justify-center shadow-[0_4px_10px_rgba(44,40,37,0.01)] group-hover:shadow-md transition-all duration-300">
                  <span className="text-[#D4AF37] font-bold text-sm md:text-lg font-serif">{step.num}</span>
                </div>

                {/* Content */}
                <div className="flex-1 bg-white rounded-3xl p-6 md:p-8 border border-[#FAF6F0] group-hover:border-[#D4AF37]/20 group-hover:shadow-[0_15px_30px_rgba(44,40,37,0.03)] transition-all duration-300">
                  <h3 className="text-lg md:text-xl font-bold text-[#2C2825] mb-2 font-serif group-hover:text-[#D4AF37] transition-colors">{step.title}</h3>
                  <p className="text-[#5C5855] leading-relaxed text-sm sm:text-base">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
