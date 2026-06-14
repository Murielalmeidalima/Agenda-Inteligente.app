'use client';
import Image from 'next/image';

export function FounderSection() {
  return (
    <section className="py-24 px-4 md:px-10 max-w-7xl mx-auto bg-[#fff8f8]">
      <div className="flex flex-col md:flex-row items-center gap-16">
        {/* Lado Esquerdo: Foto com Borda Deslocada */}
        <div className="w-full md:w-1/2 animate-fade-in-up">
          <div className="relative">
            <div className="absolute -bottom-6 -right-6 w-full h-full border-2 border-[#d9a5b3] rounded-2xl"></div>
            <div className="relative rounded-2xl overflow-hidden aspect-[4/5] bg-[#fbf1f2] shadow-xl">
              <Image 
                alt="Founder" 
                className="relative rounded-2xl w-full h-full object-cover object-center" 
                src="/images/founder_photo.png"
                fill
                sizes="(max-w-md) 100vw, 500px"
              />
            </div>
          </div>
        </div>

        {/* Lado Direito: Storytelling */}
        <div className="w-full md:w-1/2 space-y-6 animate-fade-in-up">
          <span className="text-[#8c4a60] font-semibold tracking-widest uppercase text-sm font-sans block">
            Nossa Missão
          </span>
          <h2 className="font-playfair-display text-3xl md:text-[32px] font-bold text-[#7d525f] leading-[1.3]">
            Tecnologia com Alma Feminina
          </h2>
          <blockquote className="text-2xl font-playfair-display italic text-[#504446] leading-relaxed">
            "Criei o Agenda Inteligente para ajudar clínicas e consultórios a trabalharem com mais organização, menos estresse e mais faturamento."
          </blockquote>
          <div>
            <p className="font-bold text-lg text-[#7d525f] font-sans">Dra. Jamily Martins</p>
            <p className="text-[#504446] text-sm font-sans">Fundadora &amp; CEO</p>
          </div>
          
          <div className="flex gap-4">
            <a 
              className="w-10 h-10 rounded-full bg-[#eae0e1] flex items-center justify-center text-[#7d525f] hover:bg-[#7d525f] hover:text-white transition-colors duration-300 cursor-pointer" 
              href="#"
              aria-label="Instagram"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"></path>
              </svg>
            </a>
            <a 
              className="w-10 h-10 rounded-full bg-[#eae0e1] flex items-center justify-center text-[#7d525f] hover:bg-[#7d525f] hover:text-white transition-colors duration-300 cursor-pointer" 
              href="#"
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
