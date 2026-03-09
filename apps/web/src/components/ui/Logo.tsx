'use client';
import React from 'react';
import Image from 'next/image';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export function Logo({ className, size = 40, showText = false }: LogoProps) {
  // Se a imagem logo.png existir em public/images, use-a
  // Caso contrário, use o ícone SVG como fallback
  
  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      {/* Logo Icon - Geometric Golden Design */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Golden Geometric Shape */}
          <path
            d="M50 10 L70 30 L70 50 L50 70 L30 50 L30 30 Z"
            fill="#D4AF37"
            opacity="0.9"
          />
          <path
            d="M50 20 L65 35 L65 50 L50 65 L35 50 L35 35 Z"
            fill="#2C2825"
            opacity="0.8"
          />
          <path
            d="M50 30 L60 40 L60 50 L50 60 L40 50 L40 40 Z"
            fill="#D4AF37"
            opacity="0.7"
          />
        </svg>
      </div>
      
      {showText && (
        <div className="flex flex-col leading-none">
          <span className="text-sm font-bold text-[#2C2825]">AGENDA</span>
          <span className="text-sm font-bold text-[#D4AF37]">INTELIGENTE</span>
        </div>
      )}
    </div>
  );
}

export function LogoImage({ className, size = 40, src }: LogoProps & { src?: string | null }) {
  const finalSrc = src || "/images/logo.jpg";

  return (
    <div 
      className={`relative flex items-center justify-center overflow-hidden rounded-xl border border-dashed border-amber-200 ${className || ''}`} 
      style={{ width: size * 3, height: size * 1.2 }}
    >
      <img
        src={finalSrc}
        alt="Logo"
        className="w-full h-full object-contain"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
          e.currentTarget.parentElement!.innerHTML += '<span class="text-[10px] font-bold text-amber-600">Logo</span>';
        }}
      />
    </div>
  );
}
