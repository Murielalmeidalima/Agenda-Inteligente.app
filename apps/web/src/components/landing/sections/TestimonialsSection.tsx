'use client';
import { Star } from 'lucide-react';

export function TestimonialsSection() {
  const testimonials = [
    {
      name: 'Dra. Carolina Mendes',
      clinic: 'Mendes Estética Avançada',
      text: 'Eu perdia muito tempo confirmando consulta uma a uma pelo WhatsApp. Depois do Agenda Inteligente, as faltas caíram a zero e minha secretária pôde focar em vender mais pacotes.',
    },
    {
      name: 'Dr. Ricardo Augusto',
      clinic: 'Odontologia Integrada',
      text: 'Ter o financeiro ligado à agenda mudou meu negócio. Hoje eu sei exatamente de onde vem meu lucro e quais procedimentos me dão mais retorno.',
    },
    {
      name: 'Mariana Rocha',
      clinic: 'Espaço Beleza Real',
      text: 'O acesso pelo celular é surreal de bom. Eu tiro a foto do antes e depois direto no sistema e já fica salva no prontuário da cliente. Muito profissional!',
    },
  ];

  return (
    <section className="py-20 md:py-28 px-4 bg-[#fbf1f2] relative overflow-hidden">
      <div className="absolute top-1/4 left-0 w-80 h-80 bg-[#d9a5b3]/5 rounded-full blur-3xl -z-10" />

      <div className="max-w-7xl mx-auto font-sans">
        <div className="text-center mb-14">
          <span className="text-[#7d525f] font-bold tracking-widest uppercase text-sm mb-3 block">
            DEPOIMENTOS
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold mb-4 text-[#1f1a1b] font-playfair-display">
            Quem usa, recomenda.
          </h2>
          <p className="text-[#504446] text-lg md:text-xl">
            Faça parte do grupo de profissionais que revolucionaram suas clínicas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="p-7 bg-white rounded-3xl border border-[#d4c2c5]/30 hover:border-[#c97d95]/40 hover:shadow-[0_12px_32px_rgba(201,125,149,0.03)] hover:-translate-y-1 transition-all duration-300 cursor-default"
            >
              <div className="flex gap-0.5 text-[#c97d95] mb-5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <p className="text-[#504446] text-base italic mb-6 leading-relaxed">
                &ldquo;{t.text}&rdquo;
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-[#d4c2c5]/25">
                {/* Avatar */}
                <div className="w-10 h-10 bg-[#fbf1f2] rounded-full flex items-center justify-center text-[#7d525f] font-bold text-sm shrink-0">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#1f1a1b]">{t.name}</h4>
                  <p className="text-xs text-[#504446]">{t.clinic}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
