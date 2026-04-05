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
    .select('company_id, role, approved')
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
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-card p-8 rounded-3xl border border-border shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 transition-colors group-hover:bg-primary/10" />
        
        <div className="flex items-center gap-6 relative z-10">
          <div className="relative z-10 flex items-center justify-center">
            <LogoImage 
              size={60} 
              src={companyData?.logo_url} 
              className="bg-muted rounded-2xl border border-border overflow-hidden shadow-inner w-20 h-20 md:w-24 md:h-24"
            />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-foreground tracking-tight">
              Bom dia, {profile?.role === 'admin' ? 'Gestor' : 'Profissional'}
            </h2>
            <p className="text-muted-foreground mt-1 font-medium flex items-center gap-2">
              <CalendarCheck2 className="w-4 h-4" />
              Resumo diário de {format(today, "EEEE, d 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
        </div>
        

      </div>

      {/* Grid de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link href="/dashboard/schedule" className="block group">
          <Card className="bg-card border-border hover:border-amber-200 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/5 group-hover:scale-[1.02] active:scale-95 cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                Agendamentos Hoje
              </CardTitle>
              <div className="p-2 bg-amber-50 rounded-xl group-hover:bg-amber-500 group-hover:text-white transition-all duration-300 border border-amber-100/50 group-hover:border-amber-400 shadow-sm">
                <CalendarCheck2 className="h-4 w-4 text-amber-600 group-hover:text-white transition-colors" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-foreground font-serif tracking-tighter">{todayAppointments}</div>
              <p className="text-[10px] text-muted-foreground mt-2 uppercase font-black tracking-widest flex items-center">
                <span className="text-amber-600 mr-1">{unconfirmedAppointments.length}</span> aguardando confirmação
              </p>
            </CardContent>
          </Card>
        </Link>

        {profile?.role === 'admin' && (
          <Link href="/dashboard/finance" className="block group">
            <Card className="bg-card border-border hover:border-emerald-200 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/5 group-hover:scale-[1.02] active:scale-95 cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  Faturamento Projetado
                </CardTitle>
                <div className="p-2 bg-emerald-50 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 border border-emerald-100/50 group-hover:border-emerald-500 shadow-sm">
                  <TrendingUp className="h-4 w-4 text-emerald-600 group-hover:text-white transition-colors" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-foreground font-serif tracking-tighter">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(todayRevenue)}
                </div>
                <p className="text-[10px] text-muted-foreground mt-2 uppercase font-black tracking-widest">
                  Com base nos serviços de hoje
                </p>
              </CardContent>
            </Card>
          </Link>
        )}

        <Link href="/dashboard/clients" className="block group">
          <Card className="bg-card border-border hover:border-blue-200 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/5 group-hover:scale-[1.02] active:scale-95 cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                Aniversariantes
              </CardTitle>
              <div className="p-2 bg-blue-50 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 border border-blue-100/50 group-hover:border-blue-500 shadow-sm">
                <Cake className="h-4 w-4 text-blue-600 group-hover:text-white transition-colors" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-foreground font-serif tracking-tighter">{birthdaysToday.length}</div>
              <p className="text-[10px] text-muted-foreground mt-2 uppercase font-black tracking-widest flex items-center">
                Clientes fazendo aniversário hoje
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/settings" className="block group">
          <Card className="bg-card border-border hover:border-purple-200 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/5 group-hover:scale-[1.02] active:scale-95 cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                Profissionais Ativos
              </CardTitle>
              <div className="p-2 bg-purple-50 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-all duration-300 border border-purple-100/50 group-hover:border-purple-500 shadow-sm">
                <Users className="h-4 w-4 text-purple-600 group-hover:text-white transition-colors" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-foreground font-serif tracking-tighter">{professionalsCount || 0}</div>
              <p className="text-[10px] text-muted-foreground mt-2 uppercase font-black tracking-widest">
                Equipe cadastrada no sistema
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Lado Esquerdo: Timeline (Ocupa 2/3) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold font-serif text-foreground">Timeline de Hoje</h3>
            <Link href="/dashboard/schedule">
              <Button variant="outline" size="sm">
                Ver Agenda Completa
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          <Card className="shadow-sm border-border">
            <CardContent className="p-0">
              {appointmentsData && appointmentsData.length > 0 ? (
                <div className="divide-y divide-border">
                  {appointmentsData.map((apt: any) => {
                    const aptStart = parseISO(apt.start_time);
                    const isPast = aptStart < new Date() && apt.status !== 'completed';
                    
                    return (
                      <div key={apt.id} className="p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center hover:bg-muted/30 transition-colors">
                        <div className="flex flex-col items-center justify-center min-w-[80px] bg-muted/50 p-2 rounded-xl text-center">
                          <span className="text-sm font-black text-foreground">{format(aptStart, 'HH:mm')}</span>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-bold text-foreground text-lg mb-1 flex items-center gap-2">
                                {apt.clients?.full_name || 'Cliente Removido'}
                              </h4>
                              <p className="text-sm text-muted-foreground font-medium">
                                {apt.procedures?.name || 'Procedimento não especificado'} • {apt.procedures?.duration || 0} min
                              </p>
                            </div>
                            <Badge variant="outline" className={`border px-2 py-0.5 mt-1 sm:mt-0 shadow-sm ${getStatusColor(apt.status)}`}>
                              <span className="flex items-center">
                                {getStatusIcon(apt.status)}
                                {getStatusText(apt.status)}
                              </span>
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mt-4 sm:mt-0 shrink-0">
                          {apt.status === 'scheduled' && apt.clients?.phone && (
                            <Link href={`https://wa.me/${apt.clients.phone.replace(/\D/g, '')}?text=Olá! Lembramos da sua consulta hoje às ${format(aptStart, 'HH:mm')}.`} target="_blank">
                              <Button variant="outline" size="sm" className="border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white">
                                <MessageCircle className="w-4 h-4 mr-2" />
                                Confirmar
                              </Button>
                            </Link>
                          )}
                          <Link href={`/dashboard/clients/${apt.client_id}`}>
                            <Button variant="ghost" size="sm">
                              Ver Ficha
                            </Button>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <CalendarCheck2 className="w-8 h-8 opacity-50" />
                  </div>
                  <p className="text-lg font-medium">Nenhum agendamento para hoje</p>
                  <p className="text-sm mt-1">Aproveite para organizar a clínica ou fazer marketing.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Lado Direito: Alertas e Ações (Ocupa 1/3) */}
        <div className="space-y-6">
          <h3 className="text-2xl font-bold font-serif text-foreground">Alertas Rápidos</h3>

          <div className="space-y-4">
            {/* Alerta de Confirmações Pendentes */}
            {unconfirmedAppointments.length > 0 && (
              <Card className="border-amber-200 bg-amber-50/50 shadow-sm relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400" />
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-amber-100 rounded-full text-amber-600 mt-1">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-amber-900 mb-1">Confirmações Pendentes</h4>
                      <p className="text-sm text-amber-800/80 mb-3 leading-relaxed">
                        Existem {unconfirmedAppointments.length} agendamentos hoje aguardando confirmação.
                      </p>
                      <Link href="/dashboard/communications">
                        <Button variant="outline" size="sm" className="bg-white border-amber-200 text-amber-700 hover:bg-amber-50">
                          Acessar Central
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Aniversariantes */}
            {birthdaysToday.length > 0 && (
              <Card className="border-blue-200 bg-blue-50/50 shadow-sm relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-400" />
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-blue-100 rounded-full text-blue-600 mt-1">
                      <Cake className="w-5 h-5" />
                    </div>
                    <div className="w-full">
                      <h4 className="font-bold text-blue-900 mb-1">Aniversariantes do Dia</h4>
                      <p className="text-sm text-blue-800/80 leading-relaxed mb-3">
                        {birthdaysToday.length} cliente{birthdaysToday.length > 1 ? 's fazem' : ' faz'} aniversário hoje! Deseje parabéns para fidelizar.
                      </p>
                      <div className="space-y-2 mb-3">
                        {birthdaysToday.slice(0, 3).map(client => (
                          <div key={client.id} className="flex items-center justify-between bg-white/60 p-2 rounded-lg text-sm border border-blue-100">
                            <span className="font-medium text-blue-900 truncate pr-2 flex-1">{client.full_name}</span>
                            {client.phone && (
                              <Link href={`https://wa.me/${client.phone.replace(/\D/g, '')}?text=Feliz aniversário, ${client.full_name}! A clínica deseja muitas felicidades e um dia excelente!`} target="_blank">
                                <Button size="icon" variant="ghost" className="h-6 w-6 text-blue-600 hover:bg-blue-100 hover:text-blue-700">
                                  <MessageCircle className="w-4 h-4" />
                                </Button>
                              </Link>
                            )}
                          </div>
                        ))}
                        {birthdaysToday.length > 3 && (
                          <p className="text-xs text-blue-700 font-medium text-center pt-1">+ {birthdaysToday.length - 3} outros</p>
                        )}
                      </div>
                      <Link href="/dashboard/clients">
                        <Button variant="outline" size="sm" className="w-full bg-white border-blue-200 text-blue-700 hover:bg-blue-50">
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
              <Card className="border-border shadow-sm border-dashed bg-muted/10">
                <CardContent className="p-8 text-center flex flex-col items-center">
                  <div className="bg-emerald-100 p-3 rounded-full text-emerald-600 mb-3">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-foreground mb-1">Tudo em ordem</h4>
                  <p className="text-sm text-muted-foreground">Não há pendências de confirmação ou aniversariantes hoje.</p>
                </CardContent>
              </Card>
            )}

            {/* Espaço para Novidades (Placeholder para Marketing/Planejamento) */}
            <Card className="bg-muted/30 border-border shadow-sm mt-4 overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent z-0" />
              <CardContent className="p-6 relative z-10">
                <h4 className="font-bold text-foreground mb-2 flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Performance da Semana
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Acompanhe os resultados da clínica e veja pontos de melhoria na seção avançada de relatórios.
                </p>
                <Link href="/dashboard/analytics">
                  <Button variant="primary" size="sm" className="w-full shadow-sm">
                    Ver Relatórios Completos
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
