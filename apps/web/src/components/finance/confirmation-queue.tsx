'use client';

import { Check, Clock, AlertCircle } from 'lucide-react';
import { Button, Badge, cn } from '@projeto/ui';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  payment_method: string;
  status: string;
}

interface ConfirmationQueueProps {
  transactions: Transaction[];
  onConfirm: (id: string) => void;
  loading?: string | null;
}

export function ConfirmationQueue({ transactions, onConfirm, loading }: ConfirmationQueueProps) {
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
          <Check className="h-6 w-6 text-slate-300" />
        </div>
        <p className="text-slate-400 text-sm font-medium">Nenhum pagamento pendente</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((t) => (
        <div 
          key={t.id} 
          className="flex items-center justify-between p-4 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-2xl transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">{t.description}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount)}
                </span>
                <span className="w-1 h-1 bg-slate-300 rounded-full" />
                <span className="text-[10px] text-slate-400 font-bold">
                  {format(new Date(t.date), 'dd/MM', { locale: ptBR })}
                </span>
                <Badge variant="outline" className="text-[9px] uppercase border-slate-200 text-slate-500 py-0 h-4">
                  {t.payment_method || 'PIX'}
                </Badge>
              </div>
            </div>
          </div>
          
          <Button
            size="sm"
            onClick={() => onConfirm(t.id)}
            disabled={loading === t.id}
            className="h-8 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[10px] uppercase tracking-wider px-3 shadow-md shadow-emerald-500/10"
          >
            {loading === t.id ? '...' : 'Confirmar'}
          </Button>
        </div>
      ))}
    </div>
  );
}
