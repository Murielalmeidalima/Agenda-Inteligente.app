'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface Scene {
  image: string;
  text: string;
  subText?: string;
}

const SCENES: Scene[] = [
  {
    image: '/images/founder_4.jpg',
    text: "Por trás de toda grande solução existe uma história.",
    subText: "Uma jornada que une dedicação, cuidado e o compromisso de simplificar a rotina de empreendedores de estética e bem-estar."
  },
  {
    image: '/images/founder_2.jpg',
    text: "Desenvolvido para impulsionar a gestão de clínicas e consultórios...",
    subText: "Criando soluções práticas que trazem estabilidade financeira, facilidade de agendamento e controle total sobre o negócio."
  },
  {
    image: '/images/founder_3.jpg',
    text: "...assim nasceu o Agenda Inteligente.",
    subText: "Uma resposta tecnológica inovadora focada em elevar a qualidade do atendimento e otimizar cada processo diário."
  },
  {
    image: '/images/founder_1.jpg',
    text: "Nosso propósito é proporcionar organização, produtividade e crescimento constante.",
    subText: "Uma plataforma pensada nos mínimos detalhes por quem entende a dinâmica e as necessidades reais desse mercado."
  },
  {
    image: '/images/founder_5.jpg',
    text: "Mais do que um sistema, somos o parceiro de crescimento da sua clínica.",
    subText: "Projetado com excelência e sofisticação para encantar a sua equipe e os seus clientes todos os dias."
  }
];

const SLIDE_DURATION_MS = 8000; // 8 seconds per slide

export function FounderSection() {
  const [currentScene, setCurrentScene] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentScene((prevScene) => (prevScene + 1) % SCENES.length);
    }, SLIDE_DURATION_MS);

    return () => clearInterval(interval);
  }, []);

  const activeScene = SCENES[currentScene];

  return (
    <section className="py-24 px-4 md:px-10 w-full bg-[#FAF6F0]">
      <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16 max-w-7xl mx-auto">
        
        {/* Left Side: Images of the Founder */}
        <div className="w-full lg:w-1/2 flex justify-center">
          <div className="relative w-full max-w-[450px] aspect-[4/5] bg-white rounded-3xl overflow-hidden shadow-xl border-4 border-white shadow-[#2C2825]/5">
            
            {/* Smooth transition between images (Ken Burns effect) */}
            <div className="absolute inset-0 select-none pointer-events-none overflow-hidden">
              {SCENES.map((scene, idx) => (
                <div 
                  key={idx}
                  className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                    idx === currentScene ? 'opacity-100 z-10' : 'opacity-0 z-0'
                  }`}
                >
                  <Image 
                    alt={`Jamily Guimarães - Foto ${idx + 1}`} 
                    className={`relative w-full h-full object-cover object-center transition-transform duration-[8200ms] ease-out ${
                      idx === currentScene ? 'scale-105' : 'scale-100'
                    }`}
                    src={scene.image}
                    fill
                    priority={idx === 0}
                    sizes="(max-w-md) 100vw, 500px"
                  />
                </div>
              ))}
            </div>

            {/* Subtle light/color glow effects */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/5 rounded-full blur-[60px] -mr-16 -mt-16 pointer-events-none z-20" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#FFF0F2]/10 rounded-full blur-[50px] -ml-12 -mb-12 pointer-events-none z-20" />
          </div>
        </div>

        {/* Right Side: Storytelling & Corporate Message */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center min-h-[350px] space-y-6">
          <div className="space-y-2">
            <span className="text-[#D4AF37] font-semibold tracking-widest uppercase text-xs font-sans block">
              Conheça a Fundadora
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-[#2C2825] leading-tight tracking-tight">
              Jamily Guimarães
            </h2>
            <p className="text-[#8A847C] text-xs font-bold uppercase tracking-widest mt-0.5">
              Fundadora &amp; CEO
            </p>
          </div>
          
          {/* Dynamic narrative text corresponding to the active image, animating on change */}
          <div 
            key={currentScene} 
            className="space-y-4 animate-fade-in min-h-[140px] flex flex-col justify-center"
          >
            <blockquote className="font-serif text-xl md:text-2xl lg:text-3xl italic text-[#2C2825] leading-relaxed relative pl-5 border-l-4 border-[#D4AF37]">
              "{activeScene.text}"
            </blockquote>
            {activeScene.subText && (
              <p className="text-[#5C5855] text-sm md:text-base font-normal leading-relaxed pl-5 font-sans">
                {activeScene.subText}
              </p>
            )}
          </div>

          {/* Simple dot indicator in sync with the current slide */}
          <div className="flex items-center gap-2 pt-2">
            {SCENES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentScene(idx)}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  idx === currentScene ? 'w-8 bg-[#D4AF37]' : 'w-2.5 bg-[#E5E0D8]'
                }`}
                aria-label={`Ir para o slide ${idx + 1}`}
              />
            ))}
          </div>

          <div className="pt-6 border-t border-[#FAF6F0] flex flex-wrap gap-4">
            <a 
              className="w-10 h-10 rounded-full bg-white border border-[#E5E0D8]/40 flex items-center justify-center text-[#2C2825] hover:bg-[#D4AF37] hover:text-white transition-all duration-300 cursor-pointer shadow-sm" 
              href="https://www.instagram.com/studiojamilyguimaraes?igsh=MXE2cDl2ZmljdG5qMQ%3D%3D&utm_source=qr"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"></path>
              </svg>
            </a>
          </div>
        </div>
        
      </div>
    </section>
  );
}
