'use client';
import { Star } from 'lucide-react';
import { Card } from '@projeto/ui';

export function TestimonialsSection() {
  // Estrutura pronta para os depoimentos futuros.
  // Pode ser preenchido no banco de dados ou mockado aqui.
  const testimonials = [
    {
      name: "[Nome do Cliente 1]",
      clinic: "Clínica de Estética",
      text: "Eu perdia muito tempo confirmando consulta uma a uma pelo WhatsApp. Depois do Agenda Inteligente, as faltas caíram a zero e minha secretária pôde focar em vender mais pacotes.",
      photo: ""
    },
    {
      name: "[Nome do Cliente 2]",
      clinic: "Consultório Odontológico",
      text: "Ter o financeiro ligado à agenda mudou meu negócio. Hoje eu sei exatamente de onde vem meu lucro e quais procedimentos me dão mais retorno.",
      photo: ""
    },
    {
      name: "[Nome do Cliente 3]",
      clinic: "Salão de Beleza Premium",
      text: "O acesso pelo celular é surreal de bom. Eu tiro a foto do antes e depois direto no app e já fica salva no prontuário da cliente. Muito profissional!",
      photo: ""
    }
  ];

  return (
    <section className="py-24 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-[#2C2825] font-serif">Quem usa, recomenda.</h2>
          <p className="text-[#5C5855] text-xl">Faça parte do grupo de profissionais que revolucionaram suas clínicas.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <Card key={i} className="p-8 border border-[#E5E0D8]/50 bg-[#FAF9F6] rounded-3xl hover:-translate-y-2 transition-transform duration-300">
              <div className="flex gap-1 text-[#D4AF37] mb-6">
                {[1,2,3,4,5].map(star => <Star key={star} className="w-5 h-5 fill-current" />)}
              </div>
              <p className="text-[#5C5855] text-lg italic mb-8 leading-relaxed">
                "{t.text}"
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-200 rounded-full border-2 border-white shadow-sm overflow-hidden flex items-center justify-center text-slate-400 font-bold text-xs text-center">
                  FOTO
                </div>
                <div>
                  <h4 className="font-bold text-[#2C2825]">{t.name}</h4>
                  <p className="text-sm text-[#8A847C]">{t.clinic}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
