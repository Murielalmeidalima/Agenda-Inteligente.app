'use client';

import Link from 'next/link';
import { Check } from 'lucide-react';

export function PricingSection() {
  return (
    <section className="py-24 px-4 md:px-10 w-full bg-[#FAF6F0]" id="planos">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 animate-fade-in-up">
          <span className="text-[#D4AF37] font-bold tracking-widest uppercase text-xs sm:text-sm mb-3 block">
            NOSSOS PLANOS
          </span>
          <h2 className="font-serif text-3xl md:text-5xl font-bold text-[#2C2825] leading-[1.3]">
            O plano ideal para o seu momento
          </h2>
          <p className="text-[#5C5855] mt-4 font-sans text-base sm:text-lg max-w-xl mx-auto">
            Sem contratos de fidelidade. Escolha a melhor opção e comece a escalar hoje mesmo.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto font-sans">
          
          {/* Plan 1: Essencial */}
          <div className="bg-white border border-[#E5E0D8]/45 shadow-[0_10px_30px_rgba(44,40,37,0.02)] p-10 rounded-[2.5rem] flex flex-col justify-between transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <div>
              <h3 className="text-base font-bold mb-1.5 text-[#2C2825] font-serif uppercase tracking-wider">
                ESSENCIAL
              </h3>
              <div className="mb-6 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-[#2C2825] font-serif">R$ 49,90</span>
                <span className="text-[#8A847C] text-sm font-semibold">/mês</span>
              </div>
              <p className="text-sm text-[#5C5855] mb-8 font-medium">
                Ideal para profissionais autônomos iniciando sua jornada digital.
              </p>
              <ul className="space-y-4 mb-10">
                <li className="flex items-center gap-3 text-sm text-[#5C5855]">
                  <Check className="text-[#D4AF37] w-5 h-5 shrink-0" />
                  <span>Agenda Inteligente Completa</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-[#5C5855]">
                  <Check className="text-[#D4AF37] w-5 h-5 shrink-0" />
                  <span>Lembretes por WhatsApp</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-[#5C5855]">
                  <Check className="text-[#D4AF37] w-5 h-5 shrink-0" />
                  <span>Financeiro Simplificado</span>
                </li>
              </ul>
            </div>
            <Link href="/auth/register?plan=basico">
              <button className="w-full border border-[#2C2825] text-[#2C2825] py-4 rounded-full font-bold hover:bg-[#2C2825] hover:text-white transition-all duration-300 shadow-sm cursor-pointer">
                Começar Agora
              </button>
            </Link>
          </div>

          {/* Plan 2: Profissional */}
          <div className="relative bg-white p-10 rounded-[2.5rem] flex flex-col justify-between shadow-[0_20px_50px_rgba(44,40,37,0.06)] border-2 border-[#D4AF37] md:scale-105 z-10 transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-[#D4AF37] to-[#C5A028] text-white px-5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-md">
              Mais Escolhido
            </div>
            <div>
              <h3 className="text-base font-bold mb-1.5 text-[#2C2825] font-serif uppercase tracking-wider">
                PROFISSIONAL
              </h3>
              <div className="mb-6 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-[#D4AF37] font-serif">R$ 99,90</span>
                <span className="text-[#8A847C] text-sm font-semibold">/mês</span>
              </div>
              <p className="text-sm text-[#5C5855] mb-8 font-medium">
                O pacote perfeito para clínicas e salões em fase de aceleração e escala.
              </p>
              <ul className="space-y-4 mb-10">
                <li className="flex items-center gap-3 text-sm text-[#2C2825] font-semibold">
                  <Check className="text-[#D4AF37] w-5 h-5 shrink-0" />
                  <span>Tudo do plano Essencial</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-[#5C5855]">
                  <Check className="text-[#D4AF37] w-5 h-5 shrink-0" />
                  <span>Controle de Estoque & Produtos</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-[#5C5855]">
                  <Check className="text-[#D4AF37] w-5 h-5 shrink-0" />
                  <span>Prontuário & Anamnese Digital</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-[#5C5855]">
                  <Check className="text-[#D4AF37] w-5 h-5 shrink-0" />
                  <span>Relatórios Gerenciais e de Metas</span>
                </li>
              </ul>
            </div>
            <Link href="/auth/register?plan=profissional">
              <button className="w-full bg-gradient-to-r from-[#D4AF37] to-[#C5A028] hover:from-[#C5A028] hover:to-[#B5952F] text-white py-4 rounded-full font-bold hover:scale-[1.01] active:scale-[0.99] transition-all shadow-md shadow-[#D4AF37]/20 cursor-pointer">
                Começar Agora
              </button>
            </Link>
          </div>

          {/* Plan 3: Empresarial */}
          <div className="bg-white border border-[#E5E0D8]/45 shadow-[0_10px_30px_rgba(44,40,37,0.02)] p-10 rounded-[2.5rem] flex flex-col justify-between transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <div>
              <h3 className="text-base font-bold mb-1.5 text-[#2C2825] font-serif uppercase tracking-wider">
                EMPRESARIAL
              </h3>
              <div className="mb-6 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-[#2C2825] font-serif">R$ 179,90</span>
                <span className="text-[#8A847C] text-sm font-semibold">/mês</span>
              </div>
              <p className="text-sm text-[#5C5855] mb-8 font-medium">
                Para redes e franquias estruturadas que buscam gestão de múltiplas unidades.
              </p>
              <ul className="space-y-4 mb-10">
                <li className="flex items-center gap-3 text-sm text-[#5C5855] font-semibold">
                  <Check className="text-[#D4AF37] w-5 h-5 shrink-0" />
                  <span>Tudo do plano Profissional</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-[#5C5855]">
                  <Check className="text-[#D4AF37] w-5 h-5 shrink-0" />
                  <span>Multi-Unidades / Filiais</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-[#5C5855]">
                  <Check className="text-[#D4AF37] w-5 h-5 shrink-0" />
                  <span>Permissões Administrativas Seguras</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-[#5C5855]">
                  <Check className="text-[#D4AF37] w-5 h-5 shrink-0" />
                  <span>API Aberta para Integrações</span>
                </li>
              </ul>
            </div>
            <Link href="/auth/register?plan=empresarial">
              <button className="w-full border border-[#2C2825] text-[#2C2825] py-4 rounded-full font-bold hover:bg-[#2C2825] hover:text-white transition-all duration-300 shadow-sm cursor-pointer">
                Falar com Consultor
              </button>
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
}
