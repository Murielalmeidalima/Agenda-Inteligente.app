'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase-browser';
import { Button, Input } from '@projeto/ui';
import Link from 'next/link';
import { AlertCircle, Mail, CheckCircle2, Loader2, ArrowLeft, MailCheck } from 'lucide-react';
import { LogoImage } from '@/components/ui/Logo';
import { AnimatedBackground } from '@/components/auth/AnimatedBackground';

import { Suspense } from 'react';

function ResendConfirmationContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const emailParam = searchParams?.get('email');
    if (emailParam) setEmail(emailParam);
  }, [searchParams]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Insira um endereço de e-mail válido.');
      return;
    }

    setLoading(true);
    console.log('[AUTH][RESEND] Solicitando reenvio de confirmação...');

    try {
      const supabase = createBrowserClient();
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email,
      });

      if (resendError) {
        console.error('[AUTH][RESEND] Erro:', resendError.message, '| Status:', resendError.status);
        if (resendError.status === 429) {
          throw new Error('Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.');
        }
        throw new Error('Não foi possível reenviar. O e-mail pode já ter sido confirmado.');
      }

      console.log('[AUTH][RESEND] ✅ E-mail reenviado com sucesso.');
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatedBackground>
      <div className="bg-white/80 backdrop-blur-md rounded-[2.5rem] shadow-2xl border border-white/40 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/10 rounded-bl-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#D4AF37]/5 rounded-tr-[100px] pointer-events-none" />

        <div className="px-8 sm:px-12 py-12 relative z-10">
          <div className="mb-8 text-center">
            <Link href="/auth/login" className="inline-flex items-center text-xs font-bold text-[#8A847C] hover:text-[#2C2825] mb-6 transition-colors group uppercase tracking-widest">
              <ArrowLeft className="mr-2 h-3 w-3 group-hover:-translate-x-1 transition-transform" />
              Voltar ao Login
            </Link>

            <div className="flex justify-center mb-6">
              <div className="bg-white p-3 rounded-2xl shadow-lg border border-[#F0EBE0]/50">
                <LogoImage size={64} />
              </div>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-[#2C2825] mb-2 font-serif">Confirmar E-mail</h1>
            <p className="text-[#5C5855] text-sm leading-relaxed">
              Reenviaremos o link de confirmação para o seu e-mail.
            </p>
          </div>

          {success ? (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-emerald-50/80 border border-emerald-100 text-center shadow-sm">
                <div className="h-12 w-12 bg-emerald-100 rounded-full flex items-center justify-center border border-emerald-200">
                  <div className="h-8 w-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg text-white">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-[#2C2825]">E-mail enviado!</h3>
                  <p className="text-[#5C5855] text-xs leading-relaxed">
                    Enviamos um novo link de confirmação para <strong>{email}</strong>.
                    <br />Verifique também a pasta de spam.
                  </p>
                </div>
                <div className="text-[10px] text-[#5C5855] bg-white/50 py-1.5 px-3 rounded-full border border-[#E5E0D8]">
                  O link expira em 24 horas
                </div>
              </div>

              <Link href="/auth/login" className="block">
                <Button className="w-full h-12 bg-[#2C2825] hover:bg-black text-white font-bold rounded-xl transition-all shadow-lg">
                  Voltar para o Login
                </Button>
              </Link>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleResend} noValidate>
              {error && (
                <div className="flex items-center gap-3 rounded-xl bg-red-50/90 border border-red-100 p-3 text-xs text-red-600 animate-shake shadow-sm">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                  <span className="font-medium">{error}</span>
                </div>
              )}

              <div className="space-y-1 group text-left">
                <label className="text-[10px] font-bold text-[#8A847C] uppercase tracking-widest pl-1 group-focus-within:text-[#D4AF37] transition-colors">
                  E-mail Cadastrado
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A8A49D] group-focus-within:text-[#D4AF37] transition-colors duration-300" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="seu@email.com"
                    className="bg-white/60 border-white/50 focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 h-12 pl-10 text-sm text-[#2C2825] placeholder:text-[#A8A49D] rounded-xl transition-all duration-300 shadow-sm hover:bg-white/80"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-[#D4AF37] to-[#C5A028] hover:from-[#C5A028] hover:to-[#B5952F] text-white font-bold text-base rounded-xl shadow-lg shadow-[#D4AF37]/20 hover:shadow-[#D4AF37]/40 transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                loading={loading}
                disabled={loading}
              >
                {loading ? (
                  <span>Enviando...</span>
                ) : (
                  <span className="flex items-center gap-2">
                    <MailCheck className="h-4 w-4" />
                    Reenviar Confirmação
                  </span>
                )}
              </Button>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-[#E5E0D8]/50 flex flex-col items-center gap-2">
            <p className="text-[9px] text-[#A8A49D] font-medium uppercase tracking-widest opacity-70">
              Segurança de ponta a ponta
            </p>
          </div>
        </div>
      </div>
    </AnimatedBackground>
  );
}

export default function ResendConfirmationPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <ResendConfirmationContent />
    </Suspense>
  );
}
