'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase-browser';
import { Button } from '@projeto/ui';
import { CreditCard, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function BillingPage() {
  const [subscription, setSubscription] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserClient();

  useEffect(() => {
    const fetchBilling = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', user.id)
          .single();

        if (profile?.company_id) {
          const { data: sub } = await supabase
            .from('subscriptions')
            .select('*, plan:plans(*)')
            .eq('company_id', profile.company_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
            
          setSubscription(sub);
        }

        const { data: plansData } = await supabase
          .from('plans')
          .select('*')
          .eq('is_active', true)
          .order('price', { ascending: true });

        if (plansData) setPlans(plansData);
      } catch (err) {
        console.error('Erro ao buscar dados de faturamento:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBilling();
  }, [supabase]);

  if (loading) return <div className="p-8 text-center">Carregando informações da assinatura...</div>;

  const isTrial = subscription?.status === 'trial';
  const isActive = subscription?.status === 'active';
  const isPastDue = subscription?.status === 'past_due';

  const daysLeft = subscription?.trial_end 
    ? differenceInDays(new Date(subscription.trial_end), new Date())
    : 0;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#2C2825] font-serif mb-2">Assinatura e Cobrança</h1>
        <p className="text-[#5C5855]">Gerencie seu plano, pagamentos e veja seu histórico.</p>
      </div>

      {/* Status Card */}
      <div className={`p-6 rounded-2xl border ${
        isTrial ? 'bg-amber-50 border-amber-200' : 
        isActive ? 'bg-emerald-50 border-emerald-200' : 
        isPastDue ? 'bg-red-50 border-red-200' : 
        'bg-gray-50 border-gray-200'
      }`}>
        <div className="flex items-start justify-between">
          <div className="flex gap-4">
            {isTrial && <Clock className="w-8 h-8 text-amber-600" />}
            {isActive && <CheckCircle2 className="w-8 h-8 text-emerald-600" />}
            {isPastDue && <AlertCircle className="w-8 h-8 text-red-600" />}
            
            <div>
              <h2 className={`text-lg font-bold ${
                isTrial ? 'text-amber-900' : 
                isActive ? 'text-emerald-900' : 
                isPastDue ? 'text-red-900' : 
                'text-gray-900'
              }`}>
                {isTrial && 'Período de Teste Grátis'}
                {isActive && 'Assinatura Ativa'}
                {isPastDue && 'Pagamento Atrasado'}
                {!subscription && 'Sem Assinatura'}
              </h2>
              <p className="text-sm mt-1 opacity-80">
                {isTrial && `Seu teste gratuito termina em ${daysLeft} dias (${format(new Date(subscription.trial_end), "dd 'de' MMMM", { locale: ptBR })}). Escolha um plano para não perder o acesso.`}
                {isActive && `Sua próxima cobrança será em ${format(new Date(subscription.current_period_end), "dd 'de' MMMM", { locale: ptBR })}.`}
                {isPastDue && 'Sua assinatura está suspensa. Efetue o pagamento para restaurar o acesso imediato.'}
              </p>
            </div>
          </div>
          
          {(isTrial || isPastDue) && (
             <Button className="bg-gray-900 text-white shadow-md">
               Assinar Agora
             </Button>
          )}
        </div>
      </div>

      {/* Current Plan */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Plano Atual</h3>
        {subscription?.plan ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl font-bold text-[#D4AF37]">{subscription.plan.name}</p>
              <p className="text-sm text-gray-500 mt-1">{subscription.plan.description}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">
                R$ {Number(subscription.plan.price).toFixed(2).replace('.', ',')}
                <span className="text-sm text-gray-500 font-normal">/mês</span>
              </p>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">Nenhum plano selecionado.</p>
        )}
      </div>

      {/* Available Plans */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900">Planos Disponíveis</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrent = subscription?.plan_id === plan.id;
            const features = plan.features || [];

            return (
              <div key={plan.id} className={`bg-white rounded-2xl border p-6 flex flex-col ${isCurrent ? 'border-[#D4AF37] shadow-md ring-1 ring-[#D4AF37]' : 'border-gray-200'}`}>
                {isCurrent && (
                  <span className="bg-[#D4AF37] text-white text-[10px] font-bold uppercase tracking-wider py-1 px-3 rounded-full self-start mb-4">
                    Seu Plano
                  </span>
                )}
                <h4 className="text-lg font-bold text-gray-900">{plan.name}</h4>
                <p className="text-3xl font-bold text-gray-900 mt-2 mb-1">
                  R$ {Number(plan.price).toFixed(2).replace('.', ',')}
                </p>
                <p className="text-sm text-gray-500 mb-6">por mês</p>

                <ul className="space-y-3 mb-8 flex-1">
                  {features.map((feat: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-[#D4AF37] mt-0.5 shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>

                <Button 
                  variant={isCurrent ? 'outline' : 'primary'} 
                  className={`w-full ${!isCurrent ? 'bg-gray-900 text-white' : ''}`}
                  disabled={isCurrent && isActive}
                >
                  {isCurrent ? (isActive ? 'Plano Atual' : 'Renovar Plano') : 'Mudar para este'}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
