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
import { useRouter, useSearchParams } from 'next/navigation';
import { BlockDaysModal } from './components/BlockDaysModal';
import { showToast } from '@/lib/toast-helpers';
import { isWithinInterval, startOfDay, endOfDay } from 'date-fns';

interface ScheduleCalendarClientProps {
  initialAppointments: any[];
  clients: { id: string, full_name: string, phone?: string }[];
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const filterParam = searchParams.get('filter');
  const [isOnlyMaintenance, setIsOnlyMaintenance] = useState(filterParam === 'maintenance');

  useEffect(() => {
    if (filterParam === 'maintenance') {
      setIsOnlyMaintenance(true);
    } else {
      setIsOnlyMaintenance(false);
    }
  }, [filterParam]);

  const [appointments, setAppointments] = useState(initialAppointments);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slotInterval, setSlotInterval] = useState<number>(30);
  
  // local client list state to allow inline client registration
  const [localClients, setLocalClients] = useState(clients);
  useEffect(() => {
    setLocalClients(clients);
  }, [clients]);

  // inline client registration states
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [isCreatingClientLoading, setIsCreatingClientLoading] = useState(false);

  // launching past appointment states
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchingPrice, setLaunchingPrice] = useState('');
  const [launchingPaymentStatus, setLaunchingPaymentStatus] = useState<'paid'|'partial'|'pending'>('paid');
  const [launchingPaymentMethod, setLaunchingPaymentMethod] = useState('pix');
  const [launchingPaidAmount, setLaunchingPaidAmount] = useState('');

  const handleLaunchAppointment = () => {
    setIsLaunching(true);
    setFormData({
      clientId: '',
      procedureId: '',
      professionalId: '',
      startTime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      notes: ''
    });
    setAdditionalProcedureIds([]);
    setLaunchingPrice('');
    setLaunchingPaymentStatus('paid');
    setLaunchingPaymentMethod('pix');
    setLaunchingPaidAmount('');
    setIsModalOpen(true);
  };

  useEffect(() => {
    setAppointments(initialAppointments);
  }, [initialAppointments]);

  const [formData, setFormData] = useState({
    clientId: '',
    procedureId: '',
    professionalId: '',
    startTime: '',
    notes: ''
  });

  const [additionalProcedureIds, setAdditionalProcedureIds] = useState<string[]>([]);

  const [isManualDateTime, setIsManualDateTime] = useState(false);
  const [manualDateTimeStr, setManualDateTimeStr] = useState('');

  const parseManualDateTime = (str: string): string => {
    const regex = /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/;
    const match = str.trim().match(regex);
    if (match) {
      const [, day, month, year, hour, minute] = match;
      return `${year}-${month}-${day}T${hour}:${minute}`;
    }
    return '';
  };

  useEffect(() => {
    if (isManualDateTime && formData.startTime) {
      try {
        const date = new Date(formData.startTime);
        if (!isNaN(date.getTime())) {
          setManualDateTimeStr(format(date, 'dd/MM/yyyy HH:mm'));
        }
      } catch (e) {}
    } else if (!isManualDateTime && manualDateTimeStr) {
      const parsed = parseManualDateTime(manualDateTimeStr);
      if (parsed) {
        setFormData(prev => ({ ...prev, startTime: parsed }));
      }
    }
  }, [isManualDateTime]);

  const selectedProceduresList = (() => {
    const list = [];
    const mainProc = procedures.find(p => p.id === formData.procedureId);
    if (mainProc) list.push(mainProc);
    
    additionalProcedureIds.forEach(id => {
      const extraProc = procedures.find(p => p.id === id);
      if (extraProc) list.push(extraProc);
    });
    return list;
  })();

  const calculatedTotalDuration = selectedProceduresList.reduce((sum, p) => sum + p.duration_minutes, 0);
  const calculatedTotalPrice = selectedProceduresList.reduce((sum, p) => sum + p.price, 0);

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

  const fetchLatestAppointments = async () => {
    try {
      const supabase = createBrowserClient();
      const { data: appData, error: appError } = await supabase
        .from('appointments')
        .select(`
          *,
          clients!inner(full_name, birth_date),
          procedures!inner(name, color, duration_minutes, price, maintenance_required, maintenance_days_limit, maintenance_period_unit, maintenance_duration_minutes),
          profiles:professional_id(full_name)
        `)
        .eq('company_id', companyId);

      if (appError) throw appError;

      const appIds = appData?.map(a => a.id) || [];
      let transactions: any[] = [];
      
      if (appIds.length > 0) {
        const { data: trans } = await supabase
          .from('transactions')
          .select('appointment_id, amount, status, type, payment_method')
          .in('appointment_id', appIds)
          .eq('type', 'income');
          
        transactions = trans || [];
      }

      const hydrated = appData?.map(app => {
        const linkedTrans = transactions.filter(t => t.appointment_id === app.id);
        const paidConfirmed = linkedTrans
          .filter(t => t.status === 'completed' || !t.status)
          .reduce((sum, t) => sum + Number(t.amount), 0);
          
        const procedure = Array.isArray(app.procedures) ? app.procedures[0] : app.procedures;
        const totalPrice = Number(app.price_override || procedure?.price || 0);
        
        const now = new Date();
        const startDate = new Date(app.start_time);
        
        let paymentStatus = 'pending';
        
        if (app.status === 'cancelled') {
          paymentStatus = 'cancelled';
        } else if (paidConfirmed >= totalPrice && totalPrice > 0) {
          if (startDate > now && app.status !== 'completed') {
            paymentStatus = 'advance_payment';
          } else {
            paymentStatus = 'paid';
          }
        } else if (paidConfirmed > 0) {
          paymentStatus = 'partial';
        } else {
          if (startDate < now || app.status === 'completed') {
            paymentStatus = 'overdue';
          } else {
            paymentStatus = 'pending';
          }
        }
        
        const paymentMethod = linkedTrans[0]?.payment_method || null;
        
        return {
          ...app,
          paymentStatus,
          paymentMethod,
          paidConfirmed,
          totalPrice
        };
      }) || [];

      setAppointments(hydrated);
    } catch (err) {
      console.error('Error fetching latest appointments:', err);
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
    // block scheduling in the past
    const now = new Date();
    if (date < new Date(now.getTime() - 2 * 60 * 1000)) {
      showToast.error(
        'Operação não permitida', 
        'Não é possível criar um agendamento em uma data ou horário que já passou. Caso este atendimento tenha sido realizado sem agendamento prévio, utilize a opção \'Lançar Atendimento\'.'
      );
      return;
    }

    const isBlocked = checkIsBlocked(date);
    if (isBlocked) {
      showToast.error('Indisponível', 'Este dia ou horário está bloqueado para atendimentos.');
      return;
    }

    setIsLaunching(false);
    setFormData({
      ...formData,
      startTime: format(date, "yyyy-MM-dd'T'HH:mm")
    });
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (isLaunching) {
      setLaunchingPrice(calculatedTotalPrice.toString());
    }
  }, [calculatedTotalPrice, isLaunching]);

  const handleSaveNewClientInline = async () => {
    if (!newClientName.trim()) {
      showToast.error('Erro', 'O nome do cliente é obrigatório');
      return;
    }

    setIsCreatingClientLoading(true);
    try {
      const supabase = createBrowserClient();
      const { data, error } = await supabase
        .from('clients')
        .insert({
          full_name: newClientName.trim(),
          phone: newClientPhone.trim() || null,
          company_id: companyId
        })
        .select()
        .single();

      if (error) throw error;

      showToast.success('Cliente cadastrado!');
      setLocalClients(prev => [...prev, data]);
      setFormData(prev => ({ ...prev, clientId: data.id }));
      setIsCreatingClient(false);
      setNewClientName('');
      setNewClientPhone('');
    } catch (err: any) {
      console.error('Error creating client inline:', err);
      showToast.error('Erro ao cadastrar cliente', err.message || 'Tente novamente.');
    } finally {
      setIsCreatingClientLoading(false);
    }
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
      
      let startStr = formData.startTime;
      if (isManualDateTime) {
        const parsed = parseManualDateTime(manualDateTimeStr);
        if (!parsed) {
          showToast.error('A data/hora digitada manualmente é inválida. Use o formato: DD/MM/AAAA HH:MM');
          setIsSubmitting(false);
          return;
        }
        startStr = parsed;
      }
      const start = new Date(startStr);
      const end = addMinutes(start, calculatedTotalDuration);

      // Block scheduling in the past for normal appointments
      if (!isLaunching) {
        const now = new Date();
        if (start < new Date(now.getTime() - 2 * 60 * 1000)) {
          showToast.error(
            'Operação não permitida', 
            'Não é possível criar um agendamento em uma data ou horário que já passou. Caso este atendimento tenha sido realizado sem agendamento prévio, utilize a opção \'Lançar Atendimento\'.'
          );
          setIsSubmitting(false);
          return;
        }
      }

      // Bypass conflict checks for completed launched appointments
      const hasConflict = !isLaunching && appointments.some((apt) => {
        if (apt.status === 'cancelled' || apt.status === 'completed') return false;
        if (apt.professional_id !== formData.professionalId) return false;
        
        const existingStart = new Date(apt.start_time);
        const existingEnd = apt.end_time ? new Date(apt.end_time) : addMinutes(existingStart, apt.procedures?.duration_minutes || 60);
        
        return start < existingEnd && end > existingStart;
      });

      if (hasConflict) {
        showToast.error('Atenção', 'Este profissional já possui agendamento neste horário.');
        throw new Error('Conflito de Horário');
      }

      const priceVal = isLaunching ? Number(launchingPrice) : calculatedTotalPrice;

      const { data, error } = await supabase
        .from('appointments')
        .insert({
          company_id: companyId,
          client_id: formData.clientId,
          procedure_id: formData.procedureId,
          additional_procedure_ids: additionalProcedureIds.filter(id => id !== ''),
          price_override: priceVal,
          professional_id: formData.professionalId,
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          notes: formData.notes,
          status: isLaunching ? 'completed' : 'scheduled'
        })
        .select(`
          *,
          clients(full_name),
          procedures(name, duration_minutes, color)
        `)
        .single();

      if (error) throw error;

      // Se for Lançamento e o pagamento não for Pendente, cria a transação e atualiza a conta
      if (isLaunching && launchingPaymentStatus !== 'pending') {
        let { data: catData } = await supabase.from('financial_categories')
          .select('id')
          .eq('company_id', companyId)
          .eq('name', 'Procedimentos')
          .maybeSingle();
          
        if (!catData) {
          const { data: fallbackCat } = await supabase.from('financial_categories')
            .select('id')
            .eq('company_id', companyId)
            .eq('type', 'income')
            .limit(1)
            .maybeSingle();
          catData = fallbackCat;
        }

        const { data: accData } = await supabase.from('financial_accounts')
          .select('id')
          .eq('company_id', companyId)
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle();

        const paymentVal = launchingPaymentStatus === 'paid' ? priceVal : Number(launchingPaidAmount);
        
        if (paymentVal > 0) {
          const transactionValues = {
            company_id: companyId,
            appointment_id: data.id,
            category_id: catData?.id || null,
            account_id: accData?.id || null,
            amount: paymentVal,
            type: 'income',
            status: 'completed',
            payment_method: launchingPaymentMethod,
            description: `Atendimento (Lançado): ${data.clients?.full_name}`,
            date: start.toISOString(),
            transaction_date: start.toISOString()
          };
          
          const { error: txError } = await supabase.from('transactions').insert(transactionValues);
          if (txError) {
            console.error('Error inserting transaction:', txError);
          } else if (accData?.id) {
            const { error: rpcError } = await supabase.rpc('update_account_balance', { 
              target_account_id: accData.id, 
              amount_diff: paymentVal 
            });
            if (rpcError) {
              console.error('Error updating account balance:', rpcError);
            }
          }
        }
      }

      // Criar notificação para o profissional designado (somente se agendado para o futuro)
      if (formData.professionalId && !isLaunching) {
        const procedureNames = selectedProceduresList.map(p => p.name).join(' e ');
        await supabase.from('notifications').insert({
          profile_id: formData.professionalId,
          company_id: companyId,
          title: 'Novo Agendamento',
          message: `${data.clients?.full_name} agendado para ${procedureNames} em ${format(start, 'dd/MM HH:mm')}.`,
          type: 'reminder',
          link: '/dashboard/schedule'
        });
      }

      // Adicionar mensagem na fila do WhatsApp (somente se agendado para o futuro)
      const client = localClients.find(c => c.id === formData.clientId);
      if (client?.phone && !isLaunching) {
        const procedureNames = selectedProceduresList.map(p => p.name).join(' e ');
        await supabase.from('message_queue').insert({
          company_id: companyId,
          type: 'whatsapp',
          recipient: client.phone,
          payload: { 
            content: `Olá ${client.full_name.split(' ')[0]},\n\nSeu agendamento de *${procedureNames}* está confirmado para *${format(start, 'dd/MM/yyyy')}* às *${format(start, 'HH:mm')}*.\n\nQualquer dúvida, estamos à disposição!` 
          },
          status: 'pending',
          scheduled_for: new Date().toISOString()
        });
      }

      // Refresh the page data from server to get all hydrated properties properly
      router.refresh();
      fetchLatestAppointments();
      
      setIsModalOpen(false);
      setFormData({
        clientId: '',
        procedureId: '',
        professionalId: '',
        startTime: '',
        notes: ''
      });
      setAdditionalProcedureIds([]);
      setIsLaunching(false);
      setIsCreatingClient(false);

    } catch (err: any) {
      if (err.message?.includes('AbortError') || err.name === 'AbortError') return;
      if (err.message !== 'Conflito de Horário') {
        console.error('Error saving appointment:', err.message || err.details || err);
        alert(`Erro ao salvar agendamento: ${err.message || err.details || 'Verifique as migrações no banco de dados.'}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayedAppointments = isOnlyMaintenance 
    ? appointments.filter(a => a.is_maintenance) 
    : appointments;

  return (
    <div className="flex flex-col h-full bg-white p-8 -m-8 min-h-screen">
      {isOnlyMaintenance && (
        <div className="bg-[#FAF6E9] border border-[#E5E0D8] rounded-2xl p-4 flex items-center justify-between text-xs text-[#765928] font-bold mb-4 animate-in fade-in shadow-xs">
          <span className="flex items-center gap-2">🛠️ Mostrando apenas agendamentos de Retorno / Manutenção</span>
          <button 
            onClick={() => {
              setIsOnlyMaintenance(false);
              router.replace('/dashboard/schedule');
            }}
            className="text-[#C8A46B] underline hover:text-[#b5925a] font-black uppercase tracking-wider"
          >
            Mostrar todos os agendamentos
          </button>
        </div>
      )}
      <ScheduleCalendar 
        appointments={displayedAppointments} 
        onNewAppointment={handleNewAppointment}
        onLaunchAppointment={handleLaunchAppointment}
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
        professionals={professionals}
        procedures={procedures}
      />

      <EditAppointmentModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        appointment={selectedAppointment}
        professionals={professionals}
        procedures={procedures}
        onUpdate={() => {
           router.refresh();
           fetchLatestAppointments();
        }}
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

      <Dialog open={isModalOpen} onOpenChange={(open) => {
        setIsModalOpen(open);
        if (!open) {
          setFormData({
            clientId: '',
            procedureId: '',
            professionalId: '',
            startTime: '',
            notes: ''
          });
          setAdditionalProcedureIds([]);
          setIsLaunching(false);
          setIsCreatingClient(false);
        }
      }}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto bg-white border-[#E5E0D8] p-0 rounded-3xl shadow-2xl custom-scrollbar">
          <DialogHeader className="p-8 pb-0">
             <div className="flex items-center gap-4 mb-2">
                <div className="p-2.5 bg-[#D4AF37]/10 rounded-xl">
                   <Plus className="h-5 w-5 text-[#D4AF37]" />
                </div>
                <div>
                   <DialogTitle className="text-xl font-black text-[#2C2825]">
                     {isLaunching ? 'Lançar Atendimento' : 'Criar Agendamento'}
                   </DialogTitle>
                   <p className="text-[10px] text-[#8A847C] uppercase font-black tracking-widest mt-0.5">
                     {isLaunching ? 'Registre um atendimento que já foi realizado' : 'Configure o novo agendamento'}
                   </p>
                </div>
             </div>
          </DialogHeader>
          
          <form onSubmit={handleSaveAppointment} className="p-8 space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[10px] font-black text-neutral-600 uppercase tracking-widest">Cliente</label>
                <button 
                  type="button" 
                  onClick={() => setIsCreatingClient(!isCreatingClient)}
                  className="text-[9px] font-black text-[#D4AF37] uppercase tracking-wider hover:underline"
                >
                  {isCreatingClient ? '❌ Cancelar' : '➕ Novo Cliente'}
                </button>
              </div>
              
              {isCreatingClient ? (
                <div className="bg-[#FAF9F6] border border-[#E5E0D8] rounded-2xl p-4 space-y-3 animate-in fade-in duration-200">
                  <p className="text-[9px] font-black text-[#8A847C] uppercase tracking-wider">Cadastrar Cliente Rápido</p>
                  <div className="space-y-1">
                    <Input 
                      placeholder="Nome Completo *" 
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      className="bg-white h-10 rounded-lg text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Input 
                      placeholder="WhatsApp (com DDD) - Opcional" 
                      value={newClientPhone}
                      onChange={(e) => setNewClientPhone(e.target.value)}
                      className="bg-white h-10 rounded-lg text-xs"
                    />
                  </div>
                  <Button 
                    type="button" 
                    onClick={handleSaveNewClientInline}
                    loading={isCreatingClientLoading}
                    className="w-full h-10 bg-[#D4AF37] text-white hover:bg-[#B5952F] rounded-lg text-xs font-bold transition-all"
                  >
                    Salvar e Selecionar
                  </Button>
                </div>
              ) : (
                <Select 
                  onValueChange={(val) => setFormData({...formData, clientId: val})}
                  value={formData.clientId}
                >
                  <SelectTrigger className="bg-white border-[#E5E0D8] h-12 rounded-xl text-[#2C2825] focus:ring-primary-500/10">
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-[#E5E0D8] text-[#2C2825]">
                    {localClients.map(c => (
                      <SelectItem key={c.id} value={c.id} className="hover:bg-primary-500/10 focus:bg-primary-500/10">{c.full_name}</SelectItem>
                    ))}
                    {localClients.length === 0 && (
                       <div className="p-4 text-center text-xs text-neutral-600 italic">Nenhum cliente cadastrado</div>
                    )}
                  </SelectContent>
                </Select>
              )}
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

                {/* List of additional procedures */}
                {additionalProcedureIds.map((extraId, idx) => (
                  <div key={idx} className="flex items-center gap-2 mt-2">
                    <Select 
                      onValueChange={(val) => {
                        const updated = [...additionalProcedureIds];
                        updated[idx] = val;
                        setAdditionalProcedureIds(updated);
                      }}
                      value={extraId}
                    >
                      <SelectTrigger className="bg-white border-[#E5E0D8] h-12 rounded-xl text-[#2C2825] flex-1">
                        <SelectValue placeholder="Outro procedimento..." />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-[#E5E0D8] text-[#2C2825]">
                        {procedures
                          .filter(p => p.id !== formData.procedureId && !additionalProcedureIds.includes(p.id) || p.id === extraId)
                          .map(p => (
                            <SelectItem key={p.id} value={p.id} className="hover:bg-primary-500/10 focus:bg-primary-500/10">{p.name}</SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      onClick={() => {
                        setAdditionalProcedureIds(additionalProcedureIds.filter((_, i) => i !== idx));
                      }}
                      className="h-12 px-3 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl shrink-0"
                    >
                      Remover
                    </Button>
                  </div>
                ))}

                {/* Add Procedure button */}
                {formData.procedureId && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setAdditionalProcedureIds([...additionalProcedureIds, '']);
                    }}
                    className="mt-2 text-xs font-bold text-[#D4AF37] hover:text-[#B5952F] hover:bg-[#D4AF37]/5 px-3 py-1.5 h-auto rounded-lg flex items-center gap-1.5"
                  >
                    <span>➕ Adicionar outro procedimento</span>
                  </Button>
                )}
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
              <div className="flex justify-between items-center ml-1">
                <label className="text-[10px] font-black text-neutral-600 uppercase tracking-widest">Data e Horário</label>
                <button 
                  type="button" 
                  onClick={() => setIsManualDateTime(!isManualDateTime)}
                  className="text-[9px] font-black text-[#D4AF37] uppercase tracking-wider hover:underline"
                >
                  {isManualDateTime ? '📅 Usar Calendário' : '✍️ Digitar Manualmente'}
                </button>
              </div>
              
              {isManualDateTime ? (
                <div className="space-y-1">
                  <Input 
                    type="text" 
                    placeholder="Ex: 08/07/2026 07:00"
                    value={manualDateTimeStr}
                    onChange={(e) => {
                      let val = e.target.value;
                      val = val.replace(/[^\d\s/:]/g, '');
                      setManualDateTimeStr(val);
                    }}
                    required
                    className="bg-white border-[#E5E0D8] h-12 rounded-xl text-[#2C2825] focus:ring-primary-500/10 font-bold"
                  />
                  <p className="text-[9px] text-[#8A847C] ml-1">Use o formato: DD/MM/AAAA HH:MM (Ex: 08/07/2026 07:00)</p>
                </div>
              ) : (
                <Input 
                  type="datetime-local" 
                  value={formData.startTime}
                  onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                  required
                  className="bg-white border-[#E5E0D8] h-12 rounded-xl text-[#2C2825] focus:ring-primary-500/10"
                />
              )}
            </div>

            {isLaunching && (
              <div className="bg-[#FAF9F6] border border-[#E5E0D8] rounded-2xl p-4 space-y-4 animate-in fade-in duration-200">
                <p className="text-[9px] font-black text-[#8A847C] uppercase tracking-wider mb-1">Informações Financeiras</p>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-neutral-600 uppercase tracking-widest ml-1">Valor do Atendimento (R$)</label>
                  <Input 
                    type="number" 
                    step="0.01"
                    placeholder="0.00"
                    value={launchingPrice}
                    onChange={(e) => setLaunchingPrice(e.target.value)}
                    required
                    className="bg-white border-[#E5E0D8] h-12 rounded-xl text-[#2C2825] focus:ring-primary-500/10 font-bold"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-neutral-600 uppercase tracking-widest ml-1">Situação do Pagamento</label>
                    <Select 
                      value={launchingPaymentStatus} 
                      onValueChange={(val: any) => {
                        setLaunchingPaymentStatus(val);
                        if (val === 'partial' && !launchingPaidAmount) {
                          setLaunchingPaidAmount((Number(launchingPrice) / 2).toString());
                        }
                      }}
                    >
                      <SelectTrigger className="bg-white border-[#E5E0D8] h-12 rounded-xl text-[#2C2825]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-[#E5E0D8] text-[#2C2825]">
                        <SelectItem value="paid">Pago</SelectItem>
                        <SelectItem value="partial">Parcial</SelectItem>
                        <SelectItem value="pending">Pendente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-neutral-600 uppercase tracking-widest ml-1">Forma de Pagamento</label>
                    <Select 
                      value={launchingPaymentMethod} 
                      onValueChange={setLaunchingPaymentMethod}
                      disabled={launchingPaymentStatus === 'pending'}
                    >
                      <SelectTrigger className="bg-white border-[#E5E0D8] h-12 rounded-xl text-[#2C2825] disabled:opacity-50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-[#E5E0D8] text-[#2C2825]">
                        <SelectItem value="pix">Pix</SelectItem>
                        <SelectItem value="money">Dinheiro</SelectItem>
                        <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                        <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                        <SelectItem value="bank_transfer">Transferência Bancária</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {launchingPaymentStatus === 'partial' && (
                  <div className="space-y-2 animate-in slide-in-from-top-1 duration-200">
                    <label className="text-[10px] font-black text-neutral-600 uppercase tracking-widest ml-1">Valor Pago Parcialmente (R$)</label>
                    <Input 
                      type="number" 
                      step="0.01"
                      placeholder="0.00"
                      value={launchingPaidAmount}
                      onChange={(e) => setLaunchingPaidAmount(e.target.value)}
                      required
                      className="bg-white border-[#E5E0D8] h-12 rounded-xl text-[#2C2825] focus:ring-primary-500/10 font-bold"
                    />
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-neutral-600 uppercase tracking-widest ml-1">Observações</label>
              <TextArea 
                placeholder="Ex: Alérgica a anestesia, primeira vez na clínica..."
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="bg-white border-[#E5E0D8] rounded-2xl text-[#2C2825] placeholder:text-neutral-700 min-h-[100px] focus:ring-primary-500/10"
              />
            </div>

            {selectedProceduresList.length > 1 && (
              <div className="bg-[#FAF6E9]/45 border border-[#E5E0D8] rounded-2xl p-4 space-y-2 text-xs">
                <p className="font-black text-[#2C2825] uppercase tracking-widest text-[9px] mb-1 text-neutral-600">Resumo dos Procedimentos</p>
                {selectedProceduresList.map((p, i) => (
                  <div key={p.id} className="flex justify-between items-center text-neutral-800">
                    <span className="font-bold">{i + 1}. {p.name}</span>
                    <span className="font-medium text-[#8A847C]">{p.duration_minutes} min • R$ {p.price.toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t border-[#E5E0D8] pt-2 mt-2 flex justify-between font-black text-sm text-[#2C2825]">
                  <span>Total ({selectedProceduresList.length} itens)</span>
                  <span className="text-[#D4AF37]">
                    {Math.floor(calculatedTotalDuration / 60) > 0 ? `${Math.floor(calculatedTotalDuration / 60)}h ` : ''}
                    {calculatedTotalDuration % 60}m • R$ {calculatedTotalPrice.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsModalOpen(false);
                  setFormData({
                    clientId: '',
                    procedureId: '',
                    professionalId: '',
                    startTime: '',
                    notes: ''
                  });
                  setAdditionalProcedureIds([]);
                  setIsLaunching(false);
                  setIsCreatingClient(false);
                }}
                className="flex-1 h-12 border-[#E5E0D8] bg-transparent text-neutral-400 hover:bg-neutral-800 rounded-xl font-bold transition-all"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="flex-1 h-12 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-[#2C2825] font-bold rounded-xl shadow-lg shadow-primary-500/20 transition-all active:scale-[0.98]"
                loading={isSubmitting}
              >
                {isLaunching ? 'Lançar Atendimento' : 'Agendar Horário'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
