'use client';

import Image from 'next/image';
import { Play } from 'lucide-react';

export function VideoSection() {
  return (
    <section id="video" className="bg-[#eae0e1] py-24">
      <div className="max-w-4xl mx-auto px-4 animate-fade-in-up">
        <div className="text-center mb-12">
          <h2 className="font-playfair-display text-3xl md:text-[32px] font-bold text-[#7d525f] leading-[1.3]">
            Simplicidade na Prática
          </h2>
          <p className="text-[#504446] mt-4 font-sans text-sm md:text-base">
            Veja como o Agenda Inteligente funciona em menos de 2 minutos.
          </p>
        </div>

        {/* Video Container */}
        <div className="relative aspect-video bg-white/80 backdrop-blur-md border border-white/50 shadow-2xl rounded-2xl overflow-hidden group cursor-pointer">
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center z-10">
            <div className="w-20 h-20 bg-[#7d525f] text-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300">
              <Play className="w-8 h-8 text-white fill-current stroke-none ml-1" />
            </div>
          </div>
          <Image 
            alt="Video Placeholder" 
            className="w-full h-full object-cover" 
            src="/images/video_thumbnail.png"
            fill
            sizes="(max-w-4xl) 100vw, 800px"
          />
        </div>
      </div>
    </section>
  );
}
