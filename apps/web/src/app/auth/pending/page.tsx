'use client';

import Link from 'next/link';
import { Clock, ArrowLeft, MailCheck } from 'lucide-react';
import { AnimatedBackground } from '@/components/auth/AnimatedBackground';
import { Button } from '@projeto/ui';
import { LogoImage } from '@/components/ui/Logo';

export default function PendingApprovalPage() {
  return (
    <AnimatedBackground>
      <div className="bg-white/80 backdrop-blur-md rounded-[2.5rem] shadow-2xl border border-white/40 overflow-hidden relative max-w-md w-full mx-4">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/10 rounded-bl-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#D4AF37]/5 rounded-tr-[100px] pointer-events-none" />

        <div className="px-10 py-12 relative z-10 text-center">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="bg-white p-3 rounded-2xl shadow-lg border border-[#F0EBE0]/50">
              <LogoImage size={48} />
            </div>
          </div>

          {/* Ícone animado */}
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-50 border border-amber-100 shadow-inner mb-6">
            <Clock className="h-9 w-9 text-amber-500 animate-pulse" />
          </div>

          {/* Texto */}
          <h1 className="text-2xl font-bold font-serif text-[#2C2825] mb-3">
            Aguardando Aprovação
          </h1>
          <p className="text-[#5C5855] text-sm leading-relaxed mb-6">
            Sua conta foi criada com sucesso! Um administrador precisa
            aprovar seu acesso antes que você possa entrar na plataforma.
          </p>

          {/* Info box */}
          <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4 text-left mb-8">
            <MailCheck className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 leading-relaxed">
              Você receberá um e-mail assim que seu acesso for liberado.
              Verifique também sua caixa de spam.
            </p>
          </div>

          {/* Botão voltar */}
          <Link href="/auth/login">
            <Button className="w-full h-11 bg-gradient-to-r from-[#2C2825] to-[#403c39] hover:from-black hover:to-[#2C2825] text-white font-bold rounded-xl shadow-lg transform hover:-translate-y-0.5 transition-all duration-300">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Login
            </Button>
          </Link>

          <p className="mt-6 text-[9px] text-[#A8A49D] font-medium uppercase tracking-widest opacity-70">
            © 2026 Agenda Inteligente
          </p>
        </div>
      </div>
    </AnimatedBackground>
  );
}
