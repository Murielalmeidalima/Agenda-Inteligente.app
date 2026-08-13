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
  Input,
  Badge,
  toast,
  cn
} from '@projeto/ui';
import { 
  Target, 
  Trophy, 
  TrendingUp, 
  Calendar, 
  Activity, 
  Package, 
  TrendingDown,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  ChevronLeft,
  LayoutDashboard
} from 'lucide-react';
import { useProfile } from '@/providers/profile-provider';
import { 
  format, 
  startOfDay, 
  endOfDay, 
  startOfMonth, 
  endOfMonth, 
  startOfYear, 
  endOfYear,
  isWithinInterval,
  addMonths,
  subMonths
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

type GoalCategory = 'revenue' | 'appointments' | 'procedures' | 'products';
type GoalPeriod = 'daily' | 'monthly' | 'yearly';

export default function PlanningPage() {
  const { profile } = useProfile();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [goals, setGoals] = useState<any[]>([]);
  const [actuals, setActuals] = useState({
    revenue: 0,
    appointments: 0,
    procedures: 0,
    products: 0
  });
  const [ratios, setRatios] = useState({
    procedureRatio: 0.85,
    productRatio: 0.15,
    avgProcedurePrice: 150,
    avgProductPrice: 50,
    avgProceduresPerAppointment: 1.0
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editingGoals, setEditingGoals] = useState<any[]>([]);

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

  useEffect(() => {
    setMounted(true);
    setCurrentDate(new Date());
  }, []);

  useEffect(() => {
    if (mounted && profile?.company_id) {
      fetchData();
    }
  }, [profile, currentDate, mounted]);

  async function fetchData() {
    setLoading(true);
    try {
      const supabase = createBrowserClient();
      
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);

      // Fetch Goals
      const { data: goalsData, error: goalsError } = await supabase
        .from('strategic_goals')
        .select('*')
        .eq('company_id', profile?.company_id)
        .eq('period', 'monthly')
        .gte('target_date', format(monthStart, 'yyyy-MM-dd'))
        .lte('target_date', format(monthEnd, 'yyyy-MM-dd'));

      if (goalsError) {
        if (goalsError.code === '42P01' || (goalsError.message && goalsError.message.includes('Could not find the table'))) {
           console.warn('Tabela strategic_goals não existe ainda. Rode as migrações.');
           toast.error('Tabela de metas ausente. Rode npx supabase db push.');
        } else {
           console.error('Error fetching goals:', goalsError.message || goalsError);
        }
      }

      setGoals(goalsData || []);

      // Fetch Actual Transactions for Revenue
      const { data: transRes } = await supabase
        .from('transactions')
        .select('amount')
        .eq('company_id', profile?.company_id)
        .eq('type', 'income')
        .eq('status', 'completed')
        .gte('date', format(monthStart, 'yyyy-MM-dd'))
        .lte('date', format(monthEnd, 'yyyy-MM-dd'));

      // Fetch Appointments
      const { data: appsRes } = await supabase
        .from('appointments')
        .select('*, procedures(id)')
        .eq('company_id', profile?.company_id)
        .eq('status', 'completed')
        .gte('start_time', monthStart.toISOString())
        .lte('start_time', monthEnd.toISOString());

      // Fetch Product Sales (Inventory Trans)
      const { data: invRes } = await supabase
        .from('inventory_transactions')
        .select('quantity')
        .eq('company_id', profile?.company_id)
        .eq('type', 'out')
        .gte('created_at', monthStart.toISOString())
        .lte('created_at', monthEnd.toISOString());

      const revenue = transRes?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const appointments = appsRes?.length || 0;
      const procedures = appsRes?.reduce((sum, a) => {
        let count = Array.isArray(a.procedures) ? a.procedures.length : a.procedures ? 1 : 0;
        if (Array.isArray(a.additional_procedure_ids)) {
          count += a.additional_procedure_ids.length;
        }
        return sum + count;
      }, 0) || 0;
      const products = invRes?.reduce((sum, i) => sum + Number(i.quantity), 0) || 0;

      setActuals({ revenue, appointments, procedures, products });

      // Fetch dynamic ratios and prices for the smart goals calculator
      const [proceduresList, productsList, pastApps, pastInv] = await Promise.all([
        supabase.from('procedures').select('price').eq('company_id', profile?.company_id),
        supabase.from('products').select('sale_price, price').eq('company_id', profile?.company_id),
        supabase.from('appointments').select('id, price_override, procedures(price), additional_procedure_ids').eq('company_id', profile?.company_id).eq('status', 'completed').gte('start_time', subMonths(new Date(), 6).toISOString()),
        supabase.from('inventory_transactions').select('quantity, products(sale_price, price)').eq('company_id', profile?.company_id).eq('type', 'out').gte('created_at', subMonths(new Date(), 6).toISOString())
      ]);

      let avgProcedurePrice = 150;
      if (proceduresList.data && proceduresList.data.length > 0) {
        const validPrices = proceduresList.data.map((p: any) => Number(p.price)).filter(p => p > 0);
        if (validPrices.length > 0) {
          avgProcedurePrice = validPrices.reduce((sum, p) => sum + p, 0) / validPrices.length;
        }
      }

      let avgProductPrice = 50;
      if (productsList.data && productsList.data.length > 0) {
        const validPrices = productsList.data.map((p: any) => Number(p.sale_price || p.price || 0)).filter(p => p > 0);
        if (validPrices.length > 0) {
          avgProductPrice = validPrices.reduce((sum, p) => sum + p, 0) / validPrices.length;
        }
      }

      let avgProceduresPerAppointment = 1.0;
      if (pastApps.data && pastApps.data.length > 0) {
        let totalProcedures = 0;
        pastApps.data.forEach((a: any) => {
          let count = Array.isArray(a.procedures) ? a.procedures.length : a.procedures ? 1 : 0;
          if (Array.isArray(a.additional_procedure_ids)) {
            count += a.additional_procedure_ids.length;
          }
          totalProcedures += count;
        });
        avgProceduresPerAppointment = totalProcedures / pastApps.data.length;
      }

      let totalProcedureRevenue = 0;
      if (pastApps.data && pastApps.data.length > 0) {
        pastApps.data.forEach((a: any) => {
          const price = Number(a.price_override || (Array.isArray(a.procedures) ? a.procedures[0]?.price : a.procedures?.price) || 0);
          totalProcedureRevenue += price;
        });
      }

      let totalProductRevenue = 0;
      if (pastInv.data && pastInv.data.length > 0) {
        pastInv.data.forEach((i: any) => {
          const price = Number(i.products?.sale_price || i.products?.price || 0);
          totalProductRevenue += Number(i.quantity) * price;
        });
      }

      let procedureRatio = 0.85;
      let productRatio = 0.15;
      const totalRev = totalProcedureRevenue + totalProductRevenue;
      if (totalRev > 0) {
        procedureRatio = totalProcedureRevenue / totalRev;
        productRatio = totalProductRevenue / totalRev;
      }

      setRatios({
        procedureRatio,
        productRatio,
        avgProcedurePrice,
        avgProductPrice,
        avgProceduresPerAppointment
      });
    } catch (err: any) {
      console.error('Error fetching planning data:', err);
      if (err?.code !== '42P01' && !(err?.message?.includes('Could not find the table'))) {
         toast.error('Erro ao carregar dados de planejamento');
      }
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) return null;

  const getGoalValue = (category: GoalCategory) => {
    return goals.find(g => g.category === category)?.target_value || 0;
  };

  const calculateProgress = (actual: number, target: number) => {
    if (!target) return 0;
    return Math.min(Math.round((actual / target) * 100), 100);
  };

  async function handleSaveGoals() {
    setLoading(true);
    try {
      const supabase = createBrowserClient();
      const monthStart = startOfMonth(currentDate);
      
      const categories: GoalCategory[] = ['revenue', 'appointments', 'procedures', 'products'];
      
      const upsertData = categories.map(cat => ({
        company_id: profile?.company_id,
        category: cat,
        period: 'monthly',
        target_value: editingGoals.find(eg => eg.category === cat)?.target_value || 0,
        target_date: format(monthStart, 'yyyy-MM-dd')
      }));

      // In Supabase, unique constraint (company_id, category, period, target_date) handles conflict
      const { error } = await supabase
        .from('strategic_goals')
        .upsert(upsertData, { 
          onConflict: 'company_id, category, period, target_date' 
        });

      if (error) throw error;

      toast.success('Metas atualizadas com sucesso!');
      setIsEditing(false);
      fetchData();
    } catch (err) {
      console.error('Error saving goals:', err);
      toast.error('Erro ao salvar metas');
    } finally {
      setLoading(false);
    }
  }

  function startEditing() {
    const categories: GoalCategory[] = ['revenue', 'appointments', 'procedures', 'products'];
    const currentEditing = categories.map(cat => ({
      category: cat,
      target_value: getGoalValue(cat)
    }));
    setEditingGoals(currentEditing);
    setIsEditing(true);
  }

  const handleGoalEdit = (category: GoalCategory, value: number) => {
    const newGoals = [...editingGoals];
    const { procedureRatio, productRatio, avgProcedurePrice, avgProductPrice, avgProceduresPerAppointment } = ratios;

    const updateGoalValue = (goalsList: any[], cat: GoalCategory, val: number) => {
      const goal = goalsList.find(g => g.category === cat);
      if (goal) {
        goal.target_value = val;
      } else {
        goalsList.push({ category: cat, target_value: val });
      }
    };

    if (category === 'revenue') {
      const revenue = value;
      const procedureRevenue = revenue * procedureRatio;
      const productRevenue = revenue * productRatio;

      const procedures = Math.round(procedureRevenue / (avgProcedurePrice || 150));
      const products = Math.round(productRevenue / (avgProductPrice || 50));
      const appointments = Math.round(procedures / (avgProceduresPerAppointment || 1));

      updateGoalValue(newGoals, 'revenue', revenue);
      updateGoalValue(newGoals, 'procedures', procedures);
      updateGoalValue(newGoals, 'products', products);
      updateGoalValue(newGoals, 'appointments', appointments);
    } 
    else if (category === 'procedures') {
      const procedures = value;
      const appointments = Math.round(procedures / (avgProceduresPerAppointment || 1));
      const procedureRevenue = procedures * avgProcedurePrice;
      
      const currentProducts = editingGoals.find(g => g.category === 'products')?.target_value || 0;
      const productRevenue = currentProducts * avgProductPrice;
      const revenue = procedureRevenue + productRevenue;

      updateGoalValue(newGoals, 'procedures', procedures);
      updateGoalValue(newGoals, 'appointments', appointments);
      updateGoalValue(newGoals, 'revenue', revenue);
    } 
    else if (category === 'products') {
      const products = value;
      const productRevenue = products * avgProductPrice;

      const currentProcedures = editingGoals.find(g => g.category === 'procedures')?.target_value || 0;
      const procedureRevenue = currentProcedures * avgProcedurePrice;
      const revenue = procedureRevenue + productRevenue;

      updateGoalValue(newGoals, 'products', products);
      updateGoalValue(newGoals, 'revenue', revenue);
    } 
    else if (category === 'appointments') {
      const appointments = value;
      const procedures = Math.round(appointments * avgProceduresPerAppointment);
      const procedureRevenue = procedures * avgProcedurePrice;

      const currentProducts = editingGoals.find(g => g.category === 'products')?.target_value || 0;
      const productRevenue = currentProducts * avgProductPrice;
      const revenue = procedureRevenue + productRevenue;

      updateGoalValue(newGoals, 'appointments', appointments);
      updateGoalValue(newGoals, 'procedures', procedures);
      updateGoalValue(newGoals, 'revenue', revenue);
    }

    setEditingGoals(newGoals);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-50 rounded-2xl shadow-md border border-amber-100">
            <Trophy className="h-8 w-8 text-amber-500" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight font-serif uppercase">Melhor Planejamento</h1>
            <p className="text-slate-500 text-sm font-medium">Defina metas estratégicas e acompanhe o crescimento da sua clínica.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
             <Button 
                variant="ghost" 
                size="icon" 
                className="h-10 w-10 rounded-xl"
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
             >
                <ChevronLeft className="h-5 w-5" />
             </Button>
             <span className="px-4 text-sm font-black text-slate-900 uppercase tracking-widest min-w-0 sm:min-w-[140px] text-center">
                {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
             </span>
             <Button 
                variant="ghost" 
                size="icon" 
                className="h-10 w-10 rounded-xl"
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
             >
                <ChevronRight className="h-5 w-5" />
             </Button>
          </div>
          
          <Button 
             onClick={isEditing ? handleSaveGoals : startEditing}
             className={cn(
               "h-12 px-8 rounded-2xl shadow-xl font-black transition-all active:scale-95",
               isEditing ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200" : "bg-slate-900 hover:bg-black text-white shadow-slate-200"
             )}
          >
             {isEditing ? 'Salvar Planejamento' : 'Ajustar Metas'}
          </Button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <PlanningCard 
          title="Faturamento" 
          loading={loading}
          actual={actuals.revenue} 
          target={isEditing ? Number(editingGoals.find(g => g.category === 'revenue')?.target_value || 0) : getGoalValue('revenue')}
          icon={TrendingUp}
          color="emerald"
          isCurrency
          isEditing={isEditing}
          onEdit={(val: number) => handleGoalEdit('revenue', val)}
          helperText={isEditing ? `Dividido em: ${(ratios.procedureRatio * 100).toFixed(0)}% serv. / ${(ratios.productRatio * 100).toFixed(0)}% prod.` : undefined}
        />
        <PlanningCard 
          title="Atendimentos" 
          loading={loading}
          actual={actuals.appointments} 
          target={isEditing ? Number(editingGoals.find(g => g.category === 'appointments')?.target_value || 0) : getGoalValue('appointments')}
          icon={Calendar}
          color="blue"
          isEditing={isEditing}
          onEdit={(val: number) => handleGoalEdit('appointments', val)}
          helperText={isEditing ? `Média: ${(ratios.avgProceduresPerAppointment).toFixed(1)} procedimentos/atendimento.` : undefined}
        />
        <PlanningCard 
          title="Procedimentos" 
          loading={loading}
          actual={actuals.procedures} 
          target={isEditing ? Number(editingGoals.find(g => g.category === 'procedures')?.target_value || 0) : getGoalValue('procedures')}
          icon={Activity}
          color="rose"
          isEditing={isEditing}
          onEdit={(val: number) => handleGoalEdit('procedures', val)}
          helperText={isEditing ? `Preço médio do procedimento: R$ ${ratios.avgProcedurePrice.toFixed(0)}.` : undefined}
        />
        <PlanningCard 
          title="Venda de Produtos" 
          loading={loading}
          actual={actuals.products} 
          target={isEditing ? Number(editingGoals.find(g => g.category === 'products')?.target_value || 0) : getGoalValue('products')}
          icon={Package}
          color="amber"
          isEditing={isEditing}
          onEdit={(val: number) => handleGoalEdit('products', val)}
          helperText={isEditing ? `Preço médio do produto: R$ ${ratios.avgProductPrice.toFixed(0)}.` : undefined}
        />
      </div>

      {/* Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <Card className="lg:col-span-2 bg-white border-slate-100 rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden">
            <CardHeader className="p-8 border-b border-slate-50">
               <CardTitle className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                  <LayoutDashboard className="h-6 w-6 text-slate-400" />
                  Visão Geral do Desempenho
               </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-10">
               <GoalProgress 
                  label="Meta de Faturamento" 
                  loading={loading}
                  actual={actuals.revenue} 
                  target={getGoalValue('revenue')} 
                  color="bg-emerald-500" 
                  isCurrency 
               />
               <GoalProgress 
                  label="Meta de Atendimentos" 
                  loading={loading}
                  actual={actuals.appointments} 
                  target={getGoalValue('appointments')} 
                  color="bg-blue-500" 
               />
               <GoalProgress 
                  label="Meta de Procedimentos" 
                  loading={loading}
                  actual={actuals.procedures} 
                  target={getGoalValue('procedures')} 
                  color="bg-rose-500" 
               />
               <GoalProgress 
                  label="Meta de Produtos" 
                  loading={loading}
                  actual={actuals.products} 
                  target={getGoalValue('products')} 
                  color="bg-amber-500" 
               />
            </CardContent>
         </Card>

         <Card className="bg-slate-900 text-white border-none rounded-3xl shadow-xl shadow-slate-900/20 p-8 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] -mr-32 -mt-32" />
            
            <div className="relative z-10 space-y-6">
               <Badge className="bg-amber-500 hover:bg-amber-600 text-amber-950 font-black px-4 py-1.5 rounded-full uppercase text-[10px]">Estratégia</Badge>
               <h3 className="text-2xl font-black italic tracking-tight font-serif">Como atingir suas metas mais rápido?</h3>
               <p className="text-slate-400 text-sm leading-relaxed">
                  Baseado no seu desempenho atual, você atingiu <span className="text-white font-bold">{calculateProgress(actuals.revenue, getGoalValue('revenue'))}%</span> da sua meta de faturamento. 
                  Para bater a meta total, sugerimos focar no ticket médio dos próximos atendimentos.
               </p>
            </div>

            <div className="mt-12 space-y-4 relative z-10">
               <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                  <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Dica do sistema</p>
                  <p className="text-xs text-slate-300 italic">"Clínicas com metas mensais claras crescem até 40% mais rápido que a média."</p>
               </div>
               <Button className="w-full h-12 bg-white text-slate-900 font-black rounded-xl hover:bg-slate-100 transition-all uppercase tracking-widest text-xs">
                  Ver Relatórios Completos
               </Button>
            </div>
         </Card>
      </div>
    </div>
  );
}

function PlanningCard({ title, loading, actual, target, icon: Icon, color, isCurrency, isEditing, onEdit, helperText }: any) {
  const progress = target > 0 ? Math.min(Math.round((actual / target) * 100), 100) : 0;
  
  const colors = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100 progress-bg-emerald-500',
    blue: 'bg-blue-50 text-blue-600 border-blue-100 progress-bg-blue-500',
    rose: 'bg-rose-50 text-rose-600 border-rose-100 progress-bg-rose-500',
    amber: 'bg-amber-50 text-amber-600 border-amber-100 progress-bg-amber-500'
  };

  const progressColors = {
    emerald: 'bg-emerald-500',
    blue: 'bg-blue-500',
    rose: 'bg-rose-500',
    amber: 'bg-amber-500'
  };

  const formatValue = (val: number) => {
    if (isCurrency) {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    }
    return val.toLocaleString();
  };

  return (
    <Card className="bg-white/80 backdrop-blur-md border-slate-100 rounded-3xl shadow-xl shadow-slate-200/50 p-6 group hover:shadow-2xl hover:-translate-y-1 hover:border-[#D4AF37]/20 transition-all duration-300 overflow-hidden relative">
      <div className="flex items-center justify-between mb-6">
        <div className={cn("p-2.5 rounded-2xl border transition-colors duration-500 group-hover:bg-white", colors[color as keyof typeof colors].split(' ').slice(0, 3).join(' '))}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="text-right">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{title}</p>
           {loading ? <div className="h-5 w-10 bg-slate-100 animate-pulse rounded ml-auto" /> : <p className="text-lg font-black text-slate-900 italic">{progress}%</p>}
        </div>
      </div>

      <div className="space-y-4">
         <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Realizado</p>
            {loading ? <div className="h-7 w-24 bg-slate-100 animate-pulse rounded" /> : <h4 className="text-xl font-black text-slate-950">{formatValue(actual)}</h4>}
         </div>

         <div className="h-px bg-slate-50 w-full" />

         <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Meta</p>
            {isEditing ? (
              <div className="space-y-2">
                <div className="relative">
                   {isCurrency && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">R$</span>}
                   <Input 
                     type="number" 
                     value={target} 
                     onChange={(e) => onEdit(Number(e.target.value))}
                     className={cn(
                       "h-10 bg-slate-50 border-slate-200 rounded-xl font-black text-slate-900",
                       isCurrency ? "pl-9" : ""
                     )}
                   />
                </div>
                {helperText && (
                  <p className="text-[10px] font-medium text-amber-600 italic bg-amber-50/50 px-2.5 py-1 rounded-lg border border-amber-100/30">
                    {helperText}
                  </p>
                )}
              </div>
            ) : (
              loading ? <div className="h-7 w-20 bg-slate-100 animate-pulse rounded" /> : <h4 className="text-xl font-black text-slate-300 italic">{formatValue(target)}</h4>
            )}
         </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-50">
         <div 
           className={cn("h-full transition-all duration-1000", progressColors[color as keyof typeof progressColors])} 
           style={{ width: `${progress}%` }}
         />
      </div>
    </Card>
  );
}

function GoalProgress({ label, loading, actual, target, color, isCurrency }: any) {
  const progress = target > 0 ? Math.min(Math.round((actual / target) * 100), 100) : 0;
  
  const formatValue = (val: number) => {
    if (isCurrency) {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    }
    return val.toLocaleString();
  };

  return (
    <div className="space-y-3 group">
       <div className="flex items-center justify-between">
          <div className="flex flex-col">
             <p className="text-xs font-black text-slate-900 uppercase tracking-wider">{label}</p>
             {loading ? <div className="h-3 w-32 bg-slate-100 animate-pulse rounded mt-1" /> : <p className="text-[10px] text-slate-400 font-medium">Restam {formatValue(Math.max(0, target - actual))} para a meta</p>}
          </div>
          <div className="text-right">
             {loading ? (
                <div className="h-5 w-24 bg-slate-100 animate-pulse rounded" />
             ) : (
                <>
                   <span className="text-sm font-black text-slate-950">{formatValue(actual)}</span>
                   <span className="text-xs text-slate-300 font-bold mx-2">/</span>
                   <span className="text-xs text-slate-400 font-bold">{formatValue(target)}</span>
                </>
             )}
          </div>
       </div>
       <div className="h-3 w-full bg-slate-50 rounded-full border border-slate-100 overflow-hidden relative shadow-inner">
          <div 
             className={cn("h-full rounded-full transition-all duration-1000 group-hover:brightness-110 shadow-lg", color)}
             style={{ width: `${progress}%` }}
          >
             <div className="w-full h-full opacity-30 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer" />
          </div>
       </div>
    </div>
  );
}
