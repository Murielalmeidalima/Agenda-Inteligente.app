'use client';
import { CalendarX2, UserX, Wallet, Package, BarChart3, Bot } from 'lucide-react';

export function PainPointsSection() {
  const problems = [
    {
      icon: CalendarX2,
      title: 'Agenda desorganizada',
      desc: 'Horários duplicados e buracos na agenda que fazem você perder tempo e dinheiro todos os dias.',
    },
    {
      icon: UserX,
      title: 'Clientes esquecendo consultas',
      desc: 'A taxa de faltas alta prejudica seu faturamento mensal e o planejamento da equipe.',
    },
    {
      icon: Wallet,
      title: 'Financeiro confuso',
      desc: 'Não saber exatamente quanto entrou ou saiu, dificultando o controle de lucro real.',
    },
    {
      icon: Package,
      title: 'Estoque sem controle',
      desc: 'Produtos vencendo ou acabando sem aviso, gerando gastos inesperados.',
    },
    {
      icon: BarChart3,
      title: 'Falta de relatórios',
      desc: 'Decisões tomadas no escuro, sem dados reais sobre o desempenho da clínica.',
    },
    {
      icon: Bot,
      title: 'Falta de automação',
      desc: 'Trabalho manual repetitivo que consome horas preciosas de sua secretária.',
    },
  ];

  return (
    <section className="bg-[#fbf1f2] py-24 px-4 md:px-10">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 animate-fade-in-up">
          <h2 className="font-playfair-display text-3xl md:text-[32px] font-bold text-[#7d525f] leading-[1.3]">
            Diga adeus à desorganização
          </h2>
          <p className="text-[#504446] mt-4 font-sans">
            Identificamos os maiores gargalos que impedem sua clínica de crescer.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {problems.map((prob, idx) => {
            const Icon = prob.icon;
            return (
              <div
                key={idx}
                className="bg-white/85 backdrop-blur-md border border-white/50 shadow-[0_4px_12px_rgba(201,125,149,0.05)] p-8 rounded-2xl transition-all duration-300 hover:scale-[1.01] hover:shadow-lg cursor-default flex flex-col justify-start"
              >
                <Icon className="w-10 h-10 text-[#7d525f] mb-4 shrink-0" />
                <h3 className="font-playfair-display font-bold text-lg text-[#1f1a1b] mb-2">
                  {prob.title}
                </h3>
                <p className="text-[#504446] text-sm leading-relaxed font-sans">
                  {prob.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
