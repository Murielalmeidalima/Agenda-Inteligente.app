'use client';
import React from 'react';
import Image from 'next/image';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export function Logo({ className, size = 40, showText = false }: LogoProps) {
  const [hasError, setHasError] = React.useState(false);
  const src = "/images/logo.jpg";

  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      <div 
        className="relative flex items-center justify-center overflow-hidden" 
        style={{ width: size * 3, height: size * 1.2 }}
      >
        {!hasError ? (
          <Image
            src={src}
            alt="Logo"
            fill
            className="object-contain"
            onError={() => setHasError(true)}
          />
        ) : (
          <span className="text-sm font-bold text-[#D4AF37]">Agenda Inteligente</span>
        )}
      </div>
    </div>
  );
}

export function LogoImage({ className, size = 40, src }: LogoProps & { src?: string | null }) {
  const [hasError, setHasError] = React.useState(false);
  const finalSrc = src || "/images/logo.jpg";

  return (
    <div 
      className={`relative flex items-center justify-center overflow-hidden rounded-xl border border-dashed border-amber-200 ${className || ''}`} 
      style={{ width: size * 3, height: size * 1.2 }}
    >
      {!hasError ? (
        <Image
          src={finalSrc}
          alt="Logo"
          fill
          className="object-contain"
          onError={() => setHasError(true)}
        />
      ) : (
        <span className="text-[10px] font-bold text-amber-600">Logo</span>
      )}
    </div>
  );
}
