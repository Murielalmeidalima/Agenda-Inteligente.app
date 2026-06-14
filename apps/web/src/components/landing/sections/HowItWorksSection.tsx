'use client';

export function HowItWorksSection() {
  const steps = [
    {
      num: '01',
      title: 'Cadastre sua clínica',
      desc: 'Crie sua conta em menos de 2 minutos. Sem cartão de crédito, sem burocracia.',
    },
    {
      num: '02',
      title: 'Cadastre seus clientes',
      desc: 'Importe sua base ou cadastre um a um. Tudo organizado com histórico completo.',
    },
    {
      num: '03',
      title: 'Comece a agendar',
      desc: 'Use a agenda inteligente para marcar consultas sem conflitos e com lembretes automáticos.',
    },
    {
      num: '04',
      title: 'Automatize processos',
      desc: 'Ative WhatsApp, e-mails, marketing e avaliações — tudo no piloto automático.',
    },
    {
      num: '05',
      title: 'Acompanhe resultados',
      desc: 'Veja o crescimento real da sua clínica com dashboards, metas e relatórios financeiros.',
    },
  ];

  return (
    <section id="how-it-works" className="py-20 md:py-28 px-4 bg-[#f8f3ed] relative overflow-hidden">
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#d9a5b3]/5 rounded-full blur-3xl -z-10" />

      <div className="max-w-4xl mx-auto font-sans">
        <div className="text-center mb-14">
          <span className="text-[#7d525f] font-bold tracking-widest uppercase text-sm mb-3 block">
            COMO FUNCIONA
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-[#1f1a1b] mb-4 font-playfair-display">
            Simples como deve ser
          </h2>
          <p className="text-[#504446] text-lg md:text-xl">
            Em 5 passos, sua clínica estará funcionando com gestão profissional.
          </p>
        </div>

        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-6 md:left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#d9a5b3] via-[#c97d95] to-[#7d525f] hidden md:block" />

          <div className="space-y-6 md:space-y-8">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className="flex items-start gap-5 md:gap-8 group"
              >
                {/* Number Circle */}
                <div className="relative z-10 w-12 h-12 md:w-16 md:h-16 shrink-0 rounded-2xl bg-white border-2 border-[#d4c2c5]/60 group-hover:border-[#c97d95] flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-300">
                  <span className="text-[#7d525f] font-extrabold text-sm md:text-lg font-playfair-display">{step.num}</span>
                </div>

                {/* Content */}
                <div className="flex-1 bg-white rounded-3xl p-5 md:p-6 border border-[#d4c2c5]/30 group-hover:border-[#c97d95]/40 group-hover:shadow-[0_12px_32px_rgba(201,125,149,0.03)] transition-all duration-300">
                  <h3 className="text-xl font-bold text-[#1f1a1b] mb-1.5 font-playfair-display">{step.title}</h3>
                  <p className="text-[#504446] leading-relaxed text-sm">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
