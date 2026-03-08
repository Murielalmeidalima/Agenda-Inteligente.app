'use client';

import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  Button,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Badge,
  Label,
  TextArea
} from '@projeto/ui';
import { Edit2, CheckCircle2, XCircle, AlertCircle, Trash2 } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase-browser';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface EditAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: any;
  onUpdate: () => void;
}

export function EditAppointmentModal({ isOpen, onClose, appointment, onUpdate }: EditAppointmentModalProps) {
  const [status, setStatus] = useState(appointment?.status || 'scheduled');
  const [notes, setNotes] = useState(appointment?.notes || '');
  const [loading, setLoading] = useState(false);
  const [checkingAnamnese, setCheckingAnamnese] = useState(false);
  const [sendingLink, setSendingLink] = useState(false);

  // Ficha de Atendimento
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [materialsUsed, setMaterialsUsed] = useState('');
  const [complications, setComplications] = useState('');
  const [recordId, setRecordId] = useState<string | null>(null);

  useEffect(() => {
    if (appointment) {
      setStatus(appointment.status);
      setNotes(appointment.notes || '');

      const fetchMedicalRecord = async () => {
        const supabase = createBrowserClient();
        const { data } = await supabase.from('appointment_medical_records')
          .select('*')
          .eq('appointment_id', appointment.id)
          .maybeSingle();
        
        if (data) {
           setRecordId(data.id);
           setClinicalNotes(data.clinical_notes || '');
           setMaterialsUsed(data.materials_used || '');
           setComplications(data.complications || '');
        } else {
           setRecordId(null);
           setClinicalNotes('');
           setMaterialsUsed('');
           setComplications('');
        }
      }
      fetchMedicalRecord();
    }
  }, [appointment]);

  const handleSendAnamnese = async () => {
    setSendingLink(true);
    try {
      const res = await fetch('/api/anamnese/send-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointment_id: appointment.id })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Erro ao enviar');

      toast.success('Link enviado!', {
        description: 'Prévia: ' + data.message_preview,
        duration: 5000
      });
    } catch (error: any) {
      console.error(error);
      toast.error('Erro ao enviar link: ' + error.message);
    } finally {
      setSendingLink(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === 'completed') {
      // Check Anamnese Requirement
      setCheckingAnamnese(true);
      try {
        const res = await fetch('/api/anamnese/check-status', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ appointment_id: appointment.id })
        });
        const data = await res.json();

        if (data.allow === false) { // Explicit check
          toast.error('Bloqueado: Anamnese Obrigatória Pendente', {
            description: data.message || 'O paciente precisa responder a ficha de anamnese antes de concluir o atendimento.',
            action: {
              label: 'Ver Ficha',
              onClick: () => window.open(`/dashboard/anamnese/templates`, '_blank') 
            },
            duration: 5000
          });
          return;
        }
      } catch (error) {
        console.error('Erro ao verificar anamnese:', error);
        toast.error('Erro ao verificar requisitos de anamnese');
        return;
      } finally {
        setCheckingAnamnese(false);
      }
    }
    setStatus(newStatus);
  };

  const handleSave = async () => {
    setLoading(true);
    const supabase = createBrowserClient();

    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status, notes })
        .eq('id', appointment.id);

      if (error) throw error;

      if (status === 'completed') {
         if (recordId) {
             await supabase.from('appointment_medical_records')
               .update({ 
                  clinical_notes: clinicalNotes, 
                  materials_used: materialsUsed, 
                  complications, 
                  updated_at: new Date().toISOString() 
               })
               .eq('id', recordId);
         } else {
             await supabase.from('appointment_medical_records')
               .insert({ 
                  appointment_id: appointment.id,
                  company_id: appointment.company_id,
                  client_id: appointment.client_id,
                  professional_id: appointment.professional_id,
                  clinical_notes: clinicalNotes,
                  materials_used: materialsUsed,
                  complications
               });
         }
      }

      toast.success('Agendamento atualizado!');
      onUpdate();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao atualizar agendamento');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja cancelar este agendamento?')) return;
    
    setLoading(true);
    const supabase = createBrowserClient();

    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointment.id);

      if (error) throw error;

      toast.success('Agendamento cancelado.');
      onUpdate();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao cancelar');
    } finally {
      setLoading(false);
    }
  };

  if (!appointment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-white border-[#E5E0D8] p-0 overflow-hidden rounded-3xl shadow-2xl text-[#2C2825]">
        <DialogHeader className="p-6 pb-0 bg-[#FDFBF7]/50">
           <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-[#FDFBF7] rounded-xl text-[#8A847C] border border-[#E5E0D8]">
                 <Edit2 className="h-5 w-5" />
              </div>
              <div>
                 <DialogTitle className="text-lg font-black text-[#2C2825]">Gerenciar Agendamento</DialogTitle>
                 <p className="text-[10px] text-[#8A847C] uppercase font-black tracking-widest mt-0.5">
                    {format(new Date(appointment.start_time), 'dd/MM/yyyy HH:mm')}
                 </p>
              </div>
           </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
           {/* Info Cards */}
           <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#0a0a0a] p-4 rounded-2xl border border-neutral-800">
                 <Label className="text-[10px] font-black text-[#8A847C] uppercase tracking-widest block mb-1">Cliente</Label>
                 <p className="font-bold text-sm truncate">{appointment.clients?.full_name}</p>
              </div>
              <div className="bg-[#0a0a0a] p-4 rounded-2xl border border-neutral-800">
                 <Label className="text-[10px] font-black text-[#8A847C] uppercase tracking-widest block mb-1">Procedimento</Label>
                 <p className="font-bold text-sm truncate">{appointment.procedures?.name}</p>
              </div>
           </div>

           {/* Status Selector */}
           <div className="space-y-2">
              <Label className="text-[10px] font-black text-[#8A847C] uppercase tracking-widest ml-1">Status do Atendimento</Label>
              <div className="grid grid-cols-3 gap-2">
                 <StatusButton 
                   active={status === 'scheduled'} 
                   onClick={() => handleStatusChange('scheduled')}
                   icon={AlertCircle}
                   color="text-yellow-500"
                   bg="bg-yellow-500/10"
                   label="Agendado"
                 />
                 <StatusButton 
                   active={status === 'completed'} 
                   onClick={() => handleStatusChange('completed')}
                   icon={CheckCircle2}
                   color="text-emerald-500"
                   bg="bg-emerald-500/10"
                   label="Concluído"
                   loading={checkingAnamnese}
                 />
                 <StatusButton 
                   active={status === 'cancelled'} 
                   onClick={handleDelete}
                   icon={XCircle}
                   color="text-red-500"
                   bg="bg-red-500/10"
                   label="Cancelar"
                 />
              </div>
           </div>

            {/* Notes */}
            <div className="space-y-2">
               <Label className="text-[10px] font-black text-[#8A847C] uppercase tracking-widest ml-1">Notas Internas</Label>
               <TextArea 
                 value={notes}
                 onChange={e => setNotes(e.target.value)}
                 className="bg-white border-[#E5E0D8] rounded-2xl text-[#2C2825] placeholder:text-neutral-700 min-h-[100px] focus:ring-primary-500/10"
                 placeholder="Anotações sobre o atendimento..."
               />
            </div>

            {/* Ficha de Atendimento (Prontuário) apenas quando concluído */}
            {status === 'completed' && (
               <div className="bg-[#FAF6E9] p-4 rounded-2xl border border-[#E5E0D8] space-y-4 animate-fade-in">
                  <h3 className="text-sm font-black text-[#2C2825] uppercase tracking-widest flex items-center gap-2">
                     <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                     Ficha de Atendimento
                  </h3>
                  <div className="space-y-3">
                     <div className="space-y-1">
                        <Label className="text-xs font-bold text-[#5C5855]">Evolução / Notas Clínicas</Label>
                        <TextArea 
                          value={clinicalNotes}
                          onChange={e => setClinicalNotes(e.target.value)}
                          className="bg-white border-[#E5E0D8] rounded-xl text-sm min-h-[80px]"
                          placeholder="Ex: Paciente apresentou melhora. Procedimento realizado sem intercorrências..."
                        />
                     </div>
                     <div className="space-y-1">
                        <Label className="text-xs font-bold text-[#5C5855]">Materiais e Insumos Utilizados</Label>
                        <TextArea 
                          value={materialsUsed}
                          onChange={e => setMaterialsUsed(e.target.value)}
                          className="bg-white border-[#E5E0D8] rounded-xl text-sm min-h-[60px]"
                          placeholder="Ex: Seringa 3ml, Toxina 50u, Anestésico tópico..."
                        />
                     </div>
                     <div className="space-y-1">
                        <Label className="text-xs font-bold text-[#5C5855]">Complicações ou Reações Adversas</Label>
                        <TextArea 
                          value={complications}
                          onChange={e => setComplications(e.target.value)}
                          className="bg-white border-[#E5E0D8] rounded-xl text-sm min-h-[60px]"
                          placeholder="Houve alguma complicação? Se não, deixe em branco ou informe 'Nenhuma'."
                        />
                     </div>
                  </div>
               </div>
            )}

           <Button 
             onClick={handleSave} 
             disabled={loading || checkingAnamnese}
             className="w-full h-12 bg-primary-500 hover:bg-primary-600 text-[#2C2825] font-bold rounded-xl"
           >
             {loading ? 'Salvando...' : 'Salvar Alterações'}
           </Button>

           <div className="pt-4 border-t border-[#E5E0D8]">
              <Button
                type="button"
                variant="outline"
                onClick={handleSendAnamnese}
                disabled={sendingLink}
                className="w-full h-10 border-[#E5E0D8] text-[#5C5855] hover:text-[#2C2825] hover:bg-[#FAF9F6] rounded-xl text-xs uppercase font-bold tracking-widest"
              >
                {sendingLink ? 'Gerando...' : 'Gerar Link Anamnese'}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                   toast.info('Funcionalidade de envio manual em breve.');
                }}
                className="w-full h-10 border-[#E5E0D8] text-[#5C5855] hover:text-[#2C2825] hover:bg-[#FAF9F6] rounded-xl text-xs uppercase font-bold tracking-widest mt-2"
              >
                Reenviar Email de Confirmação
              </Button>
           </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StatusButton({ active, onClick, icon: Icon, color, bg, label, loading }: any) {
   return (
      <button 
        type="button"
        onClick={onClick}
        disabled={loading}
        className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${active ? `${bg} ${color} border-current` : 'bg-white border-[#E5E0D8] text-[#8A847C] hover:bg-neutral-800'}`}
      >
         {loading ? <div className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full mb-1" /> : <Icon className="h-5 w-5 mb-1" />}
         <span className="text-xs font-bold">{label}</span>
      </button>
   );
}
