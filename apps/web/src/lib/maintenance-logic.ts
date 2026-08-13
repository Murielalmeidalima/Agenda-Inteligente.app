import { Appointment, Procedure } from '@/types/database';
import { addDays, addWeeks, addMonths, isAfter, isSaturday, isSunday, format } from 'date-fns';

/**
 * Verifica se um novo agendamento deve ser marcado como 'manutenção'
 * baseado no histórico do cliente e configurações do procedimento.
 */
export function checkMaintenanceEligibility(
  clientAppointments: Appointment[],
  procedure: Procedure,
  newAppointmentDate: Date
) {
  if (!procedure.maintenance_required || !procedure.maintenance_days_limit) {
    return { isMaintenance: false, parentId: null };
  }

  // Filtrar agendamentos concluídos do mesmo procedimento
  const previousApts = clientAppointments
    .filter(apt => 
      apt.procedure_id === procedure.id && 
      apt.status === 'completed' &&
      !apt.is_maintenance // Não vincular manutenção a outra manutenção
    )
    .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());

  if (previousApts.length === 0) {
    return { isMaintenance: false, parentId: null };
  }

  const lastApt = previousApts[0];
  const lastAptDate = new Date(lastApt.start_time);
  const limitDate = addDays(lastAptDate, procedure.maintenance_days_limit);

  // Se o novo agendamento estiver dentro do limite de dias, é uma manutenção
  if (isAfter(limitDate, newAppointmentDate)) {
    return { isMaintenance: true, parentId: lastApt.id };
  }

  return { isMaintenance: false, parentId: null };
}

/**
 * Valida se um agendamento finalizado atende aos requisitos para gerar manutenção automática.
 */
export function shouldGenerateAutomaticMaintenance(
  procObj: Partial<Procedure> | null | undefined,
  isOriginallyCompleted: boolean,
  newStatus: string
): boolean {
  if (newStatus !== 'completed' && newStatus !== 'confirmed') return false;
  if (isOriginallyCompleted) return false;
  if (!procObj) return false;
  if (!procObj.maintenance_required) return false;
  if (!procObj.maintenance_days_limit || procObj.maintenance_days_limit <= 0) return false;
  return true;
}

/**
 * Valida se a criação de um NOVO agendamento deve gerar a manutenção correspondente.
 * Gera a manutenção quando:
 *  - o procedimento exige manutenção, E
 *  - o agendamento NÃO é uma manutenção ainda "só agendada" (aguarda a finalização),
 *    OU é uma manutenção sendo finalizada/lançada na criação (status completed).
 */
export function shouldGenerateMaintenanceOnCreate(
  procObj: Record<string, any> | null | undefined,
  isLaunching: boolean,
  isMaintenance: boolean
): boolean {
  if (!procObj) return false;
  if (!procObj.maintenance_required) return false;
  if (!procObj.maintenance_days_limit || procObj.maintenance_days_limit <= 0) return false;
  if (isMaintenance && !isLaunching) return false;
  return true;
}

/**
 * Valida se a confirmação ou conclusão de um agendamento de MANUTENÇÃO deve gerar a próxima manutenção recorrente.
 */
export function shouldGenerateNextRecurringMaintenance(
  procObj: Record<string, any> | null | undefined,
  isMaintenance: boolean,
  newStatus: string,
  isOriginallyConfirmedOrCompleted: boolean
): boolean {
  if (!isMaintenance) return false;
  if (newStatus !== 'confirmed' && newStatus !== 'completed') return false;
  if (isOriginallyConfirmedOrCompleted) return false;
  if (!procObj) return false;
  if (!procObj.maintenance_required) return false;
  if (!procObj.maintenance_days_limit || procObj.maintenance_days_limit <= 0) return false;
  return true;
}

/**
 * Calcula a data exata da próxima manutenção com base na data efetiva do atendimento,
 * quantidade de tempo (dias, semanas, meses) e ajuste de final de semana (transferindo para Segunda-feira caso caia no final de semana).
 */
export function calculateMaintenanceDate(
  effectiveStartTime: Date | string,
  amount: number,
  periodUnit: string = 'days'
): Date {
  const startDate = new Date(effectiveStartTime);
  let futureDate = new Date(startDate);

  if (periodUnit === 'months') {
    futureDate = addMonths(futureDate, amount);
  } else if (periodUnit === 'weeks') {
    futureDate = addWeeks(futureDate, amount);
  } else {
    futureDate = addDays(futureDate, amount);
  }

  // Se a data calculada for no final de semana (Sábado ou Domingo), transfere para Segunda-feira (próximo dia útil)
  if (isSaturday(futureDate)) {
    futureDate = addDays(futureDate, 2); // Sábado -> Segunda-feira
  } else if (isSunday(futureDate)) {
    futureDate = addDays(futureDate, 1); // Domingo -> Segunda-feira
  }

  return futureDate;
}

