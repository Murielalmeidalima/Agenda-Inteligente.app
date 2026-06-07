'use client';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button, Badge } from '@projeto/ui';

export function HeroSection() {
  return (
    <section className="pt-32 pb-20 md:pt-48 md:pb-32 px-4 relative overflow-hidden flex flex-col items-center justify-center min-h-[90vh]">
      {/* Background Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[600px] bg-gradient-to-r from-[#D4AF37]/20 via-emerald-500/10 to-blue-500/10 blur-[120px] rounded-full -z-10 animate-pulse-slow" />
      
      <div className="max-w-5xl mx-auto text-center relative z-10">
        <Badge variant="outline" className="mb-8 py-2 px-6 border-[#D4AF37]/40 text-[#D4AF37] bg-[#D4AF37]/5 text-xs tracking-widest uppercase font-black backdrop-blur-sm rounded-full shadow-lg">
          O SOFTWARE DEFINITIVO PARA CLÍNICAS
        </Badge>
        
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-8 leading-[1.1] text-[#2C2825] font-serif">
          Transforme sua clínica em uma <br className="hidden md:block"/>
          <span className="bg-gradient-to-br from-[#D4AF37] via-[#B5952F] to-amber-700 bg-clip-text text-transparent">máquina de agendamentos e faturamento.</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-[#5C5855] mb-12 max-w-3xl mx-auto font-medium leading-relaxed">
          Agenda, financeiro, estoque, anamnese digital, avaliações e automações de WhatsApp em uma única plataforma feita para o seu crescimento.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <Link href="/auth/register">
            <Button size="lg" className="h-16 px-10 text-xl bg-[#D4AF37] hover:bg-[#B5952F] text-white shadow-2xl shadow-[#D4AF37]/30 group rounded-[1.5rem] font-black transition-all hover:scale-105 active:scale-95">
              Teste Grátis Agora
              <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <Link href="#features">
            <Button size="lg" variant="outline" className="h-16 px-10 text-xl border-[#E5E0D8] text-[#5C5855] hover:bg-[#FAF9F6] hover:text-[#2C2825] shadow-lg rounded-[1.5rem] font-bold transition-all hover:scale-105 bg-white/50 backdrop-blur-sm">
              Conhecer a Plataforma
            </Button>
          </Link>
        </div>
      </div>

      {/* [ESPAÇO PARA SCREENSHOT DO DASHBOARD OU VÍDEO] */}
      <div className="mt-20 w-full max-w-6xl mx-auto relative group perspective-1000">
        <div className="absolute -inset-1 bg-gradient-to-r from-[#D4AF37] to-amber-700 rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-1000" />
        <div className="relative bg-white rounded-3xl shadow-2xl border border-[#E5E0D8] overflow-hidden aspect-video flex items-center justify-center bg-slate-50">
          <div className="text-center text-slate-400">
             {/* Quando tiver a imagem real, substitua o conteúdo desta div pela tag <Image> */}
             <p className="font-bold text-lg mb-2">[ESPAÇO PARA VÍDEO DE DEMONSTRAÇÃO OU MOCKUP]</p>
             <p className="text-sm">Insira uma imagem de 1920x1080 mostrando o dashboard da clínica.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
