'use client';

import { useState, useEffect } from 'react';
import { StickyNote, Loader2, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Button, cn } from '@projeto/ui';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { createBrowserClient } from '@/lib/supabase-browser';
import {
  fetchProcedureHistory,
  formatObservationSummary,
  hasProcedureObservation,
  type ProcedureHistoryRecord
} from '@/lib/procedure-history';
import { ProcedureHistoryModal } from './ProcedureHistoryModal';

interface ProcedureHistorySectionProps {
  companyId: string;
  clientId?: string | null;
  procedureId?: string | null;
  clientName?: string | null;
  procedureName?: string | null;
  excludeAppointmentId?: string | null;
}

export function ProcedureHistorySection({
  companyId,
  clientId,
  procedureId,
  clientName,
  procedureName,
  excludeAppointmentId
}: ProcedureHistorySectionProps) {
  const [lastRecord, setLastRecord] = useState<ProcedureHistoryRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const supabase = createBrowserClient();

  const visible = Boolean(clientId && procedureId);

  useEffect(() => {
    if (!visible) {
      setLastRecord(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    fetchProcedureHistory(supabase, {
      companyId,
      clientId,
      procedureId,
      excludeAppointmentId,
      limit: 1
    }).then((data) => {
      if (cancelled) return;
      setLastRecord(data[0] || null);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [visible, companyId, clientId, procedureId, excludeAppointmentId]);

  if (!visible) return null;

  const hasObservation = hasProcedureObservation(lastRecord);

  return (
    <div className="border border-[#0EA5E9]/25 bg-[#F0F9FF]/60 rounded-2xl p-4 space-y-3 animate-in fade-in duration-200">
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-xl bg-[#0EA5E9] text-white flex items-center justify-center shrink-0">
          <StickyNote className="h-3.5 w-3.5" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-widest text-[#0C4A6E]">
          Histórico do procedimento
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-[#0C4A6E]">
          <Loader2 className="animate-spin h-3.5 w-3.5" />
          Buscando atendimentos anteriores...
        </div>
      ) : (
        <div className="text-xs space-y-2">
          {!lastRecord ? (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#0EA5E9] shrink-0" />
              <p className="font-black text-[#0C4A6E]">Primeiro atendimento deste procedimento.</p>
            </div>
          ) : (
            <>
              <div className={cn(
                "rounded-xl border p-3",
                hasObservation
                  ? "bg-white border-[#0EA5E9]/25"
                  : "bg-white border-[#E5E0D8]"
              )}>
                {hasObservation ? (
                  <>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <p className="text-[10px] font-black text-[#0C4A6E] uppercase tracking-wider">
                        Último atendimento
                      </p>
                      {lastRecord.start_time && (
                        <span className="text-[10px] font-bold text-[#8A847C]">
                          {format(new Date(lastRecord.start_time), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-medium text-[#3A3633] leading-relaxed break-words line-clamp-3">
                      {formatObservationSummary(lastRecord)}
                    </p>
                  </>
                ) : (
                  <p className="text-[11px] font-medium text-[#8A847C]">
                    Nenhuma observação registrada no atendimento anterior.
                  </p>
                )}
              </div>

              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsModalOpen(true)}
                className="h-8 px-2 text-[#0EA5E9] hover:text-[#0284C7] hover:bg-[#E0F2FE] rounded-lg text-[11px] font-black uppercase tracking-wider"
              >
                Ver histórico completo
                <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
              </Button>
            </>
          )}
        </div>
      )}

      <ProcedureHistoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        companyId={companyId}
        clientId={clientId}
        procedureId={procedureId}
        clientName={clientName}
        procedureName={procedureName}
        excludeAppointmentId={excludeAppointmentId}
      />
    </div>
  );
}
