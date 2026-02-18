'use client';

import { useState, useMemo } from 'react';
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
  Calendar as CalendarIcon
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
  onViewAppointment: (id: string) => void;
}

// ----------------------------------------------------------------------

export default function ScheduleCalendarComponent({
  appointments,
  onNewAppointment,
  onViewAppointment,
}: ScheduleCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarViewType>('week');

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
          appointments={appointments} 
          onDayClick={handleDayClick} 
        />
      );
    }

    return (
      <DayWeekView 
        view={view}
        visibleDays={visibleDays}
        appointments={appointments}
        onNewAppointment={onNewAppointment}
        onViewAppointment={onViewAppointment} 
      />
    );
  };

  return (
    <div className="flex flex-col h-full space-y-6 animate-fade-in group/calendar">
      {/* Calendar Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex items-center gap-6">
           <div className="p-3 bg-[#D4AF37]/10 rounded-2xl">
              <CalendarIcon className="h-8 w-8 text-[#D4AF37]" />
           </div>
           <div>
              <h2 className="text-2xl font-black text-[#2C2825] capitalize leading-none mb-1 font-serif">
                {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
              </h2>
              <p className="text-[10px] text-[#8A847C] uppercase font-black tracking-widest">Controle de Agendamentos</p>
           </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View Switcher */}
          <div className="flex bg-[#FDFBF7] rounded-xl p-1 border border-[#E5E0D8]">
            {['day', 'week', 'month'].map((v) => (
              <button
                key={v}
                onClick={() => setView(v as CalendarViewType)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-sm font-bold transition-all capitalize",
                  view === v ? "bg-[#D4AF37] text-white shadow-sm" : "text-[#5C5855] hover:text-[#2C2825] hover:bg-[#FAF6E9]"
                )}
              >
                {v === 'day' ? 'Dia' : v === 'week' ? 'Semana' : 'Mês'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" className="h-10 border-[#E5E0D8] text-[#5C5855] hover:text-[#2C2825] hover:bg-[#FAF9F6] rounded-xl px-4 font-bold active:scale-[0.98] transition-all" onClick={() => setCurrentDate(new Date())}>
               Hoje
            </Button>
            
            <div className="flex items-center gap-1 bg-white rounded-xl border border-[#E5E0D8] p-1">
               <Button size="icon" variant="ghost" className="h-8 w-8 text-[#8A847C] hover:text-[#D4AF37] hover:bg-[#FAF6E9] rounded-lg" onClick={() => navigate('prev')}>
                  <ChevronLeft className="h-4 w-4" />
               </Button>
               
               <div className="w-[140px]">
                 <Select
                   value={currentDate.getMonth().toString()}
                   onValueChange={(val) => {
                      const newDate = new Date(currentDate);
                      newDate.setMonth(parseInt(val));
                      setCurrentDate(newDate);
                   }}
                 >
                   <SelectTrigger className="h-8 border-none bg-transparent hover:bg-[#FAF9F6] text-[#2C2825] px-2 text-xs font-black uppercase focus:ring-0 w-full justify-center gap-1">
                     <SelectValue>
                        {format(currentDate, 'MMMM', { locale: ptBR })}
                     </SelectValue>
                   </SelectTrigger>
                   <SelectContent className="bg-white border-[#E5E0D8] max-h-[300px]">
                      {Array.from({ length: 12 }, (_, i) => {
                         const date = new Date(currentDate.getFullYear(), i, 1);
                         return (
                            <SelectItem key={i} value={i.toString()} className="text-xs font-bold text-[#5C5855] focus:text-[#D4AF37] focus:bg-[#FAF9F6] uppercase">
                               {format(date, 'MMMM', { locale: ptBR })}
                            </SelectItem>
                         );
                      })}
                   </SelectContent>
                 </Select>
               </div>

               <Button size="icon" variant="ghost" className="h-8 w-8 text-[#8A847C] hover:text-[#D4AF37] hover:bg-[#FAF6E9] rounded-lg" onClick={() => navigate('next')}>
                  <ChevronRight className="h-4 w-4" />
               </Button>
            </div>

            <Button onClick={() => onNewAppointment(currentDate)} className="h-10 bg-gradient-to-r from-[#D4AF37] to-[#B5952F] hover:from-[#C5A028] hover:to-[#A48625] text-white font-bold rounded-xl px-4 shadow-lg shadow-[#D4AF37]/20 active:scale-[0.98] transition-all">
               <Plus className="h-4 w-4 mr-2" />
               Novo Agendamento
            </Button>
          </div>
        </div>
      </div>

      {/* Grid Calendar */}
      <Card className="bg-white/50 border-[#E5E0D8] rounded-3xl overflow-hidden flex flex-col backdrop-blur-sm relative h-[calc(100vh-240px)] min-h-[500px] shadow-sm">
        {renderContent()}
      </Card>
    </div>
  );
}
