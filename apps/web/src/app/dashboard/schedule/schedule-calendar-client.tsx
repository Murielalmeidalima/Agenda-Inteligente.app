'use client';

import { useState } from 'react';
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
import { Plus } from 'lucide-react';
import { EditAppointmentModal } from './edit-appointment-modal';
import { showToast } from '@/lib/toast-helpers';

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

  const handleNewAppointment = (date: Date) => {
    setFormData({
      ...formData,
      startTime: format(date, "yyyy-MM-dd'T'HH:mm")
    });
    setIsModalOpen(true);
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
