'use client';
import { CalendarX2, Wallet, PackageOpen, ClipboardX, PhoneOff, StarOff } from 'lucide-react';
import { Card } from '@projeto/ui';

export function PainPointsSection() {
  const problems = [
    {
      icon: <CalendarX2 className="w-8 h-8 text-red-500" />,
      title: "Agenda Desorganizada",
      desc: "Confusão de horários, papelada e pacientes esperando."
    },
    {
      icon: <Wallet className="w-8 h-8 text-red-500" />,
      title: "Falta de Controle Financeiro",
      desc: "Você não sabe exatamente quanto ganha e quanto gasta no mês."
    },
    {
      icon: <PackageOpen className="w-8 h-8 text-red-500" />,
      title: "Estoque no Escuro",
      desc: "Produtos vencendo na prateleira ou faltando na hora do atendimento."
    },
    {
      icon: <ClipboardX className="w-8 h-8 text-red-500" />,
      title: "Anamnese de Papel",
      desc: "Fichas que se perdem e dificultam o histórico do paciente."
    },
    {
      icon: <PhoneOff className="w-8 h-8 text-red-500" />,
      title: "Faltas e Esquecimentos",
      desc: "Dinheiro perdido porque o cliente esqueceu da consulta."
    },
    {
      icon: <StarOff className="w-8 h-8 text-red-500" />,
      title: "Sem Avaliações",
      desc: "Falta de prova social online para atrair clientes novos."
    }
  ];

  return (
    <section className="py-24 px-4 bg-[#FAF6E9]/50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-[#2C2825] font-serif">
            A dor de administrar uma clínica <span className="text-red-500">sem tecnologia</span>
          </h2>
          <p className="text-[#5C5855] text-xl max-w-3xl mx-auto">
            Quantas destas situações estão impedindo sua clínica de crescer e lucrar mais hoje?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {problems.map((problem, idx) => (
            <Card key={idx} className="p-8 border-2 border-transparent hover:border-red-100 transition-colors bg-white">
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6">
                {problem.icon}
              </div>
              <h3 className="text-xl font-bold mb-3 text-[#2C2825]">{problem.title}</h3>
              <p className="text-[#5C5855] font-medium leading-relaxed">
                {problem.desc}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
