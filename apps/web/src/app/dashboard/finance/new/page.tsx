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
  const appointmentId = searchParams.get('appointment_id');
  const { profile } = useProfile();

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [linkedAppointment, setLinkedAppointment] = useState<any>(null);
  
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [newName, setNewName] = useState('');

  const [formData, setFormData] = useState({
    description: searchParams.get('description') || '',
    amount: searchParams.get('amount') || '',
    type: initialType,
    category_id: '',
    account_id: '',
    date: new Date().toISOString().split('T')[0],
    payment_method: 'pix',
    notes: '',
    appointment_id: appointmentId || null
  });

  useEffect(() => {
    if (profile?.company_id) {
      fetchInitialData();
      if (appointmentId) fetchAppointmentData();
    }
  }, [appointmentId, formData.type, profile?.company_id]);

  async function fetchAppointmentData() {
    try {
      const supabase = createBrowserClient();
      const { data } = await supabase
        .from('appointments')
        .select('*, clients(full_name), procedures(name, price)')
        .eq('id', appointmentId)
        .single();
      
      if (data) {
        setLinkedAppointment(data);
        if (!formData.description) {
          setFormData(prev => ({
            ...prev,
            description: `Recebimento: ${data.clients?.full_name}`
          }));
        }
      }
    } catch (err) {
      console.error('Error fetching linked appointment:', err);
    }
  }

  async function initializeFinance() {
    if (!profile?.company_id) return;
    setLoading(true);
    setError('');
    try {
      const supabase = createBrowserClient();
      
      console.log('Iniciando carga de dados padrão via RPC para:', profile.company_id);
      
      const { error: rpcError } = await supabase.rpc('seed_company_finance_defaults', {
        target_company_id: profile.company_id
      });

      if (rpcError) {
        console.error('Falha na função RPC seed_company_finance_defaults:', {
          message: rpcError.message,
          details: rpcError.details,
          hint: rpcError.hint,
          code: rpcError.code
        });
        throw rpcError;
      }

      console.log('Dados padrão carregados com sucesso via RPC.');
      await fetchInitialData();
    } catch (err: any) {
      console.error('Erro detalhado na inicialização financeira:', err);
      // Se for um erro de objeto, tenta extrair a mensagem
      const errorMsg = err.message || (typeof err === 'object' ? JSON.stringify(err) : String(err));
      setError('Erro ao inicializar financeiro: ' + errorMsg);
    } finally {
      setLoading(false);
    }
  }

  async function fetchInitialData() {
    if (!profile?.company_id) return;
    
    try {
      const supabase = createBrowserClient();
      
      const { data: catData, error: catError } = await supabase
        .from('financial_categories')
        .select('*')
        .eq('company_id', profile.company_id);
        
      if (catError) console.error('Error fetching categories:', catError);
        
      const { data: accData, error: accError } = await supabase
        .from('financial_accounts')
        .select('*')
        .eq('company_id', profile.company_id);

      if (accError) console.error('Error fetching accounts:', accError);

      setCategories(catData || []);
      setAccounts(accData || []);
      
      if (catData?.length) setFormData(prev => ({ ...prev, category_id: catData[0].id }));
      if (accData?.length) setFormData(prev => ({ ...prev, account_id: accData[0].id }));
    } catch (err) {
      console.error('Critical error loading finance form data:', err);
    }
  }

  async function handleAddQuickItem(type: 'category' | 'account') {
    if (!newName || !profile?.company_id) return;
    setLoading(true);
    try {
      const supabase = createBrowserClient();
      if (type === 'category') {
        const { data, error } = await supabase.from('financial_categories').insert({
          company_id: profile.company_id,
          name: newName,
          type: formData.type,
          color: '#D4AF37'
        }).select().single();
        if (error) throw error;
        setCategories([...categories, data]);
        setFormData(prev => ({ ...prev, category_id: data.id }));
        setIsAddingCategory(false);
      } else {
        const { data, error } = await supabase.from('financial_accounts').insert({
          company_id: profile.company_id,
          name: newName,
          type: 'cash'
        }).select().single();
        if (error) throw error;
        setAccounts([...accounts, data]);
        setFormData(prev => ({ ...prev, account_id: data.id }));
        setIsAddingAccount(false);
      }
      setNewName('');
    } catch (err: any) {
      setError('Erro ao criar item: ' + err.message);
    } finally {
      setLoading(false);
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
       setError('Erro: Empresa não identificada.');
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
      setError(err.message || 'Erro ao salvar lançamento.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20">
      {/* Linked Appointment Info Banner */}
      {linkedAppointment && (
        <div className="bg-rose-50 border border-rose-100 p-6 rounded-[2rem] flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
             <div className="h-12 w-12 bg-rose-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-200">
                <Briefcase className="h-6 w-6" />
             </div>
             <div>
                <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-0.5">Atendimento Vinculado</p>
                <p className="text-sm font-black text-slate-900">{linkedAppointment.clients?.full_name} <span className="text-slate-400 font-bold mx-2">/</span> {linkedAppointment.procedures?.name}</p>
             </div>
          </div>
          <div className="text-right">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Valor do Serviço</p>
             <p className="text-xl font-black text-slate-900 italic">
               {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(linkedAppointment.procedures?.price)}
             </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-5">
           <Link href="/dashboard/finance">
              <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all shadow-sm">
                 <ArrowLeft className="h-5 w-5" />
              </Button>
           </Link>
           <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                 {formData.type === 'income' ? 
                   <TrendingUp className="h-8 w-8 text-emerald-500" /> : 
                   <TrendingDown className="h-8 w-8 text-rose-500" />
                 }
                 Lançar {formData.type === 'income' ? 'Receita' : 'Despesa'}
              </h1>
              <p className="text-slate-400 text-[10px] uppercase font-black tracking-widest mt-1.5">Registro oficial no fluxo de caixa</p>
           </div>
        </div>

        <Button 
          onClick={handleSubmit}
          className={cn(
             "h-14 px-10 font-black rounded-2xl shadow-2xl active:scale-[0.98] transition-all text-sm uppercase tracking-widest",
             formData.type === 'income' ? 
             "bg-slate-900 hover:bg-black text-white shadow-slate-200" : 
             "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200"
          )}
          disabled={loading}
        >
          {loading ? "Salvando..." : (
            <>
              <Save className={cn("h-5 w-5 mr-3", formData.type === 'income' ? "text-emerald-500" : "text-white")} />
              Confirmar Lançamento
            </>
          )}
        </Button>
      </div>

      <form className="grid grid-cols-1 lg:grid-cols-2 gap-8" onSubmit={handleSubmit}>
         
         {/* Essential Info */}
         <div className="space-y-8">
            <Card className="bg-white border-[#E5E0D8] rounded-3xl overflow-hidden shadow-sm">
                <CardHeader className="bg-[#FAF6E9] border-b border-[#E5E0D8] p-8">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-[#D4AF37]/10 rounded-2xl">
                      <Tag className="h-6 w-6 text-[#D4AF37]" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-black text-[#2C2825]">Novo Lançamento</CardTitle>
                      <p className="text-[10px] text-[#8A847C] uppercase font-black tracking-widest mt-1">Registrar entrada ou saída manual</p>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-8">
                   {(!categories.length || !accounts.length) ? (
                     <div className="p-10 text-center space-y-6">
                        <div className="w-16 h-16 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto">
                           <AlertCircle className="h-8 w-8 text-[#D4AF37]" />
                        </div>
                        <div>
                           <h3 className="text-lg font-bold text-[#2C2825]">Configuração Necessária</h3>
                           <p className="text-sm text-[#8A847C] mt-1">Você ainda não possui categorias ou contas configuradas.</p>
                        </div>
                        <Button 
                           onClick={initializeFinance}
                           disabled={loading}
                           type="button"
                           className="bg-[#D4AF37] hover:bg-[#B5952F] text-white font-bold h-12 px-8 rounded-xl"
                        >
                           {loading ? 'Inicializando...' : 'Configurar Categorias e Contas Padrões'}
                        </Button>
                        <p className="text-[10px] text-[#8A847C] italic">Isso criará pastas como: Luz, Salários, Procedimentos e Caixa Geral.</p>
                     </div>
                   ) : (
                     <div className="space-y-8">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Descrição do Lançamento</label>
                             <Input 
                                placeholder="Ex: Recebimento Procedimento X" 
                                className="bg-slate-50 border-slate-200 h-12 rounded-xl text-slate-900 placeholder:text-slate-300 font-bold focus:ring-rose-500/10"
                                required
                                value={formData.description}
                                onChange={(e) => handleChange('description', e.target.value)}
                             />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-6">
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Valor (R$)</label>
                                <Input 
                                   placeholder="0,00" 
                                   className="bg-slate-50 border-slate-200 h-12 rounded-xl text-slate-900 placeholder:text-slate-300 font-black text-lg italic"
                                   required
                                   value={formData.amount}
                                   onChange={(e) => handleChange('amount', e.target.value)}
                                />
                             </div>
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Data</label>
                                <Input 
                                   type="date"
                                   className="bg-slate-50 border-slate-200 h-12 rounded-xl text-slate-900 font-bold"
                                   value={formData.date}
                                   onChange={(e) => handleChange('date', e.target.value)}
                                />
                             </div>
                          </div>
                     </div>
                   )}
                </CardContent>
             </Card>

             <Card className="bg-white border-slate-100 rounded-[2rem] overflow-hidden shadow-xl shadow-slate-200/40">
                <CardHeader className="bg-slate-50 border-b border-slate-100 py-5 px-8">
                   <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Tag className="h-3.5 w-3.5" />
                      Classificação
                   </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                   <div className="space-y-2">
                      <div className="flex justify-between items-center ml-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoria Financeira</label>
                        <button type="button" onClick={() => setIsAddingCategory(!isAddingCategory)} className="text-[10px] font-bold text-[#D4AF37] hover:underline">
                          {isAddingCategory ? 'Cancelar' : '+ Nova'}
                        </button>
                      </div>

                      {isAddingCategory ? (
                         <div className="flex gap-2 animate-in slide-in-from-top-2">
                            <Input 
                               value={newName} 
                               onChange={e => setNewName(e.target.value)}
                               placeholder="Nome da categoria"
                               className="h-10 bg-white border-[#D4AF37]/30 text-xs"
                            />
                            <Button onClick={() => handleAddQuickItem('category')} size="sm" className="h-10 bg-[#D4AF37] hover:bg-[#B5952F] text-white">Criar</Button>
                         </div>
                      ) : (
                        <Select 
                          disabled={!categories.length}
                          onValueChange={(v) => handleChange('category_id', v)} 
                          value={formData.category_id}
                        >
                           <SelectTrigger className="bg-slate-50 border-slate-200 h-12 rounded-xl text-slate-900 font-bold">
                              <SelectValue placeholder="Selecione uma categoria" />
                           </SelectTrigger>
                           <SelectContent className="bg-white border-slate-200 text-slate-700 rounded-2xl shadow-2xl">
                              {categories.filter(c => c.type === formData.type || !c.type).map(c => (
                                <SelectItem key={c.id} value={c.id} className="font-bold py-3 uppercase text-[10px] tracking-widest text-slate-500">
                                  {c.name}
                                </SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                      )}
                   </div>
                   
                   <div className="space-y-2">
                       <div className="flex justify-between items-center ml-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Conta de Movimentação</label>
                        <button type="button" onClick={() => setIsAddingAccount(!isAddingAccount)} className="text-[10px] font-bold text-[#D4AF37] hover:underline">
                          {isAddingAccount ? 'Cancelar' : '+ Nova'}
                        </button>
                      </div>

                      {isAddingAccount ? (
                         <div className="flex gap-2 animate-in slide-in-from-top-2">
                            <Input 
                               value={newName} 
                               onChange={e => setNewName(e.target.value)}
                               placeholder="Nome da conta (ex: Banco X)"
                               className="h-10 bg-white border-[#D4AF37]/30 text-xs"
                            />
                            <Button onClick={() => handleAddQuickItem('account')} size="sm" className="h-10 bg-[#D4AF37] hover:bg-[#B5952F] text-white">Criar</Button>
                         </div>
                      ) : (
                        <Select 
                          disabled={!accounts.length}
                          onValueChange={(v) => handleChange('account_id', v)} 
                          value={formData.account_id}
                        >
                           <SelectTrigger className="bg-slate-50 border-slate-200 h-12 rounded-xl text-slate-900 font-bold">
                              <SelectValue placeholder="Selecione a conta" />
                           </SelectTrigger>
                           <SelectContent className="bg-white border-slate-200 text-slate-700 rounded-2xl shadow-2xl">
                              {accounts.map(a => (
                                <SelectItem key={a.id} value={a.id} className="font-bold py-3 uppercase text-[10px] tracking-widest text-slate-500">
                                  {a.name}
                                </SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                      )}
                   </div>
                </CardContent>
             </Card>
         </div>

         {/* Additional Details */}
         <div className="space-y-8">
            <Card className="bg-white border-slate-100 rounded-[2rem] overflow-hidden shadow-xl shadow-slate-200/40 h-full">
               <CardHeader className="bg-slate-50 border-b border-slate-100 py-5 px-8">
                  <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                     <Briefcase className="h-3.5 w-3.5" />
                     Método & Notas
                  </CardTitle>
               </CardHeader>
               <CardContent className="p-8 space-y-8">
                  <div className="space-y-4">
                     <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Método de Pagamento</label>
                     <div className="grid grid-cols-2 gap-4">
                        <PaymentToggle active={formData.payment_method === 'pix'} onClick={() => handleChange('payment_method', 'pix')}>PIX</PaymentToggle>
                        <PaymentToggle active={formData.payment_method === 'credit_card'} onClick={() => handleChange('payment_method', 'credit_card')}>Cartão</PaymentToggle>
                        <PaymentToggle active={formData.payment_method === 'cash'} onClick={() => handleChange('payment_method', 'cash')}>Dinheiro</PaymentToggle>
                        <PaymentToggle active={formData.payment_method === 'transfer'} onClick={() => handleChange('payment_method', 'transfer')}>Transferência</PaymentToggle>
                     </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-slate-50">
                     <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Observações Internas</label>
                     <TextArea 
                        placeholder="Adicione detalhes complementares..."
                        className="bg-slate-50 border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-300 min-h-[180px] font-medium"
                        value={formData.notes}
                        onChange={(e) => handleChange('notes', e.target.value)}
                     />
                  </div>

                  {error && (
                     <div className="flex items-center gap-3 p-5 bg-rose-50 border border-rose-100 rounded-2xl text-sm text-rose-600 font-bold">
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
    <Suspense fallback={<div className="p-20 text-center text-slate-400 font-black uppercase text-[10px] tracking-widest animate-pulse">Carregando Formulário...</div>}>
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
            "h-12 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2",
            active ? "bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-200 scale-[1.05]" : "bg-white border-slate-100 text-slate-400 hover:border-slate-300 hover:text-slate-600"
         )}
      >
         {children}
      </button>
   )
}
