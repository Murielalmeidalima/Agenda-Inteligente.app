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
    image: '/images/founder_4.jpg', // Dra Jamily writing
    text: "Por trás de toda grande solução existe uma história.",
    subText: "Uma jornada que une cuidado, dedicação e o desejo de fazer a diferença para profissionais da saúde."
  },
  {
    image: '/images/founder_2.jpg', // Dra Jamily at work
    text: "Após identificar os desafios enfrentados por clínicas e consultórios...",
    subText: "O estresse da agenda de papel, as faltas de pacientes e a falta de controle financeiro organizados."
  },
  {
    image: '/images/founder_3.jpg', // Dra Jamily confident
    text: "...nasceu o Agenda Inteligente.",
    subText: "A resposta tecnológica focada em humanizar o atendimento e otimizar processos diários."
  },
  {
    image: '/images/founder_1.jpg', // Dra Jamily with sphere
    text: "Ajudar profissionais a terem mais organização, produtividade e crescimento.",
    subText: "Uma plataforma pensada por quem vivencia e entende a rotina clínica no dia a dia."
  },
  {
    image: '/images/founder_5.jpg', // Dra Jamily portrait
    text: "Mais do que um sistema. Uma plataforma feita para transformar a gestão clínica.",
    subText: "Projetada com alma e sensibilidade para encantar sua equipe e seus pacientes."
  }
];

export function FounderSection() {
  const [currentScene, setCurrentScene] = useState(0);
  const duration = 5000; // 5 seconds per slide

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentScene((prevScene) => (prevScene + 1) % SCENES.length);
    }, duration);

    return () => clearInterval(interval);
  }, []);

  const activeScene = SCENES[currentScene];

  return (
    <section className="py-24 px-4 md:px-10 max-w-7xl mx-auto bg-[#fff8f8]">
      <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
        
        {/* Left Side: Images of the Founder */}
        <div className="w-full lg:w-1/2 flex justify-center">
          <div className="relative w-full max-w-[450px] aspect-[4/5] bg-[#fbf1f2] rounded-3xl overflow-hidden shadow-xl border-4 border-white shadow-[#7d525f]/10">
            
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
                    alt={`Dra. Jamily Guimarães - Foto ${idx + 1}`} 
                    className={`relative w-full h-full object-cover object-center transition-transform duration-[5200ms] ease-out ${
                      idx === currentScene ? 'scale-110' : 'scale-100'
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
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#d9a5b3]/10 rounded-full blur-[60px] -mr-16 -mt-16 pointer-events-none z-20" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#c97d95]/10 rounded-full blur-[50px] -ml-12 -mb-12 pointer-events-none z-20" />
          </div>
        </div>

        {/* Right Side: Storytelling & Corporate Message */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center min-h-[350px] space-y-6">
          <div className="space-y-2">
            <span className="text-[#8c4a60] font-semibold tracking-widest uppercase text-xs font-sans block">
              Conheça a Fundadora
            </span>
            <h2 className="font-playfair-display text-3xl md:text-4xl font-bold text-[#7d525f] leading-tight tracking-tight">
              Dra. Jamily Guimarães
            </h2>
            <p className="text-[#504446]/60 text-xs font-black uppercase tracking-widest mt-0.5">
              Fundadora &amp; CEO
            </p>
          </div>
          
          {/* Dynamic narrative text corresponding to the active image, animating on change */}
          <div 
            key={currentScene} 
            className="space-y-4 animate-fade-in min-h-[140px] flex flex-col justify-center"
          >
            <blockquote className="font-playfair-display text-xl md:text-2xl lg:text-3xl italic text-[#504446] leading-relaxed relative pl-5 border-l-4 border-[#d9a5b3]">
              "{activeScene.text}"
            </blockquote>
            {activeScene.subText && (
              <p className="text-[#504446]/75 text-sm md:text-base font-normal leading-relaxed pl-5 font-sans">
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
                  idx === currentScene ? 'w-8 bg-[#8c4a60]' : 'w-2.5 bg-[#eae0e1]'
                }`}
                aria-label={`Ir para o slide ${idx + 1}`}
              />
            ))}
          </div>

          <div className="pt-6 border-t border-[#d4c2c5]/20 flex flex-wrap gap-4">
            <a 
              className="w-10 h-10 rounded-full bg-[#eae0e1] flex items-center justify-center text-[#7d525f] hover:bg-[#7d525f] hover:text-white transition-colors duration-300 cursor-pointer shadow-sm" 
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"></path>
              </svg>
            </a>
            <a 
              className="w-10 h-10 rounded-full bg-[#eae0e1] flex items-center justify-center text-[#7d525f] hover:bg-[#7d525f] hover:text-white transition-colors duration-300 cursor-pointer shadow-sm" 
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"></path>
              </svg>
            </a>
          </div>
        </div>
        
      </div>
    </section>
  );
}
