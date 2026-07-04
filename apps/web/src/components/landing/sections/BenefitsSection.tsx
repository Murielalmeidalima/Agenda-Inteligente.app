'use client';
import { CheckCircle2 } from 'lucide-react';

export function BenefitsSection() {
  const benefits = [
    'Atendimento ágil com lembretes automáticos de consulta via WhatsApp.',
    'Economia de até 10 horas semanais em processos administrativos.',
    'Retorno garantido de clientes com campanhas automáticas de fidelização.',
    'Previsibilidade de caixa completa e controle de faturamento em tempo real.',
    'Mais tempo livre para focar no cuidado e na excelência do seu atendimento.',
  ];

  const stats = [
    { value: '+35%', label: 'Produtividade da Equipe', width: '85%' },
    { value: '+42%', label: 'Faturamento Mensal', width: '92%' },
    { value: 'Até 90%', label: 'Presença Confirmada nas Consultas', width: '90%' },
  ];

  return (
    <section id="benefits" className="py-20 md:py-28 px-4 bg-white relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-1/4 right-0 w-80 h-80 bg-[#D4AF37]/5 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12 md:gap-16 font-sans">
        
        {/* Left Side: Copy */}
        <div className="flex-1 space-y-6">
          <div>
            <span className="text-[#D4AF37] font-bold tracking-widest uppercase text-xs sm:text-sm mb-3 block">
              EFICIÊNCIA E CRESCIMENTO
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-[#2C2825] leading-tight font-serif">
              O investimento que impulsiona o seu{' '}
              <span className="text-[#D4AF37]">sucesso.</span>
            </h2>
          </div>
          <p className="text-base sm:text-lg text-[#5C5855] leading-relaxed">
            Desenvolvido para simplificar o seu dia a dia, o Agenda Inteligente assume as tarefas repetitivas para que você possa focar no que realmente gera valor: o atendimento de excelência.
          </p>

          <div className="space-y-4 pt-2">
            {benefits.map((text, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
                <p className="text-[#2C2825] font-medium text-sm sm:text-base">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Stats Box */}
        <div className="flex-1 w-full">
          <div className="p-8 md:p-10 bg-white rounded-[2rem] border border-[#FAF6F0] shadow-[0_15px_40px_rgba(44,40,37,0.03)]">
            <h3 className="text-lg md:text-xl font-bold text-[#2C2825] mb-6 font-serif">
              Indicadores médios após adesão
            </h3>
            <div className="space-y-6">
              {stats.map((stat, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs sm:text-sm font-bold text-[#2C2825] mb-2">
                    <span>{stat.label}</span>
                    <span className="text-[#D4AF37]">{stat.value}</span>
                  </div>
                  <div className="w-full bg-[#FAF6F0] rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-[#D4AF37] to-[#C5A028] h-3 rounded-full transition-all duration-1000 shadow-sm shadow-[#D4AF37]/10"
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
