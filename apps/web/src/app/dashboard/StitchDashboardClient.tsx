'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Calendar, 
  Clock, 
  Bell, 
  CalendarCheck, 
  UserCheck, 
  TrendingUp, 
  DollarSign, 
  UserPlus, 
  Cake, 
  UserX, 
  AlertTriangle, 
  Star, 
  Wrench, 
  ChevronRight, 
  ChevronLeft, 
  CreditCard, 
  Sparkles,
  Package,
  ShieldCheck,
  RotateCcw,
  Settings,
  MoreHorizontal,
  CheckCircle2
} from 'lucide-react';

interface StitchDashboardClientProps {
  profile: any;
  company: any;
  metrics: {
    todayAppointmentsCount: number;
    attendedCount: number;
    predictedRevenue: number;
    receivedRevenue: number;
    newClientsCount: number;
    birthdaysCount: number;
    inactiveClientsCount: number;
    criticalStockCount: number;
    pendingReviewsCount: number;
    maintenancesCount: number;
  };
  financialSummary: {
    entries: number;
    exits: number;
    profit: number;
    toReceive: number;
    toPay: number;
  };
  weeklyRevenue?: number[];
  nextAppointment: any | null;
  upcomingAppointments: any[];
  popularProcedures?: { name: string; count: number; percentage: number }[];
}

