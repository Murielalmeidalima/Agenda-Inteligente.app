import { createServerClient } from '@/lib/auth';
import { 
  Users, 
  TrendingUp, 
  CalendarCheck2,
  Clock,
  Cake,
  AlertCircle,
  ArrowRight,
  User,
  CheckCircle2,
  XCircle,
  Clock3,
  MessageCircle,
  CalendarPlus,
  Instagram,
  Wrench,
  Star,
  UserX,
  CalendarDays
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '@projeto/ui';
import { LogoImage } from '@/components/ui/Logo';
import Link from 'next/link';
import { format, isToday, parseISO, startOfWeek, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { StitchDashboardClient } from './StitchDashboardClient';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = createServerClient();
  
  // Check Authentication
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
       <div className="flex bg-[#FDFBF7] h-screen items-center justify-center p-8 text-center">
          <div>
            <h2 className="text-xl font-bold mb-2 text-[#2C2825]">Acesso Negado</h2>
            <p className="text-[#8A847C]">Por favor, faça login novamente.</p>
          </div>
       </div>
    );
  }

  // Get User Profile & Company ID
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role, approved, permissions, full_name')
    .eq('id', user.id)
    .single();

  if (!profile || !profile.company_id) {
    return (
       <div className="flex bg-[#FDFBF7] h-screen items-center justify-center p-8 text-center">
          <div className="max-w-md">
            <h2 className="text-2xl font-serif font-bold mb-4 text-[#2C2825]">Configuração Pendente</h2>
            <p className="text-[#5C5855] leading-relaxed">
              Sua conta ainda não está vinculada a nenhuma clínica. Entre em contato com o suporte ou aguarde a aprovação do administrador.
            </p>
          </div>
       </div>
    );
  }

  if (!profile.approved) {
    return (
       <div className="flex bg-[#FDFBF7] h-screen items-center justify-center p-8 text-center">
          <div className="max-w-md">
            <h2 className="text-2xl font-serif font-bold mb-4 text-[#2C2825]">Aprovação Pendente</h2>
            <p className="text-[#5C5855] leading-relaxed">
              Sua conta aguarda aprovação do administrador da clínica. Você receberá um e-mail assim que o acesso for liberado.
            </p>
          </div>
       </div>
    );
  }

  const COMPANY_ID = profile.company_id;

  const getInitials = (name: string | null | undefined): string => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  // Dates for querying
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const monthDayStr = format(today, 'MM-dd');
  const currentMonthStr = format(today, 'MM');
  const startOfMonthStr = format(new Date(today.getFullYear(), today.getMonth(), 1), 'yyyy-MM-dd') + 'T00:00:00Z';
  const endOfMonthStr = format(new Date(today.getFullYear(), today.getMonth() + 1, 0), 'yyyy-MM-dd') + 'T23:59:59Z';

  // Dynamic Greeting based on time of day (Kombai Luxury Rules)
  const currentHour = today.getHours();
  let greeting = 'Bom dia';
  if (currentHour >= 12 && currentHour < 18) {
    greeting = 'Boa tarde';
  } else if (currentHour >= 18 || currentHour < 5) {
    greeting = 'Boa noite';
  }

  const firstName = profile?.full_name?.trim()?.split(' ')[0];
  const userDisplayName = firstName 
    ? (firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase())
    : (profile?.role === 'admin' ? 'Gestor' : 'Profissional');

  // Fetch Metrics
  const [
    { count: professionalsCount },
    { data: appointmentsData },
    { data: revenueData },
    { data: companyData },
    { data: allClientsData },
    { data: monthAppointmentsData },
    { data: maintenanceAppointmentsData },
    { data: pendingReviewsData },
    { data: productsData },
    { data: transactionsData },
    { data: upcomingAppointmentsData }
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', COMPANY_ID)
      .in('role', ['admin', 'professional']),
    
    supabase
      .from('appointments')
      .select(`
        id,
        start_time,
        end_time,
        status,
        client_id,
        procedure_id,
        clients(id, full_name, phone),
        procedures(name, duration)
      `)
      .eq('company_id', COMPANY_ID)
      .gte('start_time', todayStr + 'T00:00:00Z')
      .lte('start_time', todayStr + 'T23:59:59Z')
      .order('start_time', { ascending: true }),

    supabase
      .from('appointments')
      .select(`
        price_override,
        status,
        procedures(price)
      `)
      .eq('company_id', COMPANY_ID)
      .gte('start_time', todayStr + 'T00:00:00Z')
      .lte('start_time', todayStr + 'T23:59:59Z')
      .neq('status', 'cancelled'),

    supabase
      .from('companies')
      .select('name, logo_url')
      .eq('id', COMPANY_ID)
      .single(),

    supabase
      .from('clients')
      .select('id, full_name, phone, birth_date, instagram')
      .eq('company_id', COMPANY_ID),

    supabase
      .from('appointments')
      .select('id, client_id, start_time')
      .eq('company_id', COMPANY_ID)
      .gte('start_time', startOfMonthStr)
      .lte('start_time', endOfMonthStr)
      .neq('status', 'cancelled'),

    supabase
      .from('appointments')
      .select('id')
      .eq('company_id', COMPANY_ID)
      .gte('start_time', todayStr + 'T00:00:00Z')
      .eq('is_maintenance', true)
      .neq('status', 'cancelled'),

    supabase
      .from('reviews')
      .select('id')
      .eq('company_id', COMPANY_ID)
      .eq('status', 'pending'),

    supabase
      .from('products')
      .select('id, name, current_stock, min_stock')
      .eq('company_id', COMPANY_ID),

    supabase
      .from('transactions')
      .select('id, amount, type, status, date, transaction_date')
      .eq('company_id', COMPANY_ID),

    supabase
      .from('appointments')
      .select(`
        id,
        start_time,
        end_time,
        status,
        client_id,
        procedure_id,
        clients(id, full_name, phone),
        procedures(name, duration_minutes, price)
      `)
      .eq('company_id', COMPANY_ID)
      .gte('start_time', new Date().toISOString())
      .in('status', ['scheduled', 'confirmed', 'rescheduled'])
      .order('start_time', { ascending: true })
      .limit(10)
  ]);

  // Calculate Predicted Revenue
  const todayRevenue = revenueData?.reduce((acc: number, curr: any) => {
    return acc + (curr.price_override || curr.procedures?.price || 0);
  }, 0) || 0;

  const todayAppointments = appointmentsData?.length || 0;
  
  // Strategic Indicators Calculations
  const instagramClientsCount = allClientsData?.filter(client => client.instagram && client.instagram.trim() !== '').length || 0;
  
  const birthdaysToday = allClientsData?.filter(client => {
    if (!client.birth_date) return false;
    return client.birth_date.endsWith(`-${monthDayStr}`);
  }) || [];

  const birthdaysThisMonth = allClientsData?.filter(client => {
    if (!client.birth_date) return false;
    return client.birth_date.slice(5, 7) === currentMonthStr;
  }) || [];

  const birthdayClientsWithAppointment = birthdaysThisMonth.filter(client => {
    return monthAppointmentsData?.some(appt => appt.client_id === client.id);
  }).length;

  const inactiveClientsCount = allClientsData?.filter(client => {
    return !monthAppointmentsData?.some(appt => appt.client_id === client.id);
  }).length || 0;

  const upcomingMaintenancesCount = maintenanceAppointmentsData?.length || 0;
  const pendingReviewsCount = pendingReviewsData?.length || 0;

  // Real critical stock count from products table
  const criticalStockCount = (productsData || []).filter((p: any) => p.current_stock <= p.min_stock).length;

  // Real financial calculations from transactions
  const allTx = transactionsData || [];
  const monthlyIncomes = allTx.filter((t: any) => {
    const rawDate = t.date || t.transaction_date;
    if (!rawDate) return false;
    try {
      const tLocalDateStr = format(new Date(rawDate), 'yyyy-MM-dd');
      return t.type === 'income' && (t.status === 'completed' || !t.status) && tLocalDateStr >= startOfMonthStr.slice(0, 10);
    } catch (e) {
      return false;
    }
  });
  const receivedRevenue = monthlyIncomes.reduce((acc: number, t: any) => acc + Number(t.amount || 0), 0);

  const entriesTotal = allTx.filter((t: any) => t.type === 'income' && (t.status === 'completed' || !t.status)).reduce((acc: number, t: any) => acc + Number(t.amount || 0), 0);
  const exitsTotal = allTx.filter((t: any) => t.type === 'expense' && (t.status === 'completed' || !t.status)).reduce((acc: number, t: any) => acc + Number(t.amount || 0), 0);
  const netProfit = entriesTotal - exitsTotal;
  const toReceive = allTx.filter((t: any) => t.type === 'income' && t.status === 'pending').reduce((acc: number, t: any) => acc + Number(t.amount || 0), 0);
  const toPay = allTx.filter((t: any) => t.type === 'expense' && t.status === 'pending').reduce((acc: number, t: any) => acc + Number(t.amount || 0), 0);

  // Calculate daily revenue for Mon-Sun of current week
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weeklyRevenue = [0, 1, 2, 3, 4, 5, 6].map(dayOffset => {
    const dayDateStr = format(addDays(weekStart, dayOffset), 'yyyy-MM-dd');
    return allTx
      .filter((t: any) => {
        const rawDate = t.date || t.transaction_date;
        if (!rawDate) return false;
        try {
          const tLocalDateStr = format(new Date(rawDate), 'yyyy-MM-dd');
          return t.type === 'income' && (t.status === 'completed' || !t.status) && tLocalDateStr === dayDateStr;
        } catch (e) {
          return false;
        }
      })
      .reduce((acc: number, t: any) => acc + Number(t.amount || 0), 0);
  });

  // New clients created in month
  const newClientsCount = (allClientsData || []).filter((c: any) => c.created_at && c.created_at >= startOfMonthStr).length;

  // Next upcoming appointments from now onwards
  const upcomingAppointments = upcomingAppointmentsData || [];
  const nextAppointment = upcomingAppointments.length > 0 ? upcomingAppointments[0] : null;

  const attendedCount = appointmentsData?.filter(a => a.status === 'completed' || a.status === 'confirmed').length || 0;

  return (
    <StitchDashboardClient
      profile={profile}
      company={companyData}
      metrics={{
        todayAppointmentsCount: todayAppointments,
        attendedCount: attendedCount,
        predictedRevenue: todayRevenue,
        receivedRevenue: receivedRevenue,
        newClientsCount: newClientsCount,
        birthdaysCount: birthdaysThisMonth.length,
        inactiveClientsCount: inactiveClientsCount,
        criticalStockCount: criticalStockCount,
        pendingReviewsCount: pendingReviewsCount,
        maintenancesCount: upcomingMaintenancesCount
      }}
      financialSummary={{
        entries: entriesTotal,
        exits: exitsTotal,
        profit: netProfit,
        toReceive: toReceive,
        toPay: toPay
      }}
      weeklyRevenue={weeklyRevenue}
      nextAppointment={nextAppointment}
      upcomingAppointments={upcomingAppointments}
    />
  );
}
