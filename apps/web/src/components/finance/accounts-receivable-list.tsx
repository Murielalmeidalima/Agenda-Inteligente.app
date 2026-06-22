'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase-browser';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell,
  Badge,
  Button,
  Input
} from '@projeto/ui';
import { 
  Search, 
  Filter, 
  CheckCircle2, 
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AccountsReceivableListProps {
  companyId: string;
}

function TabButton({ active, onClick, label, count, color }: { active: boolean, onClick: () => void, label: string, count: number, color?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-4 py-2.5 rounded-2xl border text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2",
        active 
          ? (color ? `${color} shadow-sm border-current` : "bg-slate-950 border-slate-950 text-white shadow-lg shadow-slate-900/10")
          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
      )}
    >
      {label}
      <span className={cn(
        "text-[10px] px-2 py-0.5 rounded-lg font-black",
        active ? "bg-white/20 text-current" : "bg-slate-200 text-slate-700"
      )}>
        {count}
      </span>
    </button>
  );
}

export function AccountsReceivableList({ companyId }: AccountsReceivableListProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState('all'); // all, pending, partial, overdue, paid
  const [searchTerm, setSearchTerm] = useState('');
  const [errorHeader, setErrorHeader] = useState<string | null>(null);

  useEffect(() => {
    if (companyId) fetchReceivables();
  }, [companyId]);

  async function fetchReceivables() {
    if (!companyId || companyId === '') {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const supabase = createBrowserClient();
      
      const { data: appointments, error: appError } = await supabase
        .from('appointments')
        .select(`
          *,
          clients (id, full_name),
          procedures (id, name, price)
        `)
        .eq('company_id', companyId)
        .neq('status', 'cancelled')
        .order('start_time', { ascending: false });

      if (appError) throw appError;

      const appIds = appointments?.map(a => a.id) || [];
      let transactions: any[] = [];

      if (appIds.length > 0) {
        const { data: transData, error: transError } = await supabase
          .from('transactions')
          .select('id, appointment_id, amount, type, payment_method, status, transaction_date')
          .in('appointment_id', appIds)
          .eq('type', 'income');

        if (transError) throw transError;
        transactions = transData || [];
      }

      const processed = (appointments || []).map(app => {
        const linkedTrans = transactions.filter(t => t.appointment_id === app.id);
        const paidConfirmed = linkedTrans
          .filter(t => t.status === 'completed' || !t.status)
          .reduce((sum, t) => sum + Number(t.amount), 0);
        
        const hasPendingConfirmation = linkedTrans.some(t => t.status === 'pending');
        const procedure = Array.isArray(app.procedures) ? app.procedures[0] : app.procedures;
        const totalPrice = Number(app.price_override || (procedure as any)?.price || 0);
        const pendingValue = Math.max(0, totalPrice - paidConfirmed);
        
        const now = new Date();
        const appointmentDate = new Date(app.start_time);
        const isPast = appointmentDate < now;
        
        // Determine logical status
        let status = 'pending';
        if (paidConfirmed >= totalPrice && totalPrice > 0) {
          status = isPast ? 'paid' : 'advance_payment';
        } else if (paidConfirmed > 0) {
          status = isPast ? 'overdue' : 'partial';
        } else {
          status = isPast ? 'overdue' : 'pending';
        }

        // Days in Arrears
        let daysInArrears = 0;
        if (status === 'overdue' && pendingValue > 0) {
          const diffTime = Math.abs(now.getTime() - appointmentDate.getTime());
          daysInArrears = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        }

        // Payment Methods
        const paymentMethods = Array.from(new Set(
          linkedTrans
            .map(t => {
              if (t.payment_method === 'pix') return 'PIX';
              if (t.payment_method === 'credit_card') return 'C. Crédito';
              if (t.payment_method === 'debit_card') return 'C. Débito';
              if (t.payment_method === 'cash') return 'Dinheiro';
              return t.payment_method;
            })
            .filter(Boolean)
        )).join(', ') || '-';

        const client = Array.isArray(app.clients) ? app.clients[0] : app.clients;
        const clientName = (client as any)?.full_name || 'Cliente não identificado';
        const procedureName = (procedure as any)?.name || 'Procedimento não identificado';

        return {
          id: app.id,
          start_time: app.start_time,
          clientName,
          procedureName,
          totalPrice,
          paidConfirmed,
          pendingValue,
          status,
          daysInArrears,
          paymentMethods,
          hasPendingConfirmation
        };
      });

      setData(processed);
      setErrorHeader(null);
    } catch (err: any) {
      console.error('Fetch error full object:', err);
      setErrorHeader(err.message || 'Erro ao carregar dados financeiros.');
    } finally {
      setLoading(false);
    }
  }

  const filteredData = data.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = item.clientName.toLowerCase().includes(searchLower) ||
                          item.procedureName.toLowerCase().includes(searchLower);
    
    if (!matchesSearch) return false;
    
    switch (filterStatus) {
      case 'all': return true;
      case 'pending': return item.status === 'pending' || item.status === 'advance_payment';
      case 'partial': return item.status === 'partial';
      case 'overdue': return item.status === 'overdue';
      case 'paid': return item.status === 'paid';
      default: return true;
    }
  });

  if (loading) return (
    <div className="p-20 text-center">
       <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="h-10 w-10 bg-slate-100 rounded-full" />
          <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Carregando Pendências...</p>
       </div>
    </div>
  );

  if (errorHeader) return (
    <div className="p-12 text-center bg-rose-50 rounded-[2rem] border border-rose-100">
       <div className="flex flex-col items-center gap-3">
          <div className="p-4 bg-white rounded-2xl shadow-sm text-rose-500">
             <Filter className="h-8 w-8" />
          </div>
          <h3 className="text-rose-900 font-black tracking-tight">Ops! Algo deu errado</h3>
          <p className="text-rose-600/70 text-sm font-medium max-w-xs">{errorHeader}</p>
          <Button 
            className="mt-4 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl px-8"
            onClick={fetchReceivables}
          >
            Tentar Novamente
          </Button>
       </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        {/* Search and Tabs Row */}
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Buscar por cliente ou procedimento..." 
              className="pl-11 bg-slate-50 border-slate-200 rounded-2xl text-slate-900 h-12 focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500/50 transition-all font-medium placeholder:text-slate-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2 w-full lg:w-auto">
            <TabButton active={filterStatus === 'all'} onClick={() => setFilterStatus('all')} label="Todos" count={data.length} />
            <TabButton active={filterStatus === 'pending'} onClick={() => setFilterStatus('pending')} label="Pendentes" count={data.filter(d => d.status === 'pending' || d.status === 'advance_payment').length} color="border-yellow-200 text-yellow-700 bg-yellow-50/50" />
            <TabButton active={filterStatus === 'partial'} onClick={() => setFilterStatus('partial')} label="Parciais" count={data.filter(d => d.status === 'partial').length} color="border-orange-200 text-orange-600 bg-orange-50/50" />
            <TabButton active={filterStatus === 'overdue'} onClick={() => setFilterStatus('overdue')} label="Atrasados" count={data.filter(d => d.status === 'overdue').length} color="border-red-200 text-red-600 bg-red-50/50" />
            <TabButton active={filterStatus === 'paid'} onClick={() => setFilterStatus('paid')} label="Quitados" count={data.filter(d => d.status === 'paid').length} color="border-emerald-200 text-emerald-600 bg-emerald-50/50" />
            
            <Button 
              variant="outline" 
              className="border-slate-200 bg-white text-slate-500 hover:bg-slate-50 rounded-2xl h-11 px-5 font-black uppercase text-[10px] tracking-widest transition-all ml-auto lg:ml-2"
              onClick={fetchReceivables}
            >
              Atualizar
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50/80 border-b border-slate-100">
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-widest py-5 pl-8">Data</TableHead>
              <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-widest py-5">Cliente / Procedimento</TableHead>
              <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-widest py-5">Status</TableHead>
              <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-widest py-5">Método</TableHead>
              <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-widest py-5">Atraso</TableHead>
              <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-widest py-5">Valores (R$)</TableHead>
              <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-widest py-5">Saldo</TableHead>
              <TableHead className="text-right py-5 pr-8"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-64 text-center">
                   <div className="flex flex-col items-center gap-4 opacity-40">
                      <div className="p-4 bg-slate-50 rounded-3xl">
                         <Search className="h-10 w-10 text-slate-300" />
                      </div>
                      <p className="text-slate-500 font-black uppercase text-[10px] tracking-tightest">Nenhum registro encontrado.</p>
                   </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item) => (
                <TableRow key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-all cursor-default group">
                  <TableCell className="py-6 pl-8">
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-900">
                        {format(new Date(item.start_time), 'dd/MM', { locale: ptBR })}
                      </span>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                        {format(new Date(item.start_time), 'yyyy', { locale: ptBR })}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-6">
                    <p className="font-black text-slate-900 text-sm mb-0.5">{item.clientName}</p>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{item.procedureName}</p>
                    </div>
                  </TableCell>
                  <TableCell className="py-6">
                    <StatusBadge status={item.status} />
                  </TableCell>
                  <TableCell className="py-6">
                    <span className="text-xs font-bold text-slate-600">{item.paymentMethods}</span>
                  </TableCell>
                  <TableCell className="py-6">
                    {item.daysInArrears > 0 ? (
                      <Badge variant="outline" className="bg-red-50 text-red-600 border-red-100 text-[10px] font-black px-2 py-0.5 rounded-lg">
                        {item.daysInArrears} {item.daysInArrears === 1 ? 'dia' : 'dias'}
                      </Badge>
                    ) : (
                      <span className="text-xs font-bold text-slate-400">-</span>
                    )}
                  </TableCell>
                  <TableCell className="py-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase w-10">Serviço</span>
                        <span className="text-xs font-bold text-slate-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.totalPrice)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-emerald-500 uppercase w-10">Pago</span>
                        <span className="text-xs font-black text-emerald-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.paidConfirmed)}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-6">
                    <div className={cn(
                      "inline-flex flex-col px-3 py-1.5 rounded-xl border transition-all",
                      item.pendingValue > 0 
                        ? "bg-rose-50 border-rose-100 text-rose-600 shadow-sm shadow-rose-500/5" 
                        : "bg-emerald-50 border-emerald-100 text-emerald-600"
                    )}>
                      <span className="text-[8px] font-black uppercase tracking-widest mb-0.5 opacity-60">Pendente</span>
                      <span className="text-sm font-black italic">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.pendingValue)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right py-6 pr-8">
                    {item.pendingValue > 0 && (
                      <Link href={`/dashboard/finance/new?type=income&appointment_id=${item.id}&amount=${item.pendingValue}&description=Recebimento: ${item.clientName}`}>
                        <Button size="sm" className="bg-slate-950 hover:bg-black text-white font-black rounded-xl text-[10px] uppercase px-5 h-10 shadow-lg shadow-slate-200 active:scale-95 transition-all group-hover:bg-rose-600 transition-colors">
                          Receber
                          <ArrowRight className="ml-2 h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    )}
                    {item.pendingValue <= 0 && (
                       <div className="h-10 w-10 bg-emerald-50 rounded-full flex items-center justify-center ml-auto border border-emerald-100">
                          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                       </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'overdue':
      return (
        <Badge variant="outline" className="bg-red-50 text-red-600 border-red-100 text-[10px] font-black uppercase px-3 py-1.5 rounded-xl flex items-center gap-2 w-fit">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          Atrasado
        </Badge>
      );
    case 'partial':
      return (
        <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-100 text-[10px] font-black uppercase px-3 py-1.5 rounded-xl flex items-center gap-2 w-fit">
          <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
          Parcial
        </Badge>
      );
    case 'pending':
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-100 text-[10px] font-black uppercase px-3 py-1.5 rounded-xl flex items-center gap-2 w-fit">
          <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
          Pendente
        </Badge>
      );
    case 'advance_payment':
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-100 text-[10px] font-black uppercase px-3 py-1.5 rounded-xl flex items-center gap-2 w-fit">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          Adiantado
        </Badge>
      );
    case 'paid':
      return (
        <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[10px] font-black uppercase px-3 py-1.5 rounded-xl flex items-center gap-2 w-fit">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Pago
        </Badge>
      );
    default:
      return null;
  }
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
