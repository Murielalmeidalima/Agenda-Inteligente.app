'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase-browser';
import { 
  Button, 
  Card, 
  CardContent, 
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
  MoreVertical,
  Calendar,
  CreditCard,
  Banknote,
  Navigation
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const DEMO_TRANSACTIONS: any[] = [];

export default function FinancePage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stats, setStats] = useState({ income: 0, expense: 0, balance: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFinancialData();
  }, []);

  async function fetchFinancialData() {
    try {
      setLoading(true);
      const supabase = createBrowserClient();
      
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          financial_categories(name, icon, color),
          financial_accounts(name)
        `)
        .order('date', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
         setTransactions([]);
         setStats({ income: 0, expense: 0, balance: 0 });
      } else {
         const inc = data?.reduce((acc, t) => t.type === 'income' ? acc + Number(t.amount) : acc, 0) || 0;
         const exp = data?.reduce((acc, t) => t.type === 'expense' ? acc + Number(t.amount) : acc, 0) || 0;

         setTransactions(data || []);
         setStats({ income: inc, expense: exp, balance: inc - exp });
      }
    } catch (err: any) {
      console.error('Fetch failed', err?.message || err);
      // Fallback seguro em caso de erro real (sem dados demo)
      setTransactions([]);
      setStats({ income: 0, expense: 0, balance: 0 });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6">
        <div className="flex items-center gap-4">
            <Wallet className="h-8 w-8 text-[#B5952F] fill-[#D4AF37]/20" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Gestão Financeira</h1>
              <p className="text-slate-600 text-sm mt-1">Gerencie seu fluxo de caixa e visualize relatórios completos.</p>
           </div>
        </div>
        
        <div className="flex items-center gap-3">
           <Link href="/dashboard/finance/new?type=income">
             <Button className="h-12 px-6 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Nova Receita
             </Button>
           </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <FinanceCard 
            label="Saldo em Contas" 
            value={stats.balance} 
            icon={<Wallet className="h-8 w-8 text-blue-500" strokeWidth={2.5} />}
            trend="+R$ 1.200 este mês"
            color="primary"
         />
         <FinanceCard 
            label="Total de Entradas" 
            value={stats.income} 
            icon={<TrendingUp className="h-8 w-8 text-emerald-500" strokeWidth={2.5} />} 
            trend="+15% vs mês passado"
            color="emerald"
         />
         <FinanceCard 
            label="Total de Saídas" 
            value={stats.expense} 
            icon={<TrendingDown className="h-8 w-8 text-red-500" strokeWidth={2.5} />} 
            trend="-5% vs mês passado"
            color="red"
         />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Transactions List */}
         <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between px-2">
               <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">Movimentações Recentes</h3>
               <div className="flex items-center gap-2">
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                     <Search className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                     <Filter className="h-4 w-4" />
                  </Button>
               </div>
            </div>

            <Card className="bg-white border-neutral-100 rounded-3xl overflow-hidden shadow-xl shadow-slate-200/50">
               {/* Desktop Table View */}
               <div className="hidden md:block">
                  <Table>
                     <TableHeader className="bg-slate-50/50 border-b border-neutral-100">
                        <TableRow className="hover:bg-transparent border-none">
                           <TableHead className="text-slate-400 font-bold uppercase text-[10px] tracking-widest pl-8 py-4">Descrição</TableHead>
                           <TableHead className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Categoria</TableHead>
                           <TableHead className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Data</TableHead>
                           <TableHead className="text-slate-400 font-bold uppercase text-[10px] tracking-widest text-right pr-8">Valor</TableHead>
                        </TableRow>
                     </TableHeader>
                     <TableBody>
                        {loading ? (
                           Array(3).fill(0).map((_, i) => (
                              <TableRow key={i} className="border-b border-neutral-100 animate-pulse">
                                 <TableCell className="pl-8 py-6"><div className="h-10 w-40 bg-slate-100 rounded-lg" /></TableCell>
                                 <TableCell><div className="h-10 w-24 bg-slate-100 rounded-lg" /></TableCell>
                                 <TableCell><div className="h-6 w-16 bg-slate-100 rounded-full" /></TableCell>
                                 <TableCell className="pr-8 text-right"><div className="ml-auto h-10 w-20 bg-slate-100 rounded-lg" /></TableCell>
                              </TableRow>
                           ))
                        ) : transactions.length === 0 ? (
                           <TableRow>
                              <TableCell colSpan={4} className="py-20 text-center">
                                 <div className="flex flex-col items-center gap-4 text-slate-400">
                                    <Wallet className="h-12 w-12 opacity-20" />
                                    <p className="text-lg">Nenhuma movimentação registrada.</p>
                                 </div>
                              </TableCell>
                           </TableRow>
                        ) : (
                           transactions.map((t) => (
                              <TableRow key={t.id} className="border-b border-neutral-100 group hover:bg-blue-50/50 transition-colors">
                                 <TableCell className="pl-8 py-5">
                                    <div className="flex items-center gap-4">
                                       <div className={cn(
                                          "h-10 w-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
                                          t.type === 'income' ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                                       )}>
                                          {t.type === 'income' ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                                       </div>
                                       <div>
                                          <p className="font-bold text-slate-700 text-sm">{t.description || 'Sem descrição'}</p>
                                          <p className="text-[10px] text-slate-400 uppercase font-black tracking-tighter mt-0.5">{t.financial_accounts?.name}</p>
                                       </div>
                                    </div>
                                 </TableCell>
                                 <TableCell>
                                    <Badge variant="outline" className="bg-slate-100 border-slate-200 text-slate-500 text-[10px] font-bold uppercase rounded-full">
                                       {t.financial_categories?.name || 'Geral'}
                                    </Badge>
                                 </TableCell>
                                 <TableCell className="text-xs text-slate-500 font-medium font-mono">
                                    {format(new Date(t.date), 'dd MMM, yyyy', { locale: ptBR })}
                                 </TableCell>
                                 <TableCell className="pr-8 text-right">
                                    <span className={cn(
                                       "font-black text-base transition-colors",
                                       t.type === 'income' ? "text-emerald-600" : "text-slate-700"
                                    )}>
                                       {t.type === 'income' ? '+' : '-'} {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount)}
                                    </span>
                                 </TableCell>
                              </TableRow>
                           ))
                        )}
                     </TableBody>
                  </Table>
               </div>

               {/* Mobile List View */}
               <div className="md:hidden">
                  {loading ? (
                     <div className="p-4 space-y-4">
                        {[1,2,3].map(i => (
                           <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
                        ))}
                     </div>
                  ) : transactions.length === 0 ? (
                     <div className="py-16 flex flex-col items-center gap-4 text-slate-400">
                        <Wallet className="h-12 w-12 opacity-20" />
                        <p className="text-sm">Sem dados.</p>
                     </div>
                  ) : (
                     <div className="divide-y divide-neutral-100">
                        {transactions.map((t) => (
                           <div key={t.id} className="p-4 flex items-center justify-between active:bg-slate-50 transition-colors">
                              <div className="flex items-center gap-3">
                                 <div className={cn(
                                    "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                                    t.type === 'income' ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                                 )}>
                                    {t.type === 'income' ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                                 </div>
                                 <div>
                                    <p className="font-bold text-slate-700 text-sm line-clamp-1">{t.description || 'Sem descrição'}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                       <span className="text-[10px] text-slate-400 font-mono">
                                          {format(new Date(t.date), 'dd/MM', { locale: ptBR })}
                                       </span>
                                       <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                       <span className="text-[10px] text-slate-400 uppercase tracking-tight line-clamp-1 max-w-[100px]">
                                          {t.financial_categories?.name}
                                       </span>
                                    </div>
                                 </div>
                              </div>
                              <div className="text-right">
                                 <span className={cn(
                                    "font-black text-sm block",
                                    t.type === 'income' ? "text-emerald-600" : "text-slate-700"
                                 )}>
                                    {t.type === 'income' ? '+' : '-'} {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount)}
                                 </span>
                                 <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mt-0.5">
                                    {t.financial_accounts?.name}
                                 </p>
                              </div>
                           </div>
                        ))}
                     </div>
                  )}
               </div>
            </Card>
         </div>

         {/* Stats and Methods */}
         <div className="space-y-8">
            <Card className="bg-blue-950 border-blue-900 rounded-3xl overflow-hidden shadow-xl">
               <div className="p-8 space-y-6">
                  <h3 className="text-xs font-black text-blue-200 uppercase tracking-widest flex items-center gap-2">
                     <CreditCard className="h-4 w-4 text-blue-400" />
                     Métodos Preparados
                  </h3>
                  
                  <div className="space-y-4">
                     <MethodItem label="PIX Instantâneo" percentage={65} color="bg-emerald-500" />
                     <MethodItem label="Cartão de Crédito" percentage={25} color="bg-blue-500" />
                     <MethodItem label="Dinheiro / Espécie" percentage={10} color="bg-slate-500" />
                  </div>
               </div>
            </Card>

            <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 border-none rounded-3xl overflow-hidden shadow-2xl relative group">
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
                  <Navigation className="h-24 w-24 text-white" />
               </div>
               <div className="p-8 relative z-10">
                  <h3 className="text-white/60 text-[10px] uppercase font-black tracking-widest mb-1">Previsão Mensal</h3>
                  <h2 className="text-3xl font-black text-white italic">R$ 14.200,00</h2>
                  <p className="text-white/60 text-xs mt-4 leading-relaxed font-medium">Sua clínica está operando com <span className="text-white font-black">12% mais eficiência</span> que a média do setor este mês.</p>
                  <Button className="w-full mt-8 bg-white text-blue-600 hover:bg-white/90 font-black rounded-xl h-11">
                     Gerar Relatório Pro
                  </Button>
               </div>
            </Card>
         </div>
      </div>
    </div>
  );
}

function FinanceCard({ label, value, icon, trend, color }: any) {
   return (
      <Card className="bg-blue-950 border-blue-900 rounded-3xl p-8 relative overflow-hidden group hover:bg-blue-900 transition-all cursor-default shadow-xl">
         <div className={cn(
            "absolute -top-12 -right-12 w-32 h-32 rounded-full blur-[60px] opacity-10 transition-opacity group-hover:opacity-20",
            color === 'primary' ? "bg-blue-500" : color === 'emerald' ? "bg-emerald-500" : "bg-red-500"
         )} />
         
         <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black text-blue-200 uppercase tracking-widest">{label}</span>
            {icon}
         </div>
         <h2 className="text-3xl font-black text-white italic leading-none mb-4">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
         </h2>
         <div className="flex items-center gap-1.5">
            <span className={cn(
               "text-[10px] font-extrabold px-1.5 py-0.5 rounded",
               color === 'red' ? "text-red-300 bg-red-400/10" : "text-emerald-300 bg-emerald-400/10"
            )}>{trend}</span>
         </div>
      </Card>
   );
}

function MethodItem({ label, percentage, color }: any) {
   return (
      <div className="space-y-1.5">
         <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
            <span className="text-neutral-500">{label}</span>
            <span className="text-white">{percentage}%</span>
         </div>
         <div className="h-1.5 w-full bg-neutral-900 rounded-full overflow-hidden">
            <div 
               className={cn("h-full rounded-full transition-all duration-1000", color)} 
               style={{ width: `${percentage}%` }} 
            />
         </div>
      </div>
   );
}
