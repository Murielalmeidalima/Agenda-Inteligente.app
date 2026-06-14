'use client';

import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle2, Smartphone, Headphones, ShieldCheck } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center px-4 md:px-10 max-w-7xl mx-auto py-20 bg-[#fff8f8]">
      <div className="grid lg:grid-cols-2 gap-16 items-center w-full">
        {/* Lado Esquerdo: Conteúdo de Texto e CTA */}
        <div className="space-y-8 animate-fade-in-up">
          <h1 className="font-playfair-display text-4xl sm:text-5xl md:text-5xl lg:text-[48px] font-bold text-[#7d525f] leading-[1.2] tracking-[-0.02em] max-w-xl">
            Transforme sua clínica em uma máquina de agendamentos e faturamento.
          </h1>
          <p className="text-[#504446] text-lg max-w-lg leading-relaxed font-sans">
            Agenda, financeiro, estoque, anamnese digital, marketing e gestão de equipe em uma única plataforma elegante e intuitiva.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <Link href="/auth/register">
              <button className="w-full sm:w-auto bg-[#7d525f] hover:bg-[#8c4a60] text-white px-8 py-4 rounded-full text-lg font-semibold transition-colors shadow-lg shadow-pink-900/10 cursor-pointer">
                Teste Grátis por 14 Dias
              </button>
            </Link>
            <Link href="#video">
              <button className="w-full sm:w-auto border border-[#d4c2c5] px-8 py-4 rounded-full text-lg font-semibold text-[#7d525f] hover:bg-[#fbf1f2] transition-colors cursor-pointer">
                Ver Demonstração
              </button>
            </Link>
          </div>
          
          {/* Selos de Confiança */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#504446] font-sans">
              <CheckCircle2 className="w-5 h-5 text-[#8c4a60] shrink-0" />
              Sem instalação
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#504446] font-sans">
              <Smartphone className="w-5 h-5 text-[#8c4a60] shrink-0" />
              Mobile-ready
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#504446] font-sans">
              <Headphones className="w-5 h-5 text-[#8c4a60] shrink-0" />
              Suporte PT-BR
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#504446] font-sans">
              <ShieldCheck className="w-5 h-5 text-[#8c4a60] shrink-0" />
              Dados Seguros
            </div>
          </div>
        </div>

        {/* Lado Direito: Preview da Interface */}
        <div className="relative animate-fade-in-up delay-200">
          <div className="absolute -inset-4 bg-[#d9a5b3]/20 blur-3xl rounded-full"></div>
          <div className="relative bg-white/80 backdrop-blur-md rounded-2xl overflow-hidden border border-white/50 shadow-2xl transition-transform duration-500 hover:scale-[1.005]">
            <Image 
              alt="Dashboard Preview" 
              className="w-full h-auto object-cover object-top" 
              src="/images/dashboard_mockup.png"
              width={800}
              height={500}
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
