import { Appointment, Procedure } from '@/types/database';
import { addDays, isAfter, subDays } from 'date-fns';

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
