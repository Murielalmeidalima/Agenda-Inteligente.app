'use client';
import { CheckCircle2 } from 'lucide-react';
import { Card } from '@projeto/ui';

export function BenefitsSection() {
  const benefits = [
    "Redução de até 40% nas faltas de pacientes com lembretes automáticos.",
    "Economia de 10h semanais em tarefas burocráticas manuais.",
    "Aumento do ticket médio ao reengajar clientes inativos via WhatsApp.",
    "Previsibilidade de caixa sabendo exatamente o que vai receber no mês.",
    "Mais tempo livre para focar no que você ama: atender seus clientes."
  ];

  return (
    <section className="py-24 px-4 bg-white">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
        <div className="flex-1 space-y-8">
          <span className="text-emerald-600 font-bold tracking-widest uppercase text-sm">O RETORNO SOBRE INVESTIMENTO</span>
          <h2 className="text-3xl md:text-5xl font-black text-[#2C2825] font-serif leading-tight">
            O sistema se paga no <span className="text-emerald-500">primeiro mês.</span>
          </h2>
          <p className="text-xl text-[#5C5855]">
            Não é um gasto, é um investimento. O Agenda Inteligente automatiza o que te faz perder tempo e dinheiro.
          </p>
          
          <div className="space-y-4 pt-4">
            {benefits.map((text, i) => (
              <div key={i} className="flex items-start gap-4">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 mt-1" />
                <p className="text-lg text-[#2C2825] font-medium">{text}</p>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex-1 w-full">
          {/* Elemento Visual Genérico - Gráfico Subindo */}
          <Card className="p-8 border-none bg-gradient-to-br from-emerald-50 to-emerald-100 shadow-2xl relative overflow-hidden">
             <div className="absolute right-0 bottom-0 opacity-10">
                <svg width="300" height="300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>
             </div>
             <h3 className="text-2xl font-bold text-emerald-900 mb-6">Projeção de Crescimento</h3>
             <div className="space-y-6 relative z-10">
               <div>
                 <div className="flex justify-between text-sm font-bold text-emerald-800 mb-2"><span>Atendimentos Concluídos</span><span>+35%</span></div>
                 <div className="w-full bg-white/50 rounded-full h-4"><div className="bg-emerald-500 h-4 rounded-full w-[85%]"></div></div>
               </div>
               <div>
                 <div className="flex justify-between text-sm font-bold text-emerald-800 mb-2"><span>Faturamento</span><span>+42%</span></div>
                 <div className="w-full bg-white/50 rounded-full h-4"><div className="bg-emerald-500 h-4 rounded-full w-[92%]"></div></div>
               </div>
               <div>
                 <div className="flex justify-between text-sm font-bold text-emerald-800 mb-2"><span>Taxa de Faltas</span><span>-80%</span></div>
                 <div className="w-full bg-white/50 rounded-full h-4 flex justify-end"><div className="bg-emerald-500 h-4 rounded-full w-[20%]"></div></div>
               </div>
             </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
