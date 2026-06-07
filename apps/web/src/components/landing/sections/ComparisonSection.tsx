'use client';
import { XCircle, CheckCircle2 } from 'lucide-react';
import { Card } from '@projeto/ui';

export function ComparisonSection() {
  const points = [
    { label: "Agendamento de Clientes", sem: "Papel, WhatsApp confuso e erros", com: "100% Digital, organizado e sem conflitos" },
    { label: "Lembretes de Consulta", sem: "Esquecimentos e dinheiro perdido", com: "Automáticos via WhatsApp" },
    { label: "Controle Financeiro", sem: "Caderninho e planilhas soltas", com: "Fluxo de caixa e DRE automáticos" },
    { label: "Prontuário/Anamnese", sem: "Fichas de papel que somem", com: "Seguro, digital e com fotos anexadas" },
    { label: "Mobilidade", sem: "Preso ao computador da recepção", com: "Acesso de qualquer celular, de onde estiver" }
  ];

  return (
    <section className="py-24 px-4 bg-[#FAF6E9]/50">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-[#2C2825] font-serif">Por que mudar agora?</h2>
          <p className="text-[#5C5855] text-xl">A diferença entre viver apagando incêndios e ter um negócio escalável.</p>
        </div>

        <Card className="overflow-hidden border-2 border-[#E5E0D8] bg-white rounded-3xl">
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#E5E0D8]">
            {/* Lado SEM */}
            <div className="p-8 md:p-12 bg-slate-50">
              <h3 className="text-2xl font-bold text-slate-800 mb-8 flex items-center gap-3">
                <span className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-500">❌</span>
                Sua vida hoje
              </h3>
              <ul className="space-y-8">
                {points.map((p, i) => (
                  <li key={i} className="flex flex-col gap-1">
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">{p.label}</span>
                    <span className="flex items-center gap-2 text-slate-700 font-medium"><XCircle className="w-5 h-5 text-red-400 shrink-0"/> {p.sem}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Lado COM */}
            <div className="p-8 md:p-12 bg-emerald-50/30 relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/10 blur-3xl rounded-full" />
              <h3 className="text-2xl font-bold text-[#D4AF37] mb-8 flex items-center gap-3">
                <span className="w-10 h-10 bg-[#D4AF37] shadow-lg shadow-[#D4AF37]/20 rounded-full flex items-center justify-center text-white">✨</span>
                Com Agenda Inteligente
              </h3>
              <ul className="space-y-8">
                {points.map((p, i) => (
                  <li key={i} className="flex flex-col gap-1">
                    <span className="text-sm font-bold text-emerald-600/70 uppercase tracking-wider">{p.label}</span>
                    <span className="flex items-center gap-2 text-[#2C2825] font-bold"><CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0"/> {p.com}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
