'use client';

import React from 'react';
import { useProfile } from '@/providers/profile-provider';
import { usePathname } from 'next/navigation';
import { SubscriptionLockScreen } from './SubscriptionLockScreen';

export function DashboardContentWrapper({ children }: { children: React.ReactNode }) {
  const { profile, subscription, loading } = useProfile();
  const pathname = usePathname();

  // Se estiver carregando, exibe indicador de carregamento minimalista
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] w-full gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7d525f]" />
        <p className="text-[10px] text-[#504446]/60 font-black uppercase tracking-[0.2em] animate-pulse">Sincronizando assinatura...</p>
      </div>
    );
  }

  // Rotas que burlam/ignoram o bloqueio de faturamento para permitir pagamento ou administração geral
  const isBypassPath = pathname === '/dashboard/settings/billing' || pathname.startsWith('/dashboard/admin');

  // Validação da assinatura
  const isTrial = subscription?.status === 'trial';
  const isActive = subscription?.status === 'active';
  const isTrialValid = isTrial && subscription?.trial_end && new Date(subscription.trial_end) > new Date();

  const hasActiveSubscription = isActive || isTrialValid;

  // Intercepta e bloqueia o acesso caso a assinatura esteja inativa e o usuário tente acessar uma tela restrita
  if (!hasActiveSubscription && !isBypassPath && profile) {
    return <SubscriptionLockScreen subscription={subscription} role={profile.role} />;
  }

  return <>{children}</>;
}
