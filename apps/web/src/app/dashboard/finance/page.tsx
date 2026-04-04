'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase-browser';
import { 
  Button, 
  Card, 
  CardContent, 
  CardHeader,
  CardTitle,
  Badge, 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell,
  cn
} from '@projeto/ui';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownRight,
  Calendar,
  CreditCard,
  Banknote,
  ChevronRight,
  TrendingDown as TrendingDownIcon,
  AlertCircle,
  Clock as ClockIcon,
  HelpCircle
} from 'lucide-react';
import { 
  format, 
  startOfDay, 
  endOfDay, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  startOfYear, 
  endOfYear,
  isWithinInterval,
  addDays,
  addMonths,
  eachDayOfInterval,
  subDays
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CashFlowChart, ExpensesByCategoryChart } from '@/components/finance/finance-charts';
import { ConfirmationQueue } from '@/components/finance/confirmation-queue';
import { AccountsReceivableList } from '@/components/finance/accounts-receivable-list';
import { useProfile } from '@/providers/profile-provider';

type Period = 'today' | 'week' | 'month' | 'year';

export default function FinancePage() {
  const { profile } = useProfile();
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>('month');
  const [activeTab, setActiveTab] = useState<'overview' | 'receivables'>('overview');
  const [data, setData] = useState({
    transactions: [] as any[],
    pendingTransactions: [] as any[],
    stats: { 
      income: 0, 
      expense: 0, 
      balance: 0,
      forecastWeek: 0,
      forecastMonth: 0,
      receivablesTotal: 0,
      pendingCount: 0
    },
    flowData: [] as any[],
    categoryData: [] as any[]
  });

  useEffect(() => {
    if (profile?.company_id) {
      fetchData();
    }
  }, [profile, period]);

  async function fetchData() {
    setLoading(true);
    try {
      const supabase = createBrowserClient();
      const now = new Date();
      
      // Period Range
      let start: Date, end: Date;
      if (period === 'today') { start = startOfDay(now); end = endOfDay(now); }
      else if (period === 'week') { start = startOfWeek(now); end = endOfWeek(now); }
      else if (period === 'month') { start = startOfMonth(now); end = endOfMonth(now); }
      else { start = startOfYear(now); end = endOfYear(now); }

      // Fetch Everything
      const [transRes, appRes, catsRes] = await Promise.all([
        supabase.from('transactions').select('*, financial_categories(name, color)').eq('company_id', profile?.company_id).order('date', { ascending: false }),
        supabase.from('appointments').select('*, procedures(price)').eq('company_id', profile?.company_id).eq('status', 'scheduled'),
        supabase.from('financial_categories').select('*').eq('company_id', profile?.company_id)
      ]);

      const allTransactions = transRes.data || [];
      const appointments = appRes.data || [];
      
      // 1. Confirmed Transactions in Period
      const periodTransactions = allTransactions.filter(t => 
        t.status === 'completed' && isWithinInterval(new Date(t.date), { start, end })
      );

      // 2. Pending Transactions (Fila de Confirmação)
      const pendingTransactions = allTransactions.filter(t => t.status === 'pending');

      // 3. Stats Calculation
      const income = periodTransactions.reduce((acc, t) => t.type === 'income' ? acc + Number(t.amount) : acc, 0);
      const expense = periodTransactions.reduce((acc, t) => t.type === 'expense' ? acc + Number(t.amount) : acc, 0);
      const totalBalance = allTransactions.filter(t => t.status === 'completed').reduce((acc, t) => t.type === 'income' ? acc + Number(t.amount) : acc - Number(t.amount), 0);

      // 4. Forecasts (Appointments in Next Week / Month)
      const nextWeekEnd = addDays(now, 7);
      const nextMonthEnd = addMonths(now, 1);
      
      const forecastWeek = appointments.filter(a => isWithinInterval(new Date(a.start_time), { start: now, end: nextWeekEnd }))
        .reduce((acc, a) => acc + (a.price_override || a.procedures?.price || 0), 0);
        
      const forecastMonth = appointments.filter(a => isWithinInterval(new Date(a.start_time), { start: now, end: nextMonthEnd }))
        .reduce((acc, a) => acc + (a.price_override || a.procedures?.price || 0), 0);

      // 5. Chart Data (Flow)
      const flowData = eachDayOfInterval({ start: subDays(now, 6), end: now }).map(day => {
        const dayStart = startOfDay(day);
        const dayEnd = endOfDay(day);
        const dayIn = allTransactions.filter(t => t.type === 'income' && t.status === 'completed' && isWithinInterval(new Date(t.date), { start: dayStart, end: dayEnd })).reduce((acc, t) => acc + Number(t.amount), 0);
        const dayOut = allTransactions.filter(t => t.type === 'expense' && t.status === 'completed' && isWithinInterval(new Date(t.date), { start: dayStart, end: dayEnd })).reduce((acc, t) => acc + Number(t.amount), 0);
        return { date: format(day, 'dd/MM'), entradas: dayIn, saidas: dayOut };
      });

      // 6. Category Stat
      const catMap: Record<string, { val: number, color: string }> = {};
      periodTransactions.filter(t => t.type === 'expense').forEach(t => {
        const name = t.financial_categories?.name || 'Geral';
        catMap[name] = { 
          val: (catMap[name]?.val || 0) + Number(t.amount),
          color: t.financial_categories?.color || '#cbd5e1'
        };
      });
      const categoryData = Object.entries(catMap).map(([name, data]) => ({ name, value: data.val, color: data.color }));

      // 7. Receivables Logic (Simplified for Dashboard KPI)
      // Fetch completed appointments and their income transactions
      const { data: compApps } = await supabase.from('appointments').select('id, procedures(price)').eq('company_id', profile?.company_id).eq('status', 'completed');
      const appIds = compApps?.map(a => a.id) || [];
      const { data: incomeTx } = await supabase.from('transactions').select('amount, appointment_id, status').in('appointment_id', appIds).eq('type', 'income');

      let receivablesTotal = 0;
      let pendingCount = 0;
      
      compApps?.forEach(app => {
        const appIncome = incomeTx?.filter(t => t.appointment_id === app.id && t.status === 'completed').reduce((sum, t) => sum + Number(t.amount), 0) || 0;
        const procedure = Array.isArray(app.procedures) ? app.procedures[0] : app.procedures;
        const total = Number((procedure as any)?.price || 0);
        if (appIncome < total) {
          receivablesTotal += (total - appIncome);
          pendingCount++;
        }
      });

      setData({
        transactions: periodTransactions.slice(0, 5),
        pendingTransactions: pendingTransactions.slice(0, 5),
        stats: { income, expense, balance: totalBalance, forecastWeek, forecastMonth, receivablesTotal, pendingCount },
        flowData,
        categoryData
      });
    } catch (err) {
      console.error('Error fetching financial data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmTransaction(id: string) {
    setConfirmingId(id);
    try {
      const supabase = createBrowserClient();
      const { data: tx } = await supabase.from('transactions').select('*').eq('id', id).single();
      
      if (!tx) return;

      // Update status
      const { error: updateError } = await supabase
        .from('transactions')
        .update({ status: 'completed' })
        .eq('id', id);

      if (updateError) throw updateError;

      // Update balance
      const multiplier = tx.type === 'income' ? 1 : -1;
      await supabase.rpc('update_account_balance', { 
        target_account_id: tx.account_id, 
        amount_diff: multiplier * Number(tx.amount) 
      });

      fetchData(); // Refresh page
    } catch (err) {
      console.error('Error confirming transaction:', err);
    } finally {
      setConfirmingId(null);
    }
  }

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-950 rounded-2xl shadow-lg border border-amber-900/50">
            <Wallet className="h-8 w-8 text-amber-500" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Gestão Financeira</h1>
            <p className="text-slate-500 text-sm font-medium">Controle total do seu fluxo de caixa e previsões</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
            {(['today', 'week', 'month', 'year'] as const).map((p) => (
              <Button
                key={p}
                variant="ghost"
                size="sm"
                onClick={() => setPeriod(p)}
                className={cn(
                  "h-9 px-5 text-[10px] font-black uppercase rounded-xl transition-all",
                  period === p ? "bg-slate-900 text-white shadow-md shadow-slate-200" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                )}
              >
                {p === 'today' ? 'Hoje' : p === 'week' ? 'Semana' : p === 'month' ? 'Mês' : 'Ano'}
              </Button>
            ))}
          </div>
          <Link href="/dashboard/finance/new?type=income">
            <Button className="h-12 px-8 bg-slate-950 hover:bg-black text-white font-black rounded-2xl shadow-xl shadow-slate-200 flex items-center gap-3 transition-all hover:scale-[1.02] active:scale-95">
              <Plus className="h-5 w-5 text-rose-500" />
              Lançar Receita
            </Button>
          </Link>
        </div>
      </div>

      {/* Main KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <FinanceCard 
          label="Saldo Total" 
          value={data.stats.balance} 
          loading={loading}
          icon={Wallet} 
          color="blue" 
          subtitle="Em todas as contas"
        />
        <FinanceCard 
          label={`Entradas (${period})`} 
          value={data.stats.income} 
          loading={loading}
          icon={TrendingUp} 
          color="emerald" 
          subtitle="Confirmadas"
        />
        <FinanceCard 
          label={`Saídas (${period})`} 
          value={data.stats.expense} 
          loading={loading}
          icon={TrendingDown} 
          color="red" 
          subtitle="Pagas"
        />
        <FinanceCard 
          label="Previsão (Mês)" 
          value={data.stats.forecastMonth} 
          loading={loading}
          icon={Calendar} 
          color="amber" 
          subtitle="Agenda futura"
        />
        <FinanceCard 
          label="Contas a Receber" 
          value={data.stats.receivablesTotal} 
          loading={loading}
          icon={ClockIcon} 
          color="rose" 
          subtitle={`${data.stats.pendingCount} atendimentos pendentes`}
          onClick={() => setActiveTab('receivables')}
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-8 border-b border-slate-100 pb-px">
        <button 
          onClick={() => setActiveTab('overview')}
          className={cn(
            "pb-5 text-xs font-black uppercase tracking-widest transition-all relative px-2",
            activeTab === 'overview' ? "text-slate-900" : "text-slate-400 hover:text-slate-600"
          )}
        >
          Visão Geral
          {activeTab === 'overview' && <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-900 rounded-t-full shadow-[0_-2px_10px_rgba(0,0,0,0.1)]" />}
        </button>
        <button 
          onClick={() => setActiveTab('receivables')}
          className={cn(
            "pb-5 text-xs font-black uppercase tracking-widest transition-all relative px-2",
            activeTab === 'receivables' ? "text-slate-900" : "text-slate-400 hover:text-slate-600"
          )}
        >
          Contas a Receber
          {data.stats.pendingCount > 0 && (
            <span className="absolute top-0 -right-2 bg-rose-500 text-white text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-lg shadow-rose-200 border-2 border-white">
              {data.stats.pendingCount}
            </span>
          )}
          {activeTab === 'receivables' && <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-rose-500 rounded-t-full shadow-[0_-2px_10px_rgba(244,63,94,0.2)]" />}
        </button>
      </div>

      {activeTab === 'overview' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cash Flow Chart */}
        <Card className="lg:col-span-2 bg-white border-slate-100 rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden">
          <CardHeader className="border-b border-slate-50 px-8 py-6 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-black text-slate-900 tracking-tight">Fluxo de Caixa</CardTitle>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Comparativo de entradas vs saídas (7 dias)</p>
            </div>
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-black text-slate-500">ENTRADAS</span>
               </div>
               <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <span className="text-[10px] font-black text-slate-500">SAÍDAS</span>
               </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <CashFlowChart data={data.flowData} />
          </CardContent>
        </Card>

        {/* Categories / Side Panel */}
        <div className="space-y-8">
           {/* Confirmation Queue */}
           <Card className="bg-white border-slate-100 rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden">
             <CardHeader className="bg-amber-50/50 border-b border-amber-100/50 px-6 py-4">
               <CardTitle className="text-xs font-black text-amber-700 uppercase tracking-widest flex items-center gap-2">
                 <ClockIcon className="h-4 w-4" />
                 Fila de Confirmação
               </CardTitle>
             </CardHeader>
             <CardContent className="p-6">
               <ConfirmationQueue 
                 transactions={data.pendingTransactions} 
                 onConfirm={handleConfirmTransaction}
                 loading={confirmingId}
               />
               <Button variant="ghost" className="w-full mt-4 h-9 text-[10px] font-black uppercase text-slate-400 hover:text-slate-600">
                 Ver todas pendências
               </Button>
             </CardContent>
           </Card>

           {/* Expenses by Category */}
           <Card className="bg-white border-slate-100 rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden">
             <CardHeader className="px-6 py-4 border-b border-slate-50">
               <CardTitle className="text-xs font-black text-slate-900 uppercase tracking-widest">Despesas por Categoria</CardTitle>
             </CardHeader>
             <CardContent className="p-4 flex flex-col items-center">
               <ExpensesByCategoryChart data={data.categoryData} />
               {data.categoryData.length === 0 && (
                 <p className="text-[10px] font-bold text-slate-300 py-10 uppercase tracking-widest">Sem dados no período</p>
               )}
             </CardContent>
           </Card>
        </div>

        {/* Recent Activity Table (Full Width) */}
        <Card className="lg:col-span-3 bg-white border-slate-100 rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden">
            <CardHeader className="px-8 py-6 border-b border-slate-50 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black text-slate-900 tracking-tight">Movimentações Recentes</CardTitle>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Últimos lançamentos confirmados</p>
              </div>
              <Button variant="outline" className="h-9 rounded-xl text-[10px] font-black uppercase">Ver Extrato Completo</Button>
            </CardHeader>
            <Table>
                <TableHeader className="bg-slate-50/50 border-b border-slate-100">
                    <TableRow className="hover:bg-transparent border-none">
                        <TableHead className="text-slate-400 font-black uppercase text-[10px] tracking-widest pl-8 py-4">Lançamento</TableHead>
                        <TableHead className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Categoria</TableHead>
                        <TableHead className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Método</TableHead>
                        <TableHead className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Data</TableHead>
                        <TableHead className="text-slate-400 font-black uppercase text-[10px] tracking-widest text-right pr-8">Valor</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                  {data.transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <TrendingDownIcon className="h-10 w-10 text-slate-200" />
                          <p className="text-slate-400 font-bold text-sm">Nenhuma movimentação confirmada neste período.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.transactions.map((t) => (
                      <TableRow key={t.id} className="border-b border-slate-50 group hover:bg-slate-50 transition-colors">
                        <TableCell className="pl-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "h-10 w-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm",
                              t.type === 'income' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-red-50 text-red-600 border border-red-100"
                            )}>
                              {t.type === 'income' ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                            </div>
                            <div>
                                <p className="font-extrabold text-slate-900 text-sm leading-tight">{t.description}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 italic">Ref: {t.id.slice(0, 8)}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-500 text-[10px] font-black uppercase rounded-lg px-2 py-1">
                            {t.financial_categories?.name || 'Geral'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          {t.payment_method?.toUpperCase().replace('_', ' ') || 'PIX'}
                        </TableCell>
                        <TableCell className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          {format(new Date(t.date), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell className="pr-8 text-right">
                          <span className={cn(
                            "font-black text-base italic",
                            t.type === 'income' ? "text-emerald-600" : "text-slate-900"
                          )}>
                            {t.type === 'income' ? '+' : '-'} {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
            </Table>
        </Card>
      </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white border-slate-100 rounded-3xl shadow-xl shadow-slate-200/50 p-8">
             <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-rose-50 rounded-2xl border border-rose-100">
                   <ClockIcon className="h-6 w-6 text-rose-500" />
                </div>
                <div>
                   <h2 className="text-xl font-black text-slate-900 tracking-tight">Atendimentos Pendentes de Recebimento</h2>
                   <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Valores que ainda não tiveram baixa financeira total</p>
                </div>
             </div>
             
             <AccountsReceivableList companyId={profile?.company_id || ''} />
          </div>
        </div>
      )}
    </div>
  );
}

function FinanceCard({ label, value, loading, icon: Icon, color, subtitle, onClick }: any) {
  const styles = {
    blue: 'bg-white/80 backdrop-blur-md border-blue-50 text-blue-600',
    emerald: 'bg-white/80 backdrop-blur-md border-emerald-50 text-emerald-600',
    red: 'bg-white/80 backdrop-blur-md border-red-50 text-red-600',
    amber: 'bg-white/80 backdrop-blur-md border-amber-50 text-amber-600',
    rose: 'bg-rose-50/80 backdrop-blur-md border-rose-100 text-rose-600'
  };

  const iconStyles = {
    blue: 'bg-blue-600 text-white shadow-lg shadow-blue-200',
    emerald: 'bg-emerald-600 text-white shadow-lg shadow-emerald-200',
    red: 'bg-red-600 text-white shadow-lg shadow-red-200',
    amber: 'bg-amber-500 text-white shadow-lg shadow-amber-200',
    rose: 'bg-rose-600 text-white shadow-lg shadow-rose-200'
  };

  const textStyles = {
    blue: 'text-slate-900',
    emerald: 'text-slate-900',
    red: 'text-slate-900',
    amber: 'text-slate-900',
    rose: 'text-rose-950'
  };

  return (
    <Card 
      className={cn(
        "border rounded-[2rem] p-8 relative overflow-hidden group shadow-xl shadow-slate-200/40 transition-all duration-300 border-slate-100 hover:-translate-y-1 hover:shadow-2xl", 
        styles[color as keyof typeof styles],
        onClick && "cursor-pointer active:scale-95"
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
          <span className="text-[9px] font-bold text-slate-300 uppercase mt-1">{subtitle}</span>
        </div>
        <div className={cn("p-3 rounded-2xl border border-transparent transition-colors duration-500 group-hover:border-current/10", iconStyles[color as keyof typeof iconStyles])}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      <div className={cn("text-3xl font-black italic tracking-tighter truncate", textStyles[color as keyof typeof textStyles])}>
        {loading ? (
           <div className="h-9 w-32 bg-slate-100/80 animate-pulse rounded-xl mt-1" />
        ) : (
           new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
        )}
      </div>
      
      {/* Decorative Glow */}
      <div className={cn(
        "absolute -bottom-12 -right-12 w-32 h-32 rounded-full blur-[50px] opacity-10 transition-opacity group-hover:opacity-20",
        color === 'blue' ? 'bg-blue-500' : color === 'emerald' ? 'bg-emerald-500' : color === 'red' ? 'bg-red-500' : color === 'rose' ? 'bg-rose-500' : 'bg-amber-500'
      )} />
    </Card>
  );
}
