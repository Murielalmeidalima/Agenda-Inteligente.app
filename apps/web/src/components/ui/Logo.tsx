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
  const src = "/images/logo_wide.png?v=2";

  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      <div 
        className="relative flex items-center justify-center overflow-hidden" 
        style={{ width: size * 3.3, height: size }}
      >
        {!hasError ? (
          <Image
            src={src}
            alt="Logo"
            fill
            className="object-contain"
            priority
            unoptimized
            onError={() => setHasError(true)}
          />
        ) : (
          <span className="text-sm font-bold text-[#D4AF37]">Agenda Inteligente</span>
        )}
      </div>
    </div>
  );
}

export function LogoImage({ 
  className, 
  size = 40, 
  src, 
  fallbackText 
}: LogoProps & { src?: string | null; fallbackText?: string | null }) {
  const [hasError, setHasError] = React.useState(false);

  // Use fallback if we explicitly lack a custom src or if loading failed
  const useFallback = !src || hasError;
  const hasWidth = className?.includes('w-');
  const hasHeight = className?.includes('h-');

  if (useFallback && fallbackText) {
    return (
      <div 
        className={`flex items-center justify-center rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#B5952F] text-white font-serif font-black shadow-inner shadow-black/10 select-none ${className || ''}`}
        style={{ 
          width: hasWidth ? undefined : size, 
          height: hasHeight ? undefined : size, 
          fontSize: Math.max(12, size * 0.35),
          aspectRatio: '1/1'
        }}
      >
        {fallbackText}
      </div>
    );
  }

  const finalSrc = src || "/images/logo_wide.png?v=2";

  const style: React.CSSProperties = {};
  if (!hasWidth) style.width = src ? size : size * 3.3;
  if (!hasHeight) style.height = size;

  return (
    <div 
      className={`relative flex items-center justify-center overflow-hidden ${className || ''}`} 
      style={style}
    >
      <Image
        src={finalSrc}
        alt="Logo"
        fill
        className="object-contain"
        priority
        unoptimized
        onError={() => setHasError(true)}
      />
    </div>
  );
}

