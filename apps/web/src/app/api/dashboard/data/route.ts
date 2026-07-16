import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/auth';
import { format, startOfWeek, addDays } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createServerClient();
    
    // Check Authentication
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Get User Profile & Company ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id, role, approved, full_name')
      .eq('id', user.id)
      .single();

    if (!profile || !profile.company_id || !profile.approved) {
      return NextResponse.json({ error: 'Acesso negado ou clínica não configurada' }, { status: 403 });
    }

    const COMPANY_ID = profile.company_id;

    // Helper to convert date to Brazil timezone
    const toBrazilDate = (d: Date | string | number) => {
      return new Date(new Date(d).toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    };

    // Dates for querying
    const today = toBrazilDate(new Date());
    const todayStr = format(today, 'yyyy-MM-dd');
    const monthDayStr = format(today, 'MM-dd');
    const currentMonthStr = format(today, 'MM');
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfMonthStr = format(startOfMonth, 'yyyy-MM-dd') + 'T00:00:00-03:00';
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const endOfMonthStr = format(endOfMonth, 'yyyy-MM-dd') + 'T23:59:59-03:00';

    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekStartStr = format(weekStart, 'yyyy-MM-dd') + 'T00:00:00-03:00';
    const weekEndStr = format(addDays(weekStart, 6), 'yyyy-MM-dd') + 'T23:59:59-03:00';

    // Fetch Metrics in parallel
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
      { data: upcomingAppointmentsData },
      { data: weeklyAppointmentsData },
      { data: proceduresData }
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
        .gte('start_time', todayStr + 'T00:00:00-03:00')
        .lte('start_time', todayStr + 'T23:59:59-03:00')
        .order('start_time', { ascending: true }),

      supabase
        .from('appointments')
        .select(`
          id,
          price_override,
          status,
          procedures(price)
        `)
        .eq('company_id', COMPANY_ID)
        .gte('start_time', todayStr + 'T00:00:00-03:00')
        .lte('start_time', todayStr + 'T23:59:59-03:00')
        .neq('status', 'cancelled'),

      supabase
        .from('companies')
        .select('name, logo_url')
        .eq('id', COMPANY_ID)
        .single(),

      supabase
        .from('clients')
        .select('id, full_name, phone, birth_date, instagram, created_at')
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
        .gte('start_time', todayStr + 'T00:00:00-03:00')
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
        .select('id, amount, type, status, date, transaction_date, appointment_id')
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
        .limit(10),

      supabase
        .from('appointments')
        .select(`
          id,
          procedure_id,
          additional_procedure_ids,
          procedures(name)
        `)
        .eq('company_id', COMPANY_ID)
        .gte('start_time', weekStartStr)
        .lte('start_time', weekEndStr)
        .neq('status', 'cancelled'),

      supabase
        .from('procedures')
        .select('id, name')
        .eq('company_id', COMPANY_ID)
    ]);

    // Calculate Predicted Revenue (Today's unpaid appointments total)
    const todayRevenue = (revenueData || []).reduce((acc: number, curr: any) => {
      const linkedTrans = (transactionsData || []).filter((t: any) => t.appointment_id === curr.id);
      const paidConfirmed = linkedTrans
        .filter((t: any) => t.status === 'completed' || !t.status)
        .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);
        
      const totalPrice = Number(curr.price_override || curr.procedures?.price || 0);
      const pendingValue = Math.max(0, totalPrice - paidConfirmed);
      return acc + pendingValue;
    }, 0);

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
        const tLocalDateStr = format(toBrazilDate(rawDate), 'yyyy-MM-dd');
        return t.type === 'income' && 
               (t.status === 'completed' || !t.status) && 
               tLocalDateStr >= startOfMonthStr.slice(0, 10) && 
               tLocalDateStr <= endOfMonthStr.slice(0, 10);
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
    const weeklyRevenue = [0, 1, 2, 3, 4, 5, 6].map(dayOffset => {
      const dayDateStr = format(addDays(weekStart, dayOffset), 'yyyy-MM-dd');
      return allTx
        .filter((t: any) => {
          const rawDate = t.date || t.transaction_date;
          if (!rawDate) return false;
          try {
            const tLocalDateStr = format(toBrazilDate(rawDate), 'yyyy-MM-dd');
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

    // Calculate popular procedures
    const weekAppointments = weeklyAppointmentsData || [];
    const proceduresList = proceduresData || [];
    const proceduresMap = new Map(proceduresList.map((p: any) => [p.id, p.name]));

    const procCountMap: Record<string, number> = {};
    let totalProcedureCount = 0;

    weekAppointments.forEach((a: any) => {
      const name = a.procedures?.name || (a.procedure_id ? proceduresMap.get(a.procedure_id) : null) || 'Desconhecido';
      procCountMap[name] = (procCountMap[name] || 0) + 1;
      totalProcedureCount++;

      if (Array.isArray(a.additional_procedure_ids)) {
        a.additional_procedure_ids.forEach((id: string) => {
          const extraName = proceduresMap.get(id);
          if (extraName) {
            procCountMap[extraName] = (procCountMap[extraName] || 0) + 1;
            totalProcedureCount++;
          }
        });
      }
    });

    const popularProcedures = Object.entries(procCountMap)
      .map(([name, count]) => {
        const percentage = totalProcedureCount > 0 ? Math.round((count / totalProcedureCount) * 100) : 0;
        return { name, count, percentage };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return NextResponse.json({
      success: true,
      profile,
      company: companyData,
      metrics: {
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
      },
      financialSummary: {
        entries: entriesTotal,
        exits: exitsTotal,
        profit: netProfit,
        toReceive: toReceive,
        toPay: toPay
      },
      weeklyRevenue,
      nextAppointment,
      upcomingAppointments,
      popularProcedures
    });

  } catch (error: any) {
    console.error('[Dashboard Data API] Critical Error:', error);
    return NextResponse.json({ error: error.message || 'Erro crítico ao obter dados.' }, { status: 500 });
  }
}
