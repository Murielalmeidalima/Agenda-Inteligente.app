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
  CalendarPlus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '@projeto/ui';
import { LogoImage } from '@/components/ui/Logo';
import Link from 'next/link';
import { format, isToday, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
    .select('company_id, role, approved, permissions')
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

  // Fetch Metrics
  const [
    { count: professionalsCount },
    { data: appointmentsData },
    { data: revenueData },
    { data: companyData },
    { data: allClientsData } // Fetching all clients to filter birthdays safely
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
      .select('id, full_name, phone, birth_date')
      .eq('company_id', COMPANY_ID)
      .not('birth_date', 'is', null)
  ]);

  // Calculate Predicted Revenue
  const todayRevenue = revenueData?.reduce((acc: number, curr: any) => {
    return acc + (curr.price_override || curr.procedures?.price || 0);
  }, 0) || 0;

  const todayAppointments = appointmentsData?.length || 0;
  
  // Safe Birthday Filtering
  const birthdaysToday = allClientsData?.filter(client => {
    if (!client.birth_date) return false;
    // birth_date format: YYYY-MM-DD
    return client.birth_date.endsWith(`-${monthDayStr}`);
  }) || [];

  // Appointments mapping
  const unconfirmedAppointments = appointmentsData?.filter(a => a.status === 'scheduled') || [];
  const confirmedAppointments = appointmentsData?.filter(a => a.status === 'confirmed') || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'no_show': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-amber-100 text-amber-800 border-amber-200'; // scheduled (aguardando)
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-3 h-3 mr-1" />;
      case 'confirmed': return <Clock3 className="w-3 h-3 mr-1" />;
      case 'cancelled': return <XCircle className="w-3 h-3 mr-1" />;
      default: return <Clock className="w-3 h-3 mr-1" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Aguardando';
      case 'confirmed': return 'Confirmado';
      case 'completed': return 'Finalizado';
      case 'cancelled': return 'Cancelado';
      case 'no_show': return 'Faltou';
      default: return status;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      {/* Header com Branding */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-gradient-to-br from-[#FAF8F5] via-[#EFE5D3] to-[#DFD0B8] p-10 rounded-[2.5rem] shadow-xl border border-[#E5DBC7] shadow-slate-200/50 relative overflow-hidden group">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/15 rounded-full blur-[80px] -mr-32 -mt-32 transition-all duration-700 group-hover:bg-[#D4AF37]/25" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/40 rounded-full blur-[60px] -ml-32 -mb-32" />
        
        <div className="flex items-center gap-8 relative z-10">
          <div className="relative z-10 flex items-center justify-center p-1 bg-white/40 rounded-[2.2rem] backdrop-blur-md border border-white/60 shadow-sm">
            <LogoImage 
              size={96} 
              src={companyData?.logo_url} 
              fallbackText={getInitials(companyData?.name)}
              className="bg-white rounded-[2rem] overflow-hidden shadow-inner w-24 h-24 md:w-28 md:h-28"
            />
          </div>
          <div>
            <h2 className="text-3xl md:text-4xl font-black text-[#2C2825] tracking-tight font-serif mb-2">
              Bom dia, {profile?.role === 'admin' ? 'Gestor' : 'Profissional'}
            </h2>
            <p className="text-[#6A645C] font-semibold flex items-center gap-2 text-sm uppercase tracking-widest">
              <CalendarCheck2 className="w-4 h-4 text-[#B89855]" />
              Resumo de {format(today, "EEEE, d 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
        </div>
      </div>

      {/* Grid de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link href="/dashboard/schedule" className="block group h-full">
          <Card className="bg-white border-[#E5E0D8] rounded-[2rem] hover:border-amber-300 transition-all duration-500 hover:shadow-2xl hover:shadow-amber-500/10 hover:-translate-y-2 cursor-pointer h-full relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/5 rounded-full blur-2xl group-hover:bg-amber-400/20 transition-colors" />
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-[10px] font-black text-[#8A847C] uppercase tracking-widest">
                Agendamentos Hoje
              </CardTitle>
              <div className="p-3 bg-amber-50 rounded-2xl group-hover:bg-amber-500 group-hover:text-white transition-all duration-500 shadow-sm group-hover:scale-110">
                <CalendarCheck2 className="h-5 w-5 text-amber-600 group-hover:text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-black text-[#2C2825] tracking-tighter">{todayAppointments}</div>
              <p className="text-[10px] text-[#8A847C] mt-3 uppercase font-black tracking-widest flex items-center">
                <span className="text-amber-600 mr-1.5 font-bold bg-amber-100 px-2 py-0.5 rounded-md">{unconfirmedAppointments.length}</span> aguardando
              </p>
            </CardContent>
          </Card>
        </Link>

        {profile?.role === 'admin' && (
          <Link href="/dashboard/finance" className="block group h-full">
            <Card className="bg-white border-[#E5E0D8] rounded-[2rem] hover:border-emerald-300 transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-2 cursor-pointer h-full relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/5 rounded-full blur-2xl group-hover:bg-emerald-400/20 transition-colors" />
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="text-[10px] font-black text-[#8A847C] uppercase tracking-widest">
                  Faturamento Previsto
                </CardTitle>
                <div className="p-3 bg-emerald-50 rounded-2xl group-hover:bg-emerald-500 group-hover:text-white transition-all duration-500 shadow-sm group-hover:scale-110">
                  <TrendingUp className="h-5 w-5 text-emerald-600 group-hover:text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-black text-[#2C2825] tracking-tighter truncate">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(todayRevenue)}
                </div>
                <p className="text-[10px] text-[#8A847C] mt-3 uppercase font-black tracking-widest">
                  Serviços de hoje
                </p>
              </CardContent>
            </Card>
          </Link>
        )}

        <Link href="/dashboard/clients" className="block group h-full">
          <Card className="bg-white border-[#E5E0D8] rounded-[2rem] hover:border-blue-300 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-2 cursor-pointer h-full relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/5 rounded-full blur-2xl group-hover:bg-blue-400/20 transition-colors" />
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-[10px] font-black text-[#8A847C] uppercase tracking-widest">
                Aniversariantes
              </CardTitle>
              <div className="p-3 bg-blue-50 rounded-2xl group-hover:bg-blue-500 group-hover:text-white transition-all duration-500 shadow-sm group-hover:scale-110">
                <Cake className="h-5 w-5 text-blue-600 group-hover:text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-black text-[#2C2825] tracking-tighter">{birthdaysToday.length}</div>
              <p className="text-[10px] text-[#8A847C] mt-3 uppercase font-black tracking-widest">
                Clientes apagando velinhas
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/settings" className="block group h-full">
          <Card className="bg-white border-[#E5E0D8] rounded-[2rem] hover:border-purple-300 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-2 cursor-pointer h-full relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-400/5 rounded-full blur-2xl group-hover:bg-purple-400/20 transition-colors" />
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-[10px] font-black text-[#8A847C] uppercase tracking-widest">
                Equipe
              </CardTitle>
              <div className="p-3 bg-purple-50 rounded-2xl group-hover:bg-purple-500 group-hover:text-white transition-all duration-500 shadow-sm group-hover:scale-110">
                <Users className="h-5 w-5 text-purple-600 group-hover:text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-black text-[#2C2825] tracking-tighter">{professionalsCount || 0}</div>
              <p className="text-[10px] text-[#8A847C] mt-3 uppercase font-black tracking-widest">
                Profissionais ativos
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Lado Esquerdo: Timeline (Ocupa 2/3) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between pl-2">
            <h3 className="text-2xl font-black text-[#2C2825] tracking-tighter">Timeline de Hoje</h3>
            <Link href="/dashboard/schedule">
              <Button variant="outline" className="h-10 rounded-xl font-bold border-[#E5E0D8] text-[#5C5855] hover:bg-[#FAF9F6]">
                Ver Agenda
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          <Card className="shadow-sm border-[#E5E0D8] rounded-[2rem] overflow-hidden bg-white">
            <CardContent className="p-6">
              {appointmentsData && appointmentsData.length > 0 ? (
                <div className="relative pl-6 sm:pl-8">
                  {/* Linha vertical conectando os eventos da timeline */}
                  <div className="absolute left-10 sm:left-12 top-6 bottom-6 w-0.5 bg-[#E5E0D8] rounded-full" />
                  
                  <div className="space-y-8">
                    {appointmentsData.map((apt: any, idx: number) => {
                      const aptStart = parseISO(apt.start_time);
                      const isPast = aptStart < new Date() && apt.status !== 'completed';
                      
                      return (
                        <div key={apt.id} className="relative flex flex-col sm:flex-row gap-6 items-start group">
                          {/* Bolinha do tempo */}
                          <div className="absolute -left-10 sm:-left-8 top-1.5 w-4 h-4 rounded-full bg-white border-4 border-[#D4AF37] shadow-[0_0_0_4px_white] z-10 group-hover:scale-125 transition-transform" />
                          
                          <div className="flex flex-col min-w-[70px] mt-1">
                            <span className="text-lg font-black text-[#2C2825]">{format(aptStart, 'HH:mm')}</span>
                            <span className="text-[10px] font-bold text-[#8A847C] uppercase tracking-widest">{apt.procedures?.duration || 0} min</span>
                          </div>
                          
                          <div className="flex-1 bg-[#FAF9F6] p-5 rounded-3xl border border-[#E5E0D8] group-hover:border-[#D4AF37]/30 group-hover:bg-[#D4AF37]/5 transition-colors w-full">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                              <div>
                                <h4 className="font-black text-[#2C2825] text-lg mb-1 flex items-center gap-2">
                                  {apt.clients?.full_name || 'Cliente Removido'}
                                </h4>
                                <p className="text-sm text-[#8A847C] font-semibold flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                                  {apt.procedures?.name || 'Procedimento não especificado'}
                                </p>
                              </div>
                              <Badge className={`border px-3 py-1 uppercase tracking-widest text-[9px] font-black rounded-lg shadow-sm ${getStatusColor(apt.status)}`}>
                                <span className="flex items-center">
                                  {getStatusIcon(apt.status)}
                                  {getStatusText(apt.status)}
                                </span>
                              </Badge>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 mt-5 pt-4 border-t border-[#E5E0D8]/60 shrink-0">
                              {apt.status === 'scheduled' && apt.clients?.phone && (
                                <Link href={`https://wa.me/${apt.clients.phone.replace(/\D/g, '')}?text=Olá! Lembramos da sua consulta hoje às ${format(aptStart, 'HH:mm')}.`} target="_blank">
                                  <Button size="sm" className="bg-[#25D366]/10 text-[#128C7E] hover:bg-[#25D366] hover:text-white h-9 rounded-xl font-bold transition-colors">
                                    <MessageCircle className="w-4 h-4 mr-2" />
                                    Confirmar no Zap
                                  </Button>
                                </Link>
                              )}
                              <Link href={`/dashboard/clients/${apt.client_id}`}>
                                <Button variant="ghost" size="sm" className="h-9 rounded-xl font-bold text-[#8A847C] hover:text-[#5C5855]">
                                  Ver Ficha do Cliente
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-16 text-center flex flex-col items-center justify-center">
                  <div className="w-24 h-24 bg-[#FAF9F6] rounded-[2rem] flex items-center justify-center mb-6 shadow-inner border border-[#E5E0D8]">
                    <CalendarCheck2 className="w-10 h-10 text-[#D4AF37] opacity-60" />
                  </div>
                  <h3 className="text-2xl font-black text-[#2C2825] mb-2">Nenhum agendamento para hoje</h3>
                  <p className="text-[#8A847C] max-w-sm">Aproveite para organizar a clínica, responder mensagens ou planejar suas ações de marketing da semana.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Lado Direito: Alertas e Ações (Ocupa 1/3) */}
        <div className="space-y-6">
          <h3 className="text-2xl font-black text-[#2C2825] tracking-tighter pl-2">Radar da Clínica</h3>

          <div className="space-y-4">
            {/* Alerta de Confirmações Pendentes */}
            {unconfirmedAppointments.length > 0 && (
              <Card className="border-amber-200 bg-amber-50 rounded-[2rem] shadow-sm relative overflow-hidden group">
                <div className="absolute -left-4 -top-4 w-20 h-20 bg-amber-400/20 rounded-full blur-xl group-hover:bg-amber-400/30 transition-colors" />
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 relative z-10">
                    <div className="p-3 bg-amber-100/80 rounded-2xl text-amber-600 mt-1 shrink-0 border border-amber-200">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-black text-amber-900 mb-1 text-lg leading-tight">Aguardando Confirmação</h4>
                      <p className="text-sm text-amber-800/80 mb-4 font-medium">
                        Você tem <strong className="text-amber-600">{unconfirmedAppointments.length} agendamentos</strong> para confirmar hoje.
                      </p>
                      <Link href="/dashboard/communications">
                        <Button className="w-full h-10 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold shadow-md shadow-amber-500/20">
                          Ir para Central
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Aniversariantes */}
            {birthdaysToday.length > 0 && (
              <Card className="border-blue-200 bg-blue-50 rounded-[2rem] shadow-sm relative overflow-hidden group">
                <div className="absolute -left-4 -top-4 w-20 h-20 bg-blue-400/20 rounded-full blur-xl group-hover:bg-blue-400/30 transition-colors" />
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 relative z-10">
                    <div className="p-3 bg-blue-100/80 rounded-2xl text-blue-600 mt-1 shrink-0 border border-blue-200">
                      <Cake className="w-6 h-6" />
                    </div>
                    <div className="w-full">
                      <h4 className="font-black text-blue-900 mb-1 text-lg leading-tight">Festa na Clínica!</h4>
                      <p className="text-sm text-blue-800/80 font-medium mb-4">
                        Temos {birthdaysToday.length} cliente{birthdaysToday.length > 1 ? 's fazendo' : ' fazendo'} aniversário.
                      </p>
                      <div className="space-y-2 mb-4">
                        {birthdaysToday.slice(0, 3).map(client => (
                          <div key={client.id} className="flex items-center justify-between bg-white p-2.5 rounded-xl text-sm border border-blue-100/50 shadow-sm">
                            <span className="font-bold text-blue-900 truncate pr-2 flex-1">{client.full_name}</span>
                            {client.phone && (
                              <Link href={`https://wa.me/${client.phone.replace(/\D/g, '')}?text=Feliz aniversário, ${client.full_name}! A clínica deseja muitas felicidades e um dia excelente!`} target="_blank">
                                <Button size="icon" className="h-8 w-8 bg-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-colors">
                                  <MessageCircle className="w-4 h-4" />
                                </Button>
                              </Link>
                            )}
                          </div>
                        ))}
                      </div>
                      <Link href="/dashboard/clients">
                        <Button variant="outline" className="w-full h-10 border-blue-200 text-blue-700 hover:bg-blue-100 rounded-xl font-bold bg-white/50">
                          Ver Todos
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* No alerts fallback */}
            {unconfirmedAppointments.length === 0 && birthdaysToday.length === 0 && (
              <Card className="border-[#E5E0D8] shadow-sm border-dashed bg-white rounded-[2rem]">
                <CardContent className="p-10 text-center flex flex-col items-center">
                  <div className="bg-emerald-50 p-4 rounded-3xl text-emerald-500 mb-4 border border-emerald-100">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h4 className="font-black text-xl text-[#2C2825] mb-2">Tudo em ordem</h4>
                  <p className="text-sm text-[#8A847C] max-w-[200px]">Sem pendências ou alertas urgentes por agora.</p>
                </CardContent>
              </Card>
            )}

            {/* Espaço para Novidades */}
            <Card className="bg-[#FAF9F6] border-[#E5E0D8] shadow-sm mt-4 overflow-hidden relative group rounded-[2rem]">
              <CardContent className="p-6">
                <h4 className="font-black text-[#2C2825] text-lg mb-2 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-[#D4AF37]" />
                  Visão Geral
                </h4>
                <p className="text-sm text-[#8A847C] font-medium mb-5">
                  Mergulhe fundo nos dados de crescimento da clínica para traçar as próximas metas.
                </p>
                <Link href="/dashboard/analytics">
                  <Button className="w-full h-11 bg-slate-900 hover:bg-black text-white rounded-xl font-bold shadow-xl shadow-slate-900/10">
                    Acessar Relatórios
                  </Button>
                </Link>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
}
