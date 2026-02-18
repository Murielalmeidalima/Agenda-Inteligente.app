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
}

export const DayWeekView = ({ 
  view, 
  visibleDays, 
  appointments, 
  onNewAppointment, 
  onViewAppointment 
}: DayWeekViewProps) => {
  const timeSlots = Array.from({ length: 14 }, (_, i) => i + 8); // 08:00 to 21:00

  return (
    <div className="grid grid-cols-[60px_1fr] md:grid-cols-[70px_1fr] flex-1 overflow-auto custom-scrollbar relative">
      <div className="border-r border-[#E5E0D8] bg-[#FDFBF7]/50 pt-14 sticky left-0 z-40 w-full backdrop-blur-sm">
        {timeSlots.map((hour) => (
          <div key={hour} className="h-20 border-b border-[#E5E0D8]/50 px-2 md:px-3 text-right">
            <span className="text-[10px] font-black text-[#8A847C] uppercase">
              {hour.toString().padStart(2, '0')}:00
            </span>
          </div>
        ))}
      </div>

      <div 
        className="grid flex-1 min-w-0" 
        style={{ 
          gridTemplateColumns: `repeat(${view === 'day' ? 1 : 7}, minmax(${view === 'day' ? '100%' : '140px'}, 1fr))` 
        }}
      >
        {visibleDays.map((day) => (
          <div key={day.toString()} className="border-r border-[#E5E0D8] last:border-r-0 min-w-0">
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

            <div className="relative h-[1120px] bg-white/50 hover:bg-white/80 transition-colors">
              {timeSlots.map((hour) => (
                <div 
                  key={hour} 
                  className="h-20 border-b border-dashed border-[#E5E0D8]/50 group/slot cursor-pointer transition-colors relative"
                  onClick={() => {
                    const newDate = startOfDay(day);
                    newDate.setHours(hour);
                    onNewAppointment(newDate);
                  }}
                >
                   <div className="absolute inset-x-0 inset-y-1 opacity-0 group-hover/slot:opacity-100 bg-[#D4AF37]/5 transition-opacity flex items-center justify-center rounded-lg mx-1">
                      <Plus className="h-4 w-4 text-[#D4AF37]/30" />
                   </div>
                </div>
              ))}

              {appointments
                .filter((apt: any) => isSameDay(new Date(apt.start_time), day))
                .map((apt: any) => {
                  const startDate = new Date(apt.start_time);
                  const startHour = startDate.getHours();
                  const startMin = startDate.getMinutes();
                  const duration = apt.procedures?.duration_minutes || 60;
                  
                  const top = (startHour - 8) * 80 + (startMin / 60) * 80;
                  const height = (duration / 60) * 80;

                  return (
                    <div
                      key={apt.id}
                      className={cn(
                        "absolute left-1.5 right-1.5 rounded-xl p-3 text-[10px] overflow-hidden cursor-pointer border shadow-sm transition-all hover:shadow-lg hover:scale-[1.02] z-20 group/apt",
                        apt.status === 'confirmed' ? "bg-emerald-50 border-emerald-200 text-emerald-700" :
                        apt.status === 'scheduled' ? "bg-[#FAF6E9] border-[#D4AF37]/30 text-[#8A6D1B]" :
                        "bg-[#F0EBE0] border-[#E5E0D8] text-[#5C5855]"
                      )}
                      style={{ top: `${top}px`, height: `${height}px` }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewAppointment(apt.id);
                      }}
                    >
                      <div className="flex flex-col h-full justify-between">
                         <div>
                            <p className="font-black text-xs truncate group-hover/apt:text-[#2C2825] transition-colors">{apt.clients?.full_name || 'Individual'}</p>
                            <p className="opacity-70 font-medium truncate mt-0.5 uppercase tracking-tighter">{apt.procedures?.name || 'Procedimento'}</p>
                         </div>
                         {(height > 40) && (
                            <div className="flex items-center gap-1.5 opacity-80 font-bold">
                               <Clock className="h-3 w-3" />
                               <span>{format(startDate, 'HH:mm')}</span>
                               <div className="ml-auto w-1 h-3 rounded-full bg-current opacity-40" />
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
