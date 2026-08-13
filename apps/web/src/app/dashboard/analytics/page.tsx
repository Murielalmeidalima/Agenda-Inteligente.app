'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase-browser';
import { 
  Button, 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  cn,
  Badge
} from '@projeto/ui';
import { 
  TrendingUp, 
  Package, 
  Activity, 
  Calendar, 
  TrendingDown, 
  ChevronRight,
  Filter,
  Users
} from 'lucide-react';
import Link from 'next/link';
import { RankingChart, EvolutionChart } from '@/components/analytics/analytics-charts';
import { useProfile } from '@/providers/profile-provider';
import { 
  startOfDay, 
  endOfDay, 
  startOfMonth, 
  endOfMonth, 
  startOfYear, 
  endOfYear,
  isWithinInterval,
  format,
  subDays,
  eachDayOfInterval
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

type Period = 'today' | 'month' | 'year';

export default function AnalyticsPage() {
  const { profile } = useProfile();
  const router = useRouter();
  const [period, setPeriod] = useState<Period>('month');

  // Guard screen access
  useEffect(() => {
    if (profile) {
      if (profile.role !== 'admin' && profile.role !== 'chefe') {
        const hasAccess = profile.permissions?.reports?.view;
        if (!hasAccess) {
          router.push('/dashboard');
        }
      }
    }
  }, [profile, router]);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    productRanking: any[];
    procedureRanking: any[];
    evolution: any[];
    totals: {
      products: number;
      procedures: number;
      revenue: number;
    };
    clientRanking: any[];
    averageAppointments: number;
    topClient: { name: string; value: number } | null;
    cancellationStats: {
      totalScheduled: number;
      totalCancelled: number;
      cancellationRate: number;
      reasonRanking: any[];
      profRanking: any[];
    };
  }>({
    productRanking: [],
    procedureRanking: [],
    evolution: [],
    totals: { products: 0, procedures: 0, revenue: 0 },
    clientRanking: [],
    averageAppointments: 0,
    topClient: null,
    cancellationStats: {
      totalScheduled: 0,
      totalCancelled: 0,
      cancellationRate: 0,
      reasonRanking: [],
      profRanking: []
    }
  });

  useEffect(() => {
    if (profile?.company_id) {
      fetchAnalytics();
    }
  }, [profile, period]);

  async function fetchAnalytics() {
    setLoading(true);
    try {
      const supabase = createBrowserClient();
      
      // Get Date Range
      const now = new Date();
      let start: Date, end: Date;
      
      if (period === 'today') {
        start = startOfDay(now);
        end = endOfDay(now);
      } else if (period === 'month') {
        start = startOfMonth(now);
        end = endOfMonth(now);
      } else {
        start = startOfYear(now);
        end = endOfYear(now);
      }

      // Fetch Data in parallel
      const [productsRes, transactionsRes, appointmentsRes, proceduresRes] = await Promise.all([
        supabase.from('products').select('*'),
        supabase.from('inventory_transactions').select('*, products(name, description)').eq('type', 'out'),
        supabase.from('appointments').select('*, procedures(name, price), clients(id, full_name)').eq('status', 'completed'),
        supabase.from('procedures').select('id, name')
      ]);

      if (productsRes.error) throw productsRes.error;
      if (transactionsRes.error) throw transactionsRes.error;
      if (appointmentsRes.error) throw appointmentsRes.error;
      if (proceduresRes.error) throw proceduresRes.error;

      const proceduresList = proceduresRes.data || [];
      const proceduresMap = new Map(proceduresList.map(p => [p.id, p.name]));

      // Filter products (Resale only)
      const validProducts = transactionsRes.data?.filter(t => {
        const category = t.products?.description?.includes('Categoria: ') 
          ? t.products.description.split('Categoria: ')[1] 
          : '';
        return category !== 'Insumos' && isWithinInterval(new Date(t.created_at), { start, end });
      }) || [];

      // Filter appointments
      const validAppointments = appointmentsRes.data?.filter(a => 
        isWithinInterval(new Date(a.start_time), { start, end })
      ) || [];

      // Calculate Rankings
      const productMap: Record<string, number> = {};
      validProducts.forEach(t => {
        const name = t.products?.name || 'Inconhecido';
        productMap[name] = (productMap[name] || 0) + Number(t.quantity);
      });

      const procMap: Record<string, number> = {};
      validAppointments.forEach(a => {
        const name = a.procedures?.name || 'Inconhecido';
        procMap[name] = (procMap[name] || 0) + 1;

        if (Array.isArray(a.additional_procedure_ids)) {
          a.additional_procedure_ids.forEach((id: string) => {
            const extraName = proceduresMap.get(id);
            if (extraName) {
              procMap[extraName] = (procMap[extraName] || 0) + 1;
            }
          });
        }
      });

      const productRanking = Object.entries(productMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      const procedureRanking = Object.entries(procMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      // Client Ranking & Stats
      const clientMap: Record<string, { name: string, count: number, total: number }> = {};
      validAppointments.forEach(a => {
        const clientId = a.clients?.id || 'unknown';
        const clientName = a.clients?.full_name || 'Cliente Particular';
        const price = a.price_override || a.procedures?.price || 0;
        
        if (!clientMap[clientId]) {
          clientMap[clientId] = { name: clientName, count: 0, total: 0 };
        }
        clientMap[clientId].count += 1;
        clientMap[clientId].total += Number(price);
      });

      const clientRanking = Object.values(clientMap)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map(c => ({ name: c.name, value: c.count, total: c.total }));

      const totalClients = Object.keys(clientMap).length;
      const averageAppointments = totalClients > 0 ? validAppointments.length / totalClients : 0;
      const topClient = clientRanking.length > 0 ? { name: clientRanking[0].name, value: clientRanking[0].value } : null;

      // Evolution Data (Last 7 points based on period)
      // For Month: last 7 days. For Year: last 7 months.
      const evolution: any[] = [];
      if (period !== 'year') {
        const days = eachDayOfInterval({ start: subDays(now, 6), end: now });
        days.forEach(day => {
          const dayStart = startOfDay(day);
          const dayEnd = endOfDay(day);
          
          const v = validProducts.filter(t => isWithinInterval(new Date(t.created_at), { start: dayStart, end: dayEnd })).length;
          const p = validAppointments.filter(a => isWithinInterval(new Date(a.start_time), { start: dayStart, end: dayEnd })).length;
          
          evolution.push({
            date: format(day, 'dd/MM'),
            vendas: v,
            procedimentos: p
          });
        });
      }

      // Totals
      const totalRevenue = validAppointments.reduce((acc, curr) => acc + (curr.price_override || curr.procedures?.price || 0), 0);

      // Fetch all appointments for cancellation analytics
      const { data: allAppointmentsData } = await supabase
        .from('appointments')
        .select('*, procedures(name), clients(full_name), professionals(full_name)')
        .eq('company_id', profile?.company_id);

      const periodAllAppointments = (allAppointmentsData || []).filter(a =>
        isWithinInterval(new Date(a.start_time), { start, end })
      );

      const totalScheduled = periodAllAppointments.length;
      const cancelledApts = periodAllAppointments.filter(a => a.status === 'cancelled');
      const totalCancelled = cancelledApts.length;
      const cancellationRate = totalScheduled > 0 ? (totalCancelled / totalScheduled) * 100 : 0;

      // Ranking por motivo
      const reasonMap: Record<string, number> = {};
      cancelledApts.forEach(a => {
        const reason = a.cancellation_reason || 'Não informado';
        reasonMap[reason] = (reasonMap[reason] || 0) + 1;
      });

      const reasonRanking = Object.entries(reasonMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      // Ranking por profissional
      const profMap: Record<string, number> = {};
      cancelledApts.forEach(a => {
        const profName = a.professionals?.full_name || 'Profissional';
        profMap[profName] = (profMap[profName] || 0) + 1;
      });

      const profRanking = Object.entries(profMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      setData({
        productRanking,
        procedureRanking,
        evolution,
        totals: {
          products: validProducts.reduce((acc, curr) => acc + Number(curr.quantity), 0),
          procedures: validAppointments.length,
          revenue: totalRevenue
        },
        clientRanking,
        averageAppointments,
        topClient,
        cancellationStats: {
          totalScheduled,
          totalCancelled,
          cancellationRate,
          reasonRanking,
          profRanking
        }
      });
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-900 rounded-2xl shadow-xl shadow-slate-200 border border-slate-800">
            <TrendingUp className="h-8 w-8 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Análises e Insights</h1>
            <p className="text-slate-500 text-sm font-medium">Acompanhe o desempenho da sua clínica em tempo real</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          {(['today', 'month', 'year'] as const).map((p) => (
            <Button
              key={p}
              variant={period === p ? 'primary' : 'ghost'}
              onClick={() => setPeriod(p)}
              className={cn(
                "rounded-xl h-10 px-6 font-bold transition-all capitalize",
                period === p ? "bg-white text-slate-900 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-900 hover:bg-slate-200"
              )}
            >
              {p === 'today' ? 'Hoje' : p === 'month' ? 'Mês' : 'Ano'}
            </Button>
          ))}
        </div>
      </div>

      {/* Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Link href="/dashboard/inventory" className="block group">
          <MetricCard 
            title="Produtos Vendidos" 
            value={data.totals.products} 
            icon={Package} 
            trend="+12%" 
            color="amber" 
            className="group-hover:border-amber-200 group-hover:shadow-amber-500/5 h-full cursor-pointer"
          />
        </Link>
        <Link href="/dashboard/procedures" className="block group">
          <MetricCard 
            title="Procedimentos" 
            value={data.totals.procedures} 
            icon={Activity} 
            trend="+5%" 
            color="blue" 
            className="group-hover:border-blue-200 group-hover:shadow-blue-500/5 h-full cursor-pointer"
          />
        </Link>
        <Link href="/dashboard/finance" className="block group">
          <MetricCard 
            title="Faturamento" 
            value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.totals.revenue)} 
            icon={TrendingUp} 
            trend="+8%" 
            color="emerald" 
            className="group-hover:border-emerald-200 group-hover:shadow-emerald-500/5 h-full cursor-pointer"
          />
        </Link>
        <Link href="/dashboard/finance" className="block group">
          <MetricCard 
            title="Ticket Médio" 
            value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.totals.procedures ? data.totals.revenue / data.totals.procedures : 0)} 
            icon={Calendar} 
            trend="+2%" 
            color="purple" 
            className="group-hover:border-purple-200 group-hover:shadow-purple-500/5 h-full cursor-pointer"
          />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Evolutionary Chart */}
        <Card className="bg-white border-neutral-100 rounded-3xl shadow-xl shadow-slate-200/50 lg:col-span-2 overflow-hidden">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-50 px-4 sm:px-8 py-6">
            <div>
              <CardTitle className="text-xl font-black text-slate-900 tracking-tight">Evolução dos Atendimentos</CardTitle>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Produtos vs Procedimentos (Últimos 7 dias)</p>
            </div>
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-xs font-bold text-slate-600">Produtos</span>
               </div>
               <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-xs font-bold text-slate-600">Procedimentos</span>
               </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <EvolutionChart data={data.evolution} />
          </CardContent>
        </Card>

        {/* Product Ranking */}
        <Card className="bg-white border-neutral-100 rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden">
          <CardHeader className="border-b border-slate-50 px-8 py-6">
            <CardTitle className="text-xl font-black text-slate-900 tracking-tight">Ranking de Produtos</CardTitle>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Itens mais vendidos no período</p>
          </CardHeader>
          <CardContent className="p-8">
            {data.productRanking.length > 0 ? (
              <RankingChart data={data.productRanking} color="#B5952F" />
            ) : (
              <EmptyState message="Nenhuma venda registrada no período" />
            )}
          </CardContent>
        </Card>

        {/* Procedure Ranking */}
        <Card className="bg-white border-neutral-100 rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden">
          <CardHeader className="border-b border-slate-50 px-8 py-6">
            <CardTitle className="text-xl font-black text-slate-900 tracking-tight">Procedimentos Mais Realizados</CardTitle>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Ranking por frequência de atendimentos</p>
          </CardHeader>
          <CardContent className="p-8">
            {data.procedureRanking.length > 0 ? (
              <RankingChart data={data.procedureRanking} color="#3b82f6" />
            ) : (
              <EmptyState message="Nenhum procedimento concluído no período" />
            )}
          </CardContent>
        </Card>

        {/* Client Ranking */}
        <Card className="bg-white border-neutral-100 rounded-[2.5rem] shadow-2xl shadow-slate-200/60 lg:col-span-2 overflow-hidden border-2 border-slate-50">
          <CardHeader className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-50 px-10 py-8 bg-slate-50/30">
            <div>
              <CardTitle className="text-2xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
                <Users className="h-6 w-6 text-rose-500" />
                Clientes Mais Ativos
              </CardTitle>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-2">Os embaixadores da sua clínica no período selecionado</p>
            </div>
            {data.topClient && (
               <div className="mt-4 md:mt-0 flex items-center gap-3 bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center border border-rose-100">
                     <TrendingUp className="h-5 w-5 text-rose-600" />
                  </div>
                  <div>
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Campeão do Mês</p>
                     <p className="text-sm font-black text-slate-950 truncate max-w-[150px]">{data.topClient.name}</p>
                  </div>
               </div>
            )}
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-1 lg:grid-cols-12">
               <div className="lg:col-span-8 p-6 sm:p-10 border-b lg:border-b-0 lg:border-r border-slate-50">
                  {data.clientRanking.length > 0 ? (
                    <div className="space-y-8">
                       {data.clientRanking.map((client, idx) => (
                          <div key={idx} className="flex items-center justify-between group">
                             <div className="flex items-center gap-6">
                                <div className={cn(
                                   "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg transition-all shadow-sm",
                                   idx === 0 ? "bg-amber-100 text-amber-600 border border-amber-200" : 
                                   idx === 1 ? "bg-slate-100 text-slate-600 border border-slate-200" :
                                   idx === 2 ? "bg-orange-50 text-orange-600 border border-orange-100" :
                                   "bg-slate-50 text-slate-400 border border-slate-100"
                                )}>
                                   {idx + 1}
                                </div>
                                <div>
                                   <p className="text-base font-black text-slate-900 group-hover:text-rose-600 transition-colors uppercase tracking-tight">{client.name}</p>
                                   <div className="flex items-center gap-3 mt-1">
                                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                         <Activity className="h-3 w-3" /> {client.value} Atendimentos
                                      </span>
                                      <div className="w-1 h-1 rounded-full bg-slate-200" />
                                      <span className="text-[10px] font-bold text-emerald-500 uppercase">
                                         {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(client.total)} investidos
                                      </span>
                                   </div>
                                </div>
                             </div>
                             <div className="flex flex-col items-end">
                                <div className="h-2 w-32 bg-slate-50 rounded-full overflow-hidden mt-2 border border-slate-100/50">
                                   <div 
                                      className={cn("h-full transition-all duration-1000", idx === 0 ? "bg-rose-500" : "bg-slate-300")} 
                                      style={{ width: `${(client.value / data.clientRanking[0].value) * 100}%` }}
                                   />
                                </div>
                             </div>
                          </div>
                       ))}
                    </div>
                  ) : (
                    <EmptyState message="Nenhum dado de cliente no período" />
                  )}
               </div>
               <div className="lg:col-span-4 bg-slate-50/30 p-6 sm:p-10 flex flex-col justify-center gap-6 sm:gap-10">
                  <div className="space-y-4">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Activity className="h-3 w-3 text-rose-500" /> Retenção Média
                     </p>
                     <div>
                        <h4 className="text-4xl font-black text-slate-950 italic">{data.averageAppointments.toFixed(1)}</h4>
                        <p className="text-[11px] font-medium text-slate-500 mt-1">Visitas por cliente no período</p>
                     </div>
                  </div>
                  
                  <div className="h-px bg-slate-100 w-full" />
                  
                  <div className="space-y-4">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <TrendingUp className="h-3 w-3 text-emerald-500" /> Ticket Fidelidade
                     </p>
                     <div>
                        <h4 className="text-3xl font-black text-emerald-600 italic">
                           {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                              data.clientRanking.reduce((acc, curr) => acc + curr.total, 0) / (data.clientRanking.length || 1)
                           )}
                        </h4>
                        <p className="text-[11px] font-medium text-slate-500 mt-1">Gasto médio dos TOP 5 clientes</p>
                     </div>
                  </div>
               </div>
            </div>
          </CardContent>
        </Card>

        {/* Seção de Análise de Cancelamentos */}
        <Card className="bg-white border-neutral-100 rounded-[2.5rem] shadow-2xl shadow-slate-200/60 lg:col-span-2 overflow-hidden border-2 border-slate-50 mt-4">
          <CardHeader className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-50 px-10 py-8 bg-rose-50/20">
            <div>
              <CardTitle className="text-2xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
                <span className="text-xl">❌</span>
                Análise de Cancelamentos
              </CardTitle>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-2">
                Indicadores de cancelamento de agendamentos no período
              </p>
            </div>
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              <div className="bg-white px-4 py-2 rounded-2xl border border-rose-100 shadow-sm text-center">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Cancelados</p>
                <p className="text-xl font-black text-rose-600">{data.cancellationStats?.totalCancelled || 0}</p>
              </div>
              <div className="bg-white px-4 py-2 rounded-2xl border border-rose-100 shadow-sm text-center">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Taxa de Cancelamento</p>
                <p className="text-xl font-black text-rose-600">{(data.cancellationStats?.cancellationRate || 0).toFixed(1)}%</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Motivos mais frequentes */}
              <div>
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span>📊</span> Motivos Mais Frequentes
                </h4>
                {data.cancellationStats?.reasonRanking && data.cancellationStats.reasonRanking.length > 0 ? (
                  <div className="space-y-3">
                    {data.cancellationStats.reasonRanking.map((reason, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-xs font-bold text-slate-800">{reason.name}</span>
                        <Badge className="bg-rose-100 text-rose-800 border-rose-200 font-bold text-xs">
                          {reason.value} ({((reason.value / (data.cancellationStats.totalCancelled || 1)) * 100).toFixed(0)}%)
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">Nenhum cancelamento registrado no período.</p>
                )}
              </div>

              {/* Cancelamentos por profissional */}
              <div>
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span>👨‍⚕️</span> Cancelamentos por Profissional
                </h4>
                {data.cancellationStats?.profRanking && data.cancellationStats.profRanking.length > 0 ? (
                  <div className="space-y-3">
                    {data.cancellationStats.profRanking.map((prof, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-xs font-bold text-slate-800">{prof.name}</span>
                        <Badge className="bg-amber-100 text-amber-800 border-amber-200 font-bold text-xs">
                          {prof.value} cancelamentos
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">Nenhum cancelamento registrado no período.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, trend, color, className }: any) {
  const colors = {
    amber: 'text-white bg-amber-500 shadow-lg shadow-amber-200 border-amber-400',
    blue: 'text-white bg-blue-600 shadow-lg shadow-blue-200 border-blue-500',
    emerald: 'text-white bg-emerald-600 shadow-lg shadow-emerald-200 border-emerald-500',
    purple: 'text-white bg-purple-600 shadow-lg shadow-purple-200 border-purple-500'
  };

  return (
    <Card className={cn("bg-white border-neutral-100 rounded-3xl overflow-hidden shadow-lg shadow-slate-200/50 hover:scale-[1.02] transition-all duration-300", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={cn("p-2.5 rounded-2xl border", colors[color as keyof typeof colors])}>
            <Icon className="h-5 w-5" />
          </div>
          <Badge variant="outline" className="text-[10px] font-black border-slate-100 text-slate-400 px-2 py-0">
            {trend}
          </Badge>
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
          <h3 className="text-2xl font-black text-slate-900 truncate">{value}</h3>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-12 text-center">
      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
        <TrendingDown className="h-8 w-8 text-slate-200" />
      </div>
      <p className="text-slate-400 font-bold text-sm">{message}</p>
    </div>
  );
}
