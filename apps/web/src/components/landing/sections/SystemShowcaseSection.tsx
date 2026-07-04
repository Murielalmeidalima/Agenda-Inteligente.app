'use client';

import React from 'react';

export function SystemShowcaseSection() {
  return (
    <section 
      className="py-24 px-4 md:px-10 w-full bg-white relative overflow-hidden font-sans" 
      id="showcase"
    >
      <div className="max-w-7xl mx-auto">
        {/* Background Decorative Element */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#D4AF37]/5 rounded-full blur-[140px] pointer-events-none -z-10" />

        {/* Header Section */}
        <div className="text-center mb-16 animate-fade-in-up">
          <span className="text-[#D4AF37] font-bold tracking-widest uppercase text-xs md:text-sm mb-3 block">
            DEMONSTRAÇÃO EM VÍDEO
          </span>
          <h2 className="font-serif text-3xl md:text-5xl font-bold text-[#2C2825] leading-[1.2]">
            Veja a plataforma em funcionamento
          </h2>
          <p className="text-[#5C5855] mt-4 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Assista ao vídeo demonstrativo e entenda como nossa tecnologia pode simplificar a rotina da sua clínica ou consultório.
          </p>
        </div>

        {/* Browser Frame for Video */}
        <div className="max-w-5xl mx-auto animate-fade-in-up duration-300">
          <div className="relative bg-white rounded-[2rem] overflow-hidden border border-[#FAF6F0] shadow-[0_20px_50px_rgba(44,40,37,0.06)] transition-all duration-300">
            {/* Top Browser Bar */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-[#FAF6F0] bg-[#FAF6F0]/30">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]/35"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]/20"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]/10"></div>
              </div>
              <div className="mx-auto bg-white border border-[#FAF6F0] rounded-full px-5 py-1 text-xs text-[#8A847C] font-sans tracking-wide max-w-xs w-full text-center truncate shadow-inner">
                app.agendainteligente.com.br/demonstracao
              </div>
            </div>

            {/* Main Video Viewport */}
            <div className="relative aspect-video bg-[#FAF6F0]/20 overflow-hidden w-full flex items-center justify-center">
              <video
                className="w-full h-full object-cover"
                controls
                playsInline
                preload="metadata"
                poster="/images/showcase-video-poster.png"
              >
                <source src="/videos/demonstracao.mp4" type="video/mp4" />
                Seu navegador não suporta a reprodução de vídeos.
              </video>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
