'use client';

import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

interface TurnstileRenderOptions {
  sitekey: string;
  callback: (token: string) => void;
  'expired-callback'?: () => void;
  'error-callback'?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact' | 'flexible';
}

interface TurnstileProps {
  siteKey?: string;
  onToken: (token: string | null) => void;
  resetSignal?: number;
}

export function Turnstile({ siteKey, onToken, resetSignal }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!siteKey || !widgetIdRef.current || !window.turnstile) return;
    window.turnstile.reset(widgetIdRef.current);
    onToken(null);
  }, [resetSignal, siteKey, onToken]);

  useEffect(() => {
    if (!siteKey) return;
    let cancelled = false;

    const renderWidget = () => {
      if (cancelled || !containerRef.current || !window.turnstile) return;
      const widgetId = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token: string) => onToken(token),
        'expired-callback': () => onToken(null),
        'error-callback': () => onToken(null),
        theme: 'light',
        size: 'normal'
      });
      widgetIdRef.current = widgetId;
    };

    const existingScript = document.getElementById('cf-turnstile-script');
    if (window.turnstile) {
      renderWidget();
    } else if (existingScript) {
      existingScript.addEventListener('load', renderWidget);
    } else {
      const script = document.createElement('script');
      script.id = 'cf-turnstile-script';
      script.src = 'https://challenges.cloudflare.com/turnstile/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.addEventListener('load', renderWidget);
      document.head.appendChild(script);
    }

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, onToken]);

  if (!siteKey) return null;

  return (
    <div
      ref={containerRef}
      className="h-[65px] rounded-lg bg-neutral-50 border border-neutral-200"
    />
  );
}
