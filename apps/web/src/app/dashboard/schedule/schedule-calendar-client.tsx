'use client';

import { useState, useEffect, useRef } from 'react';
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
  TextArea,
  SearchableSelect,
  Badge,
  cn
} from '@projeto/ui';
import { Appointment } from '@/types/database';
import { createBrowserClient } from '@/lib/supabase-browser';
import { format, addMinutes } from 'date-fns';
import { Plus, Settings2, CalendarOff } from 'lucide-react';
import { EditAppointmentModal } from './edit-appointment-modal';
import { useRouter, useSearchParams } from 'next/navigation';
import { BlockDaysModal } from './components/BlockDaysModal';
import { showToast } from '@/lib/toast-helpers';
import { isClientNearBirthday } from '@/lib/birthday';
import { evaluateClientMaintenanceCycle, shouldGenerateMaintenanceOnCreate, createMaintenanceAppointment } from '@/lib/maintenance-logic';
import { isWithinInterval, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays } from 'date-fns';
import { useProfile } from '@/providers/profile-provider';

interface ScheduleCalendarClientProps {
  initialAppointments: any[];
  clients: { id: string, full_name: string, phone?: string }[];
  procedures: { 
    id: string; 
    name: string; 
    duration_minutes: number; 
    price: number;
    maintenance_required?: boolean;
    maintenance_days_limit?: number;
    maintenance_period_unit?: string;
    maintenance_duration_minutes?: number;
    maintenance_price?: number;
  }[];
  professionals: { id: string, full_name: string }[];
  companyId: string;
}

