'use client';

import { 
  format, 
  isToday,
  isSameDay,
  isSameMonth
} from 'date-fns';
import { Plus } from 'lucide-react';
import { Badge, cn } from '@projeto/ui';
import { Appointment } from '@/types/database';

interface MonthViewProps {
  visibleDays: Date[];
  currentDate: Date;
  appointments: any[];
  onDayClick: (day: Date) => void;
  onViewAppointment: (id: string) => void;
  scheduleBlocks: any[];
  blockHolidays?: boolean;
}

export const MonthView = ({ 
  visibleDays, 
  currentDate, 
  appointments, 
  onDayClick,
  onViewAppointment,
  scheduleBlocks,
  blockHolidays = false
}: MonthViewProps) => {
  const checkIsBlocked = (day: Date) => {
    const dayOfWeek = day.getDay();
    const dateStr = format(day, 'yyyy-MM-dd');
    
    const found = scheduleBlocks?.find(block => {
      if (!block.is_active) return false;

      // 1. Feriados
      if (block.type === 'holiday') {
        const holidayDateStr = block.date_str || format(new Date(block.start_date), 'yyyy-MM-dd');
        return dateStr === holidayDateStr;
      }

      // 2. Recorrente
      if (block.type === 'recurring') {
        return block.recurring_day === dayOfWeek;
      }

      // 3. Manual / Férias
      const startStr = format(new Date(block.start_date), 'yyyy-MM-dd');
      const endStr = block.end_date ? format(new Date(block.end_date), 'yyyy-MM-dd') : startStr;

      return dateStr >= startStr && dateStr <= endStr;
    });

    if (found) {
      const isBlocking = found.type === 'holiday' ? blockHolidays : true;
      return { ...found, isBlocking };
    }
    return null;
  };
  return (
    <div className="w-full overflow-x-auto custom-scrollbar">
      <div className="min-w-[950px] flex flex-col h-full bg-white/20">
        <div className="grid grid-cols-7 border-b border-[#E5E0D8] bg-[#FAF6E9]/50">
           {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(dayName => (
              <div key={dayName} className="py-3 text-center text-[10px] font-black text-[#8A847C] uppercase tracking-widest">
                 {dayName}
              </div>
           ))}
        </div>
        <div className="grid grid-cols-7 grid-rows-5 flex-1">
           {visibleDays.map((day) => {
              const isCurrentMonth = isSameMonth(day, currentDate);
              const dayApts = appointments.filter((apt) => isSameDay(new Date(apt.start_time), day));
              const blockedInfo = checkIsBlocked(day);
              
              return (
                  <div 
                     key={day.toString()} 
                     className={cn(
                        "border-r border-b border-[#E5E0D8] p-2 min-h-[145px] md:min-h-[160px] hover:bg-[#FAF6E9]/50 transition-colors cursor-pointer group/cell relative flex flex-col justify-between",
                        !isCurrentMonth && "bg-[#F0EBE0]/20 opacity-40",
                        blockedInfo?.isBlocking && "bg-red-50/30 hover:bg-red-50/40",
                        blockedInfo && !blockedInfo.isBlocking && "bg-blue-50/10 hover:bg-blue-50/20"
                     )}
                     onClick={() => onDayClick(day)}
                  >
                    <div className="flex items-center justify-between mb-2">
                       <div className={cn(
                          "h-7 w-7 flex items-center justify-center rounded-lg text-sm font-bold",
                          isToday(day) ? "bg-[#D4AF37] text-white shadow-lg" : "text-[#8A847C] group-hover/cell:text-[#2C2825]"
                       )}>
                          {format(day, 'd')}
                       </div>
                       {dayApts.length > 0 && (
                          <Badge variant="outline" className="text-[10px] border-[#E5E0D8] text-[#8A847C] px-1.5 h-5 bg-white">
                             {dayApts.length}
                          </Badge>
                       )}
                    </div>
                    
                    <div className="space-y-1 flex-1">
                        {blockedInfo ? (
                          <div className="flex flex-col items-center justify-center py-2 gap-1 animate-in fade-in zoom-in-95">
                            <span className={cn(
                              "text-[8px] font-black uppercase tracking-tighter text-center leading-none",
                              blockedInfo.isBlocking ? "text-red-400" : "text-blue-400"
                            )}>
                              {blockedInfo.isBlocking ? 'Indisponível' : 'Feriado'}
                            </span>
                            <span className={cn(
                              "text-[9px] font-bold text-center leading-tight",
                              blockedInfo.isBlocking ? "text-red-600" : "text-blue-600"
                            )}>{blockedInfo.title}</span>
                          </div>
                        ) : (
                          <>
                            {dayApts.slice(0, 3).map((apt: any) => {
                              let itemColors = "bg-[#FAF6E9] border-[#E5E0D8] text-[#5C5855]";
                              
                              if (apt.paymentStatus === 'cancelled') {
                                itemColors = "bg-neutral-50 border-neutral-200 text-neutral-400 line-through";
                              } else if (apt.paymentStatus === 'paid') {
                                itemColors = "bg-emerald-50 border-emerald-200 text-emerald-800";
                              } else if (apt.paymentStatus === 'advance_payment') {
                                itemColors = "bg-blue-50 border-blue-200 text-blue-800";
                              } else if (apt.paymentStatus === 'partial') {
                                itemColors = "bg-orange-50 border-orange-200 text-orange-800";
                              } else if (apt.paymentStatus === 'overdue') {
                                itemColors = "bg-red-50 border-red-200 text-red-800";
                              } else if (apt.paymentStatus === 'pending') {
                                itemColors = "bg-yellow-50 border-yellow-200 text-yellow-800";
                              }

                              const procedureColor = apt.procedures?.color || null;
                              const primaryName = apt.procedures?.name || 'Procedimento';
                              const paymentMethodText = apt.paymentMethod ? apt.paymentMethod.toUpperCase().replace('_', ' ') : '';
                              const statusText = apt.paymentStatus === 'paid' ? 'Pago' : 
                                                 apt.paymentStatus === 'advance_payment' ? 'Ant.' : 
                                                 apt.paymentStatus === 'partial' ? 'Parc.' : 
                                                 apt.paymentStatus === 'overdue' ? 'Atr.' : 
                                                 apt.paymentStatus === 'pending' ? 'Pend.' : 
                                                 'Canc.';

                              return (
                                <div 
                                  key={apt.id} 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onViewAppointment(apt.id);
                                  }}
                                  className={cn(
                                    "text-[9px] px-1.5 py-1 rounded-md border hover:border-[#D4AF37]/50 transition-all flex flex-col gap-0.5 shadow-xs leading-tight mb-1",
                                    itemColors
                                  )}
                                  style={procedureColor ? { borderLeft: `3px solid ${procedureColor}` } : {}}
                                >
                                  {/* Time and Status */}
                                  <div className="flex justify-between items-center gap-1 font-black text-[8px]">
                                    <span>{format(new Date(apt.start_time), 'HH:mm')}</span>
                                    <span className="text-[7px] uppercase tracking-tighter opacity-80">{statusText}</span>
                                  </div>
                                  
                                  {/* Client Name */}
                                  <p className="font-extrabold text-[9px] truncate">
                                    {apt.clients?.full_name || 'Cliente'}
                                  </p>
                                  
                                  {/* Procedure Name */}
                                  <p className="font-bold opacity-90 truncate text-[8px]">
                                    {primaryName}
                                  </p>
                                  
                                  {/* Payment Method & Notes */}
                                  <div className="flex justify-between items-center text-[7px] opacity-75 mt-0.5 border-t border-current/10 pt-0.5 gap-1">
                                    <span className="truncate flex-1">{apt.notes || 'Sem obs'}</span>
                                    <span className="font-black shrink-0 text-[6.5px]">{paymentMethodText || 'A DEF.'}</span>
                                  </div>
                                </div>
                              );
                            })}
                            {dayApts.length > 3 && (
                                <div className="text-[9px] text-[#8A847C] pl-1 font-bold">+ {dayApts.length - 3} mais</div>
                            )}
                          </>
                        )}
                     </div>
                    
                    <div className="absolute inset-0 opacity-0 group-hover/cell:opacity-100 flex items-center justify-center pointer-events-none">
                       <Plus className="h-8 w-8 text-[#D4AF37]/20" />
                    </div>
                 </div>
              );
           })}
         </div>
      </div>
    </div>
  );
};
