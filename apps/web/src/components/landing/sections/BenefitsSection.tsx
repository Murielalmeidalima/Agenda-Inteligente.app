'use client';
import { CheckCircle2 } from 'lucide-react';

export function BenefitsSection() {
  const benefits = [
    'Redução de até 40% nas faltas com lembretes automáticos via WhatsApp.',
    'Economia de 10h semanais em tarefas burocráticas e manuais.',
    'Aumento do ticket médio ao reengajar clientes inativos automaticamente.',
    'Previsibilidade de caixa: saiba exatamente o que vai receber no mês.',
    'Mais tempo livre para focar no que você ama: atender seus clientes.',
  ];

  const stats = [
    { value: '+35%', label: 'Atendimentos Concluídos', width: '85%' },
    { value: '+42%', label: 'Faturamento Médio', width: '92%' },
    { value: '-80%', label: 'Taxa de Faltas', width: '20%' },
  ];

  return (
    <section className="py-20 md:py-28 px-4 bg-[#fff8f8] relative overflow-hidden">
      <div className="absolute top-1/4 right-0 w-80 h-80 bg-[#d9a5b3]/5 rounded-full blur-3xl -z-10" />

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12 md:gap-16 font-sans">
        <div className="flex-1 space-y-6">
          <div>
            <span className="text-[#7d525f] font-bold tracking-widest uppercase text-sm mb-3 block">
              RETORNO SOBRE INVESTIMENTO
            </span>
            <h2 className="text-3xl md:text-5xl font-extrabold text-[#1f1a1b] leading-tight font-playfair-display">
              O sistema se paga no{' '}
              <span className="text-[#8c4a60]">primeiro mês.</span>
            </h2>
          </div>
          <p className="text-lg text-[#504446]">
            Não é um gasto, é um investimento. O Agenda Inteligente automatiza o que
            te faz perder tempo e dinheiro.
          </p>

          <div className="space-y-3 pt-2">
            {benefits.map((text, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#c97d95] shrink-0 mt-0.5" />
                <p className="text-[#504446] font-medium">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 w-full">
          <div className="p-8 bg-gradient-to-br from-[#f8f3ed] to-[#f5ecec] rounded-3xl border border-[#d4c2c5]/30 shadow-[0_12px_32px_rgba(201,125,149,0.03)]">
            <h3 className="text-xl font-bold text-[#1f1a1b] mb-6 font-playfair-display">
              Projeção de Crescimento
            </h3>
            <div className="space-y-5">
              {stats.map((stat, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm font-bold text-[#1f1a1b] mb-2">
                    <span>{stat.label}</span>
                    <span className="text-[#7d525f]">{stat.value}</span>
                  </div>
                  <div className="w-full bg-white rounded-full h-3 shadow-inner">
                    <div
                      className="bg-gradient-to-r from-[#d9a5b3] to-[#c97d95] h-3 rounded-full transition-all duration-1000"
                      style={{ width: stat.width }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
