'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Badge,
  cn
} from '@projeto/ui';
import {
  StickyNote,
  Loader2,
  CheckCircle2,
  Package,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { createBrowserClient } from '@/lib/supabase-browser';
import {
  fetchProcedureHistory,
  hasProcedureObservation,
  type ProcedureHistoryRecord
} from '@/lib/procedure-history';

interface ProcedureHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  clientId?: string | null;
  procedureId?: string | null;
  clientName?: string | null;
  procedureName?: string | null;
  excludeAppointmentId?: string | null;
}

const parseUTCDate = (isoStr?: string | null) => {
  if (!isoStr) return null;
  const d = new Date(isoStr);
  return isNaN(d.getTime()) ? null : d;
};

const formatDate = (isoStr?: string | null) => {
  const d = parseUTCDate(isoStr);
  return d ? format(d, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : '—';
};

function RecordCard({
  record,
  highlight = false
}: {
  record: ProcedureHistoryRecord;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4 space-y-3",
        highlight
          ? "bg-blue-50/70 border-[#0EA5E9]/30 ring-1 ring-[#0EA5E9]/20"
          : "bg-white border-[#E5E0D8]"
      )}
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className={cn(
            "h-8 w-8 rounded-xl flex items-center justify-center",
            highlight ? "bg-[#0EA5E9] text-white" : "bg-[#F0F9FF] text-[#0EA5E9]"
          )}>
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-black text-[#2C2825]">
              {formatDate(record.start_time || record.created_at)}
            </p>
            {record.professional_name && (
              <p className="text-[10px] font-semibold text-[#8A847C] truncate max-w-[220px]">
                {record.professional_name}
              </p>
            )}
          </div>
        </div>
        {highlight && (
          <Badge className="bg-[#0EA5E9] text-white text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
            Última observação
          </Badge>
        )}
      </div>

      {record.materials_used && (
        <div className="flex gap-2 text-[11px]">
          <Package className="h-3.5 w-3.5 text-[#0EA5E9] shrink-0 mt-0.5" />
          <p className="font-medium text-[#3A3633] leading-relaxed break-words">
            {record.materials_used}
          </p>
        </div>
      )}
      {record.clinical_notes && (
        <div className="flex gap-2 text-[11px]">
          <StickyNote className="h-3.5 w-3.5 text-[#0EA5E9] shrink-0 mt-0.5" />
          <p className="font-medium text-[#3A3633] leading-relaxed break-words">
            {record.clinical_notes}
          </p>
        </div>
      )}
      {record.complications && (
        <div className="flex gap-2 text-[11px]">
          <AlertTriangle className="h-3.5 w-3.5 text-orange-500 shrink-0 mt-0.5" />
          <p className="font-medium text-orange-700 leading-relaxed break-words">
            {record.complications}
          </p>
        </div>
      )}
    </div>
  );
}

export function ProcedureHistoryModal({
  isOpen,
  onClose,
  companyId,
  clientId,
  procedureId,
  clientName,
  procedureName,
  excludeAppointmentId
}: ProcedureHistoryModalProps) {
  const [records, setRecords] = useState<ProcedureHistoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createBrowserClient();

  useEffect(() => {
    if (!isOpen) return;
    if (!companyId || !clientId || !procedureId) {
      setRecords([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    fetchProcedureHistory(supabase, {
      companyId,
      clientId,
      procedureId,
      excludeAppointmentId,
      limit: 100
    }).then((data) => {
      if (cancelled) return;
      setRecords(data);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [isOpen, companyId, clientId, procedureId, excludeAppointmentId]);

  const lastRecord = records.find((r) => hasProcedureObservation(r)) || records[0];
  const hasAnyObservation = records.some(hasProcedureObservation);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[560px] bg-white rounded-3xl p-0 overflow-hidden border-[#E5E0D8] shadow-2xl max-h-[85vh]">
        <DialogHeader className="p-8 pb-4 border-b border-[#F8F6F2] bg-[#FAF9F6]">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#F0F9FF] rounded-2xl">
              <StickyNote className="h-6 w-6 text-[#0EA5E9]" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black text-[#2C2825]">
                Histórico do Procedimento
              </DialogTitle>
              <p className="text-[10px] text-[#8A847C] uppercase font-black tracking-widest mt-0.5 truncate max-w-[320px]">
                {clientName || 'Cliente'} · {procedureName || 'Procedimento'}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto p-8 pt-5 space-y-5">
          {!clientId || !procedureId ? (
            <div className="text-center py-10 border-2 border-dashed border-[#E5E0D8] rounded-3xl">
              <StickyNote className="h-8 w-8 text-[#E5E0D8] mx-auto mb-2" />
              <p className="text-sm text-[#8A847C] font-medium">
                Selecione um cliente e um procedimento para ver o histórico.
              </p>
            </div>
          ) : loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-[#0EA5E9]" />
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-[#E5E0D8] rounded-3xl">
              <CheckCircle2 className="h-8 w-8 text-[#0EA5E9] mx-auto mb-2" />
              <p className="text-sm font-black text-[#2C2825]">
                Primeiro atendimento deste procedimento.
              </p>
              <p className="text-[11px] text-[#8A847C] font-medium mt-1">
                Ainda não existe observação técnica registrada para {clientName} neste procedimento.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#8A847C]">
                  Informações importantes
                </p>
                {lastRecord && hasAnyObservation ? (
                  <RecordCard record={lastRecord} highlight />
                ) : (
                  <div className="rounded-2xl border border-[#E5E0D8] bg-white p-4 text-sm text-[#8A847C] font-medium">
                    Nenhuma observação registrada no atendimento anterior.
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#8A847C]">
                    Histórico completo
                  </p>
                  <span className="text-[10px] font-bold text-[#0EA5E9]">
                    {records.length} atendimento{records.length > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="space-y-3">
                  {records.map((record) => (
                    <RecordCard key={record.id} record={record} />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="p-6 pt-3 border-t border-[#F8F6F2] bg-[#FAF9F6]">
          <Button
            onClick={onClose}
            className="w-full h-12 bg-[#2C2825] hover:bg-[#3A3633] text-white font-black rounded-2xl uppercase tracking-widest text-xs"
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
