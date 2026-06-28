'use client';

import Link from 'next/link';

export function CTASection() {
  return (
    <section className="py-24 px-4 md:px-10">
      <div className="max-w-4xl mx-auto bg-[#7d525f] rounded-3xl p-12 text-center text-white relative overflow-hidden shadow-2xl animate-fade-in-up">
        {/* Blurs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -ml-32 -mb-32"></div>
        
        <h2 className="font-playfair-display text-3xl md:text-[32px] font-bold mb-6 relative z-10">
          Pronto para profissionalizar sua clínica?
        </h2>
        <p className="text-lg md:text-xl opacity-90 mb-10 relative z-10 max-w-xl mx-auto font-sans leading-relaxed">
          Junte-se a mais de 1.500 profissionais que já simplificaram sua rotina e aumentaram seus lucros.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10 font-sans">
          <Link href="/auth/register">
            <button className="bg-white text-[#7d525f] px-10 py-5 rounded-full text-lg font-bold hover:bg-[#fbf1f2] active:scale-[0.98] transition-all shadow-xl cursor-pointer">
              COMEÇAR TESTE GRÁTIS AGORA
            </button>
          </Link>
        </div>
        <p className="mt-6 text-sm opacity-70 font-sans">
          Sem cartão de crédito necessário nos primeiros 7 dias.
        </p>
      </div>
    </section>
  );
}

