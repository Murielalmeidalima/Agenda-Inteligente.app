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
}

export const MonthView = ({ 
  visibleDays, 
  currentDate, 
  appointments, 
  onDayClick 
}: MonthViewProps) => {
  return (
    <div className="flex flex-col h-full bg-white/20">
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
            
            return (
               <div 
                  key={day.toString()} 
                  className={cn(
                     "border-r border-b border-[#E5E0D8] p-2 min-h-[80px] hover:bg-[#FAF6E9]/50 transition-colors cursor-pointer group/cell relative",
                     !isCurrentMonth && "bg-[#F0EBE0]/20 opacity-40"
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
                  
                  <div className="space-y-1">
                     {dayApts.slice(0, 3).map((apt: any) => (
                        <div key={apt.id} className="text-[10px] truncate px-1.5 py-0.5 rounded bg-[#FAF6E9] text-[#5C5855] border border-[#E5E0D8] hover:border-[#D4AF37]/50">
                           {format(new Date(apt.start_time), 'HH:mm')} • {apt.clients?.full_name.split(' ')[0]}
                        </div>
                     ))}
                     {dayApts.length > 3 && (
                        <div className="text-[9px] text-[#8A847C] pl-1 font-bold">+ {dayApts.length - 3} mais</div>
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
  );
};
