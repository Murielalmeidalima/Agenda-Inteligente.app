'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase-browser';
import { 
  Button, 
  Input, 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  TextArea,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  cn
} from '@projeto/ui';
import { 
  ArrowLeft, 
  Save, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  CreditCard, 
  AlertCircle,
  Hash,
  Tag,
  Briefcase
} from 'lucide-react';
import Link from 'next/link';

import { useProfile } from '@/providers/profile-provider';

function NewTransactionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialType = searchParams.get('type') || 'income';
  const { profile } = useProfile();

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: initialType,
    category_id: '',
    account_id: '',
    date: new Date().toISOString().split('T')[0],
    payment_method: 'pix',
    notes: ''
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    try {
      const supabase = createBrowserClient();
      
      const { data: catData } = await supabase.from('financial_categories').select('*').eq('type', formData.type);
      const { data: accData } = await supabase.from('financial_accounts').select('*');

      setCategories(catData || []);
      setAccounts(accData || []);
      
      if (catData?.length) setFormData(prev => ({ ...prev, category_id: catData[0].id }));
      if (accData?.length) setFormData(prev => ({ ...prev, account_id: accData[0].id }));
    } catch (err) {
      console.error('Error loading finance form data:', err);
    }
  }

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!profile?.company_id) {
       setError('Erro: Empresa não identificada. Recarregue a página.');
       setLoading(false);
       return;
    }

    try {
      const supabase = createBrowserClient();
      
      const { error: insertError } = await supabase
        .from('transactions')
        .insert({
          company_id: profile.company_id,
          ...formData,
          amount: parseFloat(formData.amount.replace(',', '.'))
        });

      if (insertError) throw insertError;

      // 2. Atualizar saldo da conta (Simplificado para o MVP)
      const multiplier = formData.type === 'income' ? 1 : -1;
      const amountNum = parseFloat(formData.amount.replace(',', '.'));
      
      await supabase.rpc('update_account_balance', { 
        target_account_id: formData.account_id, 
        amount_diff: multiplier * amountNum 
      });

      router.push('/dashboard/finance');
      router.refresh();
    } catch (err: any) {
      console.error('Error creating transaction:', err);
      setError(err.message || 'Erro ao salvar lançamento. Tente novamente.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
           <Link href="/dashboard/finance">
              <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl bg-[#0f172a]/50 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all">
                <ArrowLeft className="h-5 w-5" />
              </Button>
           </Link>
           <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                 {formData.type === 'income' ? 
                   <TrendingUp className="h-7 w-7 text-emerald-500" /> : 
                   <TrendingDown className="h-7 w-7 text-red-500" />
                 }
                 Lançar {formData.type === 'income' ? 'Receita' : 'Despesa'}
              </h1>
              <p className="text-neutral-500 text-[10px] uppercase font-black tracking-widest mt-1">Gestão de Fluxo de Caixa Profissional</p>
           </div>
        </div>

        <Button 
          onClick={handleSubmit}
          className={cn(
             "h-12 px-8 font-black rounded-xl shadow-lg active:scale-[0.98] transition-all",
             formData.type === 'income' ? 
             "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-500/10" : 
             "bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-red-500/10"
          )}
          disabled={loading}
          loading={loading}
        >
          <Save className="h-5 w-5 mr-2" />
          Confirmar Lançamento
        </Button>
      </div>

      <form className="grid grid-cols-1 lg:grid-cols-2 gap-8" onSubmit={handleSubmit}>
         
         {/* Essential Info */}
         <div className="space-y-8">
            <Card className="bg-[#0f172a]/30 border-neutral-800 rounded-3xl overflow-hidden backdrop-blur-sm">
               <CardHeader className="bg-[#020617]/50 border-b border-neutral-800 py-4 px-8">
                  <CardTitle className="text-xs font-black text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                     <Hash className="h-3 w-3" />
                     Dados Principais
                  </CardTitle>
               </CardHeader>
               <CardContent className="p-8 space-y-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-neutral-600 uppercase ml-1">Descrição</label>
                     <Input 
                        placeholder="Ex: Pagamento Consulta x Luiza" 
                        className="bg-[#020617] border-neutral-800 h-12 rounded-xl text-white placeholder:text-neutral-700 font-bold"
                        required
                        value={formData.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                     />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-neutral-600 uppercase ml-1">Valor (R$)</label>
                        <Input 
                           placeholder="0,00" 
                           className="bg-[#020617] border-neutral-800 h-12 rounded-xl text-white placeholder:text-neutral-700 font-mono text-lg font-black"
                           required
                           value={formData.amount}
                           onChange={(e) => handleChange('amount', e.target.value)}
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-neutral-600 uppercase ml-1">Data</label>
                        <Input 
                           type="date"
                           className="bg-[#020617] border-neutral-800 h-12 rounded-xl text-white appearance-none"
                           value={formData.date}
                           onChange={(e) => handleChange('date', e.target.value)}
                        />
                     </div>
                  </div>
               </CardContent>
            </Card>

            <Card className="bg-[#0f172a]/30 border-neutral-800 rounded-3xl overflow-hidden backdrop-blur-sm">
               <CardHeader className="bg-[#020617]/50 border-b border-neutral-800 py-4 px-8">
                  <CardTitle className="text-xs font-black text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                     <Tag className="h-3 w-3" />
                     Classificação
                  </CardTitle>
               </CardHeader>
               <CardContent className="p-8 space-y-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-neutral-600 uppercase ml-1">Categoria Financeira</label>
                     <Select onValueChange={(v) => handleChange('category_id', v)} value={formData.category_id}>
                        <SelectTrigger className="bg-[#020617] border-neutral-800 h-12 rounded-xl text-white">
                           <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0f172a] border-neutral-800 text-white">
                           {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        </SelectContent>
                     </Select>
                  </div>
                  
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-neutral-600 uppercase ml-1">Conta de Origem/Destino</label>
                     <Select onValueChange={(v) => handleChange('account_id', v)} value={formData.account_id}>
                        <SelectTrigger className="bg-[#020617] border-neutral-800 h-12 rounded-xl text-white">
                           <SelectValue placeholder="Selecione a conta" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0f172a] border-neutral-800 text-white">
                           {accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                        </SelectContent>
                     </Select>
                  </div>
               </CardContent>
            </Card>
         </div>

         {/* Additional Details */}
         <div className="space-y-8">
            <Card className="bg-[#0f172a]/30 border-neutral-800 rounded-3xl overflow-hidden backdrop-blur-sm h-full">
               <CardHeader className="bg-[#020617]/50 border-b border-neutral-800 py-4 px-8">
                  <CardTitle className="text-xs font-black text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                     <Briefcase className="h-3 w-3" />
                     Mais Detalhes
                  </CardTitle>
               </CardHeader>
               <CardContent className="p-8 space-y-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-neutral-600 uppercase ml-1">Método de Pagamento</label>
                     <div className="grid grid-cols-2 gap-3">
                        <PaymentToggle active={formData.payment_method === 'pix'} onClick={() => handleChange('payment_method', 'pix')}>PIX</PaymentToggle>
                        <PaymentToggle active={formData.payment_method === 'credit_card'} onClick={() => handleChange('payment_method', 'credit_card')}>Cartão</PaymentToggle>
                        <PaymentToggle active={formData.payment_method === 'cash'} onClick={() => handleChange('payment_method', 'cash')}>Dinheiro</PaymentToggle>
                        <PaymentToggle active={formData.payment_method === 'transfer'} onClick={() => handleChange('payment_method', 'transfer')}>TED/DOC</PaymentToggle>
                     </div>
                  </div>

                  <div className="space-y-2 pt-4">
                     <label className="text-[10px] font-black text-neutral-600 uppercase ml-1">Notas Adicionais</label>
                     <TextArea 
                        placeholder="Observações internas sobre este lançamento..."
                        className="bg-[#020617] border-neutral-800 rounded-2xl text-white placeholder:text-neutral-700 min-h-[160px]"
                        value={formData.notes}
                        onChange={(e) => handleChange('notes', e.target.value)}
                     />
                  </div>

                  {error && (
                     <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-sm text-red-400">
                        <AlertCircle className="h-5 w-5 shrink-0" />
                        <p>{error}</p>
                     </div>
                  )}
               </CardContent>
            </Card>
         </div>

      </form>
    </div>
  );
}

export default function NewTransactionPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-neutral-500">Carregando formulário...</div>}>
      <NewTransactionForm />
    </Suspense>
  );
}

function PaymentToggle({ children, active, onClick }: any) {
   return (
      <button 
         type="button" 
         onClick={onClick}
         className={cn(
            "h-11 px-4 rounded-xl text-xs font-black uppercase transition-all border",
            active ? "bg-primary-500 border-primary-500 text-white shadow-lg shadow-primary-500/10" : "bg-neutral-950/40 border-neutral-800 text-neutral-500 hover:text-white"
         )}
      >
         {children}
      </button>
   )
}
