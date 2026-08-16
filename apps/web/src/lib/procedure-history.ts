import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Histórico técnico do procedimento.
 *
 * AUDITORIA: reutiliza `appointment_medical_records` (Ficha de Atendimento),
 * que já é gravada ao concluir um atendimento:
 *   • clinical_notes  -> técnica utilizada, preferências, cuidados, observações
 *   • materials_used  -> produto, quantidade, cor, número/lote
 *   • complications   -> reações ou informações relevantes
 *
 * O vínculo com o procedimento vem de `appointments.procedure_id`, então a
 * busca é SEMPRE por cliente + procedimento específicos (nunca mistura
 * observações de outro procedimento).
 */

export type ProcedureHistoryRecord = {
  id: string;
  appointment_id: string | null;
  procedure_id: string | null;
  procedure_name: string | null;
  professional_id: string | null;
  professional_name: string | null;
  client_id: string | null;
  start_time: string | null;
  clinical_notes: string | null;
  materials_used: string | null;
  complications: string | null;
  created_at: string | null;
  status: string | null;
};

export type ProcedureHistoryMap = Map<string, ProcedureHistoryRecord>;

export function procedureHistoryKey(clientId?: string | null, procedureId?: string | null): string {
  return `${clientId ?? ''}|${procedureId ?? ''}`;
}

function hasObservation(record: Pick<ProcedureHistoryRecord, 'clinical_notes' | 'materials_used' | 'complications'>): boolean {
  return Boolean(
    (record.clinical_notes && record.clinical_notes.trim()) ||
    (record.materials_used && record.materials_used.trim()) ||
    (record.complications && record.complications.trim())
  );
}

function normalizeRecord(raw: any): ProcedureHistoryRecord {
  const appointment = Array.isArray(raw?.appointment) ? raw.appointment[0] : raw?.appointment;
  const professional =
    appointment?.professional ??
    (Array.isArray(raw?.professional) ? raw.professional[0] : raw?.professional);
  const procedure =
    appointment?.procedures ??
    (Array.isArray(raw?.procedure) ? raw.procedure[0] : raw?.procedure);

  return {
    id: raw?.id ?? '',
    appointment_id: appointment?.id ?? raw?.appointment_id ?? null,
    procedure_id: appointment?.procedure_id ?? raw?.procedure_id ?? null,
    procedure_name: procedure?.name ?? null,
    professional_id: appointment?.professional_id ?? raw?.professional_id ?? null,
    professional_name: professional?.full_name ?? null,
    client_id: appointment?.client_id ?? raw?.client_id ?? null,
    start_time: appointment?.start_time ?? null,
    clinical_notes: raw?.clinical_notes ?? null,
    materials_used: raw?.materials_used ?? null,
    complications: raw?.complications ?? null,
    created_at: raw?.created_at ?? null,
    status: appointment?.status ?? null
  };
}

/**
 * Busca o histórico de observações técnicas de um cliente + procedimento.
 * Considera APENAS atendimentos CONCLUÍDOS (completed).
 * Retorna do mais recente para o mais antigo.
 */
export async function fetchProcedureHistory(
  supabase: SupabaseClient,
  options: {
    companyId: string;
    clientId?: string | null;
    procedureId?: string | null;
    excludeAppointmentId?: string | null;
    limit?: number;
  }
): Promise<ProcedureHistoryRecord[]> {
  const { companyId, clientId, procedureId, excludeAppointmentId, limit = 50 } = options;

  let query = supabase
    .from('appointment_medical_records')
    .select(
      `*,
       appointment:appointments!inner(
         id, client_id, procedure_id, professional_id, start_time, status,
         procedures(name),
         professional:profiles!inner(full_name)
       )`
    )
    .eq('company_id', companyId)
    .eq('appointments.status', 'completed');

  if (clientId) query = query.eq('appointments.client_id', clientId);
  if (procedureId) query = query.eq('appointments.procedure_id', procedureId);
  if (excludeAppointmentId) query = query.neq('appointments.id', excludeAppointmentId);

  const { data, error } = await query.limit(limit);

  if (error) {
    console.error('[procedure-history] Erro ao buscar histórico:', error);
    return [];
  }

  return (data || [])
    .map(normalizeRecord)
    .filter((r) => r.appointment_id)
    .sort((a, b) => {
      const ta = new Date(a.start_time || a.created_at || 0).getTime();
      const tb = new Date(b.start_time || b.created_at || 0).getTime();
      return tb - ta;
    });
}

/**
 * Monta um mapa {clientId|procedureId -> última observação} para a agenda.
 * Faz 2 queries (agendamentos concluídos + fichas da empresa) e mescla
 * em memória, mantendo apenas a observação mais recente de cada
 * cliente+procedimento.
 */
export async function fetchProcedureHistoryMap(
  supabase: SupabaseClient,
  companyId: string
): Promise<ProcedureHistoryMap> {
  const map: ProcedureHistoryMap = new Map();

  try {
    const [{ data: appointments }, { data: records }] = await Promise.all([
      supabase
        .from('appointments')
        .select('id, client_id, procedure_id, professional_id, start_time, status')
        .eq('company_id', companyId)
        .eq('status', 'completed'),
      supabase
        .from('appointment_medical_records')
        .select('id, appointment_id, client_id, professional_id, clinical_notes, materials_used, complications, created_at')
        .eq('company_id', companyId)
    ]);

    const apptById = new Map<string, any>((appointments || []).map((a) => [a.id, a]));

    for (const raw of records || []) {
      const appointment = apptById.get(raw.appointment_id);
      if (!appointment) continue;

      const record: ProcedureHistoryRecord = {
        id: raw.id,
        appointment_id: appointment.id,
        procedure_id: appointment.procedure_id,
        procedure_name: null,
        professional_id: appointment.professional_id,
        professional_name: null,
        client_id: appointment.client_id,
        start_time: appointment.start_time,
        clinical_notes: raw.clinical_notes,
        materials_used: raw.materials_used,
        complications: raw.complications,
        created_at: raw.created_at,
        status: appointment.status
      };

      // Mantém apenas a observação mais recente de cada cliente+procedimento
      const key = procedureHistoryKey(record.client_id, record.procedure_id);
      const current = map.get(key);
      if (!current || new Date(record.start_time || 0).getTime() >= new Date(current.start_time || 0).getTime()) {
        map.set(key, record);
      }
    }
  } catch (err) {
    console.error('[procedure-history] Erro ao montar mapa de histórico:', err);
  }

  return map;
}

/**
 * Indica se existe observação registrada (ignora fichas em branco).
 */
export function hasProcedureObservation(record?: ProcedureHistoryRecord | null): boolean {
  return Boolean(record && hasObservation(record));
}

/**
 * Texto resumido da última observação para tooltips / indicadores.
 */
export function formatObservationSummary(record?: ProcedureHistoryRecord | null): string {
  if (!record) return 'Sem histórico.';

  const parts: string[] = [];
  if (record.materials_used && record.materials_used.trim()) parts.push(record.materials_used.trim());
  if (record.clinical_notes && record.clinical_notes.trim()) parts.push(record.clinical_notes.trim());
  if (record.complications && record.complications.trim()) parts.push(`Reação/complicação: ${record.complications.trim()}`);

  return parts.length > 0 ? parts.join(' — ') : 'Nenhuma observação registrada no atendimento anterior.';
}
