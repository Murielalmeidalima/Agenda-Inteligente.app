'use client';

import { useState } from 'react';
import { 
  format, 
  startOfDay, 
  startOfWeek,
  addDays,
  isToday,
  isSameDay
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Plus, 
  Clock,
  ShieldAlert
} from 'lucide-react';
import { cn } from '@projeto/ui';
import { Appointment } from '@/types/database';
import { showToast } from '@/lib/toast-helpers';
import { isClientNearBirthday } from '@/lib/birthday';

interface DayWeekViewProps {
  view: 'day' | 'week';
  visibleDays: Date[];
  appointments: any[];
  onNewAppointment: (date: Date) => void;
  onViewAppointment: (id: string) => void;
  onDaySelect?: (date: Date) => void;
  slotInterval: number; // In minutes, e.g., 15, 30, 60
  scheduleBlocks: any[];
  blockHolidays?: boolean;
  procedures?: any[];
}

const PIXELS_PER_MINUTE = 2; // 120 pixels per hour
const SCHEDULE_START_HOUR = 0;
const SCHEDULE_END_HOUR = 24; // goes up to 23:xx

export const DayWeekView = ({ 
  view, 
  visibleDays, 
  appointments, 
  onNewAppointment, 
  onViewAppointment,
  onDaySelect,
  slotInterval,
  scheduleBlocks,
  blockHolidays = false,
  procedures = []
}: DayWeekViewProps) => {
  const [hoveredAptId, setHoveredAptId] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const handleMouseEnter = (e: React.MouseEvent, aptId: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const tooltipWidth = 256;
    let x = rect.right + 8;
    if (x + tooltipWidth > window.innerWidth) {
      x = rect.left - tooltipWidth - 8;
    }
    setTooltipPos({
      x: Math.max(8, x),
      y: rect.top
    });
    setHoveredAptId(aptId);
  };

  const handleMouseLeave = () => {
    setHoveredAptId(null);
  };

  const checkIsBlocked = (date: Date) => {
    const dayOfWeek = date.getDay();
    const dateStr = format(date, 'yyyy-MM-dd');
    const currentTime = format(date, 'HH:mm');

    const found = scheduleBlocks?.find(block => {
      if (!block.is_active) return false;

      // 1. Feriados
      if (block.type === 'holiday') {
        const holidayDateStr = block.date_str || block.start_date.substring(0, 10);
        return dateStr === holidayDateStr;
      }

      // 2. Recorrente
      if (block.type === 'recurring') {
        if (block.recurring_day !== dayOfWeek) return false;
        if (block.is_full_day) return true;
        return currentTime >= (block.start_time || '00:00') && currentTime <= (block.end_time || '23:59');
      }

      // 3. Manual / Férias
      const startStr = block.start_date.substring(0, 10);
      const endStr = block.end_date ? block.end_date.substring(0, 10) : startStr;

      if (dateStr >= startStr && dateStr <= endStr) {
        if (block.is_full_day) return true;
        return currentTime >= (block.start_time || '00:00') && currentTime <= (block.end_time || '23:59');
      }

      return false;
    });

    if (found) {
      const isBlocking = blockHolidays;
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

  // Faixa fixa dos dias da semana (não some ao rolar)
  const weekStart = startOfWeek(visibleDays[0] || new Date(), { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const selectedDay = visibleDays[0];

  const getClientBirthDate = (apt: any): string | null => {
    const c = apt?.clients;
    if (Array.isArray(c)) return c[0]?.birth_date || null;
    return c?.birth_date || null;
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full h-full bg-white select-none">

      {/* Faixa Fixa dos Dias da Semana */}
      <div className="shrink-0 border-b border-[#E5E0D8] bg-white px-2 pt-2 pb-0 z-50">
        <div className="grid grid-cols-7 gap-1.5">
          {weekDays.map((day) => {
            const active = isSameDay(day, selectedDay);
            const today = isToday(day);
            return (
              <button
                key={day.toString()}
                type="button"
                onClick={() => onDaySelect?.(day)}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-lg px-1 py-1.5 border transition-colors",
                  active
                    ? "bg-[#2C2825] text-white border-[#2C2825] shadow-sm"
                    : today
                      ? "bg-[#FAF6EE] text-[#D4AF37] border-[#D4AF37]/40 hover:border-[#D4AF37]"
                      : "bg-[#FAF9F6] text-[#5C5855] border-[#E5E0D8] hover:bg-[#FAF6EE] hover:border-[#D4AF37]/40"
                )}
              >
                <span className="text-[9px] font-black uppercase tracking-wider">{format(day, 'EEE', { locale: ptBR })}</span>
                <span className="text-[11px] font-black leading-none">{format(day, 'dd')}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar relative w-full select-none">
      <div className="inline-block min-w-full align-middle">
        
        {/* 1. STICKY HEADER ROW (Cabeçalho Fixo no Topo) */}
        <div className="sticky top-0 z-40 flex border-b border-[#E5E0D8] bg-white shadow-xs">
          
          {/* Canto Superior Esquerdo (Fixo em Top e Left) */}
          <div className="sticky left-0 z-50 w-[60px] md:w-[75px] shrink-0 border-r border-[#E5E0D8] bg-[#FDFBF7] h-14 flex items-center justify-center shadow-xs">
            <Clock className="w-4 h-4 text-[#8A847C]/80" />
          </div>

          {/* Colunas do Cabeçalho de Dias (Sincronizadas com a Grade) */}
          <div 
            className={cn(
              "grid flex-1 min-w-0 bg-white",
              view === 'day' ? "grid-cols-1" : "grid-cols-7 min-w-[700px] md:min-w-[950px] lg:min-w-0"
            )}
          >
            {visibleDays.map((day) => (
              <div 
                key={day.toString()}
                className={cn(
                  "h-14 flex flex-col items-center justify-center border-r border-[#E5E0D8] last:border-r-0 relative transition-colors",
                  isToday(day) ? "bg-[#FAF6EE]" : "bg-white",
                  checkIsBlocked(day) && "bg-red-50/50"
                )}
              >
                <span className={cn(
                  "text-[10px] uppercase font-black tracking-widest",
                  isToday(day) ? "text-[#D4AF37]" : "text-[#8A847C]"
                )}>
                  {format(day, 'EEE', { locale: ptBR })}
                </span>
                <span className={cn(
                  "text-base md:text-xl font-black leading-tight",
                  isToday(day) ? "text-[#2C2825]" : "text-[#5C5855]"
                )}>
                  {format(day, 'dd')}
                </span>
                {isToday(day) && (
                  <div className="absolute bottom-0 w-8 h-[2px] bg-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.5)]" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 2. BODY CONTENT ROW (Coluna de Horários + Grade de Dias) */}
        <div className="flex">
          
          {/* Coluna de Horários Fixo à Esquerda */}
          <div className="sticky left-0 z-30 w-[60px] md:w-[75px] shrink-0 border-r border-[#E5E0D8] bg-[#FDFBF7]/95 backdrop-blur-sm select-none">
            {timeSlots.map(({hour, minute}) => {
              const isHour = minute === 0;
              return (
                <div 
                  key={`${hour}:${minute}`} 
                  className={cn(
                    "px-1.5 md:px-3 text-right flex flex-col justify-start pt-1 border-[#E5E0D8]/50",
                    isHour ? "border-b" : "border-b border-dashed border-opacity-30"
                  )}
                  style={{ height: `${slotHeightPx}px` }}
                >
                  {(isHour || visualSlotInterval >= 30) && (
                    <span className={cn(
                      "font-black uppercase tracking-tight",
                      isHour ? "text-xs md:text-sm text-[#5C5855]" : "text-[10px] text-[#8A847C]/70"
                    )}>
                      {hour.toString().padStart(2, '0')}:{minute.toString().padStart(2, '0')}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Grade de Colunas dos Dias (Agendamentos e Clicks) */}
          <div 
            className={cn(
              "grid flex-1 min-w-0",
              view === 'day' ? "grid-cols-1" : "grid-cols-7 min-w-[700px] md:min-w-[950px] lg:min-w-0"
            )}
          >
            {visibleDays.map((day) => (
              <div key={day.toString()} className="border-r border-[#E5E0D8] last:border-r-0 min-w-0 relative">
                
                {/* Slots and Appointments Container */}
                <div 
                  className="relative bg-white/50 hover:bg-white/80 transition-colors"
                  style={{ height: `${totalHeightPx}px` }}
                >
                  {/* Background Clickable Slots */}
                  {timeSlots.map(({hour, minute}) => {
                    const isHour = minute === 0;
                    const now = new Date();
                    const slotTime = new Date(day);
                    slotTime.setHours(hour, minute, 0, 0);
                    const blockedInfo = checkIsBlocked(slotTime);
                    const isPastSlot = slotTime < new Date(now.getTime() - 2 * 60 * 1000);
                    
                    return (
                      <div 
                        key={`${hour}:${minute}`} 
                        className={cn(
                          "group/slot cursor-pointer transition-colors relative border-[#E5E0D8]/50",
                          isHour ? "border-b" : "border-b border-dashed",
                          isPastSlot && "bg-neutral-50/50 opacity-60 cursor-not-allowed",
                          blockedInfo?.isBlocking && "cursor-not-allowed bg-red-100/40",
                          blockedInfo && !blockedInfo.isBlocking && "bg-blue-50/10"
                        )}
                        style={{ height: `${slotHeightPx}px` }}
                        onClick={() => {
                          if (isPastSlot) {
                            showToast.error(
                              'Operação não permitida',
                              'Não é possível criar um agendamento em uma data ou horário que já passou. Caso este atendimento tenha sido realizado sem agendamento prévio, utilize a opção \'Lançar Atendimento\'.'
                            );
                            return;
                          }
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

                  {/* Overlay para Dias de Bloqueio Integral */}
                  {(() => {
                    const blockedInfo = checkIsBlocked(startOfDay(day));
                    if (blockedInfo && blockedInfo.is_full_day && blockedInfo.isBlocking) {
                      return (
                        <div className="absolute inset-x-0 bottom-0 top-0 z-20 flex flex-col items-center justify-center bg-[#FAF6E9]/95 border-l border-r border-[#E5E0D8]/40 p-4 text-center animate-in fade-in duration-200">
                           <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-3 shadow-inner">
                             <ShieldAlert className="h-5 w-5" />
                           </div>
                           <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">Dia Bloqueado</p>
                           <p className="text-xs font-black text-neutral-700 leading-snug max-w-[140px] mb-2">{blockedInfo.title}</p>
                           {blockedInfo.notes && (
                             <p className="text-[9px] text-neutral-400 italic max-w-[120px]">{blockedInfo.notes}</p>
                           )}
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Renderização dos Agendamentos */}
                  {appointments
                    .filter((apt: any) => isSameDay(new Date(apt.start_time), day) && apt.status !== 'cancelled')
                    .map((apt: any) => {
                      const startDate = new Date(apt.start_time);
                      const startHour = startDate.getHours();
                      const startMin = startDate.getMinutes();
                      
                      let endDate = new Date(apt.start_time);
                      let duration = apt.procedures?.duration_minutes || 60;
                      if (apt.end_time) {
                        endDate = new Date(apt.end_time);
                        duration = (endDate.getTime() - startDate.getTime()) / 60000;
                      } else {
                        endDate.setMinutes(endDate.getMinutes() + duration);
                      }

                      // Lógica de Cores Inteligente
                      let cardColors = "bg-[#F0EBE0] ring-[#E5E0D8] text-[#5C5855]";
                      
                      if (apt.status === 'cancelled' || apt.paymentStatus === 'cancelled') {
                        cardColors = "bg-neutral-100 ring-neutral-300 text-neutral-400 line-through opacity-75 grayscale";
                      } else if (apt.paymentStatus === 'paid') {
                        cardColors = "bg-emerald-50 ring-emerald-200 text-emerald-800";
                      } else if (apt.paymentStatus === 'advance_payment') {
                        cardColors = "bg-blue-50 ring-blue-200 text-blue-800";
                      } else if (apt.paymentStatus === 'partial') {
                        cardColors = "bg-orange-50 ring-orange-200 text-orange-800";
                      } else if (apt.paymentStatus === 'overdue') {
                        cardColors = "bg-red-50 ring-red-200 text-red-800";
                      } else if (apt.paymentStatus === 'pending') {
                        cardColors = "bg-yellow-50 ring-yellow-200 text-yellow-800";
                      }

                      const clampedStartHour = Math.max(SCHEDULE_START_HOUR, startHour);
                      const top = ((clampedStartHour - SCHEDULE_START_HOUR) * 60 + startMin) * PIXELS_PER_MINUTE;
                      const height = duration * PIXELS_PER_MINUTE;
                      
                      const procedureColor = apt.procedures?.color || null;

                      return (
                        <div
                          key={apt.id}
                          className={cn(
                            "absolute left-1.5 right-1.5 rounded-xl p-2 text-[10px] overflow-hidden cursor-pointer shadow-sm transition-all hover:shadow-md hover:scale-[1.02] z-20 group/apt ring-1 ring-inset flex flex-col justify-between",
                            cardColors
                          )}
                          style={{ top: `${top}px`, height: `${height}px`, minHeight: '24px', ...(procedureColor ? { borderLeft: `6px solid ${procedureColor}` } : {}) }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewAppointment(apt.id);
                          }}
                          onMouseEnter={(e) => handleMouseEnter(e, apt.id)}
                          onMouseLeave={handleMouseLeave}
                        >
                          <div className="flex flex-col h-full justify-between">
                            <div>
                              {/* Cliente e Badge de Status Financeiro */}
                              <div className="flex justify-between items-start gap-1">
                                <div className="flex items-center gap-1 min-w-0 pr-1">
                                  {apt.is_maintenance && (
                                    <span className="shrink-0 bg-purple-100 text-purple-800 border border-purple-300 text-[8px] font-black px-1 py-0.5 rounded shadow-2xs" title="Agendamento de Manutenção">
                                      🔄 Manut.
                                    </span>
                                  )}
                                  {getClientBirthDate(apt) && isClientNearBirthday(getClientBirthDate(apt)) && (
                                    <span className="shrink-0 text-[9px] leading-none" title="Aniversário por esses dias 🎂">
                                      🎂
                                    </span>
                                  )}
                                  <p className="font-black text-[11px] leading-tight truncate group-hover/apt:text-[#2C2825] transition-colors">
                                    {apt.clients?.full_name || 'Individual'}
                                  </p>
                                </div>
                                <div 
                                  className={cn(
                                    "text-[8px] font-black uppercase px-1.5 py-0.5 rounded-sm shrink-0 shadow-sm",
                                    (apt.status === 'cancelled' || apt.paymentStatus === 'cancelled') ? "bg-neutral-500 text-white" :
                                    apt.paymentStatus === 'paid' ? "bg-emerald-500 text-white" :
                                    apt.paymentStatus === 'advance_payment' ? "bg-blue-500 text-white" :
                                    apt.paymentStatus === 'partial' ? "bg-amber-500 text-white" :
                                    apt.paymentStatus === 'overdue' ? "bg-rose-500 text-white" :
                                    apt.paymentStatus === 'pending' ? "bg-yellow-500 text-neutral-800" :
                                    "bg-neutral-500 text-white"
                                  )}
                                >
                                  {(apt.status === 'cancelled' || apt.paymentStatus === 'cancelled') ? '❌ Cancelado' :
                                   apt.paymentStatus === 'paid' ? 'Pago' : 
                                   apt.paymentStatus === 'advance_payment' ? 'Antecipado' : 
                                   apt.paymentStatus === 'partial' ? 'Parcial' : 
                                   apt.paymentStatus === 'overdue' ? 'Pendente' : 
                                   apt.paymentStatus === 'pending' ? 'Futuro' : 
                                   'Cancelado'}
                                </div>
                              </div>

                              {/* Procedimento e Valor */}
                              <div className="flex flex-wrap items-center justify-between gap-1 mt-0.5 opacity-90">
                                <p 
                                  className={cn(
                                    "font-bold text-[10px] leading-tight break-words",
                                    height <= 35 ? "truncate" :
                                    height <= 55 ? "line-clamp-2" :
                                    height <= 90 ? "line-clamp-3" : ""
                                  )}
                                >
                                  {(() => {
                                    const primaryName = apt.procedures?.name || 'Procedimento';
                                    if (Array.isArray(apt.additional_procedure_ids) && apt.additional_procedure_ids.length > 0) {
                                      const extraNames = apt.additional_procedure_ids
                                        .map((id: string) => procedures.find((p: any) => p.id === id)?.name)
                                        .filter(Boolean);
                                      if (extraNames.length > 0) {
                                        return `${primaryName} + ${extraNames.join(' + ')}`;
                                      }
                                    }
                                    return primaryName;
                                  })()}
                                </p>
                                <p className="font-black text-[10px] text-inherit shrink-0">
                                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(apt.price_override || apt.procedures?.price || 0)}
                                </p>
                              </div>

                              {/* Painel Informativo para Cards Altos */}
                              {height > 55 && (
                                <div className="flex flex-col gap-0.5 mt-1 border-t border-current/10 pt-1 text-[9px]">
                                  {apt.profiles?.full_name && (
                                    <p className="font-bold opacity-80 truncate">
                                      👤 {apt.profiles.full_name}
                                    </p>
                                  )}
                                  {apt.notes && (
                                    <p className="font-medium opacity-75 line-clamp-2 italic leading-tight">
                                      💬 {apt.notes}
                                    </p>
                                  )}
                                  
                                  {height > 90 && Array.isArray(apt.additional_procedure_ids) && apt.additional_procedure_ids.length > 0 && (
                                    <div className="mt-1 space-y-0.5 border-t border-current/5 pt-1 text-[8px] opacity-90 animate-in fade-in">
                                      <p className="font-bold uppercase tracking-wider text-[6.5px] opacity-60">Procedimentos Extras:</p>
                                      {apt.additional_procedure_ids
                                        .map((id: string) => procedures.find((p: any) => p.id === id)?.name)
                                        .filter(Boolean)
                                        .map((name: string, i: number) => (
                                          <p key={i} className="truncate font-semibold leading-tight">+ {name}</p>
                                        ))
                                      }
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Horário e Forma de Pagamento */}
                            {height > 35 && (
                              <div className="flex items-center justify-between opacity-70 text-[9px] font-bold mt-1">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-2.5 w-2.5" />
                                  <span>{format(startDate, 'HH:mm')}</span>
                                </div>
                                
                                {apt.paymentMethod && (
                                  <span className="text-[8px] font-black truncate uppercase">
                                    {apt.paymentMethod === 'pix' ? '📱 PIX' :
                                     apt.paymentMethod === 'credit_card' ? '💳 CARTÃO' :
                                     apt.paymentMethod === 'debit_card' ? '💳 CARTÃO' :
                                     apt.paymentMethod === 'cash' ? '💵 DINHEIRO' :
                                     `🏦 ${apt.paymentMethod.toUpperCase().replace('_', ' ')}`}
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

      </div>

      {/* Tooltip Flutuante no Hover */}
      {hoveredAptId && (() => {
        const apt = appointments.find(a => a.id === hoveredAptId);
        if (!apt) return null;
        const procedure = Array.isArray(apt.procedures) ? apt.procedures[0] : apt.procedures;
        
        return (
          <div 
            className="fixed z-[100] bg-slate-950 text-white rounded-2xl p-4 shadow-2xl border border-neutral-800 w-64 pointer-events-none text-xs space-y-2 animate-in fade-in zoom-in-95 duration-150"
            style={{ 
              left: `${tooltipPos.x}px`, 
              top: `${tooltipPos.y}px` 
            }}
          >
            <div className="font-black text-sm border-b border-neutral-800 pb-1.5 mb-1.5 flex items-center justify-between">
              <span>{apt.clients?.full_name}</span>
            </div>
            <div>
              <span className="text-[10px] text-neutral-400 block uppercase font-black tracking-wider">Procedimento(s)</span>
              <span className="font-bold text-white block">
                {(() => {
                  const primaryName = procedure?.name || 'Procedimento';
                  if (Array.isArray(apt.additional_procedure_ids) && apt.additional_procedure_ids.length > 0) {
                    const extraNames = apt.additional_procedure_ids
                      .map((id: string) => procedures.find((p: any) => p.id === id)?.name)
                      .filter(Boolean);
                    if (extraNames.length > 0) {
                      return `${primaryName} + ${extraNames.join(' + ')}`;
                    }
                  }
                  return primaryName;
                })()}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-neutral-400 block uppercase font-black tracking-wider">Valor</span>
                <span className="font-bold text-emerald-400">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(apt.price_override || procedure?.price || 0)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 block uppercase font-black tracking-wider">Forma</span>
                <span className="font-bold text-white">
                  {apt.paymentMethod === 'pix' ? '📱 PIX' :
                   apt.paymentMethod === 'credit_card' ? '💳 Cartão' :
                   apt.paymentMethod === 'debit_card' ? '💳 Cartão' :
                   apt.paymentMethod === 'cash' ? '💵 Dinheiro' :
                   apt.paymentMethod ? `🏦 ${apt.paymentMethod.toUpperCase()}` : '-'}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-neutral-400 block uppercase font-black tracking-wider">Status</span>
                <span className="font-bold text-white">
                  {apt.paymentStatus === 'paid' ? '🟢 Pago' :
                   apt.paymentStatus === 'partial' ? '🟠 Parcial' :
                   apt.paymentStatus === 'overdue' ? '🔴 Pendente' :
                   apt.paymentStatus === 'advance_payment' ? '🔵 Antecipado' : '🟡 Futuro'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 block uppercase font-black tracking-wider">Profissional</span>
                <span className="font-bold text-white truncate block">
                  {apt.profiles?.full_name || '-'}
                </span>
              </div>
            </div>
            {apt.notes && (
              <div className="border-t border-neutral-800 pt-1.5 mt-1.5">
                <span className="text-[10px] text-neutral-400 block uppercase font-black tracking-wider">Observações</span>
                <p className="text-neutral-300 italic font-medium leading-relaxed break-words">{apt.notes}</p>
              </div>
            )}
          </div>
        );
      })()}
      </div>
    </div>
  );
};
