'use client';
import { Calendar, Check, TrendingUp, ClipboardList, Megaphone, Package } from 'lucide-react';

export function GallerySection() {
  return (
    <section className="py-24 px-4 md:px-10 max-w-7xl mx-auto bg-[#fff8f8]" id="funcionalidades">
      <div className="text-center mb-16 animate-fade-in-up">
        <h2 className="font-playfair-display text-3xl md:text-[32px] font-bold text-[#7d525f] leading-[1.3]">
          Tudo o que você precisa em um só lugar
        </h2>
        <p className="text-[#504446] mt-4 font-sans text-sm md:text-base">
          Funcionalidades premium pensadas para facilitar sua rotina.
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-6 font-sans">
        {/* Card Grande (Agenda Ultra Rápida) */}
        <div className="md:col-span-2 md:row-span-2 bg-white/80 backdrop-blur-md border border-white/50 shadow-[0_4px_12px_rgba(201,125,149,0.05)] p-10 rounded-3xl flex flex-col justify-between animate-fade-in-up">
          <div>
            <Calendar className="w-12 h-12 text-[#7d525f] mb-6" />
            <h3 className="text-2xl font-bold text-[#1f1a1b] mb-4 font-playfair-display">Agenda Ultra Rápida</h3>
            <p className="text-[#504446] leading-relaxed text-sm">
              Agende pacientes em 3 cliques. Arraste e solte para reagendar. Envio automático de lembretes via WhatsApp para reduzir faltas em até 40%.
            </p>
          </div>
          <div className="mt-8 border-t border-[#d4c2c5]/30 pt-6">
            <ul className="space-y-3 text-sm text-[#504446]">
              <li className="flex items-center gap-2">
                <Check className="text-[#8c4a60] w-4 h-4" /> 
                Visualização por profissional
              </li>
              <li className="flex items-center gap-2">
                <Check className="text-[#8c4a60] w-4 h-4" /> 
                Bloqueio inteligente de horários
              </li>
            </ul>
          </div>
        </div>

        {/* Card 2: Financeiro */}
        <div className="bg-white/80 backdrop-blur-md border border-white/50 shadow-[0_4px_12px_rgba(201,125,149,0.05)] p-8 rounded-3xl animate-fade-in-up delay-100 flex flex-col justify-between">
          <div>
            <TrendingUp className="w-8 h-8 text-[#7d525f] mb-4" />
            <h3 className="font-bold text-lg text-[#1f1a1b] mb-2 font-playfair-display">Financeiro</h3>
            <p className="text-xs md:text-sm text-[#504446] leading-relaxed">
              Fluxo de caixa, DRE e controle de inadimplência automático.
            </p>
          </div>
        </div>

        {/* Card 3: Anamnese */}
        <div className="bg-white/80 backdrop-blur-md border border-white/50 shadow-[0_4px_12px_rgba(201,125,149,0.05)] p-8 rounded-3xl animate-fade-in-up delay-200 flex flex-col justify-between">
          <div>
            <ClipboardList className="w-8 h-8 text-[#7d525f] mb-4" />
            <h3 className="font-bold text-lg text-[#1f1a1b] mb-2 font-playfair-display">Anamnese</h3>
            <p className="text-xs md:text-sm text-[#504446] leading-relaxed">
              Prontuários digitais personalizáveis e seguros (LGPD).
            </p>
          </div>
        </div>

        {/* Card 4: Marketing */}
        <div className="bg-white/80 backdrop-blur-md border border-white/50 shadow-[0_4px_12px_rgba(201,125,149,0.05)] p-8 rounded-3xl animate-fade-in-up delay-300 flex flex-col justify-between">
          <div>
            <Megaphone className="w-8 h-8 text-[#7d525f] mb-4" />
            <h3 className="font-bold text-lg text-[#1f1a1b] mb-2 font-playfair-display">Marketing</h3>
            <p className="text-xs md:text-sm text-[#504446] leading-relaxed">
              Envio de promoções e fidelização de base de clientes.
            </p>
          </div>
        </div>

        {/* Card 5: Estoque */}
        <div className="bg-white/80 backdrop-blur-md border border-white/50 shadow-[0_4px_12px_rgba(201,125,149,0.05)] p-8 rounded-3xl animate-fade-in-up delay-400 flex flex-col justify-between">
          <div>
            <Package className="w-8 h-8 text-[#7d525f] mb-4" />
            <h3 className="font-bold text-lg text-[#1f1a1b] mb-2 font-playfair-display">Estoque</h3>
            <p className="text-xs md:text-sm text-[#504446] leading-relaxed">
              Controle de entradas, saídas e alertas de validade.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
