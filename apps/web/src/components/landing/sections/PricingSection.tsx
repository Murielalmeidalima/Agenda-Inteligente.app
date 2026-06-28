'use client';

import Link from 'next/link';
import { Check } from 'lucide-react';

export function PricingSection() {
  return (
    <section className="py-24 px-4 md:px-10 w-full bg-[#fbf1f2]" id="planos">
      <div className="max-w-7xl mx-auto">
      <div className="text-center mb-16 animate-fade-in-up">
        <h2 className="font-playfair-display text-3xl md:text-[32px] font-bold text-[#7d525f] leading-[1.3]">
          Investimento Justo
        </h2>
        <p className="text-[#504446] mt-4 font-sans text-sm md:text-base">
          Planos que acompanham o crescimento do seu negócio.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto font-sans">
        {/* Plan 1: Essencial */}
        <div className="bg-white/80 backdrop-blur-md border border-white/50 shadow-[0_4px_12px_rgba(201,125,149,0.05)] p-10 rounded-3xl flex flex-col justify-between transition-transform duration-300 hover:scale-[1.01]">
          <div>
            <h3 className="text-xl font-bold mb-2 text-[#1f1a1b] font-playfair-display uppercase tracking-wider">
              ESSENCIAL
            </h3>
            <div className="mb-6 flex items-baseline gap-1">
              <span className="text-4xl font-bold text-[#7d525f] font-playfair-display">R$ 49,90</span>
              <span className="text-[#504446] text-sm">/mês</span>
            </div>
            <p className="text-sm text-[#504446] mb-8">
              Ideal para profissionais liberais começando sua jornada.
            </p>
            <ul className="space-y-4 mb-10">
              <li className="flex items-center gap-3 text-sm text-[#504446]">
                <Check className="text-[#8c4a60] w-5 h-5 shrink-0" />
                <span>Agenda Completa</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-[#504446]">
                <Check className="text-[#8c4a60] w-5 h-5 shrink-0" />
                <span>Lembretes WhatsApp</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-[#504446]">
                <Check className="text-[#8c4a60] w-5 h-5 shrink-0" />
                <span>Financeiro Básico</span>
              </li>
            </ul>
          </div>
          <Link href="/auth/register?plan=basico">
            <button className="w-full border border-[#7d525f] text-[#7d525f] py-4 rounded-full font-bold hover:bg-[#7d525f] hover:text-white transition-all duration-300 cursor-pointer">
              Começar Agora
            </button>
          </Link>
        </div>

        {/* Plan 2: Profissional */}
        <div className="relative bg-white p-10 rounded-3xl flex flex-col justify-between shadow-2xl border-2 border-[#7d525f] md:scale-105 z-10 transition-transform duration-300 hover:scale-[1.06]">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#7d525f] text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
            Mais Escolhido
          </div>
          <div>
            <h3 className="text-xl font-bold mb-2 text-[#1f1a1b] font-playfair-display uppercase tracking-wider">
              PROFISSIONAL
            </h3>
            <div className="mb-6 flex items-baseline gap-1">
              <span className="text-4xl font-bold text-[#7d525f] font-playfair-display">R$ 99,90</span>
              <span className="text-[#504446] text-sm">/mês</span>
            </div>
            <p className="text-sm text-[#504446] mb-8">
              O pacote completo para clínicas em expansão.
            </p>
            <ul className="space-y-4 mb-10">
              <li className="flex items-center gap-3 text-sm text-[#504446] font-semibold">
                <Check className="text-[#8c4a60] w-5 h-5 shrink-0" />
                <span>Tudo do Essencial</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-[#504446]">
                <Check className="text-[#8c4a60] w-5 h-5 shrink-0" />
                <span>Controle de Estoque</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-[#504446]">
                <Check className="text-[#8c4a60] w-5 h-5 shrink-0" />
                <span>Prontuário Digital</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-[#504446]">
                <Check className="text-[#8c4a60] w-5 h-5 shrink-0" />
                <span>Relatórios Avançados</span>
              </li>
            </ul>
          </div>
          <Link href="/auth/register?plan=profissional">
            <button className="w-full bg-[#7d525f] text-white py-4 rounded-full font-bold hover:bg-[#8c4a60] transition-all duration-300 shadow-lg cursor-pointer">
              Começar Agora
            </button>
          </Link>
        </div>

        {/* Plan 3: Empresarial */}
        <div className="bg-white/80 backdrop-blur-md border border-white/50 shadow-[0_4px_12px_rgba(201,125,149,0.05)] p-10 rounded-3xl flex flex-col justify-between transition-transform duration-300 hover:scale-[1.01]">
          <div>
            <h3 className="text-xl font-bold mb-2 text-[#1f1a1b] font-playfair-display uppercase tracking-wider">
              EMPRESARIAL
            </h3>
            <div className="mb-6 flex items-baseline gap-1">
              <span className="text-4xl font-bold text-[#7d525f] font-playfair-display">R$ 179,90</span>
              <span className="text-[#504446] text-sm">/mês</span>
            </div>
            <p className="text-sm text-[#504446] mb-8">
              Para grandes redes que precisam de gestão multi-unidades.
            </p>
            <ul className="space-y-4 mb-10">
              <li className="flex items-center gap-3 text-sm text-[#504446] font-semibold">
                <Check className="text-[#8c4a60] w-5 h-5 shrink-0" />
                <span>Tudo do Profissional</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-[#504446]">
                <Check className="text-[#8c4a60] w-5 h-5 shrink-0" />
                <span>Multi-Unidades</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-[#504446]">
                <Check className="text-[#8c4a60] w-5 h-5 shrink-0" />
                <span>Gestão de Franquias</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-[#504446]">
                <Check className="text-[#8c4a60] w-5 h-5 shrink-0" />
                <span>API para Integrações</span>
              </li>
            </ul>
          </div>
          <Link href="/auth/register?plan=empresarial">
            <button className="w-full border border-[#7d525f] text-[#7d525f] py-4 rounded-full font-bold hover:bg-[#7d525f] hover:text-white transition-all duration-300 cursor-pointer">
              Falar com Consultor
            </button>
          </Link>
        </div>
      </div>
    </div>
    </section>
  );
}

