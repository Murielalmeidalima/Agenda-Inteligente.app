'use client';

import Link from 'next/link';

export function CTASection() {
  return (
    <section className="py-24 px-4 bg-white relative overflow-hidden">
      <div className="max-w-5xl mx-auto bg-[#2C2825] rounded-[2.5rem] p-12 md:p-16 text-center text-white relative overflow-hidden shadow-2xl animate-fade-in-up">
        {/* Blurs */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#D4AF37]/10 rounded-full blur-3xl -mr-40 -mt-40 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#D4AF37]/5 rounded-full blur-3xl -ml-40 -mb-40 pointer-events-none"></div>
        
        <h2 className="font-serif text-3xl md:text-5xl font-bold mb-6 relative z-10 leading-tight">
          Pronto para elevar o nível da sua gestão?
        </h2>
        <p className="text-base sm:text-lg md:text-xl text-[#E5E0D8] mb-10 relative z-10 max-w-xl mx-auto font-sans leading-relaxed">
          Experimente o Agenda Inteligente gratuitamente e sinta a diferença de ter uma clínica produtiva e com faturamento otimizado.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10 font-sans">
          <Link href="/auth/register">
            <button className="bg-gradient-to-r from-[#D4AF37] to-[#C5A028] hover:from-[#C5A028] hover:to-[#B5952F] text-white px-10 py-5 rounded-full text-base sm:text-lg font-bold hover:scale-[1.01] active:scale-[0.99] transition-all shadow-xl shadow-[#D4AF37]/10 cursor-pointer">
              Começar teste gratuito agora
            </button>
          </Link>
        </div>
        <p className="mt-6 text-xs sm:text-sm text-[#8A847C] font-semibold relative z-10">
          Sem necessidade de cartão de crédito • 7 dias de teste completo
        </p>
      </div>
    </section>
  );
}

