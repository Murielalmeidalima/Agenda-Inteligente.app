'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase-browser';
import { Card, Badge, Button } from '@projeto/ui';
import { TrendingUp, Users, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { AnimatedBackground } from '@/components/auth/AnimatedBackground';

export default function SaaSAdminDashboard() {
  const [stats, setStats] = useState({
    activeUsers: 0,
    trialUsers: 0,
    pastDue: 0,
    mrr: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSaaSMetrics = async () => {
      try {
        const supabase = createBrowserClient();
        
        // Em um cenário real, você buscaria do backend ou com permissão full admin no frontend
        const { data: subs, error } = await supabase
          .from('subscriptions')
          .select('*, plan:plans(price)');

        if (error) throw error;
        
        if (subs) {
          let active = 0;
          let trial = 0;
          let due = 0;
          let mrrAcc = 0;

          subs.forEach((sub: any) => {
            if (sub.status === 'active') {
              active++;
              mrrAcc += Number(sub.plan?.price || 0);
            }
            if (sub.status === 'trial') trial++;
            if (sub.status === 'past_due') due++;
          });

          setStats({
            activeUsers: active,
            trialUsers: trial,
            pastDue: due,
            mrr: mrrAcc
          });
        }
      } catch (err) {
        console.error('Erro ao buscar metricas:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSaaSMetrics();
  }, []);

  if (loading) return <div className="p-8">Carregando painel SaaS...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-serif text-[#2C2825] mb-2">Painel Administrativo SaaS</h1>
        <p className="text-[#5C5855]">Métricas em tempo real de assinaturas do Agenda Inteligente.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <h3 className="text-sm font-semibold text-gray-500 uppercase">Receita Recorrente (MRR)</h3>
            <TrendingUp className="text-emerald-500 w-5 h-5" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            R$ {stats.mrr.toFixed(2).replace('.', ',')}
          </p>
        </Card>

        <Card className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <h3 className="text-sm font-semibold text-gray-500 uppercase">Assinaturas Ativas</h3>
            <CheckCircle2 className="text-[#D4AF37] w-5 h-5" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.activeUsers}</p>
        </Card>

        <Card className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <h3 className="text-sm font-semibold text-gray-500 uppercase">Período de Teste (Trial)</h3>
            <Clock className="text-blue-500 w-5 h-5" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.trialUsers}</p>
        </Card>

        <Card className="p-6 bg-white border border-gray-100 shadow-sm rounded-2xl flex flex-col justify-between h-32">
          <div className="flex justify-between items-start">
            <h3 className="text-sm font-semibold text-gray-500 uppercase">Inadimplentes</h3>
            <AlertCircle className="text-red-500 w-5 h-5" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.pastDue}</p>
        </Card>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center shadow-sm mt-8">
        <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-gray-800 mb-2">Gestão Completa em Breve</h3>
        <p className="text-gray-500 max-w-md mx-auto">
          A aprovação manual de clínicas foi desativada permanentemente. 
          O fluxo atual delega todo o controle de status e pagamentos para os Webhooks do Asaas.
        </p>
      </div>
    </div>
  );
}
