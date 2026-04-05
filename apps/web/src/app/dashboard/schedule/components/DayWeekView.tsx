'use client';

import { 
  format, 
  startOfDay, 
  isToday,
  isSameDay
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Plus, 
  Clock
} from 'lucide-react';
import { cn } from '@projeto/ui';
import { Appointment } from '@/types/database';

interface DayWeekViewProps {
  view: 'day' | 'week';
  visibleDays: Date[];
  appointments: any[];
  onNewAppointment: (date: Date) => void;
  onViewAppointment: (id: string) => void;
  slotInterval: number; // In minutes, e.g., 15, 30, 60
}

const PIXELS_PER_MINUTE = 2; // 120 pixels per hour
const SCHEDULE_START_HOUR = 5;
const SCHEDULE_END_HOUR = 24; // goes up to 23:xx

export const DayWeekView = ({ 
  view, 
  visibleDays, 
  appointments, 
  onNewAppointment, 
  onViewAppointment,
  slotInterval
}: DayWeekViewProps) => {
  // Forçar a exibição do fundo para ser em horas cheias (60 min)
  const visualSlotInterval = 60;
  
  // Generate time slots based on interval
  const timeSlots: { hour: number; minute: number }[] = [];
  for (let h = SCHEDULE_START_HOUR; h < SCHEDULE_END_HOUR; h++) {
    for (let m = 0; m < 60; m += visualSlotInterval) {
      timeSlots.push({ hour: h, minute: m });
    }
  }

  const slotHeightPx = visualSlotInterval * PIXELS_PER_MINUTE;
  const totalHeightPx = (SCHEDULE_END_HOUR - SCHEDULE_START_HOUR) * 60 * PIXELS_PER_MINUTE;

  return (
    <div className="grid grid-cols-[70px_1fr] md:grid-cols-[80px_1fr] flex-1 overflow-auto custom-scrollbar relative">
      
      {/* Time Lables Left Column */}
      <div className="border-r border-[#E5E0D8] bg-[#FDFBF7]/50 pt-14 sticky left-0 z-40 w-full backdrop-blur-sm">
        {timeSlots.map(({hour, minute}) => {
          const isHour = minute === 0;
          return (
            <div 
              key={`${hour}:${minute}`} 
              className={cn(
                "px-2 md:px-3 text-right flex flex-col justify-start pt-1 border-[#E5E0D8]/50",
                isHour ? "border-b border-t-0" : "border-b border-dashed border-opacity-30"
              )}
              style={{ height: `${slotHeightPx}px` }}
            >
              {(isHour || visualSlotInterval >= 30) && (
                <span className={cn(
                  "font-black uppercase",
                  isHour ? "text-sm text-[#5C5855]" : "text-xs text-[#8A847C]/70"
                )}>
                  {hour.toString().padStart(2, '0')}:{minute.toString().padStart(2, '0')}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Grid Content */}
      <div 
        className={cn(
          "grid flex-1 min-w-0",
          view === 'day' ? "grid-cols-1" : "grid-cols-7"
        )}
      >
        {visibleDays.map((day) => (
          <div key={day.toString()} className="border-r border-[#E5E0D8] last:border-r-0 min-w-0 relative">
            
            {/* Day Header */}
            <div className={cn(
              "h-14 flex flex-col items-center justify-center border-b border-[#E5E0D8] sticky top-0 z-30 transition-colors",
              isToday(day) ? "bg-[#D4AF37]/5 border-b-[#D4AF37]/30" : "bg-white/95 backdrop-blur-md"
            )}>
              <span className={cn(
                "text-[10px] uppercase font-black tracking-widest",
                isToday(day) ? "text-[#D4AF37]" : "text-[#8A847C]"
              )}>
                {format(day, 'EEE', { locale: ptBR })}
              </span>
              <span className={cn(
                "text-xl font-black leading-tight",
                isToday(day) ? "text-[#2C2825]" : "text-[#5C5855]"
              )}>
                {format(day, 'dd')}
              </span>
              {isToday(day) && (
                 <div className="absolute bottom-0 w-8 h-[2px] bg-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.5)]" />
              )}
            </div>

            {/* Slots and Appointments */}
            <div 
              className="relative bg-white/50 hover:bg-white/80 transition-colors"
              style={{ height: `${totalHeightPx}px` }}
            >
              {/* background clickable slots */}
              {timeSlots.map(({hour, minute}) => {
                const isHour = minute === 0;
                return (
                  <div 
                    key={`${hour}:${minute}`} 
                    className={cn(
                      "group/slot cursor-pointer transition-colors relative border-[#E5E0D8]/50",
                      isHour ? "border-b" : "border-b border-dashed"
                    )}
                    style={{ height: `${slotHeightPx}px` }}
                    onClick={() => {
                      const newDate = startOfDay(day);
                      newDate.setHours(hour, minute);
                      onNewAppointment(newDate);
                    }}
                  >
                     <div className="absolute inset-x-0 inset-y-1 opacity-0 group-hover/slot:opacity-100 bg-[#D4AF37]/5 transition-opacity flex items-center justify-center rounded-lg mx-1">
                        <Plus className="h-4 w-4 text-[#D4AF37]/30" />
                     </div>
                  </div>
                );
              })}

              {/* Render Appointments */}
              {appointments
                .filter((apt: any) => isSameDay(new Date(apt.start_time), day) && apt.status !== 'cancelled')
                .map((apt: any) => {
                  const startDate = new Date(apt.start_time);
                  const startHour = startDate.getHours();
                  const startMin = startDate.getMinutes();
                  
                  // Determine End Date for logic
                  let endDate = new Date(apt.start_time);
                  let duration = apt.procedures?.duration_minutes || 60;
                  if (apt.end_time) {
                    endDate = new Date(apt.end_time);
                    duration = (endDate.getTime() - startDate.getTime()) / 60000;
                  } else {
                    endDate.setMinutes(endDate.getMinutes() + duration);
                  }

                  const now = new Date();
                  
                  // Lógica de Cores Inteligente
                  let cardColors = "bg-[#F0EBE0] ring-[#E5E0D8] text-[#5C5855]";
                  
                  if (apt.paymentStatus === 'paid') {
                    // 🟢 Verde — Pago Totalmente
                    cardColors = "bg-emerald-50 ring-emerald-200 text-emerald-800";
                  } else if (now < startDate) {
                    // 🟡 Amarelo — Agendamento Futuro (ainda não aconteceu e não pago)
                    cardColors = "bg-yellow-50 ring-yellow-200 text-yellow-800";
                  } else if (isSameDay(now, startDate)) {
                    // 🟠 Laranja — Pendente (Hoje / já começou ou finalizado hoje)
                    cardColors = "bg-orange-50 ring-orange-200 text-orange-800";
                  } else {
                    // 🔴 Vermelho — Atrasado (Dias anteriores e não pago)
                    cardColors = "bg-red-50 ring-red-200 text-red-800";
                  }

                  // Handle out-of-bounds start times implicitly visually to avoid completely missing them
                  const clampedStartHour = Math.max(SCHEDULE_START_HOUR, startHour);
                  const top = ((clampedStartHour - SCHEDULE_START_HOUR) * 60 + startMin) * PIXELS_PER_MINUTE;
                  const height = duration * PIXELS_PER_MINUTE;

                  return (
                    <div
                      key={apt.id}
                      className={cn(
                        "absolute left-1.5 right-1.5 rounded-xl p-2 text-[10px] overflow-hidden cursor-pointer shadow-sm transition-all hover:shadow-md hover:scale-[1.02] z-20 group/apt ring-1 ring-inset",
                        cardColors
                      )}
                      style={{ top: `${top}px`, height: `${height}px`, minHeight: '24px' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewAppointment(apt.id);
                      }}
                    >
                      <div className="flex flex-col h-full">
                         <div className="flex justify-between items-start mb-0.5">
                           <p className="font-black text-[11px] leading-tight truncate group-hover/apt:text-[#2C2825] transition-colors pr-1">
                             {apt.clients?.full_name || 'Individual'}
                           </p>
                           {apt.status === 'completed' && (
                             <div 
                               className={cn(
                                 "w-2 h-2 rounded-full shrink-0 shadow-sm mt-0.5",
                                 apt.paymentStatus === 'paid' ? "bg-emerald-500 shadow-emerald-200" :
                                 apt.paymentStatus === 'partial' ? "bg-amber-500 shadow-amber-200" :
                                 "bg-rose-500 shadow-rose-200"
                               )}
                               title={apt.paymentStatus === 'paid' ? 'Pago' : apt.paymentStatus === 'partial' ? 'Pago Parcialmente' : 'Pendente de Pagamento'}
                             />
                           )}
                         </div>
                         {height > 35 && ( // só mostra se tiver espaço suficiente
                           <p className="opacity-80 font-semibold truncate lowercase tracking-tight mb-1">
                             {apt.procedures?.name || 'Procedimento'}
                           </p>
                         )}
                         {(height > 45) && (
                            <div className="flex items-center gap-1.5 opacity-70 font-bold mt-auto max-w-full overflow-hidden">
                               <div className="flex items-center gap-1 shrink-0">
                                 <Clock className="h-3 w-3" />
                                 <span>{format(startDate, 'HH:mm')}</span>
                               </div>
                               {apt.status === 'completed' && apt.paymentMethod && (
                                 <span className="text-[8px] uppercase font-black truncate shrink-0 ml-1">
                                    • {apt.paymentMethod.replace('_', ' ')}
                                 </span>
                               )}
                            </div>
                         )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
