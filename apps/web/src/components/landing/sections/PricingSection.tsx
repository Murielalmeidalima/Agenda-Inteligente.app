'use client';
import Link from 'next/link';
import { Zap } from 'lucide-react';
import { Button, Card } from '@projeto/ui';

export function PricingSection() {
  const PlanItem = ({ text }: { text: string }) => (
    <div className="flex items-center gap-3 text-sm text-[#5C5855]">
      <div className="w-5 h-5 bg-[#FAF6E9] rounded-full flex items-center justify-center shrink-0">
        <Zap className="h-3 w-3 text-[#D4AF37]" />
      </div>
      <span>{text}</span>
    </div>
  );

  return (
    <section id="pricing" className="py-24 px-4 bg-[#FAF6E9]/50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-[#2C2825] font-serif">Escolha o melhor plano</h2>
          <p className="text-[#5C5855] text-xl">Planos justos que crescem com a sua clínica. Cancele quando quiser.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* BÁSICO */}
          <Card className="border-2 border-[#E5E0D8] bg-white p-8 rounded-3xl flex flex-col">
            <div className="mb-6">
              <h3 className="text-xl font-bold mb-2 text-[#2C2825]">Básico</h3>
              <div className="flex items-baseline gap-1 text-[#2C2825]">
                <span className="text-4xl font-bold">R$ 49</span>
                <span className="text-[#5C5855]">/mês</span>
              </div>
              <p className="text-sm text-[#5C5855] mt-2">Para profissionais autônomos.</p>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              <PlanItem text="1 Profissional" />
              <PlanItem text="Clientes ilimitados" />
              <PlanItem text="Agenda completa" />
              <PlanItem text="Prontuário simples" />
            </ul>
            <Link href="/auth/register?plan=basico" className="w-full mt-auto">
              <Button variant="outline" className="w-full border-[#E5E0D8] hover:bg-[#FAF6E9] text-[#2C2825] font-bold rounded-xl">Assinar Básico</Button>
            </Link>
          </Card>

          {/* PROFISSIONAL */}
          <Card className="border-2 border-[#D4AF37] bg-white p-8 shadow-2xl shadow-[#D4AF37]/10 relative rounded-3xl scale-105 z-10 flex flex-col">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#D4AF37] text-white text-[10px] font-bold uppercase tracking-widest py-1 px-4 rounded-full">
              MAIS POPULAR
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-bold mb-2 text-[#2C2825]">Profissional</h3>
              <div className="flex items-baseline gap-1 text-[#2C2825]">
                <span className="text-4xl font-bold">R$ 97</span>
                <span className="text-[#5C5855]">/mês</span>
              </div>
              <p className="text-sm text-[#5C5855] mt-2">Para pequenas clínicas.</p>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              <PlanItem text="Até 5 profissionais" />
              <PlanItem text="Relatórios Financeiros" />
              <PlanItem text="Mobile Offline Master" />
              <PlanItem text="500 Lembretes WhatsApp/mês" />
            </ul>
            <Link href="/auth/register?plan=profissional" className="w-full mt-auto">
              <Button className="w-full h-12 bg-[#D4AF37] hover:bg-[#B5952F] text-white shadow-lg shadow-[#D4AF37]/20 font-black rounded-xl text-lg">
                Começar Agora
              </Button>
            </Link>
          </Card>

          {/* EMPRESARIAL */}
          <Card className="border-2 border-[#E5E0D8] bg-white p-8 rounded-3xl flex flex-col">
            <div className="mb-6">
              <h3 className="text-xl font-bold mb-2 text-[#2C2825]">Empresarial</h3>
              <div className="flex items-baseline gap-1 text-[#2C2825]">
                <span className="text-4xl font-bold">R$ 197</span>
                <span className="text-[#5C5855]">/mês</span>
              </div>
              <p className="text-sm text-[#5C5855] mt-2">Para clínicas maiores.</p>
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              <PlanItem text="Até 10 profissionais" />
              <PlanItem text="Financeiro Avançado" />
              <PlanItem text="Lembretes WhatsApp Ilimitados" />
              <PlanItem text="Campanhas de Marketing" />
            </ul>
            <Link href="/auth/register?plan=empresarial" className="w-full mt-auto">
              <Button variant="outline" className="w-full border-[#E5E0D8] hover:bg-[#FAF6E9] text-[#2C2825] font-bold rounded-xl">Assinar Empresarial</Button>
            </Link>
          </Card>

        </div>
      </div>
    </section>
  );
}
