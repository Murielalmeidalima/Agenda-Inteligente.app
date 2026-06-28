'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  AlertCircle,
  Clock as ClockIcon,
  HelpCircle,
  Trash2
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
import { CashFlowChart, ExpensesByCategoryChart, ProfitGrowthChart } from '@/components/finance/finance-charts';
import { ConfirmationQueue } from '@/components/finance/confirmation-queue';
import { AccountsReceivableList } from '@/components/finance/accounts-receivable-list';
import { useProfile } from '@/providers/profile-provider';

type Period = 'today' | 'week' | 'month' | 'year';

export default function FinancePage() {
  const { profile } = useProfile();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>('month');
  const [activeTab, setActiveTab] = useState<'overview' | 'receivables' | 'settings'>('overview');
  const [categories, setCategories] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [data, setData] = useState({
    transactions: [] as any[],
    pendingTransactions: [] as any[],
    stats: { 
      income: 0, 
      expense: 0, 
      balance: 0,
      profit: 0,
      forecastWeek: 0,
      forecastMonth: 0,
      receivablesTotal: 0,
      payablesPending: 0,
      pendingCount: 0,
      avgIncome: 0,
      avgExpense: 0,
      avgProfit: 0,
      paidTotal: 0,
      pendingTotal: 0,
      receivedToday: 0,
      receivedMonth: 0,
      receivedYear: 0,
      pendingPayments: 0,
      overduePayments: 0,
      partialPayments: 0,
      futureForecast: 0,
      totalReceivable: 0,
      inadimplencia: 0
    },
    flowData: [] as any[],
    categoryData: [] as any[]
  });

  useEffect(() => {
    if (profile) {
      // Checagem de RBAC (Segurança)
      if (profile.role !== 'admin' && profile.role !== 'chefe') {
        const hasAccess = profile.permissions?.finance?.view;
        if (!hasAccess) {
          router.push('/dashboard');
          return;
        }
      }

      if (profile.company_id) {
        fetchData();
      }
    }
  }, [profile, period, router]);

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
      const [transRes, appRes, accRes, catsRes] = await Promise.all([
        supabase.from('transactions').select('*, financial_categories(name, color)').eq('company_id', profile?.company_id).order('date', { ascending: false }),
        supabase.from('appointments').select('*, procedures(price)').eq('company_id', profile?.company_id).neq('status', 'cancelled'),
        supabase.from('financial_accounts').select('*').eq('company_id', profile?.company_id),
        supabase.from('financial_categories').select('*').eq('company_id', profile?.company_id)
      ]);

      const allTransactions = (transRes.data || []).map((t: any) => ({ ...t, status: t.status || 'completed' }));
      const appointments = appRes.data || [];
      setAccounts(accRes.data || []);
      setCategories(catsRes.data || []);
      
      // 1. Confirmed Transactions in Period
      const periodTransactions = allTransactions.filter(t => 
        (t.status === 'completed') && isWithinInterval(new Date(t.date), { start, end })
      );

      // 2. Pending Transactions (Fila de Confirmação)
      const pendingTransactions = allTransactions.filter(t => t.status === 'pending');

      // 3. Stats Calculation
      const income = periodTransactions.reduce((acc, t) => t.type === 'income' ? acc + Number(t.amount) : acc, 0);
      const expense = periodTransactions.reduce((acc, t) => t.type === 'expense' ? acc + Number(t.amount) : acc, 0);
      const profit = income - expense;
      const totalBalance = allTransactions.filter(t => t.status === 'completed').reduce((acc, t) => t.type === 'income' ? acc + Number(t.amount) : acc - Number(t.amount), 0);

      // 4. Averages Calculation
      let days = 1;
      if (period === 'week') days = 7;
      else if (period === 'month') days = 30;
      else if (period === 'year') days = 365;

      const avgIncome = income / days;
      const avgExpense = expense / days;
      const avgProfit = profit / days;

      // 5. Payables (Pending Expenses)
      const payablesPending = allTransactions
        .filter(t => t.type === 'expense' && t.status === 'pending')
        .reduce((acc, t) => acc + Number(t.amount), 0);

      // 6. Forecasts (Appointments in Next Week / Month)
      const nextWeekEnd = addDays(now, 7);
      const nextMonthEnd = addMonths(now, 1);
      
      const forecastWeek = appointments.filter(a => a.status === 'scheduled' && isWithinInterval(new Date(a.start_time), { start: now, end: nextWeekEnd }))
        .reduce((acc, a) => acc + (a.price_override || a.procedures?.price || 0), 0);
        
      const forecastMonth = appointments.filter(a => a.status === 'scheduled' && isWithinInterval(new Date(a.start_time), { start: now, end: nextMonthEnd }))
        .reduce((acc, a) => acc + (a.price_override || a.procedures?.price || 0), 0);

      // 7. Chart Data (Flow)
      const flowData = eachDayOfInterval({ start: subDays(now, 6), end: now }).map(day => {
        const dayStart = startOfDay(day);
        const dayEnd = endOfDay(day);
        const dayIn = allTransactions.filter(t => t.type === 'income' && (t.status === 'completed') && isWithinInterval(new Date(t.date), { start: dayStart, end: dayEnd })).reduce((acc, t) => acc + Number(t.amount), 0);
        const dayOut = allTransactions.filter(t => t.type === 'expense' && (t.status === 'completed') && isWithinInterval(new Date(t.date), { start: dayStart, end: dayEnd })).reduce((acc, t) => acc + Number(t.amount), 0);
        return { date: format(day, 'dd/MM'), entradas: dayIn, saidas: dayOut, lucro: dayIn - dayOut };
      });

      // 8. Category Stat
      const catMap: Record<string, { val: number, color: string }> = {};
      periodTransactions.filter(t => t.type === 'expense').forEach(t => {
        const name = t.financial_categories?.name || 'Geral';
        catMap[name] = { 
          val: (catMap[name]?.val || 0) + Number(t.amount),
          color: t.financial_categories?.color || '#cbd5e1'
        };
      });
      const categoryData = Object.entries(catMap).map(([name, data]) => ({ name, value: data.val, color: data.color }));

      // 9. Overhaul Indicators
      const startOfToday = startOfDay(now);
      const endOfToday = endOfDay(now);
      const startOfMeso = startOfMonth(now);
      const endOfMeso = endOfMonth(now);
      const startOfAno = startOfYear(now);
      const endOfAno = endOfYear(now);

      const receivedToday = allTransactions
        .filter(t => t.type === 'income' && (t.status === 'completed' || !t.status) && isWithinInterval(new Date(t.transaction_date || t.date || t.created_at), { start: startOfToday, end: endOfToday }))
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const receivedMonth = allTransactions
        .filter(t => t.type === 'income' && (t.status === 'completed' || !t.status) && isWithinInterval(new Date(t.transaction_date || t.date || t.created_at), { start: startOfMeso, end: endOfMeso }))
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const receivedYear = allTransactions
        .filter(t => t.type === 'income' && (t.status === 'completed' || !t.status) && isWithinInterval(new Date(t.transaction_date || t.date || t.created_at), { start: startOfAno, end: endOfAno }))
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const mappedApps = appointments.map(app => {
        const linkedTrans = allTransactions.filter(t => t.appointment_id === app.id);
        const paidConfirmed = linkedTrans
          .filter(t => t.status === 'completed' || !t.status)
          .reduce((sum, t) => sum + Number(t.amount), 0);
          
        const procedure = Array.isArray(app.procedures) ? app.procedures[0] : app.procedures;
        const totalPrice = Number(app.price_override || procedure?.price || 0);
        const pendingValue = Math.max(0, totalPrice - paidConfirmed);
        
        const appointmentDate = new Date(app.start_time);
        const isFuture = appointmentDate > now;
        const isPast = appointmentDate <= now;
        
        let status = 'pending';
        if (paidConfirmed >= totalPrice && totalPrice > 0) {
          status = isFuture ? 'advance_payment' : 'paid';
        } else if (paidConfirmed > 0) {
          status = isPast ? 'overdue' : 'partial';
        } else {
          status = isPast ? 'overdue' : 'pending';
        }
        
        return {
          totalPrice,
          paidConfirmed,
          pendingValue,
          isFuture,
          isPast,
          status
        };
      });

      const pendingPayments = mappedApps
        .filter(app => app.status === 'pending')
        .reduce((sum, app) => sum + app.pendingValue, 0);

      const overduePayments = mappedApps
        .filter(app => app.status === 'overdue')
        .reduce((sum, app) => sum + app.pendingValue, 0);

      const partialPayments = mappedApps
        .filter(app => app.status === 'partial')
        .reduce((sum, app) => sum + app.pendingValue, 0);

      const futureForecast = mappedApps
        .filter(app => app.isFuture)
        .reduce((sum, app) => sum + app.totalPrice, 0);

      const totalReceivable = mappedApps
        .reduce((sum, app) => sum + app.pendingValue, 0);

      const pastCompletedTotalValue = mappedApps
        .filter(app => app.isPast)
        .reduce((sum, app) => sum + app.totalPrice, 0);

      const inadimplencia = pastCompletedTotalValue > 0
        ? Math.round((overduePayments / pastCompletedTotalValue) * 100)
        : 0;

      const pendingCount = mappedApps.filter(app => app.pendingValue > 0).length;

      setData({
        transactions: periodTransactions.slice(0, 5),
        pendingTransactions: pendingTransactions.slice(0, 5),
        stats: { 
          income, 
          expense, 
          balance: totalBalance, 
          profit,
          forecastWeek, 
          forecastMonth, 
          receivablesTotal: totalReceivable, 
          payablesPending,
          pendingCount,
          avgIncome,
          avgExpense,
          avgProfit,
          paidTotal: income,
          pendingTotal: totalReceivable + payablesPending,
          receivedToday,
          receivedMonth,
          receivedYear,
          pendingPayments,
          overduePayments,
          partialPayments,
          futureForecast,
          totalReceivable,
          inadimplencia
        },
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

      const { error: updateError } = await supabase
        .from('transactions')
        .update({ status: 'completed' })
        .eq('id', id);

      if (updateError) throw updateError;

      const multiplier = tx.type === 'income' ? 1 : -1;
      await supabase.rpc('update_account_balance', { 
        target_account_id: tx.account_id, 
        amount_diff: multiplier * Number(tx.amount) 
      });

      fetchData();
    } catch (err) {
      console.error('Error confirming transaction:', err);
    } finally {
      setConfirmingId(null);
    }
  }

  async function handleDelete(table: string, id: string) {
    if (!confirm('Tem certeza que deseja excluir este item?')) return;
    try {
      let entity: string = 'transaction';
      if (table === 'financial_categories') entity = 'financial_category';
      else if (table === 'financial_accounts') entity = 'financial_account';

      const res = await fetch('/api/entity/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity, id })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao excluir item.');
      fetchData();
    } catch (err: any) {
      console.error('Error deleting finance item:', err);
      alert(err.message || 'Erro ao excluir item.');
    }
  }

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[#D4AF37]/10 rounded-2xl border border-[#D4AF37]/20 shadow-sm">
            <Wallet className="h-8 w-8 text-[#D4AF37]" />
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

      {/* Sub-seção 1: Desempenho de Caixa (Realizado) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-emerald-500" />
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Desempenho de Caixa (Realizado)</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <FinanceCard label="Recebido Hoje" value={data.stats.receivedToday} loading={loading} icon={Banknote} color="emerald" subtitle="Hoje" />
          <FinanceCard label="Recebido Mês" value={data.stats.receivedMonth} loading={loading} icon={Calendar} color="emerald" subtitle="Este mês" />
          <FinanceCard label="Recebido Ano" value={data.stats.receivedYear} loading={loading} icon={TrendingUp} color="emerald" subtitle="Este ano" />
          <FinanceCard label="Lucro Líquido" value={data.stats.profit} loading={loading} icon={ArrowUpRight} color="blue" subtitle="No período selecionado" />
        </div>
      </div>

      {/* Sub-seção 2: Cobrança e Previsões (A Receber) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <ClockIcon className="h-4 w-4 text-amber-500" />
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Cobrança e Previsões (A Receber)</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
          <FinanceCard label="Pagamentos Pendentes" value={data.stats.pendingPayments} loading={loading} icon={ClockIcon} color="amber" subtitle="Futuros pendentes" />
          <FinanceCard label="Pagamentos Parciais" value={data.stats.partialPayments} loading={loading} icon={TrendingUp} color="amber" subtitle="Saldos de parciais" />
          <FinanceCard label="Pagamentos em Atraso" value={data.stats.overduePayments} loading={loading} icon={AlertCircle} color="red" subtitle="Vencidos e não pagos" onClick={() => setActiveTab('receivables')} />
          <FinanceCard label="Futuros Previstos" value={data.stats.futureForecast} loading={loading} icon={Calendar} color="blue" subtitle="Total de futuros" />
          <FinanceCard label="Total a Receber" value={data.stats.totalReceivable} loading={loading} icon={Wallet} color="rose" subtitle="Soma de pendências" />
          
          <Card className="border rounded-[2rem] p-8 relative overflow-hidden group shadow-xl shadow-slate-200/40 border-slate-100 hover:-translate-y-1 hover:shadow-2xl bg-white/80">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inadimplência</span>
              <div className="p-2 rounded-xl bg-red-600 text-white shadow-lg">
                <AlertCircle className="h-4 w-4" />
              </div>
            </div>
            <div className="text-3xl font-black italic tracking-tighter text-red-600">
              {loading ? (
                <div className="h-9 w-20 bg-slate-100/80 animate-pulse rounded-xl" />
              ) : (
                `${data.stats.inadimplencia}%`
              )}
            </div>
            <span className="text-[9px] font-bold text-slate-400 uppercase block mt-1">Saldos atrasados / Realizados</span>
          </Card>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100">
        <div className="flex items-center gap-8">
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
            {activeTab === 'receivables' && <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-rose-500 rounded-t-full shadow-[0_-2px_10px_rgba(244,63,94,0.2)]" />}
          </button>
          <button 
            onClick={() => setActiveTab('settings')} 
            className={cn(
              "pb-5 text-xs font-black uppercase tracking-widest transition-all relative px-2", 
              activeTab === 'settings' ? "text-slate-900" : "text-slate-400 hover:text-slate-600"
            )}
          >
            Gestão de Pastas
            {activeTab === 'settings' && <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-[#D4AF37] rounded-t-full shadow-[0_-2px_10px_rgba(212,175,55,0.2)]" />}
          </button>
        </div>

        <div className="flex items-center gap-6 pb-4">
           <div className="flex flex-col items-end">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Média Diária</span>
              <span className="text-sm font-black text-emerald-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.stats.avgIncome)}</span>
           </div>
           <div className="w-px h-8 bg-slate-100" />
           <div className="flex flex-col items-end">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Lucro Médio/Dia</span>
              <span className="text-sm font-black text-blue-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.stats.avgProfit)}</span>
           </div>
        </div>
      </div>

      {activeTab === 'overview' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cash Flow Chart */}
        <Card className="lg:col-span-2 bg-white border-slate-100 rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden">
          <CardHeader className="border-b border-slate-50 px-8 py-6 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-black text-slate-900 tracking-tight">Fluxo de Caixa e Lucratividade</CardTitle>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Comparativo de entradas vs saídas e margem de lucro</p>
            </div>
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-black text-slate-500 uppercase">Entradas</span>
               </div>
               <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <span className="text-[10px] font-black text-slate-500 uppercase">Saídas</span>
               </div>
               <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span className="text-[10px] font-black text-slate-500 uppercase">Lucro</span>
               </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <CashFlowChart data={data.flowData} />
          </CardContent>
        </Card>

        {/* Categories / Side Panel */}
        <div className="space-y-8">
           {/* Financial Health Gauge */}
           <Card className="bg-white border-slate-100 rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden">
             <CardHeader className="px-6 py-4 border-b border-slate-50">
               <CardTitle className="text-xs font-black text-slate-900 uppercase tracking-widest">Saúde Financeira</CardTitle>
             </CardHeader>
             <CardContent className="p-6">
                <div className="space-y-4">
                   <div className="flex justify-between items-end">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recebidos vs Pendentes</span>
                      <span className="text-sm font-black text-emerald-600">
                         {Math.round((data.stats.income / (data.stats.income + data.stats.receivablesTotal || 1)) * 100)}%
                      </span>
                   </div>
                   <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                         className="h-full bg-emerald-500 transition-all duration-1000" 
                         style={{ width: `${(data.stats.income / (data.stats.income + data.stats.receivablesTotal || 1)) * 100}%` }}
                      />
                   </div>
                   <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                      Meta: Receber {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.stats.receivablesTotal)} adicionais para 100% de aproveitamento.
                   </p>
                </div>
             </CardContent>
           </Card>
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

        </div>

        {/* Profit Growth Section */}
        <Card className="lg:col-span-2 bg-white border-slate-100 rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden">
          <CardHeader className="border-b border-slate-50 px-8 py-6">
            <CardTitle className="text-lg font-black text-slate-900 tracking-tight">Crescimento Financeiro</CardTitle>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Trajetória do lucro acumulado no período</p>
          </CardHeader>
          <CardContent className="p-8">
            <ProfitGrowthChart data={data.flowData} />
          </CardContent>
        </Card>

        {/* Expenses by Category Improved */}
        <Card className="bg-white border-slate-100 rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden">
          <CardHeader className="px-6 py-4 border-b border-slate-50">
            <CardTitle className="text-xs font-black text-slate-900 uppercase tracking-widest">Distribuição de Gastos</CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex flex-col items-center">
            <ExpensesByCategoryChart data={data.categoryData} />
            <div className="w-full space-y-2 mt-4">
               {data.categoryData.slice(0, 3).map((cat: any) => (
                  <div key={cat.name} className="flex justify-between items-center px-2">
                     <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">{cat.name}</span>
                     </div>
                     <span className="text-[10px] font-black text-slate-900 tracking-tighter">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cat.value)}</span>
                  </div>
               ))}
               {data.categoryData.length === 0 && (
                  <p className="text-[10px] font-bold text-slate-300 py-10 text-center uppercase tracking-widest">Sem dados no período</p>
               )}
            </div>
          </CardContent>
        </Card>

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
                          <Trash2 className="h-10 w-10 text-slate-200" />
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
      ) : activeTab === 'receivables' ? (
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
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <Card className="bg-white border-slate-100 rounded-3xl shadow-sm">
             <CardHeader className="border-b border-slate-50">
                <CardTitle className="text-sm font-black text-slate-900 uppercase tracking-widest">Categorias de Lançamento</CardTitle>
             </CardHeader>
             <CardContent className="p-6">
                <div className="space-y-3">
                   {categories.map(c => (
                     <div key={c.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                        <div className="flex items-center gap-3">
                           <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                           <span className="text-xs font-bold text-slate-700">{c.name}</span>
                           <Badge variant="outline" className="text-[8px] uppercase">{c.type === 'income' ? 'Entrada' : 'Saída'}</Badge>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDelete('financial_categories', c.id)}
                          className="h-8 w-8 text-slate-300 hover:text-rose-500"
                        >
                           <Trash2 className="h-4 w-4" />
                        </Button>
                     </div>
                   ))}
                </div>
             </CardContent>
           </Card>

           <Card className="bg-white border-slate-100 rounded-3xl shadow-sm">
             <CardHeader className="border-b border-slate-50">
                <CardTitle className="text-sm font-black text-slate-900 uppercase tracking-widest">Contas Bancárias / Caixas</CardTitle>
             </CardHeader>
             <CardContent className="p-6">
                <div className="space-y-3">
                   {accounts.map(a => (
                     <div key={a.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                        <div className="flex items-center gap-3">
                           <Wallet className="w-4 h-4 text-[#D4AF37]" />
                           <span className="text-xs font-bold text-slate-700">{a.name}</span>
                        </div>
                        <div className="text-right">
                           <p className="text-[10px] font-black text-slate-400 uppercase">Saldo Atual</p>
                           <p className="text-xs font-black text-slate-900 italic">
                             {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(a.balance || 0)}
                           </p>
                        </div>
                     </div>
                   ))}
                </div>
             </CardContent>
           </Card>
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