export default function ScheduleCalendarClient({
  initialAppointments,
  clients: initialClients = [],
  procedures: initialProcedures = [],
  professionals: initialProfessionals = [],
  companyId
}: ScheduleCalendarClientProps) {
  const router = useRouter();
  const { profile } = useProfile();
  const searchParams = useSearchParams();
  const filterParam = searchParams.get('filter');
  const [isOnlyMaintenance, setIsOnlyMaintenance] = useState(filterParam === 'maintenance');

  // Promotions and Discount states
  const [promotions, setPromotions] = useState<any[]>([]);
  const [receptionistLimit, setReceptionistLimit] = useState<{ type: 'value' | 'percentage', limit: number } | null>(null);
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [discountMethod, setDiscountMethod] = useState<'percentage' | 'value'>('percentage');
  const [discountName, setDiscountName] = useState('');
  const [discountValue, setDiscountValue] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [discountNotes, setDiscountNotes] = useState('');
  const [showDiscountForm, setShowDiscountForm] = useState(false);

  useEffect(() => {
    if (filterParam === 'maintenance') {
      setIsOnlyMaintenance(true);
    } else {
      setIsOnlyMaintenance(false);
    }
  }, [filterParam]);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'day' | 'week' | 'month'>('week');
  const [appointments, setAppointments] = useState(initialAppointments);
  const [loading, setLoading] = useState(false);
  const cacheRef = useRef<Record<string, any[]>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slotInterval, setSlotInterval] = useState<number>(30);
  
  const [localClients, setLocalClients] = useState<any[]>(initialClients || []);
  const [localProcedures, setLocalProcedures] = useState<any[]>(initialProcedures || []);
  const [localProfessionals, setLocalProfessionals] = useState<any[]>(initialProfessionals || []);

  const clients = localClients;
  const procedures = localProcedures;
  const professionals = localProfessionals;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cachedClients = localStorage.getItem('calendar_clients_cache');
      const cachedProcedures = localStorage.getItem('calendar_procedures_cache');
      const cachedProfessionals = localStorage.getItem('calendar_professionals_cache');
      
      if (cachedClients) {
        try { setLocalClients(JSON.parse(cachedClients)); } catch (e) {}
      }
      if (cachedProcedures) {
        try { setLocalProcedures(JSON.parse(cachedProcedures)); } catch (e) {}
      }
      if (cachedProfessionals) {
        try { setLocalProfessionals(JSON.parse(cachedProfessionals)); } catch (e) {}
      }
    }

    async function loadMetadata() {
      try {
        const supabase = createBrowserClient();
        const [clientsRes, proceduresRes, professionalsRes] = await Promise.all([
          supabase
            .from('clients')
            .select('id, full_name, birth_date, phone')
            .eq('company_id', companyId)
            .order('full_name'),
          supabase
            .from('procedures')
            .select('id, name, duration_minutes, price, maintenance_required, maintenance_days_limit, maintenance_period_unit, maintenance_duration_minutes, maintenance_price')
            .eq('company_id', companyId)
            .order('name'),
          supabase
            .from('profiles')
            .select('id, full_name')
            .eq('company_id', companyId)
            .in('role', ['admin', 'professional'])
            .order('full_name')
        ]);

        if (clientsRes.data) {
          setLocalClients(clientsRes.data);
          localStorage.setItem('calendar_clients_cache', JSON.stringify(clientsRes.data));
        }
        if (proceduresRes.data) {
          setLocalProcedures(proceduresRes.data);
          localStorage.setItem('calendar_procedures_cache', JSON.stringify(proceduresRes.data));
        }
        if (professionalsRes.data) {
          setLocalProfessionals(professionalsRes.data);
          localStorage.setItem('calendar_professionals_cache', JSON.stringify(professionalsRes.data));
        }
      } catch (err) {
        console.error('Error fetching calendar metadata:', err);
      }
    }

    loadMetadata();
  }, [companyId]);

  // inline client registration states
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientLastName, setNewClientLastName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientBirthDate, setNewClientBirthDate] = useState('');
  const [newClientInstagram, setNewClientInstagram] = useState('');
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
    fetchLatestAppointments();
  }, [currentDate, view]);

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

  const calculatePrices = () => {
    const mainProc = procedures.find(p => p.id === formData.procedureId);
    
    if (!mainProc) {
      return {
        originalBasePrice: 0,
        usedBasePrice: 0,
        suggestedBasePrice: 0,
        priceType: 'normal' as 'normal' | 'maintenance' | 'promotion',
        manualDiscountVal: 0,
        finalPrice: 0,
        ruleApplied: 'original_price',
        ruleAppliedDetails: 'Nenhum procedimento selecionado'
      };
    }

    // Avaliar o Ciclo de Manutenção do Cliente para o procedimento selecionado
    const targetDate = formData.startTime ? new Date(formData.startTime) : new Date();
    const clientAppts = appointments.filter(a => a.client_id === formData.clientId);
    const cycleEval = evaluateClientMaintenanceCycle(
      clientAppts,
      mainProc.id,
      targetDate,
      mainProc.maintenance_days_limit
    );

    let originalBasePrice = Number(mainProc.price || 0);
    let usedBasePrice = originalBasePrice;
    let priceType: 'normal' | 'maintenance' | 'promotion' = 'normal';
    let ruleApplied = 'original_price';
    let ruleAppliedDetails = cycleEval.ruleLabel;

    // A. Manutenção Fixo (se o ciclo estiver ativo e houver maintenance_price cadastrado)
    if (cycleEval.isMaintenanceEligible && mainProc.maintenance_price && Number(mainProc.maintenance_price) > 0) {
      usedBasePrice = Number(mainProc.maintenance_price);
      priceType = 'maintenance';
      ruleApplied = 'maintenance';
      ruleAppliedDetails = 'Preço aplicado: Manutenção ativa';
    } 
    // B. Preço Promocional
    else if (formData.startTime) {
      const startDT = new Date(formData.startTime);
      const activePromo = promotions.find(p => {
        if (p.procedure_id !== mainProc.id || !p.is_active) return false;
        const start = new Date(p.start_date);
        const end = new Date(p.end_date);
        return startDT >= start && startDT <= end;
      });

      if (activePromo) {
        priceType = 'promotion';
        ruleApplied = 'promotion';
        if (activePromo.type === 'value') {
          usedBasePrice = Number(activePromo.value);
          ruleAppliedDetails = `Promoção: ${activePromo.name} (R$ ${usedBasePrice.toFixed(2)})`;
        } else {
          const discountAmt = originalBasePrice * (Number(activePromo.value) / 100);
          usedBasePrice = Math.max(0, originalBasePrice - discountAmt);
          ruleAppliedDetails = `Promoção: ${activePromo.name} (${activePromo.value}%)`;
        }
      }
    }

    // Procedimentos adicionais
    let additionalProceduresTotal = 0;
    additionalProcedureIds.forEach(id => {
      const extraProc = procedures.find(p => p.id === id);
      if (extraProc) {
        additionalProceduresTotal += Number(extraProc.price || 0);
        originalBasePrice += Number(extraProc.price || 0);
      }
    });

    const totalUsedBasePrice = usedBasePrice + additionalProceduresTotal;

    // Desconto manual opcional
    let manualDiscountVal = 0;
    if (discountName || discountValue || discountPercentage) {
      if (discountMethod === 'value' && discountValue) {
        manualDiscountVal = parseFloat(discountValue.replace(',', '.')) || 0;
      } else if (discountMethod === 'percentage' && discountPercentage) {
        const pct = parseFloat(discountPercentage.replace(',', '.')) || 0;
        manualDiscountVal = totalUsedBasePrice * (pct / 100);
      }
    }

    const finalPrice = Math.max(0, totalUsedBasePrice - manualDiscountVal);

    return {
      originalBasePrice,
      usedBasePrice: totalUsedBasePrice,
      suggestedBasePrice: totalUsedBasePrice,
      priceType,
      manualDiscountVal,
      finalPrice,
      ruleApplied,
      ruleAppliedDetails
    };
  };

  const handleDiscountValueChange = (val: string) => {
    if (val === '' || /^[0-9]*[.,]?[0-9]*$/.test(val)) {
      setDiscountValue(val);
      setDiscountPercentage('');
    }
  };

  const handleDiscountPercentageChange = (val: string) => {
    if (val === '' || /^[0-9]*[.,]?[0-9]*$/.test(val)) {
      setDiscountPercentage(val);
      setDiscountValue('');
    }
  };

  // Edit Modal State
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Block Modal State
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [scheduleBlocks, setScheduleBlocks] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [showHolidays, setShowHolidays] = useState(false);
  const [blockHolidays, setBlockHolidays] = useState(false);

  const fetchPromotions = async () => {
    try {
      const supabase = createBrowserClient();
      const { data, error } = await supabase
        .from('procedure_promotions')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true);
      if (error) throw error;
      setPromotions(data || []);
    } catch (err) {
      console.error('Error fetching promotions:', err);
    }
  };

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
      if (data.settings.receptionist_discount_limit) {
        setReceptionistLimit(data.settings.receptionist_discount_limit);
      } else {
        setReceptionistLimit({ type: 'percentage', limit: 15 });
      }
    } else {
      setReceptionistLimit({ type: 'percentage', limit: 15 });
    }
  };

  const fetchLatestAppointments = async (bypassCache = false) => {
    // Calculate date range based on view
    let start = startOfDay(currentDate);
    let end = endOfDay(currentDate);
    
    if (view === 'week') {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
      start = startOfDay(weekStart);
      end = endOfDay(addDays(weekStart, 6));
    } else if (view === 'month') {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      start = startOfWeek(monthStart, { weekStartsOn: 0 });
      end = endOfWeek(monthEnd, { weekStartsOn: 0 });
    }

    const cacheKey = `${start.toISOString()}_${end.toISOString()}`;
    if (!bypassCache && cacheRef.current[cacheKey]) {
      setAppointments(cacheRef.current[cacheKey]);
      return;
    }

    setLoading(true);
    try {
      const supabase = createBrowserClient();
      const { data: appData, error: appError } = await supabase
        .from('appointments')
        .select(`
          *,
          clients!inner(full_name, birth_date),
          procedures!inner(name, color, duration_minutes, price, maintenance_required, maintenance_days_limit, maintenance_period_unit, maintenance_duration_minutes, maintenance_price),
          profiles:professional_id(full_name)
        `)
        .eq('company_id', companyId)
        .gte('start_time', start.toISOString())
        .lte('start_time', end.toISOString());

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

      cacheRef.current[cacheKey] = hydrated;
      setAppointments(hydrated);
    } catch (err) {
      console.error('Error fetching latest appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHolidays = async () => {
    try {
      const currentYear = new Date().getFullYear();
      const nextYear = currentYear + 1;
      
      const fetchYear = async (y: number) => {
        try {
          const response = await fetch(`https://brasilapi.com.br/api/feriados/v1/${y}`);
          if (!response.ok) return [];
          return await response.json();
        } catch (e) {
          console.error(`Failed to fetch holidays for year ${y}:`, e);
          return [];
        }
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
    fetchPromotions();
  }, [companyId]);

  const handleNewAppointment = (date: Date) => {
    // block scheduling in the past
    const now = new Date();
    // Allow if it is the same day (today) or in the future
    const isPastDay = startOfDay(date) < startOfDay(now);
    
    if (isPastDay) {
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
      const fullName = `${newClientName.trim()} ${newClientLastName.trim()}`.trim();
      const { data, error } = await supabase
        .from('clients')
        .insert({
          full_name: fullName,
          phone: newClientPhone.trim() || null,
          email: newClientEmail.trim() || null,
          birth_date: newClientBirthDate || null,
          instagram: newClientInstagram.trim() || null,
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
      setNewClientLastName('');
      setNewClientEmail('');
      setNewClientBirthDate('');
      setNewClientInstagram('');
      setNewClientPhone('');
    } catch (err: any) {
      console.error('Error creating client inline:', err);
      showToast.error('Erro ao cadastrar cliente', err.message || 'Tente novamente.');
    } finally {
      setIsCreatingClientLoading(false);
    }
  };

  const checkIsBlocked = (date: Date) => {
    // Se o interruptor mestre estiver desligado, nenhum bloqueio é aplicado
    if (!blockHolidays) return undefined;

    const dayOfWeek = date.getDay();
    const dateStr = format(date, 'yyyy-MM-dd');
    const currentTime = format(date, 'HH:mm');
    const allBlocks = [...scheduleBlocks, ...(showHolidays ? holidays : [])];

    return allBlocks.find(block => {
      if (!block.is_active) return false;

      // 1. Feriados (BrasilAPI usa formato 'yyyy-MM-dd')
      if (block.type === 'holiday') {
        const holidayDateStr = block.date_str || block.start_date.substring(0, 10);
        return dateStr === holidayDateStr;
      }

      // 2. Recorrente (Semanal)
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
        
        // Also check exact end boundary
        if (!overlapsBlock) {
          const blockedEnd = checkIsBlocked(new Date(end.getTime() - 1000));
          if (blockedEnd) {
            overlapsBlock = true;
            blockedBlockObj = blockedEnd;
          }
        }
        
        if (overlapsBlock) {
          if (blockedBlockObj?.is_full_day) {
            showToast.error('Erro', 'Esta data foi bloqueada pela clínica e não está disponível para novos agendamentos.');
          } else {
            showToast.error('Erro', 'O horário selecionado está indisponível devido a um bloqueio da agenda.');
          }
          setIsSubmitting(false);
          return;
        }
      }

      // Check for conflicts with existing appointments in the database
      if (!isLaunching) {
        const { data: dbConflicts, error: conflictError } = await supabase
          .from('appointments')
          .select('id, start_time, end_time, clients(full_name)')
          .eq('company_id', companyId)
          .eq('professional_id', formData.professionalId)
          .neq('status', 'cancelled')
          .neq('status', 'completed')
          .lt('start_time', end.toISOString())
          .gt('end_time', start.toISOString());

        if (conflictError) {
          console.error('Erro ao verificar conflitos no banco:', conflictError);
        } else if (dbConflicts && dbConflicts.length > 0) {
          const clientsData = dbConflicts[0].clients;
          const conflictName = (Array.isArray(clientsData) 
            ? clientsData[0]?.full_name 
            : (clientsData as any)?.full_name) || 'outro cliente';
          showToast.error('Atenção', `Este profissional já possui um agendamento ativo com ${conflictName} neste horário.`);
          throw new Error('Conflito de Horário');
        }
      }

      const prices = calculatePrices();
      
      // Receptionist discount limit check
      if (profile?.role !== 'admin' && profile?.role !== 'chefe' && (discountValue || discountPercentage) && prices.manualDiscountVal > 0) {
        const limitType = receptionistLimit?.type || 'percentage';
        const limitVal = receptionistLimit?.limit || 15;
        
        if (limitType === 'percentage') {
          const pct = (prices.manualDiscountVal / prices.suggestedBasePrice) * 100;
          if (pct > limitVal) {
            showToast.error('Limite de Desconto Excedido', `O limite de desconto configurado para recepcionistas é de ${limitVal}%.`);
            setIsSubmitting(false);
            return;
          }
        } else if (limitType === 'value') {
          if (prices.manualDiscountVal > limitVal) {
            showToast.error('Limite de Desconto Excedido', `O limite de desconto configurado para recepcionistas é de R$ ${limitVal.toFixed(2)}.`);
            setIsSubmitting(false);
            return;
          }
        }
      }

      const priceVal = isLaunching ? (Number(launchingPrice) || prices.finalPrice) : prices.finalPrice;

      // Equalização dos campos de pagamento na tabela appointments
      let mappedPaymentStatus = 'pending';
      let mappedPaymentMethod: string | null = null;
      if (isLaunching) {
        mappedPaymentStatus = launchingPaymentStatus; // 'paid' | 'partial' | 'pending'
        if (launchingPaymentStatus !== 'pending') {
          mappedPaymentMethod = launchingPaymentMethod;
        }
      }

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
          status: isLaunching ? 'completed' : 'scheduled',
          original_price: prices.originalBasePrice,
          discount_type: discountMethod || null,
          discount_name: discountName || null,
          discount_value: prices.manualDiscountVal || null,
          discount_percentage: discountPercentage ? parseFloat(discountPercentage.replace(',', '.')) : null,
          discount_notes: discountNotes || null,
          rule_applied: prices.ruleApplied,
          is_maintenance: isMaintenance
        })
        .select(`
          *,
          clients(full_name),
          procedures(name, duration_minutes, color)
        `)
        .single();

      if (error) throw error;

      // Geração Automática Imediata de Manutenção no ato do agendamento
      const procObj = procedures.find(p => p.id === formData.procedureId);
      if (shouldGenerateMaintenanceOnCreate(procObj, isLaunching, isMaintenance)) {
        const { created, futureDate } = await createMaintenanceAppointment(
          supabase,
          {
            id: data.id,
            company_id: companyId,
            client_id: formData.clientId,
            professional_id: formData.professionalId,
            procedure_id: formData.procedureId,
            start_time: start.toISOString()
          },
          procObj,
          isLaunching
        );
        if (created && futureDate) {
          showToast.success('Agendamento Criado!', `Próxima manutenção agendada automaticamente para ${format(futureDate, 'dd/MM/yyyy')}`);
        }
      }

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
      fetchLatestAppointments(true);
      
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
    <div className="flex flex-col h-full bg-white p-3 sm:p-4 md:p-6 min-h-screen w-full overflow-x-hidden space-y-4">
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
        currentDate={currentDate}
        setCurrentDate={setCurrentDate}
        view={view}
        setView={setView}
        loading={loading}
      />

      <EditAppointmentModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        appointment={selectedAppointment}
        professionals={professionals}
        procedures={procedures}
        clients={localClients}
        onUpdate={() => {
           router.refresh();
           fetchLatestAppointments(true);
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
            {/* Barra de Atalhos Rápidos - Touch friendly & premium */}
            <div className="bg-[#FAF9F6] border border-[#E5E0D8] rounded-2xl p-3.5 space-y-2">
              <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest block ml-1">Ações e Atalhos Rápidos</span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingClient(!isCreatingClient)}
                  className={cn(
                    "flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all active:scale-[0.98] h-16",
                    isCreatingClient 
                      ? "bg-rose-500 text-white border-rose-500 shadow-sm" 
                      : "bg-white text-[#2C2825] border-[#E5E0D8] hover:bg-[#FAF6EE] hover:border-[#D4AF37]/45"
                  )}
                >
                  <span className="text-lg mb-1">{isCreatingClient ? '❌' : '👤'}</span>
                  <span className="text-[9px] font-black uppercase tracking-wider leading-none">
                    {isCreatingClient ? 'Cancelar' : 'Novo Cliente'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsManualDateTime(!isManualDateTime)}
                  className={cn(
                    "flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all active:scale-[0.98] h-16",
                    isManualDateTime 
                      ? "bg-[#D4AF37] text-white border-[#D4AF37] shadow-sm" 
                      : "bg-white text-[#2C2825] border-[#E5E0D8] hover:bg-[#FAF6EE] hover:border-[#D4AF37]/45"
                  )}
                >
                  <span className="text-lg mb-1">✍️</span>
                  <span className="text-[9px] font-black uppercase tracking-wider leading-none">Data Manual</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (formData.procedureId) {
                      setAdditionalProcedureIds([...additionalProcedureIds, '']);
                    } else {
                      showToast.error('Selecione primeiro o procedimento principal');
                    }
                  }}
                  className="flex flex-col items-center justify-center p-2.5 rounded-xl border bg-white text-[#2C2825] border-[#E5E0D8] hover:bg-[#FAF6EE] hover:border-[#D4AF37]/45 text-center transition-all active:scale-[0.98] h-16"
                >
                  <span className="text-lg mb-1">➕</span>
                  <span className="text-[9px] font-black uppercase tracking-wider leading-none">Proced. Extra</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[10px] font-black text-neutral-600 uppercase tracking-widest">Cliente</label>
              </div>
              
              {isCreatingClient ? (
                <div className="bg-[#FAF9F6] border border-[#E5E0D8] rounded-2xl p-4 space-y-3 animate-in fade-in duration-200">
                  <p className="text-[9px] font-black text-[#8A847C] uppercase tracking-wider">Cadastrar Cliente Rápido</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Input 
                        placeholder="Nome *" 
                        value={newClientName}
                        onChange={(e) => setNewClientName(e.target.value)}
                        className="bg-white h-10 rounded-lg text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Input 
                        placeholder="Sobrenome" 
                        value={newClientLastName}
                        onChange={(e) => setNewClientLastName(e.target.value)}
                        className="bg-white h-10 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Input 
                        type="email"
                        placeholder="E-mail" 
                        value={newClientEmail}
                        onChange={(e) => setNewClientEmail(e.target.value)}
                        className="bg-white h-10 rounded-lg text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Input 
                        placeholder="WhatsApp (com DDD)" 
                        value={newClientPhone}
                        onChange={(e) => setNewClientPhone(e.target.value)}
                        className="bg-white h-10 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Input 
                        type="date"
                        placeholder="Data de Nascimento" 
                        value={newClientBirthDate}
                        onChange={(e) => setNewClientBirthDate(e.target.value)}
                        className="bg-white h-10 rounded-lg text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Input 
                        placeholder="@instagram" 
                        value={newClientInstagram}
                        onChange={(e) => setNewClientInstagram(e.target.value)}
                        className="bg-white h-10 rounded-lg text-xs"
                      />
                    </div>
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
                <SearchableSelect
                  options={localClients.map(c => ({
                    value: c.id,
                    label: `${c.full_name}${isClientNearBirthday(c.birth_date) ? ' 🎂' : ''}`
                  }))}
                  value={formData.clientId}
                  onChange={(val) => setFormData({...formData, clientId: val})}
                  placeholder="Selecione o cliente"
                  searchPlaceholder="Buscar por nome..."
                />
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-neutral-600 uppercase tracking-widest ml-1">Procedimento</label>
                <SearchableSelect
                  options={procedures.map(p => ({ value: p.id, label: p.name }))}
                  value={formData.procedureId}
                  onChange={(val) => {
                    setFormData({...formData, procedureId: val});
                    const proc = procedures.find(p => p.id === val);
                    if (proc?.maintenance_required && proc?.maintenance_price && Number(proc.maintenance_price) > 0) {
                      setIsMaintenance(true);
                    } else {
                      setIsMaintenance(false);
                    }
                  }}
                  placeholder="O que fará?"
                  searchPlaceholder="Buscar procedimento..."
                />

                {/* List of additional procedures */}
                {additionalProcedureIds.map((extraId, idx) => (
                  <div key={idx} className="flex items-center gap-2 mt-2">
                    <SearchableSelect
                      options={procedures
                        .filter(p => p.id !== formData.procedureId && !additionalProcedureIds.includes(p.id) || p.id === extraId)
                        .map(p => ({ value: p.id, label: p.name }))}
                      value={extraId}
                      onChange={(val) => {
                        const updated = [...additionalProcedureIds];
                        updated[idx] = val;
                        setAdditionalProcedureIds(updated);
                      }}
                      placeholder="Outro procedimento..."
                      searchPlaceholder="Buscar procedimento..."
                      className="flex-1"
                    />
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


              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-neutral-600 uppercase tracking-widest ml-1">Profissional</label>
                <SearchableSelect
                  options={professionals.map(p => ({ value: p.id, label: p.full_name }))}
                  value={formData.professionalId}
                  onChange={(val) => setFormData({...formData, professionalId: val})}
                  placeholder="Quem atende?"
                  searchPlaceholder="Buscar profissional..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[10px] font-black text-neutral-600 uppercase tracking-widest">Data e Horário</label>
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

            {/* Reestruturação da Seção de Preços: Bloco 1, Bloco 2 e Bloco 3 */}
            <div className="space-y-4 pt-4 border-t border-[#E5E0D8]">
              {/* BLOCO 1: Valor Fixo do Atendimento */}
              {formData.procedureId && (
                <div className="bg-[#FAF6E9]/70 border border-[#E5E0D8] rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#8A847C]">Valor Fixo do Atendimento</span>
                    <Badge className="bg-[#D4AF37]/15 text-[#2C2825] border-[#D4AF37]/40 font-bold px-2.5 py-0.5 text-[10px] rounded-md shadow-xs">
                      {calculatePrices().ruleAppliedDetails}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-xs font-bold text-[#2C2825] pt-1">
                    <span>Procedimento: {procedures.find(p => p.id === formData.procedureId)?.name}</span>
                    <span className="font-mono text-neutral-900 bg-white px-3 py-1 rounded-lg border border-[#E5E0D8]">
                      R$ {calculatePrices().usedBasePrice.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {/* BLOCO 2: Desconto Manual (Opcional) */}
              {formData.procedureId && profile?.role !== 'professional' && (
                <div className="border border-[#E5E0D8] rounded-2xl p-4 space-y-3 bg-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-[#2C2825]">Desconto Manual (Opcional)</h4>
                      <p className="text-[10px] text-neutral-500">Conceder benefício adicional neste atendimento</p>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (showDiscountForm) {
                          setDiscountName('');
                          setDiscountValue('');
                          setDiscountPercentage('');
                          setDiscountNotes('');
                        }
                        setShowDiscountForm(!showDiscountForm);
                      }}
                      className="h-8 rounded-xl text-xs font-bold border-[#E5E0D8] hover:bg-neutral-50"
                    >
                      {showDiscountForm ? '✕ Remover Desconto' : '🏷️ + Aplicar Desconto'}
                    </Button>
                  </div>

                  {showDiscountForm && (
                    <div className="space-y-4 pt-3 border-t border-[#E5E0D8]/60 animate-fade-in">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-[#8A847C] uppercase tracking-wider ml-1">Nome do Desconto</label>
                          <Input 
                            placeholder="Ex: VIP, Fidelidade, Parceria..."
                            value={discountName}
                            onChange={(e) => setDiscountName(e.target.value)}
                            className="bg-white border-[#E5E0D8] h-10 rounded-xl text-xs font-bold"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-[#8A847C] uppercase tracking-wider ml-1">Método de Desconto</label>
                          <div className="flex bg-[#F0EBE0]/60 p-1 rounded-xl gap-1 h-10">
                            <button
                              type="button"
                              onClick={() => {
                                setDiscountMethod('percentage');
                                setDiscountValue('');
                              }}
                              className={cn(
                                "flex-1 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all",
                                discountMethod === 'percentage' 
                                  ? "bg-white text-[#D4AF37] shadow-xs" 
                                  : "text-[#5C5855] hover:text-[#2C2825]"
                              )}
                            >
                              % Porcentagem
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDiscountMethod('value');
                                setDiscountPercentage('');
                              }}
                              className={cn(
                                "flex-1 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all",
                                discountMethod === 'value' 
                                  ? "bg-white text-[#D4AF37] shadow-xs" 
                                  : "text-[#5C5855] hover:text-[#2C2825]"
                              )}
                            >
                              R$ Dinheiro
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-[#8A847C] uppercase tracking-wider ml-1">
                            {discountMethod === 'percentage' ? 'Desconto (%)' : 'Valor do Desconto (R$)'}
                          </label>
                          <Input 
                            placeholder="0"
                            value={discountMethod === 'percentage' ? discountPercentage : discountValue}
                            onChange={(e) => {
                              if (discountMethod === 'percentage') {
                                handleDiscountPercentageChange(e.target.value);
                              } else {
                                handleDiscountValueChange(e.target.value);
                              }
                            }}
                            className="bg-white border-[#E5E0D8] h-10 rounded-xl text-xs font-bold"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-[#8A847C] uppercase tracking-wider ml-1">Observações do Desconto</label>
                          <Input 
                            placeholder="Motivo..."
                            value={discountNotes}
                            onChange={(e) => setDiscountNotes(e.target.value)}
                            className="bg-white border-[#E5E0D8] h-10 rounded-xl text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* BLOCO 3: Resumo Financeiro Completo */}
              {formData.procedureId && (
                <div className="bg-[#FAF6E9]/80 border border-[#E5E0D8] rounded-2xl p-4 space-y-2 text-xs">
                  <p className="font-black text-[#2C2825] uppercase tracking-widest text-[9px] mb-1">Resumo Financeiro do Agendamento</p>
                  
                  <div className="flex justify-between items-center text-neutral-600">
                    <span>Valor Original do Procedimento:</span>
                    <span className="font-mono">R$ {calculatePrices().originalBasePrice.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between items-center text-neutral-800 font-bold">
                    <span>Valor Fixo Utilizado:</span>
                    <span className="font-mono text-[#2C2825]">
                      R$ {calculatePrices().usedBasePrice.toFixed(2)} {calculatePrices().priceType === 'maintenance' ? '(Manutenção)' : '(Normal)'}
                    </span>
                  </div>

                  {calculatePrices().manualDiscountVal > 0 && (
                    <div className="flex justify-between items-center text-rose-600 font-bold">
                      <span>Desconto Manual Aplicado:</span>
                      <span className="font-mono">- R$ {calculatePrices().manualDiscountVal.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="border-t border-[#E5E0D8] pt-2 mt-2 flex justify-between font-black text-sm text-[#2C2825]">
                    <span>Valor Final do Atendimento:</span>
                    <span className="text-[#D4AF37] font-mono text-base">
                      R$ {calculatePrices().finalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>

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
