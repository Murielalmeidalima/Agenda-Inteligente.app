import { describe, it, expect } from 'vitest';
import {
  procedureHistoryKey,
  hasProcedureObservation,
  formatObservationSummary,
  type ProcedureHistoryRecord
} from '../lib/procedure-history';

function makeRecord(overrides: Partial<ProcedureHistoryRecord>): ProcedureHistoryRecord {
  return {
    id: 'r1',
    appointment_id: 'a1',
    procedure_id: 'p1',
    procedure_name: 'Botox',
    professional_id: null,
    professional_name: 'Dra. Ana',
    client_id: 'c1',
    start_time: '2026-07-01T10:00:00.000Z',
    clinical_notes: null,
    materials_used: null,
    complications: null,
    created_at: '2026-07-01T10:30:00.000Z',
    status: 'completed',
    ...overrides
  };
}

describe('Suíte: Histórico Técnico do Procedimento', () => {

  it('chave do mapa é composta por cliente + procedimento (não mistura procedimentos)', () => {
    expect(procedureHistoryKey('c1', 'p1')).toBe('c1|p1');
    expect(procedureHistoryKey('c1', 'p2')).toBe('c1|p2');
    expect(procedureHistoryKey('c2', 'p1')).toBe('c2|p1');
    expect(procedureHistoryKey('c1', 'p1')).not.toBe(procedureHistoryKey('c1', 'p2'));
    expect(procedureHistoryKey('c1', 'p1')).not.toBe(procedureHistoryKey('c2', 'p1'));
  });

  it('"Primeiro atendimento deste procedimento." quando não existe nenhum registro', () => {
    const records: ProcedureHistoryRecord[] = [];
    expect(records.length).toBe(0);
    expect(records.some(hasProcedureObservation)).toBe(false);
  });

  it('apenas atendimentos CONCLUÍDOS entram no histórico', () => {
    const completed = makeRecord({ status: 'completed' });
    const scheduled = makeRecord({ id: 'r2', status: 'scheduled' });
    const cancelled = makeRecord({ id: 'r3', status: 'cancelled' });

    const history = [completed, scheduled, cancelled].filter(r => r.status === 'completed');
    expect(history).toHaveLength(1);
    expect(history[0].id).toBe('r1');
  });

  it('ordena do mais recente para o mais antigo', () => {
    const older = makeRecord({ id: 'r1', start_time: '2026-05-01T10:00:00.000Z' });
    const newer = makeRecord({ id: 'r2', start_time: '2026-08-01T10:00:00.000Z' });

    const sorted = [older, newer].sort(
      (a, b) => new Date(b.start_time || 0).getTime() - new Date(a.start_time || 0).getTime()
    );
    expect(sorted[0].id).toBe('r2');
    expect(sorted[1].id).toBe('r1');
  });

  it('append por atendimento: cada atendimento mantém sua própria observação (nunca sobrescreve)', () => {
    const first = makeRecord({ id: 'r1', start_time: '2026-05-01T10:00:00.000Z', clinical_notes: 'Primeira sessão.' });
    const second = makeRecord({ id: 'r2', start_time: '2026-08-01T10:00:00.000Z', clinical_notes: 'Segunda sessão.' });

    const history = [first, second];
    expect(history.find(r => r.id === 'r1')?.clinical_notes).toBe('Primeira sessão.');
    expect(history.find(r => r.id === 'r2')?.clinical_notes).toBe('Segunda sessão.');
    expect(history.length).toBe(2);
  });

  it('ficha em branco (sem observação) não é considerada como histórico útil', () => {
    const blank = makeRecord({ clinical_notes: '   ', materials_used: '', complications: null });
    expect(hasProcedureObservation(blank)).toBe(false);
  });

  it('formata o resumo combinando materiais, observações e reações', () => {
    const record = makeRecord({
      materials_used: 'Toxina 50u',
      clinical_notes: 'Aplicado na glabela',
      complications: 'Equimose leve'
    });

    const summary = formatObservationSummary(record);
    expect(summary).toContain('Toxina 50u');
    expect(summary).toContain('Aplicado na glabela');
    expect(summary).toContain('Equimose leve');
  });

  it('formata "Nenhuma observação registrada no atendimento anterior." quando a ficha está em branco', () => {
    const blank = makeRecord({ clinical_notes: '', materials_used: '', complications: '' });
    expect(formatObservationSummary(blank)).toBe('Nenhuma observação registrada no atendimento anterior.');
  });

  it('formata "Sem histórico." quando não existe registro', () => {
    expect(formatObservationSummary(null)).toBe('Sem histórico.');
  });
});