export function StitchDashboardClient({
  profile,
  company,
  metrics,
  financialSummary,
  weeklyRevenue = [0, 0, 0, 0, 0, 0, 0],
  nextAppointment,
  upcomingAppointments,
  popularProcedures = []
}: StitchDashboardClientProps) {
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDateStr, setCurrentDateStr] = useState<string>('');
  const [greeting, setGreeting] = useState<string>('Boa tarde');
  const [isCalendarExpanded, setIsCalendarExpanded] = useState(false);
  const [initialDay] = useState<number>(() => new Date().getDate());

  // Force-refresh server data on component mount to bypass Next.js client router caching
  useEffect(() => {
    router.refresh();
  }, [router]);

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();

      // Auto-reload at midnight rollover to keep dashboard dates accurate
      if (now.getDate() !== initialDay) {
        window.location.reload();
        return;
      }

      const hours = now.getHours();

      if (hours >= 5 && hours < 12) {
        setGreeting('Bom dia');
      } else if (hours >= 12 && hours < 18) {
        setGreeting('Boa tarde');
      } else {
        setGreeting('Boa noite');
      }

      setCurrentDateStr(format(now, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR }));
      setCurrentTime(format(now, 'HH:mm'));
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, [initialDay]);

  const userName = profile?.full_name 
    ? profile.full_name
    : (profile?.role === 'admin' ? 'Gestor' : 'Profissional');

  const userRoleTitle = profile?.role === 'admin' ? 'Diretora Clínica' : 'Profissional da Saúde';

  const formatMoney = (val: number) => {
    if (!val && val !== 0) return 'R$ 0';
    if (Math.abs(val) >= 1000) return `R$ ${(val / 1000).toFixed(1)}k`;
    return `R$ ${val.toLocaleString('pt-BR')}`;
  };

  const currentMonthYearName = format(new Date(), "MMMM 'de' yyyy", { locale: ptBR });

  // Regra Estrita: Notificação do início APENAS para agendamentos e pagamentos pendentes (sem estoque, manutenção ou avaliações)
  const hasPendingAppointments = metrics.todayAppointmentsCount > metrics.attendedCount;
  const hasPendingPayments = financialSummary.toPay > 0 || financialSummary.toReceive > 0;
  
  const urgentAlertsCount = (hasPendingAppointments ? 1 : 0) + (hasPendingPayments ? 1 : 0);

  // Find max value in weekly revenue to set bar height percentage
  const maxWeeklyVal = Math.max(...weeklyRevenue, 1);

  return (
    <div className="min-h-screen bg-[#F7F1E8] text-[#3D2C28] -m-6 p-6 sm:p-10 font-sans">
      {/* TopAppBar / Header (Glassmorphism Aesthetica Pro) */}
      <header className="sticky top-0 z-30 bg-[#FFF8F6]/80 backdrop-blur-md px-6 sm:px-10 py-6 border-b border-[#D1C5B5]/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 rounded-2xl mb-8 shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#3D2C28] tracking-tight">
            {greeting}, {userName}
          </h1>
          <div className="flex flex-wrap items-center gap-3 mt-1 text-xs sm:text-sm text-[#4E463A] uppercase tracking-wider font-semibold">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#C8A46B]" />
              {currentDateStr || 'Carregando data...'}
            </span>
            <span className="w-1 h-1 bg-[#D1C5B5] rounded-full hidden sm:inline-block" />
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#C8A46B]" />
              {currentTime || '00:00'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6 self-end md:self-auto">
          <Link href="/dashboard/communications" className="relative group">
            <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-[#D1C5B5]/30 hover:bg-[#FFF0ED] transition-all shadow-sm">
              <Bell className="w-5 h-5 text-[#4E463A]" />
              {urgentAlertsCount > 0 && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#BA1A1A] rounded-full border-2 border-white animate-pulse" />
              )}
            </button>
          </Link>
          <Link href="/dashboard/settings" className="flex items-center gap-3 pl-6 border-l border-[#D1C5B5]/30 group cursor-pointer">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-[#271814] leading-none group-hover:text-[#C8A46B] transition-colors">{userName}</p>
              <p className="text-xs text-[#4E463A] mt-1 font-medium">{userRoleTitle}</p>
            </div>
            <div className="w-12 h-12 rounded-full border-2 border-white overflow-hidden shadow-sm bg-[#C8A46B] flex items-center justify-center text-white font-bold text-lg group-hover:scale-105 transition-transform">
              {company?.logo_url ? (
                <img src={company.logo_url} alt={userName} className="w-full h-full object-cover" />
              ) : (
                userName.charAt(0)
              )}
            </div>
          </Link>
        </div>
      </header>

      <div className="space-y-10">
        {/* Metrics Grid (10 Cards - 2 Rows of 5) Cards com redirecionamento interativo */}
        <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {/* Row 1 */}
          <div 
            onClick={() => {
              setIsCalendarExpanded(true);
              setTimeout(() => {
                const el = document.getElementById('unified-next-appointment-card');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth' });
                }
              }, 50);
            }} 
            className="bg-white p-5 rounded-2xl shadow-sm border border-[#D1C5B5]/30 group hover:border-[#C8A46B]/50 transition-all cursor-pointer block"
          >
            <p className="text-xs font-semibold text-[#4E463A] uppercase tracking-wider mb-1">Agenda de Hoje</p>
            <div className="flex items-end justify-between">
              <h3 className="text-3xl font-bold text-[#3D2C28]">{metrics.todayAppointmentsCount}</h3>
              <CalendarCheck className="w-6 h-6 text-[#C8A46B] group-hover:scale-110 transition-transform" />
            </div>
          </div>

          <Link href="/dashboard/schedule" className="bg-white p-5 rounded-2xl shadow-sm border border-[#D1C5B5]/30 group hover:border-[#C8A46B]/50 transition-all cursor-pointer block">
            <p className="text-xs font-semibold text-[#4E463A] uppercase tracking-wider mb-1">Atendimentos</p>
            <div className="flex items-end justify-between">
              <h3 className="text-3xl font-bold text-[#3D2C28]">{metrics.attendedCount}</h3>
              <UserCheck className="w-6 h-6 text-[#C8A46B] group-hover:scale-110 transition-transform" />
            </div>
          </Link>

          <Link href="/dashboard/finance?tab=pending" className="bg-white p-5 rounded-2xl shadow-sm border border-[#D1C5B5]/30 group hover:border-[#C8A46B]/50 transition-all cursor-pointer block">
            <p className="text-xs font-semibold text-[#4E463A] uppercase tracking-wider mb-1">Receita Prevista</p>
            <div className="flex items-end justify-between">
              <h3 className="text-2xl sm:text-3xl font-bold text-[#3D2C28]">
                {formatMoney(metrics.predictedRevenue)}
              </h3>
              <TrendingUp className="w-6 h-6 text-[#C8A46B] group-hover:scale-110 transition-transform" />
            </div>
          </Link>

          <Link href="/dashboard/finance?tab=received" className="bg-white p-5 rounded-2xl shadow-sm border border-[#D1C5B5]/30 group hover:border-[#C8A46B]/50 transition-all cursor-pointer block">
            <p className="text-xs font-semibold text-[#4E463A] uppercase tracking-wider mb-1">Receita Recebida</p>
            <div className="flex items-end justify-between">
              <h3 className="text-2xl sm:text-3xl font-bold text-[#3D2C28]">
                {formatMoney(metrics.receivedRevenue)}
              </h3>
              <DollarSign className="w-6 h-6 text-[#755848] group-hover:scale-110 transition-transform" />
            </div>
          </Link>

          <Link href="/dashboard/clients" className="bg-white p-5 rounded-2xl shadow-sm border border-[#D1C5B5]/30 group hover:border-[#C8A46B]/50 transition-all cursor-pointer block">
            <p className="text-xs font-semibold text-[#4E463A] uppercase tracking-wider mb-1">Clientes Novos</p>
            <div className="flex items-end justify-between">
              <h3 className="text-3xl font-bold text-[#3D2C28]">{metrics.newClientsCount}</h3>
              <UserPlus className="w-6 h-6 text-[#C8A46B] group-hover:scale-110 transition-transform" />
            </div>
          </Link>

          {/* Row 2 */}
          <Link href="/dashboard/marketing?tab=birthday_campaign" className="bg-white p-5 rounded-2xl shadow-sm border border-[#D1C5B5]/30 group hover:border-[#C8A46B]/50 transition-all cursor-pointer block">
            <p className="text-xs font-semibold text-[#4E463A] uppercase tracking-wider mb-1">Aniversariantes</p>
            <div className="flex items-end justify-between">
              <h3 className="text-3xl font-bold text-[#3D2C28]">{metrics.birthdaysCount}</h3>
              <Cake className="w-6 h-6 text-[#D8B4A0] group-hover:scale-110 transition-transform" />
            </div>
          </Link>

          <Link href="/dashboard/marketing?tab=inactive" className="bg-white p-5 rounded-2xl shadow-sm border border-[#D1C5B5]/30 group hover:border-[#C8A46B]/50 transition-all cursor-pointer block">
            <p className="text-xs font-semibold text-[#4E463A] uppercase tracking-wider mb-1">Inativos</p>
            <div className="flex items-end justify-between">
              <h3 className="text-3xl font-bold text-[#3D2C28]">{metrics.inactiveClientsCount}</h3>
              <UserX className="w-6 h-6 text-[#807668] group-hover:scale-110 transition-transform" />
            </div>
          </Link>

          <Link href="/dashboard/inventory" className="bg-white p-5 rounded-2xl shadow-sm border border-[#D1C5B5]/30 group hover:border-[#C8A46B]/50 transition-all cursor-pointer block">
            <p className="text-xs font-semibold text-[#4E463A] uppercase tracking-wider mb-1">Estoque Crítico</p>
            <div className="flex items-end justify-between">
              <h3 className="text-3xl font-bold text-[#BA1A1A]">{metrics.criticalStockCount}</h3>
              <AlertTriangle className="w-6 h-6 text-[#BA1A1A] group-hover:scale-110 transition-transform" />
            </div>
          </Link>

          <Link href="/dashboard/marketing?tab=reviews" className="bg-white p-5 rounded-2xl shadow-sm border border-[#D1C5B5]/30 group hover:border-[#C8A46B]/50 transition-all cursor-pointer block">
            <p className="text-xs font-semibold text-[#4E463A] uppercase tracking-wider mb-1">Avaliações</p>
            <div className="flex items-end justify-between">
              <h3 className="text-3xl font-bold text-[#3D2C28]">{metrics.pendingReviewsCount}</h3>
              <Star className="w-6 h-6 text-[#C8A46B] group-hover:scale-110 transition-transform" />
            </div>
          </Link>

          <Link href="/dashboard/schedule?filter=maintenance" className="bg-white p-5 rounded-2xl shadow-sm border border-[#D1C5B5]/30 group hover:border-[#C8A46B]/50 transition-all cursor-pointer block">
            <p className="text-xs font-semibold text-[#4E463A] uppercase tracking-wider mb-1">Manutenções</p>
            <div className="flex items-end justify-between">
              <h3 className="text-3xl font-bold text-[#3D2C28]">{metrics.maintenancesCount}</h3>
              <Wrench className="w-6 h-6 text-[#C8A46B] group-hover:scale-110 transition-transform" />
            </div>
          </Link>
        </section>

        {/* Layout Split (12 Columns) */}
        <div className="grid grid-cols-12 gap-8">
          {/* Main Content Column (8 Cols) */}
          <div className="col-span-12 lg:col-span-8 space-y-8">
            {/* Goal Card (Sem redirecionamento) */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-[#D1C5B5]/30">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold text-[#3D2C28]">Meta de Faturamento</h3>
                  <p className="text-sm text-[#4E463A]">Progresso acumulado do mês atual</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-[#C8A46B]">
                    {metrics.predictedRevenue > 0 
                      ? `${Math.min(100, Math.round((financialSummary.entries / (metrics.predictedRevenue || 1)) * 100))}%` 
                      : '0%'}
                  </p>
                  <p className="text-xs font-semibold text-[#4E463A] uppercase">
                    {formatMoney(financialSummary.entries)} / {formatMoney(metrics.predictedRevenue)}
                  </p>
                </div>
              </div>
              <div className="w-full h-3 bg-[#FFF0ED] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#C8A46B] rounded-full transition-all duration-1000" 
                  style={{ 
                    width: `${metrics.predictedRevenue > 0 
                      ? Math.min(100, Math.round((financialSummary.entries / (metrics.predictedRevenue || 1)) * 100)) 
                      : 0}%` 
                  }}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8 pt-6 border-t border-[#D1C5B5]/20">
                <div>
                  <p className="text-xs font-semibold text-[#4E463A] uppercase mb-1">Realizado vs Previsto</p>
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-bold text-[#3D2C28]">
                      {formatMoney(financialSummary.entries)}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#4E463A] uppercase mb-1">Resultado Financeiro</p>
                  <div className="flex items-center gap-2 text-emerald-600">
                    <TrendingUp className="w-5 h-5" />
                    <span className="text-xl font-bold">{formatMoney(financialSummary.profit)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Unified Next Appointment & Upcoming Slots Card */}
            <div id="unified-next-appointment-card" className="bg-white rounded-2xl shadow-sm border border-[#D1C5B5]/30 overflow-hidden transition-all duration-300">
              <div className="bg-[#C8A46B]/10 px-6 sm:px-8 py-4 border-b border-[#C8A46B]/20 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#C8A46B]" />
                  <span className="text-xs font-bold text-[#765928] uppercase tracking-wider">Próximo Atendimento</span>
                </div>
                <div className="flex items-center gap-3">
                  {nextAppointment && (
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold uppercase">
                      {nextAppointment.status === 'confirmed' ? 'Confirmado' : 'Agendado'}
                    </span>
                  )}
                  <button
                    onClick={() => setIsCalendarExpanded(!isCalendarExpanded)}
                    className="text-xs font-bold text-[#C8A46B] hover:text-[#b5925a] flex items-center gap-1 transition-colors"
                  >
                    {isCalendarExpanded ? '✕ Ocultar Calendário' : '📅 Ver Próximos Horários'}
                  </button>
                </div>
              </div>

              {nextAppointment ? (
                <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-8">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#FED8C3] flex items-center justify-center text-[#795C4C] font-bold text-2xl shadow-inner flex-shrink-0">
                    {nextAppointment.clients?.full_name ? nextAppointment.clients.full_name.charAt(0) : '?'}
                  </div>
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 w-full">
                    <div>
                      <p className="text-[10px] font-bold text-[#8A847C] uppercase tracking-wider">Paciente</p>
                      <p className="text-base font-bold text-[#3D2C28] mt-0.5">{nextAppointment.clients?.full_name || 'Paciente'}</p>
                      <p className="text-xs text-[#5C5855] mt-0.5">{nextAppointment.clients?.phone || 'Sem telefone'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-[#8A847C] uppercase tracking-wider">Horário & Procedimento</p>
                      <p className="text-base font-bold text-[#3D2C28] mt-0.5">
                        {nextAppointment.start_time ? format(new Date(nextAppointment.start_time), 'HH:mm') : '--:--'}{' '}
                        <span className="text-[#8A847C] font-normal">—</span> {nextAppointment.procedures?.name || 'Procedimento'}
                      </p>
                      <p className="text-xs text-[#5C5855] mt-0.5">Duração: {nextAppointment.procedures?.duration_minutes || 30} min</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-[#8A847C] uppercase tracking-wider">Data do Atendimento</p>
                      <p className="text-base font-bold text-[#3D2C28] mt-0.5">
                        {nextAppointment.start_time ? format(new Date(nextAppointment.start_time), 'dd/MM/yyyy') : '--/--/----'}
                      </p>
                      <p className="text-xs text-[#5C5855] mt-0.5 capitalize">
                        {nextAppointment.start_time ? format(new Date(nextAppointment.start_time), 'EEEE', { locale: ptBR }) : ''}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-[#FFF8F6] rounded-2xl flex items-center justify-center mb-3 border border-[#D1C5B5]/30">
                    <Clock className="w-8 h-8 text-[#C8A46B] opacity-50" />
                  </div>
                  <p className="text-base font-bold text-[#3D2C28]">Nenhum próximo atendimento agendado</p>
                  <p className="text-xs text-[#4E463A] mt-1">Sua agenda não possui consultas ativas no momento.</p>
                </div>
              )}

              {/* Collapsible/Expandable Section */}
              {isCalendarExpanded && (
                <div className="border-t border-[#D1C5B5]/20 bg-[#FDFBF7]/50 p-6 sm:p-8 space-y-6 transition-all duration-300 animate-in fade-in slide-in-from-top-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Mini Calendar component */}
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-xs font-bold text-[#3D2C28] uppercase tracking-wider">Próximos Dias</span>
                        <span className="text-xs font-semibold text-[#C8A46B] capitalize">{currentMonthYearName}</span>
                      </div>
                      <div className="grid grid-cols-7 text-center text-[10px] font-bold text-[#4E463A] uppercase mb-4">
                        <span>Dom</span><span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sab</span>
                      </div>
                      <div className="grid grid-cols-7 gap-y-2 text-center text-xs text-[#3D2C28]">
                        <span className="text-[#D1C5B5] py-1.5">28</span>
                        <span className="text-[#D1C5B5] py-1.5">29</span>
                        <span className="text-[#D1C5B5] py-1.5">30</span>
                        <span className="py-1.5 hover:bg-[#FFF8F6] rounded-lg cursor-pointer">1</span>
                        <span className="py-1.5 hover:bg-[#FFF8F6] rounded-lg cursor-pointer">2</span>
                        <span className="py-1.5 hover:bg-[#FFF8F6] rounded-lg cursor-pointer">3</span>
                        <span className="py-1.5 hover:bg-[#FFF8F6] rounded-lg cursor-pointer">4</span>
                        <span className="py-1.5 hover:bg-[#FFF8F6] rounded-lg cursor-pointer">5</span>
                        <span className="py-1.5 font-bold text-[#C8A46B] bg-[#C8A46B]/10 rounded-lg cursor-pointer">6</span>
                        <span className="py-1.5 hover:bg-[#FFF8F6] rounded-lg cursor-pointer">7</span>
                        <span className="py-1.5 hover:bg-[#FFF8F6] rounded-lg cursor-pointer relative">8 <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#C8A46B] rounded-full" /></span>
                        <span className="py-1.5 hover:bg-[#FFF8F6] rounded-lg cursor-pointer">9</span>
                        <span className="py-1.5 hover:bg-[#FFF8F6] rounded-lg cursor-pointer">10</span>
                        <span className="py-1.5 hover:bg-[#FFF8F6] rounded-lg cursor-pointer">11</span>
                      </div>
                    </div>

                    {/* Next List Section */}
                    <div className="space-y-4">
                      <span className="text-xs font-bold text-[#3D2C28] uppercase tracking-wider block">Agendamentos em Sequência</span>
                      <div className="space-y-3">
                        {upcomingAppointments && upcomingAppointments.length > 0 ? (
                          upcomingAppointments.slice(0, 4).map((appt: any) => (
                            <div key={appt.id} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-[#D1C5B5]/25 border-l-4 border-[#C8A46B] shadow-xs">
                              <div className="text-center w-12 border-r border-[#D1C5B5]/20 pr-2 flex-shrink-0">
                                <p className="text-xs font-bold text-[#3D2C28]">
                                  {appt.start_time ? format(new Date(appt.start_time), 'HH:mm') : '--:--'}
                                </p>
                                <p className="text-[9px] text-[#8A847C] font-semibold">
                                  {appt.start_time ? format(new Date(appt.start_time), 'dd/MM') : ''}
                                </p>
                              </div>
                              <div className="flex-1">
                                <p className="text-xs font-bold text-[#3D2C28] line-clamp-1">{appt.procedures?.name || 'Procedimento'}</p>
                                <p className="text-[11px] text-[#4E463A] line-clamp-1">{appt.clients?.full_name || 'Cliente'}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-4 text-center text-xs font-medium text-[#4E463A] bg-[#FFF8F6] rounded-xl border border-dashed border-[#D1C5B5]/50">
                            Nenhum horário próximo agendado.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Charts Section (Visual apenas sem redirecionar ao clicar) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-[#D1C5B5]/30">
                <h4 className="text-xs font-bold text-[#3D2C28] uppercase tracking-wider mb-6">
                  Faturamento Semanal
                </h4>
                <div className="h-48 flex items-end justify-between gap-2 pt-4">
                  {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'].map((dayName, idx) => {
                    const dayVal = weeklyRevenue[idx] || 0;
                    const heightPct = maxWeeklyVal > 0 ? Math.max(10, Math.round((dayVal / maxWeeklyVal) * 100)) : 15;
                    return (
                      <div key={dayName} className="w-full h-full flex flex-col justify-end items-center group relative cursor-pointer">
                        {/* Tooltip Hover visual com valor em Reais */}
                        <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-[#3D2C28] text-white text-[10px] font-bold px-2 py-1 rounded shadow-md whitespace-nowrap z-20 pointer-events-none">
                          {formatMoney(dayVal)}
                        </div>
                        <div 
                          className={`w-full rounded-t-lg transition-all duration-300 ${dayVal > 0 ? 'bg-[#C8A46B] group-hover:bg-[#b5925a]' : 'bg-[#D1C5B5]/20 group-hover:bg-[#C8A46B]/30'}`} 
                          style={{ height: `${heightPct}%` }}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between mt-4 text-[10px] text-[#4E463A] uppercase font-bold tracking-tighter">
                  <span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sab</span><span>Dom</span>
                </div>
              </div>

              <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-[#D1C5B5]/30">
                <h4 className="text-xs font-bold text-[#3D2C28] uppercase tracking-wider mb-6 flex justify-between items-center">
                  Procedimentos Populares
                  <span className="text-[10px] text-[#4E463A] bg-[#FFF0ED] px-2 py-0.5 rounded font-normal normal-case">Esta Semana</span>
                </h4>
                <div className="space-y-4">
                  {popularProcedures && popularProcedures.length > 0 ? (
                    popularProcedures.map((proc, index) => (
                      <div key={index} className="flex items-center gap-4">
                        <span className="text-xs font-medium w-28 truncate" title={proc.name}>
                          {proc.name}
                        </span>
                        <div className="flex-1 h-2 bg-[#FFF0ED] rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[#C8A46B] transition-all duration-500" 
                            style={{ width: `${proc.percentage}%` }} 
                          />
                        </div>
                        <span className="text-xs font-bold w-10 text-right">{proc.percentage}%</span>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-center text-sm text-[#8A847C]">
                      <Sparkles className="w-8 h-8 text-[#C8A46B]/40 mb-2 animate-pulse" />
                      <p className="font-medium text-[#4E463A]">Nenhum procedimento registrado</p>
                      <p className="text-xs text-[#8A847C]/80 mt-0.5">nesta semana</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Financial Summary (Sem redirecionar ao clicar, mantendo apenas exibição visual) */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div className="bg-white p-4 rounded-xl border border-[#D1C5B5]/20 shadow-xs transition-all">
                <p className="text-[10px] text-[#4E463A] uppercase font-bold">Entradas</p>
                <p className="text-sm font-bold text-emerald-600">{formatMoney(financialSummary?.entries)}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-[#D1C5B5]/20 shadow-xs transition-all">
                <p className="text-[10px] text-[#4E463A] uppercase font-bold">Saídas</p>
                <p className="text-sm font-bold text-[#BA1A1A]">{formatMoney(financialSummary?.exits)}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-[#D1C5B5]/20 shadow-xs transition-all">
                <p className="text-[10px] text-[#4E463A] uppercase font-bold">Lucro Líquido</p>
                <p className="text-sm font-bold text-[#3D2C28]">{formatMoney(financialSummary?.profit)}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-[#D1C5B5]/20 shadow-xs transition-all">
                <p className="text-[10px] text-[#4E463A] uppercase font-bold">A Receber</p>
                <p className="text-sm font-bold text-[#4E463A]">{formatMoney(financialSummary?.toReceive)}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-[#D1C5B5]/20 shadow-xs transition-all">
                <p className="text-[10px] text-[#4E463A] uppercase font-bold">A Pagar</p>
                <p className="text-sm font-bold text-[#4E463A]">{formatMoney(financialSummary?.toPay)}</p>
              </div>
            </div>
          </div>

          {/* Sidebar Right Column (4 Cols) */}
          <div className="col-span-12 lg:col-span-4 space-y-8">
            {/* Smart Alerts Panel (Notificações exclusivas de agendamento e pagamento) */}
            <div className="bg-white rounded-2xl shadow-sm border border-[#D1C5B5]/30 flex flex-col">
              <div className="p-6 border-b border-[#D1C5B5]/20 flex justify-between items-center">
                <h3 className="text-lg font-bold text-[#3D2C28]">Alertas Inteligentes</h3>
                {urgentAlertsCount > 0 ? (
                  <span className="bg-[#FFDAD6] text-[#BA1A1A] text-[10px] px-2.5 py-1 rounded-md font-bold">
                    {urgentAlertsCount} URGENTES
                  </span>
                ) : (
                  <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2.5 py-1 rounded-md font-bold">
                    TUDO OK
                  </span>
                )}
              </div>
              <div className="divide-y divide-[#D1C5B5]/10">
                {hasPendingAppointments && (
                  <div className="p-5 flex gap-4 hover:bg-[#FFF8F6] transition-colors group block">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 flex-shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#3D2C28]">Consultas Pendentes</p>
                      <p className="text-xs text-[#4E463A]">{metrics.todayAppointmentsCount - metrics.attendedCount} atendimento(s) pendente(s) hoje</p>
                    </div>
                  </div>
                )}

                {hasPendingPayments && (
                  <div className="p-5 flex gap-4 hover:bg-[#FFF8F6] transition-colors group block">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 flex-shrink-0">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#3D2C28]">Pagamentos Pendentes</p>
                      <p className="text-xs text-[#4E463A]">{formatMoney(financialSummary.toPay + financialSummary.toReceive)} em movimentações pendentes</p>
                    </div>
                  </div>
                )}

                {urgentAlertsCount === 0 && (
                  <div className="p-8 text-center flex flex-col items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                    <p className="text-sm font-bold text-[#3D2C28]">Sem notificações urgentes</p>
                    <p className="text-xs text-[#4E463A] mt-1">Todos os agendamentos e pagamentos estão em dia.</p>
                  </div>
                )}
              </div>
              <div className="p-4 bg-[#FFF8F6] text-center rounded-b-2xl border-t border-[#D1C5B5]/10">
                <Link href="/dashboard/schedule" className="text-[#C8A46B] text-xs font-bold hover:underline">
                  Ver todos os alertas
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
