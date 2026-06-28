'use client';

import { ShieldCheck, Lock, Database, Server, KeyRound, FileCheck } from 'lucide-react';

const SECURITY_PILLARS = [
  {
    icon: ShieldCheck,
    title: 'LGPD Compliance',
    description: 'Totalmente adequado à Lei Geral de Proteção de Dados com gestão de consentimento e termos de anamnese.',
    badge: '100% Em Conformidade'
  },
  {
    icon: Lock,
    title: 'Criptografia Bancária',
    description: 'Dados protegidos com criptografia ponta a ponta (AES-256 e SSL/TLS) em repouso e em trânsito.',
    badge: 'AES-256 Bits'
  },
  {
    icon: Server,
    title: 'Nuvem de Alta Disponibilidade',
    description: 'Servidores de última geração com redundância geográfica e uptime garantido de 99.9%.',
    badge: 'Cloud Enterprise'
  },
  {
    icon: Database,
    title: 'Backups Diários Automáticos',
    description: 'Cópias de segurança executadas diariamente com recuperação instantânea para sua total tranquilidade.',
    badge: 'Redundância Total'
  }
];

export function SecuritySection() {
  return (
    <section className="bg-[#262122] text-[#f8eeef] py-24 px-4 md:px-10 relative overflow-hidden font-sans">
      {/* Glow ambient background elements */}
      <div className="absolute top-1/4 left-0 w-96 h-96 bg-[#7d525f]/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-[#d9a5b3]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10 space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#7d525f]/20 border border-[#d9a5b3]/30 text-[#d9a5b3] text-xs font-bold tracking-widest uppercase">
            <ShieldCheck className="w-4 h-4 text-[#d9a5b3]" />
            Segurança &amp; Privacidade de Nível Empresarial
          </div>
          <h2 className="font-playfair-display text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight">
            Seus dados blindados com tecnologia de ponta
          </h2>
          <p className="text-[#e2d5d7]/80 text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
            Utilizamos os mesmos padrões e protocolos de proteção das principais instituições financeiras para garantir sigilo total e disponibilidade ininterrupta para sua clínica.
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {SECURITY_PILLARS.map((pillar, idx) => {
            const IconComponent = pillar.icon;
            return (
              <div 
                key={idx} 
                className="bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 hover:border-[#d9a5b3]/40 p-8 rounded-3xl transition-all duration-300 group flex flex-col justify-between cursor-pointer shadow-xl hover:-translate-y-1"
              >
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#7d525f]/40 to-[#8c4a60]/20 border border-[#d9a5b3]/30 flex items-center justify-center text-[#d9a5b3] group-hover:scale-110 transition-transform duration-300 shadow-inner">
                      <IconComponent className="w-7 h-7 text-[#d9a5b3] group-hover:text-white transition-colors" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-playfair-display text-xl font-bold text-white group-hover:text-[#d9a5b3] transition-colors">
                      {pillar.title}
                    </h3>
                    <p className="text-sm text-[#e2d5d7]/70 leading-relaxed">
                      {pillar.description}
                    </p>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-white/5">
                  <span className="inline-block text-[11px] font-bold tracking-wider text-[#d9a5b3] uppercase bg-[#7d525f]/20 px-3 py-1 rounded-md border border-[#d9a5b3]/20">
                    {pillar.badge}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Trust Bottom Banner */}
        <div className="bg-gradient-to-r from-[#342d2e] via-[#3d3436] to-[#342d2e] border border-white/10 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="flex items-center gap-4 text-left">
            <div className="w-12 h-12 rounded-xl bg-[#7d525f]/30 flex items-center justify-center shrink-0 border border-[#d9a5b3]/30">
              <FileCheck className="w-6 h-6 text-[#d9a5b3]" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">Pronto para atendimento clínico com tranquilidade jurídica?</h4>
              <p className="text-xs md:text-sm text-[#e2d5d7]/70">Termos de consentimento e prontuários digitais alinhados às exigências dos conselhos de saúde e LGPD.</p>
            </div>
          </div>
          <div className="shrink-0">
            <span className="text-xs font-bold tracking-wider text-[#d9a5b3] uppercase bg-white/5 border border-white/10 px-4 py-2 rounded-full inline-flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#d9a5b3]" />
              Proteção Ativa 24/7
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
