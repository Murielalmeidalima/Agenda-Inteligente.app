'use client';

import { useState, useEffect } from 'react';
import ScheduleCalendar from './ScheduleCalendarComponent';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  Button,
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Label,
  TextArea
} from '@projeto/ui';
import { Appointment } from '@/types/database';
import { createBrowserClient } from '@/lib/supabase-browser';
import { format, addMinutes } from 'date-fns';
import { Plus, Settings2, CalendarOff } from 'lucide-react';
import { EditAppointmentModal } from './edit-appointment-modal';
import { BlockDaysModal } from './components/BlockDaysModal';
import { showToast } from '@/lib/toast-helpers';
import { isWithinInterval, startOfDay, endOfDay } from 'date-fns';

interface ScheduleCalendarClientProps {
  initialAppointments: any[];
  clients: { id: string, full_name: string }[];
  procedures: { id: string, name: string, duration_minutes: number, price: number }[];
  professionals: { id: string, full_name: string }[];
  companyId: string;
}

export default function ScheduleCalendarClient({
  initialAppointments,
  clients,
  procedures,
  professionals,
  companyId
}: ScheduleCalendarClientProps) {
  const [appointments, setAppointments] = useState(initialAppointments);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slotInterval, setSlotInterval] = useState<number>(30);
  
  const [formData, setFormData] = useState({
    clientId: '',
    procedureId: '',
    professionalId: '',
    startTime: '',
    notes: ''
  });

  // Edit Modal State
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Block Modal State
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [scheduleBlocks, setScheduleBlocks] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [showHolidays, setShowHolidays] = useState(false);
  const [blockHolidays, setBlockHolidays] = useState(false);

  const fetchSettings = async () => {
    const supabase = createBrowserClient();
    const { data } = await supabase
      .from('companies')
      .select('settings')
      .eq('id', companyId)
      .single();
    if (data?.settings) {
      setShowHolidays(data.settings.show_holidays || false);
      setBlockHolidays(data.settings.block_holidays || false);
    }
  };

  const fetchHolidays = async () => {
    try {
      const currentYear = new Date().getFullYear();
      const nextYear = currentYear + 1;
      
      const fetchYear = async (y: number) => {
        const response = await fetch(`https://brasilapi.com.br/api/feriados/v1/${y}`);
        return await response.json();
      };

      const [dataCurrent, dataNext] = await Promise.all([fetchYear(currentYear), fetchYear(nextYear)]);
      
      const allHolidays = [...(Array.isArray(dataCurrent) ? dataCurrent : []), ...(Array.isArray(dataNext) ? dataNext : [])];
      
      if (allHolidays.length > 0) {
        console.log('Holidays fetched:', allHolidays.length);
        setHolidays(allHolidays.map(h => ({
          ...h,
          title: h.name,
          type: 'holiday',
          date_str: h.date, // Guardar a string direta do feriado
          start_date: new Date(h.date + 'T12:00:00Z').toISOString(),
          is_full_day: true,
          is_active: true
        })));
      }
    } catch (err) {
      console.error('Error fetching holidays:', err);
    }
  };

  const fetchBlocks = async () => {
    const supabase = createBrowserClient();
    const { data } = await supabase
      .from('schedule_blocks')
      .select('*')
      .eq('company_id', companyId);
    setScheduleBlocks(data || []);
  };

  useEffect(() => {
    fetchBlocks();
    fetchSettings();
    fetchHolidays();
  }, [companyId]);

  const handleNewAppointment = (date: Date) => {
    // Verificar se o dia está bloqueado antes de abrir
    const isBlocked = checkIsBlocked(date);
    if (isBlocked) {
      showToast.error('Indisponível', 'Este dia ou horário está bloqueado para atendimentos.');
      return;
    }

    setFormData({
      ...formData,
      startTime: format(date, "yyyy-MM-dd'T'HH:mm")
    });
    setIsModalOpen(true);
  };

  const checkIsBlocked = (date: Date) => {
    const dayOfWeek = date.getDay();
    const dateStr = format(date, 'yyyy-MM-dd');
    const currentTime = format(date, 'HH:mm');
    const allBlocks = [...scheduleBlocks, ...(showHolidays ? holidays : [])];

    return allBlocks.find(block => {
      if (!block.is_active) return false;

      // 1. Feriados (BrasilAPI usa formato 'yyyy-MM-dd')
      if (block.type === 'holiday') {
        const holidayDateStr = block.date_str || format(new Date(block.start_date), 'yyyy-MM-dd');
        const matches = dateStr === holidayDateStr;
        // Se for feriado e não estivermos bloqueando, mostramos mas não bloqueamos
        if (matches && !blockHolidays) return false;
        return matches;
      }

      // 2. Recorrente (Semanal)
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
        
        // Bloqueio parcial apenas se o dia for o dia atual do loop
        return currentTime >= (block.start_time || '00:00') && currentTime <= (block.end_time || '23:59');
      }

      return false;
    });
  };

  const handleSaveAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientId || !formData.procedureId || !formData.professionalId) {
       showToast.error('Preencha todos os campos obrigatórios');
       return;
    }

    setIsSubmitting(true);
    
    try {
      const supabase = createBrowserClient();
      
      const procedure = procedures.find(p => p.id === formData.procedureId);
      if (!procedure) throw new Error('Procedimento não selecionado');
      
      const start = new Date(formData.startTime);
      const end = addMinutes(start, procedure.duration_minutes);

      const hasConflict = appointments.some((apt) => {
        if (apt.status === 'cancelled') return false;
        if (apt.professional_id !== formData.professionalId) return false;
        
        const existingStart = new Date(apt.start_time);
        const existingEnd = apt.end_time ? new Date(apt.end_time) : addMinutes(existingStart, apt.procedures?.duration_minutes || 60);
        
        return start < existingEnd && end > existingStart;
      });

      if (hasConflict) {
        showToast.error('Atenção', 'Este profissional já possui agendamento neste horário.');
        throw new Error('Conflito de Horário');
      }

      const { data, error } = await supabase
        .from('appointments')
        .insert({
          company_id: companyId,
          client_id: formData.clientId,
          procedure_id: formData.procedureId,
          professional_id: formData.professionalId,
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          notes: formData.notes,
          status: 'scheduled'
        })
        .select(`
          *,
          clients(full_name),
          procedures(name, duration_minutes)
        `)
        .single();

      if (error) throw error;

      // Criar notificação para o profissional designado
      if (formData.professionalId) {
        await supabase.from('notifications').insert({
          profile_id: formData.professionalId,
          company_id: companyId,
          title: 'Novo Agendamento',
          message: `${data.clients?.full_name} agendado para ${data.procedures?.name} em ${format(start, 'dd/MM HH:mm')}.`,
          type: 'reminder',
          link: '/dashboard/schedule'
        });
      }

      setAppointments([...appointments, data]);
      setIsModalOpen(false);
      setFormData({
        clientId: '',
        procedureId: '',
        professionalId: '',
        startTime: '',
        notes: ''
      });

    } catch (err: any) {
      if (err.message?.includes('AbortError') || err.name === 'AbortError') return;
      if (err.message !== 'Conflito de Horário') {
        console.error('Error saving appointment:', err);
        alert('Erro ao salvar agendamento');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white p-8 -m-8 min-h-screen">
      <ScheduleCalendar 
        appointments={appointments} 
        onNewAppointment={handleNewAppointment}
        onViewAppointment={(id) => {
          const apt = appointments.find(a => a.id === id);
          if (apt) {
            setSelectedAppointment(apt);
            setIsEditModalOpen(true);
          }
        }}
        slotInterval={slotInterval}
        onSlotIntervalChange={setSlotInterval}
        scheduleBlocks={[...scheduleBlocks, ...(showHolidays ? holidays : [])]}
        onOpenBlocks={() => setIsBlockModalOpen(true)}
        blockHolidays={blockHolidays}
      />

      <BlockDaysModal 
        isOpen={isBlockModalOpen}
        onClose={() => setIsBlockModalOpen(false)}
        companyId={companyId}
        onRefresh={() => {
          fetchBlocks();
          fetchSettings();
        }}
      />

      <EditAppointmentModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        appointment={selectedAppointment}
        onUpdate={() => {
           window.location.reload();
        }}
      />

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[550px] bg-white border-[#E5E0D8] p-0 overflow-hidden rounded-3xl shadow-2xl">
          <DialogHeader className="p-8 pb-0">
             <div className="flex items-center gap-4 mb-2">
                <div className="p-2.5 bg-[#D4AF37]/10 rounded-xl">
                   <Plus className="h-5 w-5 text-[#D4AF37]" />
                </div>
                <div>
                   <DialogTitle className="text-xl font-black text-[#2C2825]">Criar Agendamento</DialogTitle>
                   <p className="text-[10px] text-[#8A847C] uppercase font-black tracking-widest mt-0.5">Configure o novo atendimento</p>
                </div>
             </div>
          </DialogHeader>
          
          <form onSubmit={handleSaveAppointment} className="p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-neutral-600 uppercase tracking-widest ml-1">Cliente</label>
              <Select 
                onValueChange={(val) => setFormData({...formData, clientId: val})}
                value={formData.clientId}
              >
                <SelectTrigger className="bg-white border-[#E5E0D8] h-12 rounded-xl text-[#2C2825] focus:ring-primary-500/10">
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent className="bg-white border-[#E5E0D8] text-[#2C2825]">
                  {clients.map(c => (
                    <SelectItem key={c.id} value={c.id} className="hover:bg-primary-500/10 focus:bg-primary-500/10">{c.full_name}</SelectItem>
                  ))}
                  {clients.length === 0 && (
                     <div className="p-4 text-center text-xs text-neutral-600 italic">Nenhum cliente cadastrado</div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-neutral-600 uppercase tracking-widest ml-1">Procedimento</label>
                <Select 
                  onValueChange={(val) => setFormData({...formData, procedureId: val})}
                  value={formData.procedureId}
                >
                  <SelectTrigger className="bg-white border-[#E5E0D8] h-12 rounded-xl text-[#2C2825]">
                    <SelectValue placeholder="O que fará?" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-[#E5E0D8] text-[#2C2825]">
                    {procedures.map(p => (
                      <SelectItem key={p.id} value={p.id} className="hover:bg-primary-500/10 focus:bg-primary-500/10">{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-neutral-600 uppercase tracking-widest ml-1">Profissional</label>
                <Select 
                  onValueChange={(val) => setFormData({...formData, professionalId: val})}
                  value={formData.professionalId}
                >
                  <SelectTrigger className="bg-white border-[#E5E0D8] h-12 rounded-xl text-[#2C2825]">
                    <SelectValue placeholder="Quem atende?" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-[#E5E0D8] text-[#2C2825]">
                    {professionals.map(p => (
                      <SelectItem key={p.id} value={p.id} className="hover:bg-primary-500/10 focus:bg-primary-500/10">{p.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-neutral-600 uppercase tracking-widest ml-1">Data e Horário</label>
              <Input 
                type="datetime-local" 
                value={formData.startTime}
                onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                required
                className="bg-white border-[#E5E0D8] h-12 rounded-xl text-[#2C2825] appearance-none focus:ring-primary-500/10"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-neutral-600 uppercase tracking-widest ml-1">Observações</label>
              <TextArea 
                placeholder="Ex: Alérgica a anestesia, primeira vez na clínica..."
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="bg-white border-[#E5E0D8] rounded-2xl text-[#2C2825] placeholder:text-neutral-700 min-h-[100px] focus:ring-primary-500/10"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsModalOpen(false)}
                className="flex-1 h-12 border-[#E5E0D8] bg-transparent text-neutral-400 hover:bg-neutral-800 rounded-xl font-bold transition-all"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="flex-1 h-12 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-[#2C2825] font-bold rounded-xl shadow-lg shadow-primary-500/20 transition-all active:scale-[0.98]"
                loading={isSubmitting}
              >
                Agendar Horário
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
