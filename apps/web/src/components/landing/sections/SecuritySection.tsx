'use client';

import { ShieldCheck, Lock, Database } from 'lucide-react';

export function SecuritySection() {
  return (
    <section className="bg-[#342f30] text-[#f8eeef] py-24 px-4 md:px-10">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
        {/* Lado Esquerdo: Conteúdo */}
        <div className="md:w-1/2 space-y-6">
          <h2 className="font-playfair-display text-3xl md:text-[32px] font-bold text-white mb-6">
            Seus dados blindados com tecnologia de ponta
          </h2>
          <p className="opacity-80 mb-8 text-lg font-sans leading-relaxed">
            Utilizamos os mesmos padrões de segurança de grandes bancos para garantir que sua clínica e seus pacientes estejam sempre protegidos.
          </p>
          <div className="grid grid-cols-2 gap-8 font-sans">
            <div>
              <h4 className="font-bold text-[#d9a5b3] mb-2 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#d9a5b3] shrink-0" />
                LGPD Compliance
              </h4>
              <p className="text-sm opacity-70">
                Totalmente adequado à Lei Geral de Proteção de Dados.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-[#d9a5b3] mb-2 flex items-center gap-2">
                <Lock className="w-5 h-5 text-[#d9a5b3] shrink-0" />
                Criptografia
              </h4>
              <p className="text-sm opacity-70">
                Dados criptografados ponta a ponta em repouso e trânsito.
              </p>
            </div>
          </div>
        </div>

        {/* Lado Direito: Grid de Infraestrutura */}
        <div className="md:w-1/2 grid grid-cols-2 gap-4 font-sans w-full animate-fade-in-up delay-200">
          <div className="bg-white/10 p-6 rounded-xl text-center border border-white/5 flex flex-col items-center justify-center min-h-[160px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              alt="Supabase" 
              className="h-8 mx-auto mb-4 grayscale opacity-80 invert object-contain" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuA-5lLNqPj5koQ3jHiSGnb5iso0sQYY54PPGI8rf1ZT68dKuVOB3YvBYghDW7e6VbruMdLXznvn43iVPLFQxRWYkTuFnjEsNYVtB5F004IBHrOBxF7xhbktS_-QOIDPpo4Ai5gdqf1-s8aJNpADfv3zJbtCoS0LHzOFJPTHxqBRcOTlsWTCJ-Q61T8drYdaSMi04PXW8qBOipD8hyxttEGjOuAPIIa2h4oSnI90ZVkwaRNTLvxPToST9FhEpS9Ml-rgFmvgHWWgPGw"
            />
            <p className="text-xs uppercase tracking-widest font-bold text-white">Cloud Infrastructure</p>
          </div>
          <div className="bg-white/10 p-6 rounded-xl text-center border border-white/5 flex flex-col items-center justify-center min-h-[160px]">
            <Database className="w-10 h-10 mb-4 text-[#d9a5b3]" />
            <p className="text-xs uppercase tracking-widest font-bold text-white">Backups Diários</p>
          </div>
        </div>
      </div>
    </section>
  );
}

