'use client';

import React from 'react';
import { Button } from '@projeto/ui';
import { Lock, AlertOctagon, HelpCircle, ArrowRight, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SubscriptionLockScreenProps {
  subscription: any;
  role: string;
}

export function SubscriptionLockScreen({ subscription, role }: SubscriptionLockScreenProps) {
  const router = useRouter();
  const isAdmin = role === 'admin';

  const isTrial = subscription?.status === 'trial';
  const isPastDue = subscription?.status === 'past_due' || subscription?.status === 'suspended';
  const isCanceled = subscription?.status === 'canceled';

  const trialEndFormatted = subscription?.trial_end
    ? format(new Date(subscription.trial_end), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#fff8f8] p-4 overflow-hidden">
      {/* Decorative Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#d9a5b3]/15 rounded-full blur-[120px] -mr-48 -mt-48 animate-pulse duration-[8000ms]" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#c97d95]/10 rounded-full blur-[100px] -ml-32 -mb-32" />

      <div className="w-full max-w-lg relative bg-white/70 backdrop-blur-xl border border-[#d4c2c5]/40 p-8 md:p-12 rounded-[2.5rem] shadow-2xl shadow-[#7d525f]/5 text-center space-y-8 animate-fade-in-up">
        {/* Header Icon */}
        <div className="relative mx-auto w-24 h-24 flex items-center justify-center bg-white rounded-3xl border border-[#d4c2c5]/30 shadow-md group">
          <div className="absolute inset-0 bg-gradient-to-tr from-[#7d525f]/5 to-[#c97d95]/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          {isTrial ? (
            <Clock className="w-10 h-10 text-[#c97d95] relative z-10 animate-float" />
          ) : isPastDue ? (
            <AlertOctagon className="w-10 h-10 text-[#ba1a1a] relative z-10 animate-pulse" />
          ) : (
            <Lock className="w-10 h-10 text-[#7d525f] relative z-10" />
          )}
        </div>

        {/* Copywriting */}
        <div className="space-y-4">
          <span className="text-[#8c4a60] font-black tracking-widest uppercase text-xs font-sans block">
            {isTrial ? 'Período de Teste Concluído' : isPastDue ? 'Assinatura Pendente' : 'Acesso Bloqueado'}
          </span>
          
          <h1 className="font-playfair-display text-3xl font-bold text-[#7d525f] leading-tight">
            {isTrial 
              ? 'Seu período de teste grátis chegou ao fim' 
              : isPastDue 
              ? 'Ops! O acesso da sua clínica está suspenso' 
              : 'Assinatura inativa no sistema'}
          </h1>
          
          <p className="text-[#504446] text-sm leading-relaxed max-w-sm mx-auto font-medium">
            {isTrial 
              ? `O seu teste de 7 dias expirou em ${trialEndFormatted || 'recentemente'}. Para continuar usando o Agenda Inteligente e otimizando a sua clínica, selecione um plano.` 
              : isPastDue 
              ? 'Detectamos uma pendência no pagamento da sua assinatura. Fique tranquilo, todos os seus dados estão salvos e seguros.' 
              : 'O acesso da clínica foi suspenso temporariamente por falta de uma assinatura ativa. Entre em contato para regularizar.'}
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-4 pt-4">
          {isAdmin ? (
            <Button 
              onClick={() => router.push('/dashboard/settings/billing')}
              className="w-full h-14 bg-[#7d525f] hover:bg-[#8c4a60] text-white font-bold rounded-2xl shadow-xl shadow-[#7d525f]/15 transition-all hover:scale-[1.01] hover:shadow-2xl hover:shadow-[#8c4a60]/20 flex items-center justify-center gap-2 group text-sm"
            >
              Escolher Plano e Ativar Conta
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          ) : (
            <div className="bg-[#fbf1f2] border border-[#d4c2c5]/20 p-4 rounded-2xl text-xs text-[#8c4a60] font-bold">
              ⚠️ Apenas os administradores da clínica podem gerenciar faturamento e realizar pagamentos. Solicite ao responsável para regularizar o acesso.
            </div>
          )}

          <a 
            href="/suporte" 
            className="inline-flex items-center gap-1.5 text-xs text-[#504446]/60 hover:text-[#7d525f] transition-colors font-semibold py-2"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Precisa de ajuda? Fale com nosso suporte
          </a>
        </div>
      </div>
    </div>
  );
}
