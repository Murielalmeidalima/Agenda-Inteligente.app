'use client';

import { StickyNote } from 'lucide-react';
import { cn } from '@projeto/ui';
import {
  hasProcedureObservation,
  type ProcedureHistoryRecord
} from '@/lib/procedure-history';

interface HistoryIndicatorProps {
  record?: ProcedureHistoryRecord | null;
  onOpen: () => void;
  className?: string;
}

export function HistoryIndicator({ record, onOpen, className }: HistoryIndicatorProps) {
  if (!record || !hasProcedureObservation(record)) return null;

  return (
    <button
      type="button"
      title="Histórico do procedimento"
      aria-label="Ver histórico do procedimento"
      onClick={(e) => {
        e.stopPropagation();
        onOpen();
      }}
      className={cn(
        "shrink-0 text-[#0EA5E9] hover:text-[#0284C7] transition-colors cursor-pointer p-0.5 rounded",
        className
      )}
    >
      <StickyNote className="h-3 w-3" />
    </button>
  );
}
