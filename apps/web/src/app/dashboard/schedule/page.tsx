import { createServerClient } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ScheduleCalendarClient from './schedule-calendar-client';

export const dynamic = 'force-dynamic';

export default async function SchedulePage() {
  const supabase = createServerClient();
  
  // Authentication Check
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Fetch User Profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, company_id, role, approved')
    .eq('id', user.id)
    .single();

  if (profileError || !profile || !profile.company_id) {
    console.error('Profile error:', profileError);
    // Handle case where user has no profile or company
    return (
       <div className="flex h-screen items-center justify-center p-8 text-center">
          <div>
            <h2 className="text-xl font-bold mb-2">Perfil não configurado</h2>
            <p className="text-neutral-500">Entre em contato com o suporte ou refaça o login.</p>
          </div>
       </div>
    );
  }

  if (!profile.approved) {
    redirect('/auth/pending'); // página dedicada — não causa loop com middleware
  }


  // Buscar Agendamentos, Clientes e Procedimentos (Join)
  const { data: appointments, error } = await supabase
    .from('appointments')
    .select(`
      *,
      clients!inner(full_name, birth_date),
      procedures!inner(name, color, duration_minutes, price, maintenance_required, maintenance_days_limit, maintenance_period_unit, maintenance_duration_minutes)
    `)
    .eq('company_id', profile.company_id);

  if (error) {
    console.error('Error fetching appointments:', JSON.stringify(error, null, 2));
    return <div className="p-8 text-red-600">Erro ao carregar agendamentos</div>;
  }

  const appIds = appointments?.map(a => a.id) || [];
  let transactions: any[] = [];
  
  if (appIds.length > 0) {
    const { data: trans } = await supabase
      .from('transactions')
      .select('appointment_id, amount, status, type, payment_method')
      .in('appointment_id', appIds)
      .eq('type', 'income');
      
    transactions = trans || [];
  }

  // Pre-process appointments to include payment status
  const hydratedAppointments = appointments?.map(app => {
    const linkedTrans = transactions.filter(t => t.appointment_id === app.id);
    const paidConfirmed = linkedTrans
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + Number(t.amount), 0);
      
    const procedure = Array.isArray(app.procedures) ? app.procedures[0] : app.procedures;
    const totalPrice = Number(app.price_override || procedure?.price || 0);
    
    let paymentStatus = 'unpaid';
    if (paidConfirmed >= totalPrice && totalPrice > 0) paymentStatus = 'paid';
    else if (paidConfirmed > 0) paymentStatus = 'partial';
    
    // Pegar o method da transação mais recente ou primeira
    const paymentMethod = linkedTrans[0]?.payment_method || null;
    
    return {
      ...app,
      paymentStatus,
      paymentMethod,
      paidConfirmed,
      totalPrice
    };
  }) || [];

  // Buscar Clientes e Procedimentos para os formulários de criação
  const { data: clients, error: clientsError } = await supabase
    .from('clients')
    .select('id, full_name, birth_date, phone')
    .eq('company_id', profile.company_id)
    .order('full_name');

  if (clientsError) console.error('Error fetching clients:', clientsError);

  const { data: procedures, error: proceduresError } = await supabase
    .from('procedures')
    .select('id, name, duration_minutes, price, maintenance_required, maintenance_days_limit, maintenance_period_unit, maintenance_duration_minutes')
    .eq('company_id', profile.company_id)
    .order('name');

  if (proceduresError) console.error('Error fetching procedures:', proceduresError);

  // Buscar Profissionais (Peris com role 'professional' ou 'admin')
  const { data: professionals, error: professionalsError } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('company_id', profile.company_id)
    .in('role', ['admin', 'professional'])
    .order('full_name');

  if (professionalsError) console.error('Error fetching professionals:', professionalsError);

  return (
    <ScheduleCalendarClient 
      initialAppointments={hydratedAppointments as any || []}
      clients={clients || []}
      procedures={procedures || []}
      professionals={professionals || []}
      companyId={profile.company_id}
    />
  );
}