/**
 * Determina o valor do agendamento de manutenção.
 * Se o procedimento tiver um valor específico de manutenção (maintenance_price > 0), utiliza este valor.
 * Caso contrário, utiliza o valor padrão do procedimento.
 */
export function calculateMaintenancePrice(
  procObj: Record<string, any> | null | undefined
): number {
  if (!procObj) return 0;
  if (procObj.maintenance_price !== undefined && procObj.maintenance_price !== null) {
    const maintPrice = Number(procObj.maintenance_price);
    if (!isNaN(maintPrice) && maintPrice > 0) {
      return maintPrice;
    }
  }
  if (procObj.price !== undefined && procObj.price !== null) {
    const stdPrice = Number(procObj.price);
    if (!isNaN(stdPrice)) {
      return stdPrice;
    }
  }
  return 0;
}

/**
 * Retorna a duração em minutos para o agendamento de manutenção.
 */
export function calculateMaintenanceDuration(
  procObj: Record<string, any> | null | undefined
): number {
  if (!procObj) return 60;
  return Number(procObj.maintenance_duration_minutes) || Number(procObj.duration_minutes) || 60;
}

/**
 * Função utilitária para criar e inserir no banco o agendamento de manutenção vinculado ao pai.
 */
export async function createMaintenanceAppointment(
  supabase: any,
  parentAppointment: {
    id: string;
    company_id: string;
    client_id: string;
    professional_id: string;
    procedure_id: string;
    start_time: string;
  },
  procObj: Record<string, any>,
  notifyClient: boolean = true
) {
  // Verificar se já existe um agendamento de manutenção filho vinculado a este pai
  const { data: existingChild } = await supabase
    .from('appointments')
    .select('id, start_time')
    .eq('parent_appointment_id', parentAppointment.id)
    .neq('status', 'cancelled')
    .maybeSingle();

  if (existingChild) {
    return {
      data: existingChild,
      created: false,
      alreadyExists: true,
      futureDate: new Date(existingChild.start_time)
    };
  }

  const futureDate = calculateMaintenanceDate(
    parentAppointment.start_time,
    procObj.maintenance_days_limit,
    procObj.maintenance_period_unit || 'days'
  );

  const durationMinutes = calculateMaintenanceDuration(procObj);
  const futureEnd = new Date(futureDate.getTime() + durationMinutes * 60 * 1000);
  const maintPrice = calculateMaintenancePrice(procObj);

  const { data: maintApp, error } = await supabase
    .from('appointments')
    .insert({
      company_id: parentAppointment.company_id,
      client_id: parentAppointment.client_id,
      professional_id: parentAppointment.professional_id,
      procedure_id: parentAppointment.procedure_id,
      start_time: futureDate.toISOString(),
      end_time: futureEnd.toISOString(),
      status: 'scheduled',
      is_maintenance: true,
      parent_appointment_id: parentAppointment.id,
      price_override: maintPrice,
      original_price: maintPrice,
      notes: 'Agendamento automático de manutenção/retorno.'
    })
    .select(`
      *,
      clients(full_name, phone),
      procedures(name, duration_minutes, color)
    `)
    .single();

  if (error) {
    console.error('Erro ao criar manutenção automática:', error);
    return { error, created: false };
  }

  // Notificar o profissional (e o cliente via WhatsApp) sobre a próxima manutenção
  try {
    await supabase.from('notifications').insert({
      profile_id: parentAppointment.professional_id,
      company_id: parentAppointment.company_id,
      title: 'Nova Manutenção Agendada',
      message: `Próxima manutenção/retorno agendada para ${format(futureDate, 'dd/MM/yyyy')}.`,
      type: 'reminder',
      link: '/dashboard/schedule'
    });
  } catch (notifError) {
    console.error('Erro ao notificar profissional sobre manutenção:', notifError);
  }

  const maintClient = maintApp?.clients;
  const clientPhone = Array.isArray(maintClient) ? maintClient[0]?.phone : maintClient?.phone;
  if (maintApp && clientPhone && notifyClient) {
    try {
      await supabase.from('message_queue').insert({
        company_id: parentAppointment.company_id,
        type: 'whatsapp',
        recipient: clientPhone,
        payload: {
          content: `Olá! Seu retorno/manutenção está agendado para *${format(futureDate, 'dd/MM/yyyy')}*. Qualquer dúvida, estamos à disposição!`
        },
        status: 'pending',
        scheduled_for: new Date().toISOString()
      });
    } catch (queueError) {
      console.error('Erro ao enfileirar mensagem de manutenção:', queueError);
    }
  }

  return { data: maintApp, created: true, futureDate };
}

