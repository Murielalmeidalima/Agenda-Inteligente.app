'use client';

import Link from 'next/link';
import { ShieldCheck, Cloud, Headphones, Lock } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative pt-36 pb-24 px-4 md:px-10 w-full bg-white overflow-hidden">
      {/* Background visual accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-gradient-to-b from-[#FAF6F0]/50 to-transparent rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#FFF0F2]/60 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="flex flex-col items-center w-full max-w-7xl mx-auto text-center space-y-12">
        
        {/* Sub-badge indicating product tier */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FAF6F0] border border-[#D4AF37]/20 text-[#2C2825] text-xs font-bold uppercase tracking-widest animate-fade-in shadow-[0_2px_10px_rgba(44,40,37,0.01)]">
          <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
          Acelerando a sua gestão
        </div>

        {/* Headline and Paragraph */}
        <div className="flex flex-col items-center max-w-4xl mx-auto space-y-6 animate-fade-in-up">
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-[#2C2825] leading-[1.1] tracking-tight">
            Gestão inteligente para <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-[#D4AF37] via-[#B5952F] to-[#2C2825] bg-clip-text text-transparent">
              clínicas, salões e consultórios.
            </span>
          </h1>
          
          <p className="text-[#5C5855] text-base sm:text-lg md:text-xl max-w-2xl leading-relaxed font-sans font-medium">
            Reúna agenda, clientes, equipe, financeiro, estoque, marketing e relatórios estratégicos em um único lugar prático e elegante. Otimize sua rotina e foque no que realmente importa: seus clientes.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md pt-2 animate-fade-in-up duration-500">
          <Link href="/auth/register" className="w-full sm:w-auto">
            <button className="w-full sm:w-auto bg-gradient-to-r from-[#D4AF37] to-[#C5A028] hover:from-[#C5A028] hover:to-[#B5952F] text-white px-10 py-5 rounded-full text-base font-bold transition-all shadow-lg shadow-[#D4AF37]/25 hover:shadow-[#D4AF37]/45 cursor-pointer transform hover:-translate-y-0.5 active:scale-[0.98]">
              Começar teste gratuito
            </button>
          </Link>
          <a 
            href="#showcase"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('showcase')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="w-full sm:w-auto"
          >
            <button className="w-full sm:w-auto border border-[#FAF6F0] bg-white text-[#2C2825] hover:bg-[#FAF6F0]/50 hover:border-[#D4AF37]/20 px-10 py-5 rounded-full text-base font-bold transition-all shadow-sm hover:shadow cursor-pointer transform hover:-translate-y-0.5 active:scale-[0.98]">
              Ver demonstração
            </button>
          </a>
        </div>

        {/* Trust Seals */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-12 border-t border-[#FAF6F0] w-full max-w-4xl animate-fade-in-up duration-700">
          <div className="flex items-center justify-center gap-3 text-xs md:text-sm font-semibold text-[#5C5855] font-sans">
            <Cloud className="w-5 h-5 text-[#D4AF37] shrink-0" />
            <span>Plataforma em Nuvem</span>
          </div>
          <div className="flex items-center justify-center gap-3 text-xs md:text-sm font-semibold text-[#5C5855] font-sans">
            <ShieldCheck className="w-5 h-5 text-[#D4AF37] shrink-0" />
            <span>Segurança de Dados (LGPD)</span>
          </div>
          <div className="flex items-center justify-center gap-3 text-xs md:text-sm font-semibold text-[#5C5855] font-sans">
            <Lock className="w-5 h-5 text-[#D4AF37] shrink-0" />
            <span>Pagamento 100% Seguro</span>
          </div>
          <div className="flex items-center justify-center gap-3 text-xs md:text-sm font-semibold text-[#5C5855] font-sans">
            <Headphones className="w-5 h-5 text-[#D4AF37] shrink-0" />
            <span>Suporte em Português</span>
          </div>
        </div>

      </div>
    </section>
  );
}
