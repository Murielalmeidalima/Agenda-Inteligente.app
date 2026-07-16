'use client';

import { useState, useMemo, useEffect } from 'react';
import { 
  format, 
  startOfWeek,
  addDays,
  addWeeks,
  startOfMonth, 
  endOfMonth, 
  endOfWeek, 
  eachDayOfInterval, 
  addMonths
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon,
  Settings2,
  Filter
} from 'lucide-react';
import { 
  Button, 
  Card, 
  cn,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@projeto/ui';
import { Appointment } from '@/types/database';
import { MonthView } from './components/MonthView';
import { DayWeekView } from './components/DayWeekView';

// ----------------------------------------------------------------------

type CalendarViewType = 'day' | 'week' | 'month';

interface ScheduleCalendarProps {
  appointments: (Appointment & {
    clients: { full_name: string };
    procedures: { name: string; duration_minutes: number };
  })[];
  onNewAppointment: (date: Date) => void;
  onLaunchAppointment: () => void;
  onViewAppointment: (id: string) => void;
  slotInterval: number;
  onSlotIntervalChange: (interval: number) => void;
  scheduleBlocks: any[];
  onOpenBlocks: () => void;
  blockHolidays: boolean;
  professionals?: any[];
  procedures?: any[];
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  view: CalendarViewType;
  setView: (view: CalendarViewType) => void;
  loading?: boolean;
}

// ----------------------------------------------------------------------

export default function ScheduleCalendarComponent({
  appointments,
  onNewAppointment,
  onLaunchAppointment,
  onViewAppointment,
  slotInterval,
  onSlotIntervalChange,
  scheduleBlocks,
  onOpenBlocks,
  blockHolidays,
  professionals = [],
  procedures = [],
  currentDate,
  setCurrentDate,
  view,
  setView,
  loading = false
}: ScheduleCalendarProps) {
  const isDateInPast = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(currentDate);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
  }, [currentDate]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setView('day');
    }
  }, [setView]);

  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>('all');
  const [filterProfessional, setFilterProfessional] = useState<string>('all');
  const [filterProcedure, setFilterProcedure] = useState<string>('all');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>('all');

  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt: any) => {
      if (filterPaymentStatus !== 'all' && apt.paymentStatus !== filterPaymentStatus) return false;
      if (filterProfessional !== 'all' && apt.professional_id !== filterProfessional) return false;
      if (filterProcedure !== 'all' && apt.procedure_id !== filterProcedure) return false;
      if (filterPaymentMethod !== 'all' && apt.paymentMethod !== filterPaymentMethod) return false;
      return true;
    });
  }, [appointments, filterPaymentStatus, filterProfessional, filterProcedure, filterPaymentMethod]);

  const visibleDays = useMemo(() => {
    if (view === 'day') {
      return [currentDate];
    }
    
    if (view === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 });
      return Array.from({ length: 7 }, (_, i) => addDays(start, i));
    }
    
    // Month View (Classic Grid)
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
    
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentDate, view]);

  const navigate = (direction: 'prev' | 'next') => {
    const amount = direction === 'next' ? 1 : -1;
    if (view === 'day') setCurrentDate(addDays(currentDate, amount));
    else if (view === 'week') setCurrentDate(addWeeks(currentDate, amount));
    else setCurrentDate(addMonths(currentDate, amount));
  };

  const handleDayClick = (day: Date) => {
    setCurrentDate(day);
    setView('day');
  };

  const renderContent = () => {
    if (view === 'month') {
      return (
        <MonthView 
          visibleDays={visibleDays} 
          currentDate={currentDate} 
          appointments={filteredAppointments} 
          onDayClick={handleDayClick} 
          onViewAppointment={onViewAppointment}
          scheduleBlocks={scheduleBlocks}
          blockHolidays={blockHolidays}
        />
      );
    }

    return (
      <DayWeekView 
        view={view}
        visibleDays={visibleDays}
        appointments={filteredAppointments}
        onNewAppointment={onNewAppointment}
        onViewAppointment={onViewAppointment} 
        slotInterval={slotInterval}
        scheduleBlocks={scheduleBlocks}
        blockHolidays={blockHolidays}
        procedures={procedures}
      />
    );
  };

  return (
    <div className="flex flex-col h-full space-y-6 animate-fade-in group/calendar relative">
      {loading && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500 animate-pulse rounded-full z-50" />
      )}
      {/* Calendar Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex items-center gap-6 text-slate-800">
           <div className="p-3 bg-[#D4AF37]/10 rounded-2xl">
              <CalendarIcon className="h-8 w-8 text-[#D4AF37]" />
           </div>
           <div>
              <h2 className="text-2xl font-black text-[#2C2825] capitalize leading-none mb-1 font-serif">
                {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
              </h2>
              <p className={cn(
                "text-[10px] uppercase font-black tracking-widest transition-colors",
                isDateInPast ? "text-red-600 font-extrabold" : "text-[#8A847C]"
              )}>
                {isDateInPast ? '⚠️ Somente consulta (Data no passado)' : 'Controle de Agendamentos'}
              </p>
           </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full xl:w-auto">
          {/* Group 1: Configuration & View Switcher */}
          <div className="grid grid-cols-2 gap-3 w-full sm:w-auto">
            {/* Bloquear Dias */}
            <div className="flex items-center bg-white rounded-xl border border-[#E5E0D8] px-2 h-10">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onOpenBlocks}
                className="gap-2 text-[#5C5855] hover:text-red-600 font-bold uppercase tracking-widest text-[10px] w-full justify-center"
              >
                <Settings2 className="h-3.5 w-3.5" />
                Bloquear Dias
              </Button>
            </div>

            {/* View Switcher */}
            <div className="flex items-center bg-white rounded-xl border border-[#E5E0D8] px-2 h-10 w-full sm:w-[140px]">
              <Select 
                value={view} 
                onValueChange={(val) => setView(val as CalendarViewType)}
              >
                <SelectTrigger className="border-none h-8 p-0 px-2 bg-transparent focus:ring-0 text-xs font-bold text-[#5C5855] w-full uppercase tracking-widest">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Diário</SelectItem>
                  <SelectItem value="week">Semanal</SelectItem>
                  <SelectItem value="month">Calendário</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Group 2: Date Navigation & New Appointment */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            {/* Date Navigator */}
            <div className="flex items-center justify-between bg-white rounded-xl border border-[#E5E0D8] p-1 w-full sm:w-auto">
               <Button size="icon" variant="ghost" className="h-8 w-8 text-[#8A847C] hover:text-[#D4AF37] hover:bg-[#FAF6E9] rounded-lg shrink-0" onClick={() => navigate('prev')}>
                  <ChevronLeft className="h-4 w-4" />
               </Button>
               
               <div className="relative flex items-center justify-center flex-1 sm:w-[140px] group">
                 <div className="h-8 flex items-center justify-center bg-transparent group-hover:bg-[#FAF9F6] text-[#2C2825] px-2 text-[11px] font-black uppercase w-full gap-1 rounded-md cursor-pointer transition-colors text-center leading-tight">
                   {view === 'month' 
                     ? format(currentDate, "MMMM 'de' yyyy", { locale: ptBR }) 
                     : format(currentDate, "dd 'de' MMMM", { locale: ptBR })}
                 </div>
                 <input 
                   type="date"
                   value={format(currentDate, 'yyyy-MM-dd')}
                   onChange={(e) => {
                     if (e.target.value) {
                       const parts = e.target.value.split('-');
                       if (parts.length === 3) {
                         setCurrentDate(new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), 12, 0, 0));
                       }
                     }
                   }}
                   className="absolute inset-0 opacity-0 cursor-pointer w-full h-full [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer z-10"
                 />
               </div>

               <Button size="icon" variant="ghost" className="h-8 w-8 text-[#8A847C] hover:text-[#D4AF37] hover:bg-[#FAF6E9] rounded-lg shrink-0" onClick={() => navigate('next')}>
                  <ChevronRight className="h-4 w-4" />
               </Button>
            </div>

            {/* Lançar Atendimento */}
            <Button 
              onClick={onLaunchAppointment} 
              className="h-10 w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold rounded-xl px-4 shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all justify-center"
            >
               <Plus className="h-4 w-4 mr-2" />
               Lançar Atendimento
            </Button>

            {/* Novo Agendamento */}
            <Button 
              onClick={() => onNewAppointment(currentDate)} 
              disabled={isDateInPast}
              className="h-10 w-full sm:w-auto bg-gradient-to-r from-[#D4AF37] to-[#B5952F] hover:from-[#C5A028] hover:to-[#A48625] text-white font-bold rounded-xl px-4 shadow-lg shadow-[#D4AF37]/20 active:scale-[0.98] transition-all justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
               <Plus className="h-4 w-4 mr-2" />
               Novo Agendamento
            </Button>
          </div>
        </div>
      </div>

      {/* Visual Legend & Filter Row */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        {/* Legend */}
        <div className="flex items-center gap-3.5 bg-[#FAF9F6] border border-[#E5E0D8]/60 px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-wider text-[#5C5855] shadow-sm overflow-x-auto w-full md:w-auto whitespace-nowrap scrollbar-none">
          <span className="text-[#8A847C]">Legenda:</span>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /> <span>Pago</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-orange-500" /> <span>Parcial</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-500" /> <span>Pendente</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500" /> <span>Antecipado</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-yellow-500" /> <span>Futuro</span></div>
        </div>

        {/* Quick Filter Bar */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <div className="text-[9px] font-black text-[#8A847C] uppercase tracking-widest flex items-center gap-1 mr-1">
            <Filter className="h-3.5 w-3.5 text-[#D4AF37]" />
            Filtrar:
          </div>

          {/* Status Selection */}
          <div className="w-[120px] bg-white rounded-xl border border-[#E5E0D8] px-2 h-9 flex items-center shadow-sm">
            <Select value={filterPaymentStatus} onValueChange={setFilterPaymentStatus}>
              <SelectTrigger className="border-none h-7 p-0 px-1 bg-transparent focus:ring-0 text-[10px] font-black text-[#5C5855] w-full uppercase tracking-wider">
                <SelectValue placeholder="Pagamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-[10px] font-bold">Todos Status</SelectItem>
                <SelectItem value="paid" className="text-[10px] font-bold">🟢 Pago</SelectItem>
                <SelectItem value="partial" className="text-[10px] font-bold">🟠 Parcial</SelectItem>
                <SelectItem value="overdue" className="text-[10px] font-bold">🔴 Pendente</SelectItem>
                <SelectItem value="advance_payment" className="text-[10px] font-bold">🔵 Antecipado</SelectItem>
                <SelectItem value="pending" className="text-[10px] font-bold">🟡 Futuro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Professional Selection */}
          <div className="w-[140px] bg-white rounded-xl border border-[#E5E0D8] px-2 h-9 flex items-center shadow-sm">
            <Select value={filterProfessional} onValueChange={setFilterProfessional}>
              <SelectTrigger className="border-none h-7 p-0 px-1 bg-transparent focus:ring-0 text-[10px] font-black text-[#5C5855] w-full uppercase tracking-wider">
                <SelectValue placeholder="Profissional" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-[10px] font-bold">Todos Profissionais</SelectItem>
                {professionals?.map((p: any) => (
                  <SelectItem key={p.id} value={p.id} className="text-[10px] font-bold">{p.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Procedure Selection */}
          <div className="w-[140px] bg-white rounded-xl border border-[#E5E0D8] px-2 h-9 flex items-center shadow-sm">
            <Select value={filterProcedure} onValueChange={setFilterProcedure}>
              <SelectTrigger className="border-none h-7 p-0 px-1 bg-transparent focus:ring-0 text-[10px] font-black text-[#5C5855] w-full uppercase tracking-wider">
                <SelectValue placeholder="Procedimento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-[10px] font-bold">Todos Procedimentos</SelectItem>
                {procedures?.map((p: any) => (
                  <SelectItem key={p.id} value={p.id} className="text-[10px] font-bold">{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Payment Method Selection */}
          <div className="w-[120px] bg-white rounded-xl border border-[#E5E0D8] px-2 h-9 flex items-center shadow-sm">
            <Select value={filterPaymentMethod} onValueChange={setFilterPaymentMethod}>
              <SelectTrigger className="border-none h-7 p-0 px-1 bg-transparent focus:ring-0 text-[10px] font-black text-[#5C5855] w-full uppercase tracking-wider">
                <SelectValue placeholder="Forma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-[10px] font-bold">Todas Formas</SelectItem>
                <SelectItem value="pix" className="text-[10px] font-bold">📱 PIX</SelectItem>
                <SelectItem value="credit_card" className="text-[10px] font-bold">💳 Cartão Crédito</SelectItem>
                <SelectItem value="debit_card" className="text-[10px] font-bold">💳 Cartão Débito</SelectItem>
                <SelectItem value="cash" className="text-[10px] font-bold">💵 Dinheiro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Clear Filters Button */}
          {(filterPaymentStatus !== 'all' || filterProfessional !== 'all' || filterProcedure !== 'all' || filterPaymentMethod !== 'all') && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                setFilterPaymentStatus('all');
                setFilterProfessional('all');
                setFilterProcedure('all');
                setFilterPaymentMethod('all');
              }}
              className="text-[10px] font-black uppercase text-rose-500 hover:text-rose-700 h-9 px-3 hover:bg-rose-50 rounded-xl"
            >
              Limpar
            </Button>
          )}
        </div>
      </div>

      {/* Grid Calendar */}
      <Card className="bg-white/50 border-[#E5E0D8] rounded-3xl overflow-hidden flex flex-col backdrop-blur-sm relative h-[calc(100vh-240px)] min-h-[500px] shadow-sm">
        {renderContent()}
      </Card>
    </div>
  );
}
