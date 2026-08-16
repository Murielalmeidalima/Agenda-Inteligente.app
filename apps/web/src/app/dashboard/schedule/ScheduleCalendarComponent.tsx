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
  Filter,
  Search,
  X,
  SlidersHorizontal
} from 'lucide-react';
import { 
  Button, 
  Card, 
  cn,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Input,
  Badge
} from '@projeto/ui';
import { Appointment } from '@/types/database';
import { MonthView } from './components/MonthView';
import { DayWeekView } from './components/DayWeekView';
import type { ProcedureHistoryMap } from '@/lib/procedure-history';

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
  historyMap?: ProcedureHistoryMap;
  companyId?: string;
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
  historyMap = new Map(),
  companyId,
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

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>('all');
  const [filterProfessional, setFilterProfessional] = useState<string>('all');
  const [filterProcedure, setFilterProcedure] = useState<string>('all');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>('all');

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filterProfessional !== 'all') count++;
    if (filterProcedure !== 'all') count++;
    if (filterPaymentMethod !== 'all') count++;
    return count;
  }, [filterProfessional, filterProcedure, filterPaymentMethod]);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt: any) => {
      // Filtragem Instantânea por Nome ou Telefone do Cliente
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const clientName = apt.clients?.full_name?.toLowerCase() || '';
        const clientPhone = apt.clients?.phone || '';
        if (!clientName.includes(q) && !clientPhone.includes(q)) {
          return false;
        }
      }
      if (filterPaymentStatus !== 'all' && apt.paymentStatus !== filterPaymentStatus) return false;
      if (filterProfessional !== 'all' && apt.professional_id !== filterProfessional) return false;
      if (filterProcedure !== 'all' && apt.procedure_id !== filterProcedure) return false;
      if (filterPaymentMethod !== 'all' && apt.paymentMethod !== filterPaymentMethod) return false;
      return true;
    });
  }, [appointments, searchQuery, filterPaymentStatus, filterProfessional, filterProcedure, filterPaymentMethod]);

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
          historyMap={historyMap}
          companyId={companyId}
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
        historyMap={historyMap}
        companyId={companyId}
      />
    );
  };

  return (
    <div className="flex flex-col h-full space-y-6 animate-fade-in group/calendar relative">
      {loading && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500 animate-pulse rounded-full z-50" />
      )}
      {/* Calendar Header — Responsivo para iPad (Portrait/Landscape) e iPhones */}
      <div className="flex flex-col gap-4 bg-[#FAF9F6] border border-[#E5E0D8] p-4 sm:p-5 rounded-3xl shadow-xs">
        {/* Top Row: Title + Controls Grid */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-slate-800">
             <div className="p-2.5 bg-[#D4AF37]/10 rounded-2xl shrink-0">
                <CalendarIcon className="h-6 w-6 text-[#D4AF37]" />
             </div>
             <div>
                <h2 className="text-xl sm:text-2xl font-black text-[#2C2825] capitalize leading-tight font-serif">
                  {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
                </h2>
                <p className={cn(
                  "text-[9px] sm:text-[10px] uppercase font-black tracking-widest transition-colors",
                  isDateInPast ? "text-red-600 font-extrabold" : "text-[#8A847C]"
                )}>
                  {isDateInPast ? '⚠️ Somente consulta (Data no passado)' : 'Controle de Agendamentos'}
                </p>
             </div>
          </div>

          {/* Action Buttons & Controls Bar */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* Bloquear Dias */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onOpenBlocks}
              className="h-10 px-3 border-[#E5E0D8] bg-white text-[#5C5855] hover:text-rose-600 font-bold uppercase tracking-wider text-[10px] rounded-xl flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Settings2 className="h-3.5 w-3.5" />
              <span>Bloquear</span>
            </Button>

            {/* View Switcher */}
            <div className="bg-white rounded-xl border border-[#E5E0D8] px-2 h-10 flex items-center shadow-xs">
              <Select 
                value={view} 
                onValueChange={(val) => setView(val as CalendarViewType)}
              >
                <SelectTrigger className="border-none h-8 p-0 px-1 bg-transparent focus:ring-0 text-xs font-bold text-[#5C5855] w-full uppercase tracking-wider">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Diário</SelectItem>
                  <SelectItem value="week">Semanal</SelectItem>
                  <SelectItem value="month">Calendário</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Navigator */}
            <div className="col-span-2 sm:col-span-1 flex items-center justify-between bg-white rounded-xl border border-[#E5E0D8] p-1 h-10 min-w-[160px] shadow-xs">
               <Button size="icon" variant="ghost" className="h-8 w-8 text-[#8A847C] hover:text-[#D4AF37] hover:bg-[#FAF6E9] rounded-lg shrink-0" onClick={() => navigate('prev')}>
                  <ChevronLeft className="h-4 w-4" />
               </Button>
               
               <div className="relative flex items-center justify-center flex-1 group">
                 <div className="h-8 flex items-center justify-center bg-transparent group-hover:bg-[#FAF9F6] text-[#2C2825] px-1 text-[11px] font-black uppercase w-full rounded-md cursor-pointer transition-colors text-center leading-tight">
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
                   className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                 />
               </div>

               <Button size="icon" variant="ghost" className="h-8 w-8 text-[#8A847C] hover:text-[#D4AF37] hover:bg-[#FAF6E9] rounded-lg shrink-0" onClick={() => navigate('next')}>
                  <ChevronRight className="h-4 w-4" />
               </Button>
            </div>

            {/* Lançar Atendimento */}
            <Button 
              onClick={onLaunchAppointment} 
              className="h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl px-3 sm:px-4 shadow-md text-xs active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
            >
               <Plus className="h-3.5 w-3.5" />
               <span>Lançar</span>
            </Button>

            {/* Novo Agendamento */}
            <Button 
              onClick={() => onNewAppointment(currentDate)} 
              disabled={isDateInPast}
              className="h-10 bg-[#D4AF37] hover:bg-[#b8972e] text-white font-bold rounded-xl px-3 sm:px-4 shadow-md text-xs active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
               <Plus className="h-3.5 w-3.5" />
               <span>Agendar</span>
            </Button>
          </div>
        </div>

        {/* Bottom Row: Real-Time Search Bar + Status Touch Chips + Advanced Filters Drawer */}
        <div className="space-y-3 pt-3 border-t border-[#E5E0D8]/60">
          {/* Real-time search input & filter trigger */}
          <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A847C]" />
              <Input
                type="text"
                placeholder="Buscar cliente por nome ou telefone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-8 h-10 bg-white border-[#E5E0D8] rounded-xl text-xs font-medium focus:ring-[#D4AF37]/20 shadow-xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 p-0.5"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={cn(
                "h-10 px-3.5 border-[#E5E0D8] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs",
                showAdvancedFilters || activeFiltersCount > 0 
                  ? "bg-[#D4AF37]/15 text-[#2C2825] border-[#D4AF37]" 
                  : "bg-white text-[#5C5855] hover:bg-neutral-50"
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-[#D4AF37]" />
              <span>Filtros Avançados</span>
              {activeFiltersCount > 0 && (
                <Badge className="bg-[#D4AF37] text-white text-[9px] px-1.5 py-0.2 rounded-full font-black">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </div>

          {/* Quick Payment Status Touch Chips (Estilo iOS) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[10px] font-bold">
            <span className="text-[#8A847C] uppercase tracking-wider text-[9px] font-black mr-1 shrink-0">Status:</span>
            {[
              { id: 'all', label: 'Todos' },
              { id: 'paid', label: '🟢 Pago' },
              { id: 'partial', label: '🟠 Parcial' },
              { id: 'overdue', label: '🔴 Pendente' },
              { id: 'advance_payment', label: '🔵 Antecipado' },
              { id: 'pending', label: '🟡 Futuro' }
            ].map(statusChip => (
              <button
                key={statusChip.id}
                type="button"
                onClick={() => setFilterPaymentStatus(statusChip.id)}
                className={cn(
                  "px-3 py-1.5 rounded-xl transition-all whitespace-nowrap border shadow-2xs font-bold text-[10px]",
                  filterPaymentStatus === statusChip.id
                    ? "bg-[#2C2825] text-white border-[#2C2825]"
                    : "bg-white text-[#5C5855] border-[#E5E0D8] hover:bg-neutral-100"
                )}
              >
                {statusChip.label}
              </button>
            ))}

            {(searchQuery || filterPaymentStatus !== 'all' || activeFiltersCount > 0) && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setFilterPaymentStatus('all');
                  setFilterProfessional('all');
                  setFilterProcedure('all');
                  setFilterPaymentMethod('all');
                }}
                className="px-2.5 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 text-[10px] font-black uppercase tracking-wider transition-all border border-rose-200"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Expanded Advanced Filters Drawer/Popover */}
          {showAdvancedFilters && (
            <div className="bg-white border border-[#E5E0D8] p-3.5 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-3 animate-fade-in shadow-sm">
              {/* Professional Selection */}
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-wider text-[#8A847C] ml-1">Profissional</label>
                <Select value={filterProfessional} onValueChange={setFilterProfessional}>
                  <SelectTrigger className="bg-white border-[#E5E0D8] h-9 rounded-xl text-xs font-medium">
                    <SelectValue placeholder="Todos Profissionais" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos Profissionais</SelectItem>
                    {professionals?.map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Procedure Selection */}
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-wider text-[#8A847C] ml-1">Procedimento</label>
                <Select value={filterProcedure} onValueChange={setFilterProcedure}>
                  <SelectTrigger className="bg-white border-[#E5E0D8] h-9 rounded-xl text-xs font-medium">
                    <SelectValue placeholder="Todos Procedimentos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos Procedimentos</SelectItem>
                    {procedures?.map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Method Selection */}
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-wider text-[#8A847C] ml-1">Forma de Pagamento</label>
                <Select value={filterPaymentMethod} onValueChange={setFilterPaymentMethod}>
                  <SelectTrigger className="bg-white border-[#E5E0D8] h-9 rounded-xl text-xs font-medium">
                    <SelectValue placeholder="Todas Formas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas Formas</SelectItem>
                    <SelectItem value="pix">📱 PIX</SelectItem>
                    <SelectItem value="credit_card">💳 Cartão Crédito</SelectItem>
                    <SelectItem value="debit_card">💳 Cartão Débito</SelectItem>
                    <SelectItem value="cash">💵 Dinheiro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grid Calendar */}
      <Card className="bg-white/50 border-[#E5E0D8] rounded-3xl overflow-hidden flex flex-col backdrop-blur-sm relative h-[calc(100vh-240px)] h-[calc(100dvh-240px)] min-h-[500px] shadow-sm">
        {renderContent()}
      </Card>
    </div>
  );
}
