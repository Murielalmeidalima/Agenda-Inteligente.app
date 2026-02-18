'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

const IMAGE_PREFIX = '/animations/Objective_create_a_1080p_202602172351_';
const START_INDEX = 38;
const END_INDEX = 79;
const TOTAL_IMAGES = END_INDEX - START_INDEX + 1;

// Generate filenames
const images = Array.from({ length: TOTAL_IMAGES }, (_, i) => {
  const num = (START_INDEX + i).toString().padStart(3, '0');
  // Need to verify if the file extension is .jpg
  return `${IMAGE_PREFIX}${num}.jpg`; 
});

export function AnimatedBackground({ children }: { children: React.ReactNode }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    // 4 seconds per slide (adjust as needed for "balanced time")
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#2C2825] flex items-center justify-center font-sans">
      
      {/* Background Slideshow */}
      <div className="absolute inset-0 w-full h-full z-0">
        {images.map((src, index) => (
          <div
            key={src}
            className={`absolute inset-0 w-full h-full transition-opacity duration-[1500ms] ease-in-out ${
              index === currentImageIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Image
              src={src}
              alt="Background Animation"
              fill
              priority={index === 0}
              className="object-cover"
              quality={90}
            />
          </div>
        ))}
        {/* Overlay for Contrast */}
        <div className="absolute inset-0 bg-black/40 z-10 backdrop-blur-[2px]" />
      </div>

      {/* Content Container (Glassmorphism) */}
      <div className="relative z-20 w-full px-4 sm:px-6 lg:px-8 flex items-center justify-center min-h-screen py-10">
        <div className="w-full max-w-[480px] xl:max-w-[550px]">
           {children}
        </div>
      </div>
    </div>
  );
}
