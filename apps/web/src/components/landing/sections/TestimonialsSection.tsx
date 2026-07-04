'use client';
import { Star } from 'lucide-react';

export function TestimonialsSection() {
  const testimonials = [
    {
      name: 'Dra. Carolina Mendes',
      clinic: 'Mendes Estética Avançada',
      text: 'Com as confirmações automáticas de consultas via WhatsApp, obtivemos uma eficiência incrível. A taxa de presença aumentou e nossa recepção hoje tem muito mais tempo para acolher os clientes com excelência.',
    },
    {
      name: 'Dr. Ricardo Augusto',
      clinic: 'Odontologia Integrada',
      text: 'A integração completa do financeiro com a agenda transformou o gerenciamento do consultório. Agora temos visibilidade em tempo real do faturamento e indicadores de rentabilidade precisos.',
    },
    {
      name: 'Mariana Rocha',
      clinic: 'Espaço Beleza Real',
      text: 'O acesso mobile é excelente. A facilidade de anexar fotos de evolução clínica direto no prontuário digital e colher assinaturas na tela do tablet elevou a percepção de valor dos nossos atendimentos.',
    },
  ];

  return (
    <section className="py-20 md:py-28 px-4 bg-white relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-1/4 left-0 w-80 h-80 bg-[#D4AF37]/5 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto font-sans">
        <div className="text-center mb-16">
          <span className="text-[#D4AF37] font-bold tracking-widest uppercase text-xs sm:text-sm mb-3 block">
            DEPOIMENTOS DE SUCESSO
          </span>
          <h2 className="font-serif text-3xl md:text-5xl font-bold mb-4 text-[#2C2825]">
            Quem usa, aprova e recomenda
          </h2>
          <p className="text-[#5C5855] text-base sm:text-lg max-w-2xl mx-auto">
            Descubra como profissionais de estética, saúde e beleza estão alcançando novos patamares de organização e crescimento.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="p-8 bg-white rounded-[2rem] border border-[#FAF6F0] shadow-[0_10px_30px_rgba(44,40,37,0.02)] hover:shadow-lg hover:border-[#D4AF37]/20 hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex gap-1 text-[#D4AF37] mb-6">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-[#5C5855] text-sm sm:text-base italic mb-6 leading-relaxed">
                  &ldquo;{t.text}&rdquo;
                </p>
              </div>
              <div className="flex items-center gap-3 pt-5 border-t border-[#FAF6F0]">
                {/* Avatar */}
                <div className="w-10 h-10 bg-[#FAF6F0] rounded-full flex items-center justify-center text-[#D4AF37] font-bold text-sm shrink-0 border border-[#FAF6F0]">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#2C2825]">{t.name}</h4>
                  <p className="text-xs text-[#8A847C] font-medium">{t.clinic}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
