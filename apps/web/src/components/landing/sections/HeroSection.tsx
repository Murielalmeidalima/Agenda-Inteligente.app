'use client';

import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle2, Smartphone, Headphones, ShieldCheck } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative pt-28 pb-20 px-4 md:px-10 w-full bg-[#fbf1f2] overflow-hidden">
      <div className="flex flex-col items-center w-full max-w-7xl mx-auto space-y-16">
        
        {/* 1. Logo Grande Sozinha no Início */}
        <div className="relative flex items-center justify-center animate-fade-in-up w-full pt-4">
          <div className="relative w-full max-w-3xl flex items-center justify-center transition-transform duration-500 hover:scale-[1.02] group">
            <div className="relative w-full aspect-[16/7] sm:aspect-[16/6] flex items-center justify-center">
              <Image 
                alt="Logo Agenda Inteligente" 
                className="object-contain drop-shadow-md transition-transform duration-500 group-hover:scale-105" 
                src="/images/logo_wide.png"
                fill
                priority
                unoptimized
              />
            </div>
          </div>
        </div>

        {/* 2. Conteúdo de Transformação */}
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto space-y-8 animate-fade-in-up delay-150">
          <h1 className="font-playfair-display text-4xl sm:text-5xl md:text-6xl font-bold text-[#7d525f] leading-[1.15] tracking-[-0.02em]">
            Transforme sua clínica em uma máquina de agendamentos e faturamento.
          </h1>
          <p className="text-[#504446] text-lg md:text-xl max-w-2xl leading-relaxed font-sans">
            Agenda, financeiro, estoque, anamnese digital, marketing e gestão de equipe em uma única plataforma elegante e intuitiva.
          </p>

          <div className="pt-2">
            <a 
              href="#video"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('video')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-block bg-[#7d525f] hover:bg-[#8c4a60] text-white px-10 py-5 rounded-full text-lg font-semibold transition-all shadow-xl shadow-pink-900/15 cursor-pointer hover:scale-[1.03] active:scale-[0.98]"
            >
              Ver Demonstração
            </a>
          </div>
          
          {/* Selos de Confiança */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 md:gap-8 pt-8 border-t border-[#d4c2c5]/40 w-full max-w-3xl">
            <div className="flex items-center justify-center gap-2 text-xs md:text-sm font-semibold text-[#504446] font-sans">
              <CheckCircle2 className="w-5 h-5 text-[#8c4a60] shrink-0" />
              Sem instalação
            </div>
            <div className="flex items-center justify-center gap-2 text-xs md:text-sm font-semibold text-[#504446] font-sans">
              <Smartphone className="w-5 h-5 text-[#8c4a60] shrink-0" />
              Mobile-ready
            </div>
            <div className="flex items-center justify-center gap-2 text-xs md:text-sm font-semibold text-[#504446] font-sans">
              <Headphones className="w-5 h-5 text-[#8c4a60] shrink-0" />
              Suporte PT-BR
            </div>
            <div className="flex items-center justify-center gap-2 text-xs md:text-sm font-semibold text-[#504446] font-sans">
              <ShieldCheck className="w-5 h-5 text-[#8c4a60] shrink-0" />
              Dados Seguros
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
