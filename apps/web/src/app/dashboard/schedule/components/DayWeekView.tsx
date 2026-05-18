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
import { showToast } from '@/lib/toast-helpers';

interface DayWeekViewProps {
  view: 'day' | 'week';
  visibleDays: Date[];
  appointments: any[];
  onNewAppointment: (date: Date) => void;
  onViewAppointment: (id: string) => void;
  slotInterval: number; // In minutes, e.g., 15, 30, 60
  scheduleBlocks: any[];
  blockHolidays?: boolean;
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
  slotInterval,
  scheduleBlocks,
  blockHolidays = false
}: DayWeekViewProps) => {
  const checkIsBlocked = (date: Date) => {
    const dayOfWeek = date.getDay();
    const dateStr = format(date, 'yyyy-MM-dd');
    const currentTime = format(date, 'HH:mm');

    const found = scheduleBlocks?.find(block => {
      if (!block.is_active) return false;

      // 1. Feriados
      if (block.type === 'holiday') {
        const holidayDateStr = block.date_str || format(new Date(block.start_date), 'yyyy-MM-dd');
        return dateStr === holidayDateStr;
      }

      // 2. Recorrente
      if (block.type === 'recurring') {
        if (block.recurring_day !== dayOfWeek) return false;
        if (block.is_full_day) return true;
        return currentTime >= (block.start_time || '00:00') && currentTime <= (block.end_time || '23:59');
      }

      // 3. Manual / Férias
      const startStr = format(new Date(block.start_date), 'yyyy-MM-dd');
      const endStr = block.end_date ? format(new Date(block.end_date), 'yyyy-MM-dd') : startStr;

      if (dateStr >= startStr && dateStr <= endStr) {
        if (block.is_full_day) return true;
        return currentTime >= (block.start_time || '00:00') && currentTime <= (block.end_time || '23:59');
      }

      return false;
    });

    if (found) {
      const isBlocking = found.type === 'holiday' ? blockHolidays : true;
      return { ...found, isBlocking };
    }
    return null;
  };
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
              isToday(day) ? "bg-[#D4AF37]/5 border-b-[#D4AF37]/30" : "bg-white/95 backdrop-blur-md",
              checkIsBlocked(day) && "bg-red-50/50"
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
                
                const slotTime = new Date(day);
                slotTime.setHours(hour, minute);
                const blockedInfo = checkIsBlocked(slotTime);
                
                return (
                  <div 
                    key={`${hour}:${minute}`} 
                    className={cn(
                      "group/slot cursor-pointer transition-colors relative border-[#E5E0D8]/50",
                      isHour ? "border-b" : "border-b border-dashed",
                      blockedInfo?.isBlocking && "cursor-not-allowed bg-red-100/40",
                      blockedInfo && !blockedInfo.isBlocking && "bg-blue-50/10"
                    )}
                    style={{ height: `${slotHeightPx}px` }}
                    onClick={() => {
                      if (blockedInfo?.isBlocking) {
                        showToast.error('Bloqueado', `Este horário está bloqueado: ${blockedInfo.title}`);
                        return;
                      }
                      const newDate = startOfDay(day);
                      newDate.setHours(hour, minute);
                      onNewAppointment(newDate);
                    }}
                  >
                     {blockedInfo && (
                       <div className="absolute inset-0 flex items-center justify-center px-2">
                         <span className={cn(
                           "text-[9px] font-black truncate uppercase tracking-tighter opacity-70",
                           blockedInfo.isBlocking ? "text-red-600" : "text-blue-600"
                         )}>
                            {blockedInfo.title}
                         </span>
                       </div>
                     )}
                     <div className="absolute inset-x-0 inset-y-1 opacity-0 group-hover/slot:opacity-100 bg-[#D4AF37]/5 transition-opacity flex items-center justify-center rounded-lg mx-1">
                        {!blockedInfo && <Plus className="h-4 w-4 text-[#D4AF37]/30" />}
                     </div>
                  </div>
                );
              })}

              {/* Overlay for full-day blocked days */}
              {(() => {
                const blockedInfo = checkIsBlocked(startOfDay(day));
                if (blockedInfo && blockedInfo.is_full_day && blockedInfo.isBlocking) {
                  return (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-red-50/20 backdrop-blur-[1px] p-4 text-center pointer-events-none">
                       <div className="bg-white/80 border border-red-100 p-4 rounded-2xl shadow-sm animate-in zoom-in-95 fade-in duration-300">
                          <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Não haverá atendimento</p>
                          <p className="text-sm font-black text-red-600 leading-tight italic">{blockedInfo.title}</p>
                       </div>
                    </div>
                  );
                }
                return null;
              })()}

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
                  
                  if (apt.status === 'completed') {
                    if (apt.paymentStatus === 'paid') {
                      // 🟢 Verde — Concluído e Pago
                      cardColors = "bg-emerald-50 ring-emerald-200 text-emerald-800";
                    } else {
                      // 🔴 Vermelho — Concluído e Não Pago (Pendente/Parcial)
                      cardColors = "bg-red-50 ring-red-200 text-red-800";
                    }
                  } else {
                    if (apt.paymentStatus === 'paid') {
                      // 🟢 Verde — Pago antecipadamente (ainda não concluído)
                      cardColors = "bg-emerald-50 ring-emerald-200 text-emerald-800";
                    } else if (now < startDate) {
                      // 🟡 Amarelo — Futuro (ainda não aconteceu e não pago)
                      cardColors = "bg-yellow-50 ring-yellow-200 text-yellow-800";
                    } else if (isSameDay(now, startDate)) {
                      // 🟠 Laranja — Hoje (não concluído e não pago)
                      cardColors = "bg-orange-50 ring-orange-200 text-orange-800";
                    } else {
                      // 🔴 Vermelho — Atrasado (dias anteriores, não pago e não concluído)
                      cardColors = "bg-red-50 ring-red-200 text-red-800";
                    }
                  }

                  // Handle out-of-bounds start times implicitly visually to avoid completely missing them
                  const clampedStartHour = Math.max(SCHEDULE_START_HOUR, startHour);
                  const top = ((clampedStartHour - SCHEDULE_START_HOUR) * 60 + startMin) * PIXELS_PER_MINUTE;
                  const height = duration * PIXELS_PER_MINUTE;
                  
                  const procedureColor = apt.procedures?.color || null;

                  return (
                    <div
                      key={apt.id}
                      className={cn(
                        "absolute left-1.5 right-1.5 rounded-xl p-2 text-[10px] overflow-hidden cursor-pointer shadow-sm transition-all hover:shadow-md hover:scale-[1.02] z-20 group/apt ring-1 ring-inset",
                        cardColors
                      )}
                      style={{ top: `${top}px`, height: `${height}px`, minHeight: '24px', ...(procedureColor ? { borderLeft: `6px solid ${procedureColor}` } : {}) }}
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
                                 "text-[8px] font-black uppercase px-1.5 py-0.5 rounded-sm shrink-0 shadow-sm ml-1",
                                 apt.paymentStatus === 'paid' ? "bg-emerald-500 text-white" :
                                 apt.paymentStatus === 'partial' ? "bg-amber-500 text-white" :
                                 "bg-rose-500 text-white"
                               )}
                             >
                               {apt.paymentStatus === 'paid' ? 'Pago' : apt.paymentStatus === 'partial' ? 'Parcial' : 'Pendente'}
                             </div>
                           )}
                         </div>
                         {height > 35 && ( // só mostra se tiver espaço suficiente
                           <div className="flex flex-col gap-0.5 mb-1">
                             <p className="opacity-80 font-semibold truncate lowercase tracking-tight">
                               {apt.procedures?.name || 'Procedimento'}
                             </p>
                             {apt.is_maintenance && (
                               <span className="text-[8px] uppercase font-black bg-[#D4AF37] text-white px-1.5 py-0.5 rounded-sm w-fit flex items-center gap-1 shadow-sm">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21v-5h5"/></svg>
                                  Manutenção
                               </span>
                             )}
                           </div>
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
