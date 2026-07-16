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
  Input,
  cn,
  SearchableSelect
} from '@projeto/ui';
import { Edit2, CheckCircle2, XCircle, AlertCircle, Banknote, User, UserCheck, Sparkles } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase-browser';
import { toast } from 'sonner';
import { format, addDays, addWeeks, addMonths, isSaturday, isSunday, subDays } from 'date-fns';
import { useProfile } from '@/providers/profile-provider';

interface EditAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: any;
  onUpdate: () => void;
  professionals?: any[];
  procedures?: any[];
  clients?: any[];
}

export function EditAppointmentModal({ isOpen, onClose, appointment, onUpdate, professionals, procedures = [], clients = [] }: EditAppointmentModalProps) {
  const { profile } = useProfile();
  const [status, setStatus] = useState(appointment?.status || 'scheduled');
  const [notes, setNotes] = useState(appointment?.notes || '');
  const [loading, setLoading] = useState(false);
  const [checkingAnamnese, setCheckingAnamnese] = useState(false);
  const [sendingLink, setSendingLink] = useState(false);

  // Discount states
  const [editIsMaintenance, setEditIsMaintenance] = useState(false);
  const [editDiscountMethod, setEditDiscountMethod] = useState<'percentage' | 'value'>('percentage');
  const [editDiscountName, setEditDiscountName] = useState('');
  const [editDiscountValue, setEditDiscountValue] = useState('');
  const [editDiscountPercentage, setEditDiscountPercentage] = useState('');
  const [editDiscountNotes, setEditDiscountNotes] = useState('');
  const [promotions, setPromotions] = useState<any[]>([]);
  const [receptionistLimit, setReceptionistLimit] = useState<{ type: 'value' | 'percentage', limit: number } | null>(null);

  // Ficha de Atendimento
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [materialsUsed, setMaterialsUsed] = useState('');
  const [complications, setComplications] = useState('');
  const [recordId, setRecordId] = useState<string | null>(null);

  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editClientId, setEditClientId] = useState('');
  const [editProfessionalId, setEditProfessionalId] = useState('');
  const [editAdditionalProcedureIds, setEditAdditionalProcedureIds] = useState<string[]>([]);
  const [editProcedureId, setEditProcedureId] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Finance integration
  const isOriginallyCompleted = appointment?.status === 'completed';

  // Blocks state variables
  const [scheduleBlocks, setScheduleBlocks] = useState<any[]>([]);
  const [showHolidays, setShowHolidays] = useState(false);
  const [blockHolidays, setBlockHolidays] = useState(false);
  const [holidays, setHolidays] = useState<any[]>([]);

  const checkIsBlocked = (date: Date) => {
    // Se o interruptor mestre estiver desligado, nenhum bloqueio é aplicado
    if (!blockHolidays) return undefined;

    const dayOfWeek = date.getDay();
    const dateStr = format(date, 'yyyy-MM-dd');
    const currentTime = format(date, 'HH:mm');
    const allBlocks = [...scheduleBlocks, ...(showHolidays ? holidays : [])];

    return allBlocks.find(block => {
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
  };

  // Adições para o Histórico Financeiro
  const [transactionsList, setTransactionsList] = useState<any[]>([]);
  const [newPayAmount, setNewPayAmount] = useState<string>('');
  const [newPayMethod, setNewPayMethod] = useState<string>('pix');
  const [loadingTx, setLoadingTx] = useState(false);

  const fetchTransactions = async () => {
    if (!appointment?.id) return;
    const supabase = createBrowserClient();
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('appointment_id', appointment.id)
      .eq('type', 'income')
      .order('transaction_date', { ascending: false });
    if (error) {
      console.error('Error fetching transactions:', error);
    } else {
      setTransactionsList(data || []);
      // Calculate pending balance to autofill
      const paid = (data || [])
        .filter((t: any) => t.status === 'completed' || !t.status)
        .reduce((sum: number, t: any) => sum + Number(t.amount), 0);
      const proc = Array.isArray(appointment.procedures) ? appointment.procedures[0] : appointment.procedures;
      const total = Number(appointment.price_override || proc?.price || 0);
      const pending = Math.max(0, total - paid);
      setNewPayAmount(pending.toString());
    }
  };

  const fetchPromotionsAndSettings = async () => {
    if (!appointment?.company_id) return;
    const supabase = createBrowserClient();
    
    // fetch promotions
    const { data: promoData } = await supabase
      .from('procedure_promotions')
      .select('*')
      .eq('company_id', appointment.company_id)
      .eq('is_active', true);
    if (promoData) setPromotions(promoData);

    // fetch settings
    const { data: compData } = await supabase
      .from('companies')
      .select('settings')
      .eq('id', appointment.company_id)
      .single();
    if (compData?.settings) {
      if (compData.settings.receptionist_discount_limit) {
        setReceptionistLimit(compData.settings.receptionist_discount_limit);
      } else {
        setReceptionistLimit({ type: 'percentage', limit: 15 });
      }
    } else {
      setReceptionistLimit({ type: 'percentage', limit: 15 });
    }
  };

  useEffect(() => {
    if (appointment?.company_id) {
      fetchPromotionsAndSettings();
    }
  }, [appointment?.company_id]);

  useEffect(() => {
    if (appointment) {
      setStatus(appointment.status);
      setNotes(appointment.notes || '');

      setEditClientId(appointment.client_id || '');
      setEditProfessionalId(appointment.professional_id || '');
      setEditAdditionalProcedureIds(appointment.additional_procedure_ids || []);
      setEditProcedureId(appointment.procedure_id || '');
      setEditStartTime(appointment.start_time ? format(new Date(appointment.start_time), "yyyy-MM-dd'T'HH:mm") : '');
      setEditNotes(appointment.notes || '');
      setEditIsMaintenance(appointment.is_maintenance || false);
      setEditDiscountMethod(appointment.discount_type || 'percentage');
      setEditDiscountName(appointment.discount_name || '');
      setEditDiscountValue(appointment.discount_value !== undefined && appointment.discount_value !== null ? appointment.discount_value.toString() : '');
      setEditDiscountPercentage(appointment.discount_percentage !== undefined && appointment.discount_percentage !== null ? appointment.discount_percentage.toString() : '');
      setEditDiscountNotes(appointment.discount_notes || '');
      setIsEditing(false);

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
      const fetchBlocksAndSettings = async () => {
        const supabase = createBrowserClient();
        const { data: blocks } = await supabase
          .from('schedule_blocks')
          .select('*')
          .eq('company_id', appointment.company_id);
        setScheduleBlocks(blocks || []);

        const { data: company } = await supabase
          .from('companies')
          .select('settings')
          .eq('id', appointment.company_id)
          .single();
        if (company?.settings) {
          setShowHolidays(company.settings.show_holidays || false);
          setBlockHolidays(company.settings.block_holidays || false);
        }
      };
      
      const fetchHolidays = async () => {
        try {
          const res = await fetch(`https://brasilapi.com.br/api/feriados/v1/${new Date().getFullYear()}`);
          if (res.ok) {
            const data = await res.json();
            setHolidays(data.map((h: any) => ({
              id: h.name,
              title: h.name,
              type: 'holiday',
              start_date: `${h.date}T00:00:00.000Z`,
              date_str: h.date,
              is_active: true
            })));
          }
        } catch (err) {
          console.error('Error fetching holidays in edit modal:', err);
        }
      };

      fetchMedicalRecord();
      fetchTransactions();
      fetchBlocksAndSettings();
      fetchHolidays();
    }
  }, [appointment]);

  const calculatePrices = () => {
    const mainProc = procedures?.find(p => p.id === editProcedureId);
    
    if (!mainProc) {
      return {
        originalBasePrice: 0,
        suggestedBasePrice: 0,
        manualDiscountVal: 0,
        finalPrice: 0,
        ruleApplied: 'original_price',
        ruleAppliedDetails: 'Nenhum procedimento selecionado'
      };
    }

    let originalBasePrice = Number(mainProc.price || 0);
    let suggestedBasePrice = originalBasePrice;
    let ruleApplied = 'original_price';
    let ruleAppliedDetails = 'Preço Original';

    if (editIsMaintenance && mainProc.maintenance_price && Number(mainProc.maintenance_price) > 0) {
      suggestedBasePrice = Number(mainProc.maintenance_price);
      ruleApplied = 'maintenance';
      ruleAppliedDetails = `Preço de Retorno/Manutenção (R$ ${suggestedBasePrice.toFixed(2)})`;
    } 
    else if (editStartTime) {
      const startDT = new Date(editStartTime);
      const activePromo = promotions.find(p => {
        if (p.procedure_id !== mainProc.id || !p.is_active) return false;
        const start = new Date(p.start_date);
        const end = new Date(p.end_date);
        return startDT >= start && startDT <= end;
      });

      if (activePromo) {
        ruleApplied = 'promotion';
        if (activePromo.type === 'value') {
          suggestedBasePrice = Number(activePromo.value);
          ruleAppliedDetails = `Promoção: ${activePromo.name} (Preço Fixo R$ ${suggestedBasePrice.toFixed(2)})`;
        } else {
          const discountAmt = originalBasePrice * (Number(activePromo.value) / 100);
          suggestedBasePrice = Math.max(0, originalBasePrice - discountAmt);
          ruleAppliedDetails = `Promoção: ${activePromo.name} (${activePromo.value}% desc. - R$ ${suggestedBasePrice.toFixed(2)})`;
        }
      }
    }

    // Now add additional procedures to the calculation
    let additionalProceduresTotal = 0;
    editAdditionalProcedureIds.forEach((id: string) => {
      const extraProc = procedures?.find(p => p.id === id);
      if (extraProc) {
        additionalProceduresTotal += Number(extraProc.price || 0);
        originalBasePrice += Number(extraProc.price || 0);
      }
    });

    const totalSuggestedPrice = suggestedBasePrice + additionalProceduresTotal;

    // Apply manual discounts
    let manualDiscountVal = 0;
    if (editDiscountName || editDiscountValue || editDiscountPercentage) {
      if (editDiscountMethod === 'value' && editDiscountValue) {
        manualDiscountVal = parseFloat(editDiscountValue.replace(',', '.')) || 0;
      } else if (editDiscountMethod === 'percentage' && editDiscountPercentage) {
        const pct = parseFloat(editDiscountPercentage.replace(',', '.')) || 0;
        manualDiscountVal = totalSuggestedPrice * (pct / 100);
      }
    }

    const finalPrice = Math.max(0, totalSuggestedPrice - manualDiscountVal);

    return {
      originalBasePrice,
      suggestedBasePrice: totalSuggestedPrice,
      manualDiscountVal,
      finalPrice,
      ruleApplied,
      ruleAppliedDetails
    };
  };

  const handleDiscountValueChange = (val: string) => {
    if (val === '' || /^[0-9]*[.,]?[0-9]*$/.test(val)) {
      setEditDiscountValue(val);
      setEditDiscountPercentage('');
    }
  };

  const handleDiscountPercentageChange = (val: string) => {
    if (val === '' || /^[0-9]*[.,]?[0-9]*$/.test(val)) {
      setEditDiscountPercentage(val);
      setEditDiscountValue('');
    }
  };

  const handleRegisterPaymentDirect = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newPayAmount || Number(newPayAmount) <= 0) {
      toast.error('Informe um valor de pagamento válido.');
      return;
    }
    
    setLoadingTx(true);
    const supabase = createBrowserClient();
    try {
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

      const paymentVal = Number(newPayAmount.replace(',', '.'));
      
      const transactionValues = {
        company_id: appointment.company_id,
        appointment_id: appointment.id,
        category_id: catData?.id,
        account_id: accData?.id,
        amount: paymentVal,
        type: 'income',
        status: 'completed',
        payment_method: newPayMethod,
        description: `Atendimento (Avulso): ${appointment.clients?.full_name}`,
        date: new Date().toISOString(),
        transaction_date: new Date().toISOString()
      };
      
      const { error: txError } = await supabase.from('transactions').insert(transactionValues);
      if (txError) throw txError;

      if (accData?.id) {
        const { error: rpcError } = await supabase.rpc('update_account_balance', { 
          target_account_id: accData.id, 
          amount_diff: paymentVal 
        });
        if (rpcError) throw rpcError;
      }
      
      toast.success('Pagamento registrado com sucesso!');
      
      await fetchTransactions();
      onUpdate();
    } catch (err: any) {
      console.error('Error registering payment:', err);
      toast.error('Erro ao registrar pagamento: ' + err.message);
    } finally {
      setLoadingTx(false);
    }
  };

  const handleSendAnamnese = async () => {
    setSendingLink(true);
    try {
      const res = await fetch('/api/anamnese/send-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointment_id: appointment.id })
      });
      
      let data: any = {};
      try {
        data = await res.json();
      } catch (_) {}

      if (!res.ok) throw new Error(data.error || `Erro do servidor (${res.status})`);

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
        
        let data: any = {};
        try {
          data = await res.json();
        } catch (_) {}

        if (!res.ok) throw new Error(data.error || `Erro do servidor (${res.status})`);

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
      } catch (error: any) {
        console.error('Erro ao verificar anamnese:', error);
        toast.error('Erro ao verificar requisitos de anamnese: ' + error.message);
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
      const updatePayload: any = { status };
      
      if (isEditing) {
        if (!editClientId || !editProfessionalId || !editProcedureId || !editStartTime) {
          toast.error('Preencha todos os campos obrigatórios (Cliente, Profissional, Procedimento e Data/Hora).');
          setLoading(false);
          return;
        }
        
        const selectedProc = procedures?.find(p => p.id === editProcedureId);
        const duration = selectedProc?.duration_minutes || 60;
        const start = new Date(editStartTime);
        const end = new Date(start.getTime() + duration * 60 * 1000);

        // Check if any part of the appointment overlaps with a schedule block
        let checkTime = new Date(start.getTime());
        let overlapsBlock = false;
        let blockedBlockObj: any = null;
        
        while (checkTime < end) {
          const blocked = checkIsBlocked(checkTime);
          if (blocked) {
            overlapsBlock = true;
            blockedBlockObj = blocked;
            break;
          }
          checkTime = new Date(checkTime.getTime() + 15 * 60 * 1000);
        }
        
        if (!overlapsBlock) {
          const blockedEnd = checkIsBlocked(new Date(end.getTime() - 1000));
          if (blockedEnd) {
            overlapsBlock = true;
            blockedBlockObj = blockedEnd;
          }
        }
        
        if (overlapsBlock) {
          if (blockedBlockObj?.is_full_day) {
            toast.error('Esta data foi bloqueada pela clínica e não está disponível para novos agendamentos.');
          } else {
            toast.error('O horário selecionado está indisponível devido a um bloqueio da agenda.');
          }
          setLoading(false);
          return;
        }
        
        const prices = calculatePrices();

        // Receptionist discount limit check
        if (profile?.role !== 'admin' && profile?.role !== 'chefe' && (editDiscountValue || editDiscountPercentage) && prices.manualDiscountVal > 0) {
          const limitType = receptionistLimit?.type || 'percentage';
          const limitVal = receptionistLimit?.limit || 15;
          
          if (limitType === 'percentage') {
            const pct = (prices.manualDiscountVal / prices.suggestedBasePrice) * 100;
            if (pct > limitVal) {
              toast.error(`Limite de Desconto Excedido: O limite configurado para recepcionistas é de ${limitVal}%.`);
              setLoading(false);
              return;
            }
          } else if (limitType === 'value') {
            if (prices.manualDiscountVal > limitVal) {
              toast.error(`Limite de Desconto Excedido: O limite configurado para recepcionistas é de R$ ${limitVal.toFixed(2)}.`);
              setLoading(false);
              return;
            }
          }
        }

        updatePayload.client_id = editClientId;
        updatePayload.professional_id = editProfessionalId;
        updatePayload.procedure_id = editProcedureId;
        updatePayload.start_time = start.toISOString();
        updatePayload.end_time = end.toISOString();
        updatePayload.notes = editNotes;
        updatePayload.additional_procedure_ids = editAdditionalProcedureIds.filter(id => id !== '');

        // Save discount details
        updatePayload.original_price = prices.originalBasePrice;
        updatePayload.discount_type = editDiscountMethod || null;
        updatePayload.discount_name = editDiscountName || null;
        updatePayload.discount_value = prices.manualDiscountVal || null;
        updatePayload.discount_percentage = editDiscountPercentage ? parseFloat(editDiscountPercentage.replace(',', '.')) : null;
        updatePayload.discount_notes = editDiscountNotes || null;
        updatePayload.rule_applied = prices.ruleApplied;
        updatePayload.is_maintenance = editIsMaintenance;
        updatePayload.price_override = prices.finalPrice;
      } else {
        updatePayload.notes = notes;
      }

      const { error } = await supabase
        .from('appointments')
        .update(updatePayload)
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

  const procObj = Array.isArray(appointment?.procedures) ? appointment.procedures[0] : appointment?.procedures;
  const totalPrice = Number(appointment?.price_override || procObj?.price || 0);
  const paidConfirmed = transactionsList
    .filter(t => t.status === 'completed' || !t.status)
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const pendingBalance = Math.max(0, totalPrice - paidConfirmed);

  if (!appointment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto bg-white border-[#E5E0D8] p-0 rounded-3xl shadow-2xl text-[#2C2825] custom-scrollbar">
        <DialogHeader className="p-6 pb-0 bg-[#FDFBF7]/50 sticky top-0 z-10 border-b border-[#E5E0D8]/40 backdrop-blur-md">
           <div className="flex items-center justify-between w-full mb-2 pr-6">
              <div className="flex items-center gap-3">
                 <button 
                   type="button"
                   onClick={() => setIsEditing(!isEditing)}
                   className={cn(
                     "p-2 rounded-xl border transition-all hover:scale-105 active:scale-95",
                     isEditing 
                       ? "bg-[#D4AF37] text-white border-[#D4AF37] shadow-sm" 
                       : "bg-[#FDFBF7] text-[#8A847C] border-[#E5E0D8] hover:bg-[#FAF6EE] hover:text-[#2C2825]"
                   )}
                   title="Editar agendamento"
                 >
                    <Edit2 className="h-5 w-5" />
                 </button>
                 <div>
                    <DialogTitle className="text-lg font-black text-[#2C2825]">
                      {isEditing ? 'Editar Agendamento' : 'Gerenciar Agendamento'}
                    </DialogTitle>
                    <p className="text-[10px] text-[#8A847C] uppercase font-black tracking-widest mt-0.5">
                       {format(new Date(appointment.start_time), 'dd/MM/yyyy HH:mm')}
                    </p>
                 </div>
              </div>
              
              {isEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-[9px] font-black text-rose-500 uppercase tracking-wider hover:underline"
                >
                  Cancelar
                </button>
              )}
           </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
                 {isEditing ? (
              <div className="space-y-4 bg-[#FAF9F6] p-4 rounded-2xl border border-[#E5E0D8]">
                {/* Barra de Atalhos Rápidos - Touch friendly & premium */}
                <div className="bg-white border border-[#E5E0D8] rounded-xl p-2.5 space-y-1.5 mb-2">
                  <span className="text-[8px] font-black text-neutral-500 uppercase tracking-widest block ml-1">Atalhos Rápidos</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (editProcedureId) {
                          setEditAdditionalProcedureIds([...editAdditionalProcedureIds, '']);
                        } else {
                          toast.error('Selecione primeiro o procedimento principal');
                        }
                      }}
                      className="flex items-center justify-center gap-1.5 p-2 rounded-lg border bg-[#FAF9F6] text-[#2C2825] border-[#E5E0D8] hover:bg-[#FAF6EE] hover:border-[#D4AF37]/45 text-center transition-all active:scale-[0.98] h-10"
                    >
                      <span className="text-xs">➕</span>
                      <span className="text-[9px] font-black uppercase tracking-wider">Proced. Extra</span>
                    </button>

                    {procedures?.find(p => p.id === editProcedureId)?.maintenance_required && (
                      <button
                        type="button"
                        onClick={() => setEditIsMaintenance(!editIsMaintenance)}
                        className={cn(
                          "flex items-center justify-center gap-1.5 p-2 rounded-lg border text-center transition-all active:scale-[0.98] h-10",
                          editIsMaintenance 
                            ? "bg-[#D4AF37] text-white border-[#D4AF37] shadow-sm" 
                            : "bg-[#FAF9F6] text-[#2C2825] border-[#E5E0D8] hover:bg-[#FAF6EE] hover:border-[#D4AF37]/45"
                        )}
                      >
                        <span className="text-xs">🔁</span>
                        <span className="text-[9px] font-black uppercase tracking-wider">Manutenção</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Cliente */}
                <div className="space-y-1">
                  <Label className="text-[10px] font-black text-neutral-600 uppercase tracking-widest ml-1">Cliente</Label>
                  <SearchableSelect
                    options={clients.map(c => ({ value: c.id, label: c.full_name }))}
                    value={editClientId}
                    onChange={setEditClientId}
                    placeholder="Selecione o cliente"
                    searchPlaceholder="Buscar por nome..."
                    triggerClassName="h-10 rounded-xl"
                  />
                </div>

                {/* Profissional */}
                <div className="space-y-1">
                  <Label className="text-[10px] font-black text-neutral-600 uppercase tracking-widest ml-1">Profissional</Label>
                  <SearchableSelect
                    options={(professionals || []).map(p => ({ value: p.id, label: p.full_name }))}
                    value={editProfessionalId}
                    onChange={setEditProfessionalId}
                    placeholder="Selecione o profissional"
                    searchPlaceholder="Buscar profissional..."
                    triggerClassName="h-10 rounded-xl"
                  />
                </div>

                {/* Procedimento */}
                <div className="space-y-1">
                  <Label className="text-[10px] font-black text-neutral-600 uppercase tracking-widest ml-1">Procedimento</Label>
                  <SearchableSelect
                    options={(procedures || []).map(p => ({ value: p.id, label: p.name }))}
                    value={editProcedureId}
                    onChange={(val) => {
                      setEditProcedureId(val);
                      const proc = procedures?.find(p => p.id === val);
                      if (proc?.maintenance_required && proc?.maintenance_price && Number(proc.maintenance_price) > 0) {
                        setEditIsMaintenance(true);
                      } else {
                        setEditIsMaintenance(false);
                      }
                    }}
                    placeholder="Selecione o procedimento"
                    searchPlaceholder="Buscar procedimento..."
                    triggerClassName="h-10 rounded-xl"
                  />
                </div>

                {/* List of edit additional procedures */}
                {editAdditionalProcedureIds.map((extraId, idx) => (
                  <div key={idx} className="flex items-center gap-2 mt-2">
                    <SearchableSelect
                      options={(procedures || [])
                        .filter(p => p.id !== editProcedureId && !editAdditionalProcedureIds.includes(p.id) || p.id === extraId)
                        .map(p => ({ value: p.id, label: p.name }))}
                      value={extraId}
                      onChange={(val) => {
                        const updated = [...editAdditionalProcedureIds];
                        updated[idx] = val;
                        setEditAdditionalProcedureIds(updated);
                      }}
                      placeholder="Outro procedimento..."
                      searchPlaceholder="Buscar procedimento..."
                      className="flex-1"
                      triggerClassName="h-10 rounded-xl"
                    />
                    <Button 
                      type="button" 
                      variant="ghost" 
                      onClick={() => {
                        setEditAdditionalProcedureIds(editAdditionalProcedureIds.filter((_, i) => i !== idx));
                      }}
                      className="h-10 px-3 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl shrink-0"
                    >
                      Remover
                    </Button>
                  </div>
                ))}

                {/* Data e Hora */}
                <div className="space-y-1">
                  <Label className="text-[10px] font-black text-neutral-600 uppercase tracking-widest ml-1">Data e Hora de Início</Label>
                  <Input 
                    type="datetime-local" 
                    value={editStartTime}
                    onChange={(e) => setEditStartTime(e.target.value)}
                    className="bg-white h-10 rounded-xl text-[#2C2825] border-[#E5E0D8]"
                  />
                </div>

                {/* Descontos e Promoções (Edit Mode) */}
                <div className="space-y-4 pt-3 border-t border-[#E5E0D8]/60 mt-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-black text-neutral-600 uppercase tracking-widest ml-1">Descontos e Promoções</Label>
                    
                    {procedures?.find(p => p.id === editProcedureId)?.maintenance_required && (
                      <div className="flex items-center gap-2">
                        <input 
                          type="checkbox"
                          id="edit_is_maintenance_booking"
                          checked={editIsMaintenance}
                          onChange={(e) => setEditIsMaintenance(e.target.checked)}
                          className="w-4 h-4 rounded border-[#E5E0D8] text-[#D4AF37] focus:ring-[#D4AF37]"
                        />
                        <label htmlFor="edit_is_maintenance_booking" className="text-xs font-bold text-[#5C5855] cursor-pointer">É Manutenção/Retorno</label>
                      </div>
                    )}
                  </div>

                  {editProcedureId && (
                    <div className="bg-[#FAF6E9] border border-[#E5E0D8] rounded-xl p-2.5 text-[11px] text-[#765928] font-bold">
                      ⚡ Regra de preço aplicada: <span className="underline">{calculatePrices().ruleAppliedDetails}</span>
                    </div>
                  )}

                  {profile?.role !== 'professional' ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-[#8A847C] uppercase tracking-wider ml-1">Nome do Desconto</label>
                          <Input 
                            placeholder="Ex: VIP, Fidelidade, Campanha..."
                            value={editDiscountName}
                            onChange={(e) => setEditDiscountName(e.target.value)}
                            className="bg-white border-[#E5E0D8] h-9 rounded-lg text-xs font-bold"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-[#8A847C] uppercase tracking-wider ml-1">Método de Desconto</label>
                          <div className="flex bg-[#F0EBE0]/60 p-1 rounded-lg gap-1 h-9">
                            <button
                              type="button"
                              onClick={() => {
                                setEditDiscountMethod('percentage');
                                setEditDiscountValue('');
                              }}
                              className={cn(
                                "flex-1 py-1 rounded-md text-[9px] font-black uppercase tracking-wider transition-all",
                                editDiscountMethod === 'percentage' 
                                  ? "bg-white text-[#D4AF37] shadow-xs" 
                                  : "text-[#5C5855] hover:text-[#2C2825]"
                              )}
                            >
                              % Porcentagem
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditDiscountMethod('value');
                                setEditDiscountPercentage('');
                              }}
                              className={cn(
                                "flex-1 py-1 rounded-md text-[9px] font-black uppercase tracking-wider transition-all",
                                editDiscountMethod === 'value' 
                                  ? "bg-white text-[#D4AF37] shadow-xs" 
                                  : "text-[#5C5855] hover:text-[#2C2825]"
                              )}
                            >
                              R$ Dinheiro
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-[#8A847C] uppercase tracking-wider ml-1">
                            {editDiscountMethod === 'percentage' ? 'Desconto (%)' : 'Valor do Desconto (R$)'}
                          </label>
                          <Input 
                            placeholder="0"
                            value={editDiscountMethod === 'percentage' ? editDiscountPercentage : editDiscountValue}
                            onChange={(e) => {
                              if (editDiscountMethod === 'percentage') {
                                handleDiscountPercentageChange(e.target.value);
                              } else {
                                handleDiscountValueChange(e.target.value);
                              }
                            }}
                            className="bg-white border-[#E5E0D8] h-9 rounded-lg text-xs font-bold"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-[#8A847C] uppercase tracking-wider ml-1">Observações do Desconto</label>
                          <Input 
                            placeholder="Motivo..."
                            value={editDiscountNotes}
                            onChange={(e) => setEditDiscountNotes(e.target.value)}
                            className="bg-white border-[#E5E0D8] h-9 rounded-lg text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[9px] text-neutral-400 italic">Profissionais não aplicam descontos.</p>
                  )}
                </div>

                {/* Recibo/Resumo Financeiro (Edit Mode) */}
                {editProcedureId && (
                  <div className="bg-white border border-[#E5E0D8]/60 rounded-xl p-3 space-y-1.5 text-[11px] mt-3">
                    <div className="flex justify-between items-center text-neutral-600">
                      <span>Valor Original:</span>
                      <span className="font-mono">R$ {calculatePrices().originalBasePrice.toFixed(2)}</span>
                    </div>
                    {calculatePrices().suggestedBasePrice !== calculatePrices().originalBasePrice && (
                      <div className="flex justify-between items-center text-neutral-800 font-bold">
                        <span>Sugerido (Promo/Manut):</span>
                        <span className="font-mono">R$ {calculatePrices().suggestedBasePrice.toFixed(2)}</span>
                      </div>
                    )}
                    {calculatePrices().manualDiscountVal > 0 && (
                      <div className="flex justify-between items-center text-rose-600 font-bold">
                        <span>Desconto Manual:</span>
                        <span className="font-mono">- R$ {calculatePrices().manualDiscountVal.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t border-[#E5E0D8]/50 pt-1 mt-1 flex justify-between font-black text-[#2C2825]">
                      <span>Valor Final:</span>
                      <span className="text-[#D4AF37] font-mono">
                        R$ {calculatePrices().finalPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Info Cards */
              <div className="bg-[#FAF9F6] border border-[#E5E0D8] rounded-2xl p-4 space-y-4">
                {/* Cliente */}
                <div className="flex items-center gap-3.5 pb-3 border-b border-[#E5E0D8]/60">
                  <div className="h-9 w-9 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] shrink-0">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-[#8A847C] uppercase tracking-widest block">Cliente</span>
                    <span className="font-bold text-sm text-[#2C2825]">{appointment.clients?.full_name}</span>
                  </div>
                </div>

                {/* Profissional */}
                <div className="flex items-center gap-3.5 pb-3 border-b border-[#E5E0D8]/60">
                  <div className="h-9 w-9 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] shrink-0">
                    <UserCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-[#8A847C] uppercase tracking-widest block">Profissional</span>
                    <span className="font-bold text-sm text-[#2C2825]">
                      {appointment.profiles?.full_name || 'Não atribuído'}
                    </span>
                  </div>
                </div>

                {/* Procedimento(s) */}
                <div className="flex items-start gap-3.5">
                  <div className="h-9 w-9 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] shrink-0 mt-0.5">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] font-black text-[#8A847C] uppercase tracking-widest block mb-1">Procedimento(s)</span>
                    <div className="space-y-2">
                      {/* Primary Procedure */}
                      <div className="flex justify-between items-center text-xs font-bold text-[#2C2825]">
                        <span className="truncate">{(Array.isArray(appointment.procedures) ? appointment.procedures[0] : appointment.procedures)?.name}</span>
                        <span className="font-mono text-[#8A847C]">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((Array.isArray(appointment.procedures) ? appointment.procedures[0] : appointment.procedures)?.price || 0)}
                        </span>
                      </div>
                      {/* Additional Procedures */}
                      {Array.isArray(appointment.additional_procedure_ids) && appointment.additional_procedure_ids.map((id: string) => {
                        const extraProc = procedures?.find((p: any) => p.id === id);
                        if (!extraProc) return null;
                        return (
                          <div key={id} className="flex justify-between items-center text-xs font-bold text-[#2C2825] border-t border-[#E5E0D8]/45 pt-1.5 mt-1.5 font-medium">
                            <span className="truncate">{extraProc.name}</span>
                            <span className="font-mono text-[#8A847C]">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(extraProc.price || 0)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    {/* Total Price */}
                    <div className="border-t border-[#D4AF37]/30 pt-2.5 mt-3 flex justify-between items-center">
                      <span className="text-[9px] font-black text-[#D4AF37] uppercase tracking-widest leading-none">Total</span>
                      <span className="text-[#D4AF37] text-sm font-black font-mono">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                          (() => {
                            if (appointment?.price_override !== null && appointment?.price_override !== undefined && Number(appointment.price_override) > 0) {
                              return Number(appointment.price_override);
                            }
                            const proc = Array.isArray(appointment?.procedures) ? appointment.procedures[0] : appointment?.procedures;
                            const primaryPrice = Number(proc?.price || 0);
                            let extraPrice = 0;
                            if (Array.isArray(appointment?.additional_procedure_ids)) {
                              appointment.additional_procedure_ids.forEach((id: string) => {
                                const extraProc = procedures?.find((p: any) => p.id === id);
                                if (extraProc) extraPrice += Number(extraProc.price || 0);
                              });
                            }
                            return primaryPrice + extraPrice;
                          })()
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

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

            {/* Histórico Financeiro */}
            {status !== 'cancelled' && (
              <div className="bg-[#FAF9F6] p-4 rounded-2xl border border-[#E5E0D8] space-y-4 my-4">
                <h3 className="text-sm font-black text-[#2C2825] uppercase tracking-widest flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-primary-500" />
                  Histórico Financeiro
                </h3>

                {/* Resumo Financeiro */}
                <div className="grid grid-cols-3 gap-2 text-center bg-white p-3 rounded-xl border border-[#E5E0D8]/60">
                  <div>
                    <span className="text-[9px] font-black text-[#8A847C] uppercase tracking-wider block">Total</span>
                    <span className="text-xs font-bold text-[#2C2825]">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPrice)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-[#8A847C] uppercase tracking-wider block">Pago</span>
                    <span className="text-xs font-bold text-emerald-600">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(paidConfirmed)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-[#8A847C] uppercase tracking-wider block">Pendente</span>
                    <span className={`text-xs font-bold ${pendingBalance > 0 ? 'text-amber-600' : 'text-neutral-500'}`}>
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pendingBalance)}
                    </span>
                  </div>
                </div>

                {/* Histórico de Transações */}
                {transactionsList.length > 0 ? (
                  <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                    {transactionsList.map((tx) => (
                      <div key={tx.id} className="flex justify-between items-center bg-white px-3 py-1.5 rounded-lg border border-[#E5E0D8]/40 text-xs">
                        <div className="flex flex-col">
                          <span className="font-bold text-[#2C2825]">
                            {tx.payment_method === 'pix' ? 'PIX' :
                             tx.payment_method === 'credit_card' ? 'Cartão de Crédito' :
                             tx.payment_method === 'debit_card' ? 'Cartão de Débito' :
                             tx.payment_method === 'cash' ? 'Dinheiro' : tx.payment_method || 'Outro'}
                          </span>
                          <span className="text-[9px] text-[#8A847C]">
                            {format(new Date(tx.transaction_date || tx.date || tx.created_at), 'dd/MM/yyyy HH:mm')}
                          </span>
                        </div>
                        <span className="font-black text-emerald-600">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(tx.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-neutral-600 italic text-center py-2">
                    Nenhum pagamento registrado ainda.
                  </p>
                )}

                {/* Formulário de Novo Pagamento (apenas se houver saldo pendente) */}
                {pendingBalance > 0 && (
                  <div className="space-y-3 pt-2 border-t border-[#E5E0D8]/50">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-[#5C5855]">Valor (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          required
                          className="bg-white border-[#E5E0D8] h-9 rounded-lg text-xs"
                          value={newPayAmount}
                          onChange={(e) => setNewPayAmount(e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-[#5C5855]">Forma</Label>
                        <Select value={newPayMethod} onValueChange={setNewPayMethod}>
                          <SelectTrigger className="bg-white border-[#E5E0D8] h-9 rounded-lg text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pix">PIX</SelectItem>
                            <SelectItem value="credit_card">Cartão Crédito</SelectItem>
                            <SelectItem value="debit_card">Cartão Débito</SelectItem>
                            <SelectItem value="cash">Dinheiro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button
                      type="button"
                      onClick={(e) => handleRegisterPaymentDirect(e)}
                      disabled={loadingTx}
                      className="w-full h-9 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm"
                    >
                      {loadingTx ? 'Registrando...' : 'Registrar Pagamento'}
                    </Button>
                  </div>
                )}
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