export type MaintenanceCycleEvaluation = {
  isMaintenanceEligible: boolean;
  parentId: string | null;
  ruleReason: 'first_appointment' | 'active_maintenance' | 'broken_cancelled' | 'broken_expired' | 'no_active_cycle';
  ruleLabel: string;
};

/**
 * Avalia o histórico completo de atendimentos do cliente para um procedimento específico
 * e decide se o agendamento pertence a um ciclo de manutenção ativo ou se deve iniciar um novo ciclo (preço normal).
 */
export function evaluateClientMaintenanceCycle(
  clientAppointments: Appointment[] | undefined | null,
  procedureId: string,
  newAppointmentDate: Date | string,
  maintenanceDaysLimit?: number | null
): MaintenanceCycleEvaluation {
  if (!procedureId || !maintenanceDaysLimit || maintenanceDaysLimit <= 0) {
    return {
      isMaintenanceEligible: false,
      parentId: null,
      ruleReason: 'first_appointment',
      ruleLabel: 'Preço aplicado: Primeiro Atendimento'
    };
  }

  const list = clientAppointments || [];
  const procApts = list
    .filter(apt => apt.procedure_id === procedureId)
    .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());

  if (procApts.length === 0) {
    return {
      isMaintenanceEligible: false,
      parentId: null,
      ruleReason: 'first_appointment',
      ruleLabel: 'Preço aplicado: Primeiro Atendimento'
    };
  }

  const mostRecent = procApts[0];
  const targetDate = new Date(newAppointmentDate);

  // Situação 1: Agendamento de manutenção mais recente foi CANCELADO -> Ciclo Rompido!
  if (mostRecent.status === 'cancelled') {
    return {
      isMaintenanceEligible: false,
      parentId: null,
      ruleReason: 'broken_cancelled',
      ruleLabel: 'Preço aplicado: Novo ciclo (manutenção anterior cancelada)'
    };
  }

  // Situação 2: Verificar se existe manutenção ativa vinculada ao cliente
  const activeMaint = procApts.find(apt => apt.is_maintenance === true && apt.status !== 'cancelled');

  if (activeMaint) {
    const maintDate = new Date(activeMaint.start_time);
    const limitDate = addDays(maintDate, maintenanceDaysLimit);

    // Se o prazo expirou ou o cliente não compareceu no prazo
    if (isAfter(targetDate, limitDate)) {
      return {
        isMaintenanceEligible: false,
        parentId: null,
        ruleReason: 'broken_expired',
        ruleLabel: 'Preço aplicado: Novo ciclo (prazo expirado)'
      };
    }

    return {
      isMaintenanceEligible: true,
      parentId: activeMaint.parent_appointment_id || activeMaint.id,
      ruleReason: 'active_maintenance',
      ruleLabel: 'Preço aplicado: Manutenção ativa'
    };
  }

  // Verificar o último atendimento concluído
  const lastCompleted = procApts.find(apt => apt.status === 'completed' || apt.status === 'confirmed');

  if (!lastCompleted) {
    return {
      isMaintenanceEligible: false,
      parentId: null,
      ruleReason: 'first_appointment',
      ruleLabel: 'Preço aplicado: Primeiro Atendimento'
    };
  }

  const completedDate = new Date(lastCompleted.start_time);
  const expirationDate = addDays(completedDate, maintenanceDaysLimit);

  if (isAfter(targetDate, expirationDate)) {
    return {
      isMaintenanceEligible: false,
      parentId: null,
      ruleReason: 'broken_expired',
      ruleLabel: 'Preço aplicado: Novo ciclo (prazo expirado)'
    };
  }

  return {
    isMaintenanceEligible: true,
    parentId: lastCompleted.id,
    ruleReason: 'active_maintenance',
    ruleLabel: 'Preço aplicado: Manutenção ativa'
  };
}



