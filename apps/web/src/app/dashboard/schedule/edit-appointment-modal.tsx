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
  TextArea,
  Input
} from '@projeto/ui';
import { Edit2, CheckCircle2, XCircle, AlertCircle, Banknote } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase-browser';
import { toast } from 'sonner';
import { format, addDays, addWeeks, addMonths, isSaturday, isSunday, subDays } from 'date-fns';

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

  // Finance integration
  const isOriginallyCompleted = appointment?.status === 'completed';
  const [paymentStatus, setPaymentStatus] = useState<'paid'|'partial'|'unpaid'>('paid');
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [paymentAmount, setPaymentAmount] = useState<string>('');

  useEffect(() => {
    if (appointment) {
      setStatus(appointment.status);
      setNotes(appointment.notes || '');
      
      const procedurePrice = appointment.price_override || appointment.procedures?.price || 0;
      setPaymentAmount(procedurePrice.toString());

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

        if (data.allow === false) { 
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
      // Atualiza compromisso
      const { error } = await supabase
        .from('appointments')
        .update({ status, notes })
        .eq('id', appointment.id);

      if (error) throw error;

      if (status === 'completed') {
          // Lógica de Manutenção Automática
          const proc = appointment.procedures;
          // Note that appointment.procedures might be an array if fetched weirdly, but in page.tsx we already did `Array.isArray(app.procedures) ? app.procedures[0] : app.procedures;`
          // So it's an object. Let's handle arrays just in case it's raw.
          const procObj = Array.isArray(proc) ? proc[0] : proc;
          
          if (!isOriginallyCompleted && procObj?.maintenance_required && procObj?.maintenance_days_limit) {
            const unit = procObj.maintenance_period_unit || 'days';
            const amount = procObj.maintenance_days_limit;
            
            let futureDate = new Date(appointment.start_time);
            if (unit === 'months') {
              futureDate = addMonths(futureDate, amount);
            } else if (unit === 'weeks') {
              futureDate = addWeeks(futureDate, amount);
            } else {
              futureDate = addDays(futureDate, amount);
            }

            // Pular finais de semana (sempre para antes do vencimento)
            if (isSaturday(futureDate)) {
              futureDate = subDays(futureDate, 1); // Antecipa para Sexta-feira
            } else if (isSunday(futureDate)) {
              futureDate = subDays(futureDate, 2); // Antecipa para Sexta-feira
            }

            const labelUnit = unit === 'months' ? (amount === 1 ? 'mês' : 'meses') : unit === 'weeks' ? (amount === 1 ? 'semana' : 'semanas') : (amount === 1 ? 'dia' : 'dias');
            const confirmMsg = `O procedimento ${procObj.name} prevê manutenção/retorno em ${amount} ${labelUnit}.\n\nDeseja agendar automaticamente a manutenção para o dia ${format(futureDate, 'dd/MM/yyyy')} no mesmo horário?`;
            
            if (window.confirm(confirmMsg)) {
              const futureEnd = new Date(futureDate);
              futureEnd.setMinutes(futureEnd.getMinutes() + (procObj.maintenance_duration_minutes || procObj.duration_minutes || 60));

              const { error: maintError } = await supabase.from('appointments').insert({
                company_id: appointment.company_id,
                client_id: appointment.client_id,
                professional_id: appointment.professional_id,
                procedure_id: appointment.procedure_id, // keep same procedure for maintenance
                start_time: futureDate.toISOString(),
                end_time: futureEnd.toISOString(),
                status: 'scheduled',
                is_maintenance: true,
                parent_appointment_id: appointment.id,
                notes: 'Agendamento automático de manutenção/retorno.'
              });

              if (maintError) {
                console.error('Erro ao criar manutenção:', maintError);
                toast.error('Erro ao agendar manutenção.');
              } else {
                toast.success(`Manutenção agendada para ${format(futureDate, 'dd/MM/yyyy')}`);
              }
            }
          }

         // Registra ficha médica
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

          // Lógica Financeira (Apenas na PRIMEIRA vez que é concluído)
          if (!isOriginallyCompleted && paymentStatus !== 'unpaid') {
            const procedurePrice = Number(appointment.price_override || appointment.procedures?.price || 0);
            const paidAmount = paymentStatus === 'paid' ? procedurePrice : Number(paymentAmount.replace(',', '.'));
            
            if (paidAmount > 0) {
              // Buscar categoria 'Procedimentos' ou qualquer categoria de 'income' como fallback
              let { data: catData } = await supabase.from('financial_categories')
                .select('id')
                .eq('company_id', appointment.company_id)
                .eq('name', 'Procedimentos')
                .maybeSingle();
                
              if (!catData) {
                const { data: fallbackCat } = await supabase.from('financial_categories')
                  .select('id')
                  .eq('company_id', appointment.company_id)
                  .eq('type', 'income')
                  .limit(1)
                  .maybeSingle();
                catData = fallbackCat;
              }
                
              const { data: accData } = await supabase.from('financial_accounts')
                .select('id')
                .eq('company_id', appointment.company_id)
                .order('created_at', { ascending: true })
                .limit(1)
                .maybeSingle();

              const transactionValues = {
                company_id: appointment.company_id,
                appointment_id: appointment.id,
                category_id: catData?.id,
                account_id: accData?.id,
                amount: paidAmount,
                type: 'income',
                status: 'completed',
                payment_method: paymentMethod,
                description: `Atendimento: ${appointment.clients?.full_name}`,
                date: new Date().toISOString(),
                transaction_date: new Date().toISOString()
              };
              
              const { error: txError } = await supabase.from('transactions').insert(transactionValues);
              if (txError) throw txError;

              // Atualizar saldo da conta
              if (accData?.id) {
                const { error: rpcError } = await supabase.rpc('update_account_balance', { 
                  target_account_id: accData.id, 
                  amount_diff: paidAmount 
                });
                if (rpcError) throw rpcError;
              }
            }
          }
      }

      toast.success('Agendamento atualizado!');
      onUpdate();
      onClose();
    } catch (error: any) {
      console.error('Erro detalhado ao atualizar agendamento:', error);
      if (typeof error === 'object' && error !== null) {
        console.error('Error Details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
      }
      toast.error(error.message || 'Erro ao atualizar agendamento');
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
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto bg-white border-[#E5E0D8] p-0 rounded-3xl shadow-2xl text-[#2C2825] custom-scrollbar">
        <DialogHeader className="p-6 pb-0 bg-[#FDFBF7]/50 sticky top-0 z-10 border-b border-[#E5E0D8]/40 backdrop-blur-md">
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
                 <p className="font-bold text-sm truncate text-white">{appointment.clients?.full_name}</p>
              </div>
              <div className="bg-[#0a0a0a] p-4 rounded-2xl border border-neutral-800">
                 <Label className="text-[10px] font-black text-[#8A847C] uppercase tracking-widest block mb-1">Procedimento</Label>
                 <p className="font-bold text-sm truncate text-white">{appointment.procedures?.name}</p>
                 <p className="text-emerald-400 text-xs font-black mt-1">
                   {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(appointment.price_override || appointment.procedures?.price || 0)}
                 </p>
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

           {/* Painel Financeiro INJECT (exibido apenas quando marcou Concluído agora - não reexibe se ja era concluido antes para evitar double billing) */}
           {status === 'completed' && !isOriginallyCompleted && (
              <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 space-y-4 animate-fade-in relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                   <Banknote className="h-24 w-24" />
                </div>
                <h3 className="text-sm font-black text-emerald-900 uppercase tracking-widest flex items-center gap-2 relative z-10">
                   <Banknote className="w-4 h-4 text-emerald-600" />
                   Baixa Financeira
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                  <div className="space-y-1">
                    <Label className="text-xs font-bold text-emerald-800">Situação do Pagamento</Label>
                    <Select value={paymentStatus} onValueChange={(val: any) => setPaymentStatus(val)}>
                      <SelectTrigger className="bg-white border-emerald-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paid" className="text-emerald-700 font-bold">Pago Totalmente</SelectItem>
                        <SelectItem value="partial" className="text-amber-600 font-bold">Pago Parcial</SelectItem>
                        <SelectItem value="unpaid" className="text-rose-600 font-bold">Não Pago (Pendente)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {paymentStatus !== 'unpaid' && (
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-emerald-800">Método Utilizado</Label>
                      <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                        <SelectTrigger className="bg-white border-emerald-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pix">PIX</SelectItem>
                          <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                          <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                          <SelectItem value="cash">Dinheiro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {paymentStatus === 'partial' && (
                  <div className="space-y-1 relative z-10">
                    <Label className="text-xs font-bold text-emerald-800">Valor Recebido Agora (R$)</Label>
                    <Input 
                      type="number"
                      step="0.01"
                      className="bg-white border-emerald-200 focus:ring-emerald-500/20"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                    />
                    <p className="text-[10px] text-emerald-700 mt-1 font-medium italic">
                      O valor restante irá automaticamente para "Contas a Receber".
                    </p>
                  </div>
                )}
                {paymentStatus === 'unpaid' && (
                  <p className="text-[10px] text-emerald-700 font-medium italic relative z-10">
                    Nenhuma entrada será gerada agora. O sistema vai classificar este atendimento automaticamente em "Contas a Receber".
                  </p>
                )}
              </div>
           )}

            {/* Notes */}
            <div className="space-y-2">
               <Label className="text-[10px] font-black text-[#8A847C] uppercase tracking-widest ml-1">Notas Internas</Label>
               <TextArea 
                 value={notes}
                 onChange={e => setNotes(e.target.value)}
                 className="bg-white border-[#E5E0D8] rounded-2xl text-[#2C2825] placeholder:text-neutral-700 min-h-[80px] focus:ring-primary-500/10"
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

           <div className="pt-4 border-t border-[#E5E0D8] pb-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleSendAnamnese}
                disabled={sendingLink}
                className="w-full h-10 border-[#E5E0D8] text-[#5C5855] hover:text-[#2C2825] hover:bg-[#FAF9F6] rounded-xl text-xs uppercase font-bold tracking-widest"
              >
                {sendingLink ? 'Gerando...' : 'Gerar Link Anamnese'}
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
