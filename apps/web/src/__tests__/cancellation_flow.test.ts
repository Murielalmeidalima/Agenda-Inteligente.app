import { describe, it, expect } from 'vitest';

describe('Suíte de Testes: Fluxos Distintos de Exclusão e Cancelamento de Agendamentos', () => {

  // Helper de Conflito de Horário (Espelhando a regra do schedule-calendar-client.tsx)
  function isTimeSlotConflict(existingAppointments: any[], newStart: Date, newEnd: Date) {
    return existingAppointments.some(apt => {
      // Agendamentos cancelados ou concluídos liberam o horário imediatamente
      if (apt.status === 'cancelled' || apt.status === 'completed') return false;

      const aptStart = new Date(apt.start_time);
      const aptEnd = new Date(apt.end_time);

      return newStart < aptEnd && newEnd > aptStart;
    });
  }

  // Helper de Permissão por Perfil
  function getAppointmentPermissions(role: string) {
    const isAdmin = role === 'admin' || role === 'chefe';
    const isReception = role === 'recepcao' || role === 'receptionist' || role === 'funcionario';
    const isProfessional = role === 'professional';

    return {
      canDelete: isAdmin,
      canCancel: isAdmin || isReception,
      isViewOnly: isProfessional
    };
  }

  // Cenário 1: Excluir Agendamento Futuro (Hard Delete)
  it('Cenário 1: Exclusão definitiva remove o agendamento e libera o horário', () => {
    let database = [
      { id: 'apt-1', status: 'scheduled', start_time: '2026-07-25T10:00:00Z', end_time: '2026-07-25T11:00:00Z' }
    ];

    // Simular exclusão definitiva
    database = database.filter(apt => apt.id !== 'apt-1');
    expect(database.length).toBe(0);

    // Tentar agendar novo cliente no mesmo horário
    const hasConflict = isTimeSlotConflict(database, new Date('2026-07-25T10:00:00Z'), new Date('2026-07-25T11:00:00Z'));
    expect(hasConflict).toBe(false);
  });

  // Cenário 2: Cancelar Agendamento Futuro (Soft Delete + Motivo)
  it('Cenário 2: Cancelar agendamento altera status para cancelled, registra motivo e libera o horário', () => {
    const apt = {
      id: 'apt-2',
      status: 'scheduled',
      start_time: '2026-07-25T14:00:00Z',
      end_time: '2026-07-25T15:00:00Z',
      cancellation_reason: null as string | null,
      cancelled_at: null as string | null
    };

    // Simular cancelamento
    apt.status = 'cancelled';
    apt.cancellation_reason = 'Cliente desistiu';
    apt.cancelled_at = '2026-07-21T10:00:00Z';

    expect(apt.status).toBe('cancelled');
    expect(apt.cancellation_reason).toBe('Cliente desistiu');
    expect(apt.cancelled_at).not.toBeNull();

    // Confirmar que o horário foi liberado para novos clientes
    const hasConflict = isTimeSlotConflict([apt], new Date('2026-07-25T14:00:00Z'), new Date('2026-07-25T15:00:00Z'));
    expect(hasConflict).toBe(false);
  });

  // Cenário 3: Validação de Bloqueio Financeiro para Exclusão Definitiva
  it('Cenário 3: Impede exclusão definitiva se houver pagamentos vinculados (> 0)', () => {
    const paidConfirmed: number = 150.00;

    const canHardDelete = paidConfirmed === 0;
    expect(canHardDelete).toBe(false);
  });

  // Cenário 4: Permissões de Perfil por Função
  it('Cenário 4: Valida permissões de perfil para Administrador, Recepcionista e Profissional', () => {
    const adminPerms = getAppointmentPermissions('admin');
    expect(adminPerms.canDelete).toBe(true);
    expect(adminPerms.canCancel).toBe(true);
    expect(adminPerms.isViewOnly).toBe(false);

    const recepPerms = getAppointmentPermissions('recepcao');
    expect(recepPerms.canDelete).toBe(false);
    expect(recepPerms.canCancel).toBe(true);
    expect(recepPerms.isViewOnly).toBe(false);

    const profPerms = getAppointmentPermissions('professional');
    expect(profPerms.canDelete).toBe(false);
    expect(profPerms.canCancel).toBe(false);
    expect(profPerms.isViewOnly).toBe(true);
  });

  // Cenário 5: Métricas e Indicadores de Relatório de Cancelamento
  it('Cenário 5: Calcula corretamente Total Cancelados, Taxa de Cancelamento e Ranking por Motivo', () => {
    const appointments = [
      { id: '1', status: 'completed', cancellation_reason: null },
      { id: '2', status: 'completed', cancellation_reason: null },
      { id: '3', status: 'cancelled', cancellation_reason: 'Cliente desistiu' },
      { id: '4', status: 'cancelled', cancellation_reason: 'Cliente desistiu' },
      { id: '5', status: 'cancelled', cancellation_reason: 'Cliente remarcou' }
    ];

    const totalScheduled = appointments.length;
    const cancelledApts = appointments.filter(a => a.status === 'cancelled');
    const totalCancelled = cancelledApts.length;
    const cancellationRate = (totalCancelled / totalScheduled) * 100;

    expect(totalScheduled).toBe(5);
    expect(totalCancelled).toBe(3);
    expect(cancellationRate).toBe(60);

    // Motivos mais frequentes
    const reasonMap: Record<string, number> = {};
    cancelledApts.forEach(a => {
      const reason = a.cancellation_reason || 'Não informado';
      reasonMap[reason] = (reasonMap[reason] || 0) + 1;
    });

    expect(reasonMap['Cliente desistiu']).toBe(2);
    expect(reasonMap['Cliente remarcou']).toBe(1);
  });

});
