import { describe, it, expect } from 'vitest';
import { 
  shouldGenerateAutomaticMaintenance, 
  shouldGenerateMaintenanceOnCreate,
  shouldGenerateNextRecurringMaintenance,
  calculateMaintenanceDate, 
  calculateMaintenancePrice, 
  calculateMaintenanceDuration,
  evaluateClientMaintenanceCycle
} from '../lib/maintenance-logic';
import { format, isSaturday, isSunday } from 'date-fns';

describe('Auditoria e Validação da Geração Automática e Recorrente de Manutenções', () => {

  // Cenário 1: Agendamento de procedimento sem manutenção -> não criar manutenção
  it('Cenário 1: Procedimento sem manutenção não deve gerar agendamento de retorno', () => {
    const procedure = {
      id: 'proc-1',
      name: 'Limpeza de Pele',
      maintenance_required: false,
      maintenance_days_limit: 30,
      price: 150
    };

    const onCreate = shouldGenerateMaintenanceOnCreate(procedure, false, false);
    expect(onCreate).toBe(false);
  });

  // Cenário 2: Agendamento imediato ao criar consulta (ex: 22/07/2026) -> gera manutenção automaticamente
  it('Cenário 2: Agendamento criado para 22/07/2026 gera manutenção futura imediatamente', () => {
    const procedure = {
      id: 'proc-2',
      name: 'Botox 180 dias',
      maintenance_required: true,
      maintenance_days_limit: 180,
      maintenance_period_unit: 'days',
      price: 1200,
      maintenance_price: 800
    };

    // Valida que ao agendar (isLaunching = false, isMaintenance = false) deve gerar a manutenção
    const onCreate = shouldGenerateMaintenanceOnCreate(procedure, false, false);
    expect(onCreate).toBe(true);

    const dataAgendamento = new Date('2026-07-22T14:00:00');
    const futureDate = calculateMaintenanceDate(dataAgendamento, 180, 'days');

    // 22/07/2026 + 180 dias = 18/01/2027 (Segunda-feira)
    expect(isSaturday(futureDate)).toBe(false);
    expect(isSunday(futureDate)).toBe(false);
    expect(format(futureDate, 'dd/MM/yyyy')).toBe('18/01/2027');
  });

  // Cenário 3: Finais de semana transferidos para a Segunda-feira (dia útil)
  it('Cenário 3: Se a data calculada cai no final de semana (ex: Domingo), transfere para Segunda-feira', () => {
    const procedure = {
      id: 'proc-3',
      name: 'Preenchimento 30 dias',
      maintenance_required: true,
      maintenance_days_limit: 30,
      maintenance_period_unit: 'days'
    };

    const dataAgendamento = new Date('2026-07-10T14:00:00');
    const futureDate = calculateMaintenanceDate(dataAgendamento, 30, 'days');

    // 10/07/2026 + 30 dias = 09/08/2026 (Domingo). Como cai no Domingo, move para Segunda-feira (10/08/2026)
    expect(isSaturday(futureDate)).toBe(false);
    expect(isSunday(futureDate)).toBe(false);
    expect(format(futureDate, 'dd/MM/yyyy')).toBe('10/08/2026');
  });

  // Cenário 4: Manutenção recorrente -> confirmação/conclusão de manutenção gera a próxima manutenção
  it('Cenário 4: Confirmar/Concluir agendamento de manutenção dispara a próxima manutenção recorrente', () => {
    const procedure = {
      id: 'proc-4',
      name: 'Tratamento Recorrente',
      maintenance_required: true,
      maintenance_days_limit: 60,
      maintenance_period_unit: 'days'
    };

    // Agendamento é uma manutenção (isMaintenance = true), novo status é 'confirmed', e não estava confirmado antes
    const shouldRecur = shouldGenerateNextRecurringMaintenance(procedure, true, 'confirmed', false);
    expect(shouldRecur).toBe(true);

    // Se a manutenção já estava confirmada anteriormente, não deve duplicar
    const shouldNotDuplicate = shouldGenerateNextRecurringMaintenance(procedure, true, 'confirmed', true);
    expect(shouldNotDuplicate).toBe(false);
  });

  // Cenário 5: Atendimento cancelado -> não gera manutenção
  it('Cenário 5: Atendimento cancelado não gera manutenção', () => {
    const procedure = {
      id: 'proc-5',
      name: 'Peeling Químico',
      maintenance_required: true,
      maintenance_days_limit: 30
    };

    const result = shouldGenerateAutomaticMaintenance(procedure, false, 'cancelled');
    expect(result).toBe(false);
  });

  // Cenário 6: Atendimento lançado retroativamente ("Lançar Atendimento") -> não gera manutenção
  it('Cenário 6: Lançar Atendimento retroativo não dispara manutenção automática', () => {
    const procedure = {
      id: 'proc-6',
      name: 'Lançamento Retroativo',
      maintenance_required: true,
      maintenance_days_limit: 60
    };

    const onCreate = shouldGenerateMaintenanceOnCreate(procedure, true, false);
    expect(onCreate).toBe(false);
  });

  // Cenário 7: Valor da Manutenção
  it('Cenário 7: Utiliza o valor específico da manutenção se existir (>0), senão utiliza o padrão', () => {
    const procComValor = { price: 500, maintenance_price: 350 };
    expect(calculateMaintenancePrice(procComValor)).toBe(350);

    const procSemValorManut = { price: 500, maintenance_price: 0 };
    expect(calculateMaintenancePrice(procSemValorManut)).toBe(500);
  });

  // Cenário 8: Ciclos de Manutenção e Rompimento
  it('Cenário 8: Primeiro atendimento inicia ciclo com Preço Normal ("Primeiro Atendimento")', () => {
    const evalResult = evaluateClientMaintenanceCycle([], 'proc-botox', '2026-07-21', 45);
    expect(evalResult.isMaintenanceEligible).toBe(false);
    expect(evalResult.ruleReason).toBe('first_appointment');
    expect(evalResult.ruleLabel).toBe('Preço aplicado: Primeiro Atendimento');
  });

  it('Cenário 9: Manutenção cancelada rompe o ciclo e força Preço Normal no próximo atendimento', () => {
    const history: any[] = [
      { id: '1', procedure_id: 'proc-botox', start_time: '2026-06-01', status: 'cancelled', is_maintenance: true }
    ];
    const evalResult = evaluateClientMaintenanceCycle(history, 'proc-botox', '2026-07-21', 45);
    expect(evalResult.isMaintenanceEligible).toBe(false);
    expect(evalResult.ruleReason).toBe('broken_cancelled');
    expect(evalResult.ruleLabel).toBe('Preço aplicado: Novo ciclo (manutenção anterior cancelada)');
  });

  it('Cenário 10: Manutenção expirada/não realizada dentro do prazo rompe o ciclo (Preço Normal)', () => {
    const history: any[] = [
      { id: '1', procedure_id: 'proc-botox', start_time: '2026-01-01', status: 'completed', is_maintenance: false }
    ];
    // 6 meses depois (mais de 45 dias limit)
    const evalResult = evaluateClientMaintenanceCycle(history, 'proc-botox', '2026-07-21', 45);
    expect(evalResult.isMaintenanceEligible).toBe(false);
    expect(evalResult.ruleReason).toBe('broken_expired');
    expect(evalResult.ruleLabel).toBe('Preço aplicado: Novo ciclo (prazo expirado)');
  });

  it('Cenário 11: Manutenção realizada no prazo mantém o ciclo ativo (Preço de Manutenção)', () => {
    const history: any[] = [
      { id: '1', procedure_id: 'proc-botox', start_time: '2026-07-01', status: 'scheduled', is_maintenance: true }
    ];
    const evalResult = evaluateClientMaintenanceCycle(history, 'proc-botox', '2026-07-15', 45);
    expect(evalResult.isMaintenanceEligible).toBe(true);
    expect(evalResult.ruleReason).toBe('active_maintenance');
    expect(evalResult.ruleLabel).toBe('Preço aplicado: Manutenção ativa');
  });

});
