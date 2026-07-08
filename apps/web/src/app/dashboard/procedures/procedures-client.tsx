'use client';

import { useState, useEffect } from 'react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  Button, 
  Input, 
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  cn,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  Label
} from '@projeto/ui';
import { 
  Activity,
  Trash2, 
  Edit3, 
  Plus,
  Info
} from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase-browser';
import { useProfile } from '@/providers/profile-provider';
import { useRouter } from 'next/navigation';

export default function ProceduresClient() {
  const { profile } = useProfile();
  const router = useRouter();
  const [procedures, setProcedures] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const [isAddingProcedure, setIsAddingProcedure] = useState(false);
  const [editingProcedureId, setEditingProcedureId] = useState<string | null>(null);
  
  const [newService, setNewService] = useState({
    name: '',
    duration_minutes: 60,
    price: '',
    description: '',
    color: '#D4AF37',
    maintenance_required: false,
    maintenance_days_limit: 30,
    maintenance_period_unit: 'days', // 'days', 'weeks', 'months'
    maintenance_duration_minutes: 60,
    requires_anamnese: false,
    anamnese_template_id: ''
  });

  const supabase = createBrowserClient();
  const companyId = profile?.company_id;

  const fetchProcedures = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('procedures')
        .select('*')
        .eq('company_id', companyId)
        .order('name');
      
      if (error) throw error;
      if (data) setProcedures(data);

      const { data: tmplData } = await supabase
        .from('anamnese_templates')
        .select('id, name')
        .eq('company_id', companyId)
        .eq('is_active', true);
        
      if (tmplData) setTemplates(tmplData);
    } catch (err: any) {
      if (err.message?.includes('AbortError') || err.name === 'AbortError') return;
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  // Guard screen access
  useEffect(() => {
    if (profile) {
      if (profile.role !== 'admin' && profile.role !== 'chefe') {
        const hasAccess = profile.permissions?.settings?.view;
        if (!hasAccess) {
          router.push('/dashboard');
        }
      }
    }
  }, [profile, router]);

  useEffect(() => {
    if (companyId) {
      fetchProcedures();
    }
  }, [companyId]);

  const handleCreateService = async () => {
    const normalizedNewName = newService.name.trim().toLowerCase();
    
    if (!normalizedNewName) {
      alert('O nome do procedimento não pode ser vazio.');
      return;
    }

    const isDuplicate = procedures.some(p => 
      p.name.trim().toLowerCase() === normalizedNewName && 
      p.id !== editingProcedureId
    );

    if (isDuplicate) {
      alert('Já existe um procedimento com este nome.');
      return;
    }

    let error;
    const parsedPrice = parseFloat(newService.price.toString().replace(',', '.')) || 0;

    if (editingProcedureId) {
       const { error: updateError } = await supabase
         .from('procedures')
         .update({
           name: newService.name,
           duration_minutes: newService.duration_minutes,
           price: parsedPrice,
           description: newService.description,
           color: newService.color,
           maintenance_required: newService.maintenance_required,
           maintenance_days_limit: newService.maintenance_days_limit,
           maintenance_period_unit: newService.maintenance_period_unit,
           maintenance_duration_minutes: newService.maintenance_duration_minutes,
           requires_anamnese: newService.requires_anamnese,
           anamnese_template_id: newService.anamnese_template_id || null
         })
         .eq('id', editingProcedureId)
         .eq('company_id', companyId);
       error = updateError;
    } else {
       const { error: insertError } = await supabase
         .from('procedures')
         .insert([{
           name: newService.name,
           duration_minutes: newService.duration_minutes,
           price: parsedPrice,
           description: newService.description,
           color: newService.color,
           maintenance_required: newService.maintenance_required,
           maintenance_days_limit: newService.maintenance_days_limit,
           maintenance_period_unit: newService.maintenance_period_unit,
           maintenance_duration_minutes: newService.maintenance_duration_minutes,
           requires_anamnese: newService.requires_anamnese,
           anamnese_template_id: newService.anamnese_template_id || null,
           company_id: companyId
         }]);
       error = insertError;
    }

    if (!error) {
      setIsAddingProcedure(false);
      setEditingProcedureId(null);
      setNewService({
        name: '',
        duration_minutes: 60,
        price: '',
        description: '',
        color: '#D4AF37',
        maintenance_required: false,
        maintenance_days_limit: 30,
        maintenance_period_unit: 'days',
        maintenance_duration_minutes: 60,
        requires_anamnese: false,
        anamnese_template_id: ''
      });
      fetchProcedures();
    } else {
      console.error('Error creating service:', JSON.stringify(error, null, 2));
      alert(`Erro ao criar serviço: ${error.message || 'Verifique as permissões'}`);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este procedimento?')) return;
    try {
      const res = await fetch('/api/entity/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity: 'procedure', id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao excluir procedimento.');
      setProcedures(prev => prev.filter(p => p.id !== id));
      fetchProcedures();
    } catch (err: any) {
      console.error('Error deleting procedure:', err);
      alert(err.message || 'Erro ao excluir procedimento.');
    }
  };


  return (
    <div className="space-y-10 animate-fade-in pb-20">
      <div className="flex flex-col gap-6 md:flex-row md:items-end justify-between">
        <div className="flex items-center gap-6">
          <div className="p-3 bg-[#D4AF37]/10 rounded-2xl">
            <Activity className="h-6 w-6 text-[#D4AF37]" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-[#2C2825] tracking-tight">Procedimentos</h1>
            <p className="text-[#8A847C] text-[10px] uppercase font-black tracking-widest mt-1">Gerencie seu catálogo de serviços</p>
          </div>
        </div>

        <Dialog open={isAddingProcedure} onOpenChange={(open) => {
           setIsAddingProcedure(open);
           if (!open) {
              setEditingProcedureId(null);
              setNewService({
                name: '', duration_minutes: 60, price: '', description: '', color: '#D4AF37', maintenance_required: false, maintenance_days_limit: 30, maintenance_period_unit: 'days', maintenance_duration_minutes: 60, requires_anamnese: false, anamnese_template_id: ''
              });
           }
        }}>
           <DialogTrigger asChild>
             <Button className="h-11 px-6 bg-[#D4AF37] text-white hover:bg-[#B5952F] font-black rounded-xl active:scale-[0.98] transition-all" onClick={() => {
                setEditingProcedureId(null);
                setNewService({
                  name: '', duration_minutes: 60, price: '', description: '', color: '#D4AF37', maintenance_required: false, maintenance_days_limit: 30, maintenance_period_unit: 'days', maintenance_duration_minutes: 60, requires_anamnese: false, anamnese_template_id: ''
                });
             }}>
                 <Plus className="h-5 w-5 mr-2" />
                 Novo Serviço
             </Button>
           </DialogTrigger>
           <DialogContent className="bg-white border-[#E5E0D8] text-[#2C2825] rounded-3xl max-w-md w-[95vw] md:w-full max-h-[90vh] flex flex-col p-0 overflow-hidden">
             <DialogHeader className="p-6 pb-4 border-b border-[#E5E0D8]/40">
               <DialogTitle className="text-xl font-bold flex items-center gap-2">
                 <Plus className="h-5 w-5 text-[#D4AF37]" />
                 {editingProcedureId ? 'Editar Procedimento' : 'Novo Procedimento'}
               </DialogTitle>
             </DialogHeader>
             
             <div className="flex-1 overflow-y-auto p-6 space-y-6">
               <div className="space-y-6">
                 <div className="space-y-2">
                   <Label className="text-[10px] font-black text-[#8A847C] uppercase tracking-widest ml-1">Nome do Serviço</Label>
                   <Input 
                     placeholder="Ex: Limpeza de Pele" 
                     value={newService.name}
                     onChange={(e) => setNewService({...newService, name: e.target.value})}
                     className="bg-[#FDFBF7] border-[#E5E0D8] h-12 rounded-xl text-[#2C2825] font-bold" 
                   />
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <Label className="text-[10px] font-black text-[#8A847C] uppercase tracking-widest ml-1">Descrição</Label>
                     <Input 
                       placeholder="Descrição curta do procedimento" 
                       value={newService.description}
                       onChange={(e) => setNewService({...newService, description: e.target.value})}
                       className="bg-[#FDFBF7] border-[#E5E0D8] h-12 rounded-xl text-[#2C2825] font-bold" 
                     />
                   </div>
                   
                   <div className="space-y-2">
                     <Label className="text-[10px] font-black text-[#8A847C] uppercase tracking-widest ml-1">Cor na Agenda</Label>
                     <div className="flex items-center gap-2">
                       <Input 
                         type="color"
                         value={newService.color || '#D4AF37'}
                         onChange={(e) => setNewService({...newService, color: e.target.value})}
                         className="p-1 h-12 w-16 bg-[#FDFBF7] border-[#E5E0D8] rounded-xl cursor-pointer" 
                       />
                       <div className="flex gap-2 flex-wrap flex-1 ml-2">
                         {['#D4AF37', '#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F97316'].map((preset) => (
                           <button 
                             key={preset}
                             type="button"
                             onClick={() => setNewService({...newService, color: preset})}
                             className={cn(
                               "w-6 h-6 rounded-full border-2 transition-transform hover:scale-110",
                               newService.color === preset ? "border-slate-800" : "border-transparent"
                             )}
                             style={{ backgroundColor: preset }}
                           />
                         ))}
                       </div>
                     </div>
                   </div>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <Label className="text-[10px] font-black text-[#8A847C] uppercase tracking-widest ml-1">Duração</Label>
                     <div className="flex gap-2">
                       <div className="relative flex-1">
                         <Input 
                           type="number"
                           min="0"
                           placeholder="0"
                           value={Math.floor(newService.duration_minutes / 60).toString()}
                           onChange={(e) => {
                             const h = parseInt(e.target.value) || 0;
                             const m = newService.duration_minutes % 60;
                             setNewService({...newService, duration_minutes: (h * 60) + m});
                           }}
                           className="bg-[#FDFBF7] border-[#E5E0D8] h-12 rounded-xl text-[#2C2825] font-bold pr-8" 
                         />
                         <span className="absolute right-3 top-3.5 text-xs text-[#8A847C] font-bold">H</span>
                       </div>
                       <div className="relative flex-1">
                         <Input 
                           type="number"
                           min="0"
                           max="59"
                           placeholder="0"
                           value={(newService.duration_minutes % 60).toString()}
                           onChange={(e) => {
                             let m = parseInt(e.target.value) || 0;
                             if (m > 59) m = 59;
                             const h = Math.floor(newService.duration_minutes / 60);
                             setNewService({...newService, duration_minutes: (h * 60) + m});
                           }}
                           className="bg-[#FDFBF7] border-[#E5E0D8] h-12 rounded-xl text-[#2C2825] font-bold pr-10" 
                         />
                         <span className="absolute right-3 top-3.5 text-xs text-[#8A847C] font-bold">MIN</span>
                       </div>
                     </div>
                   </div>
                   <div className="space-y-2">
                     <Label className="text-[10px] font-black text-[#8A847C] uppercase tracking-widest ml-1">Valor (R$)</Label>
                     <Input 
                       type="text"
                       inputMode="decimal"
                       placeholder="0,00"
                       value={newService.price}
                       onChange={(e) => {
                         const val = e.target.value;
                         if (val === '' || /^[0-9]*[.,]?[0-9]*$/.test(val)) {
                           setNewService({...newService, price: val});
                         }
                       }}
                       className="bg-[#FDFBF7] border-[#E5E0D8] h-12 rounded-xl text-[#2C2825] font-bold" 
                     />
                   </div>
                 </div>
 
                 <div className="flex items-center gap-3 p-4 bg-[#FDFBF7] rounded-2xl border border-[#E5E0D8]">
                   <input 
                     type="checkbox" 
                     id="maintenance"
                     checked={newService.maintenance_required}
                     onChange={(e) => setNewService({...newService, maintenance_required: e.target.checked})}
                     className="w-5 h-5 rounded border-[#E5E0D8] bg-white text-[#D4AF37] focus:ring-[#D4AF37]"
                   />
                   <div className="flex-1">
                     <Label htmlFor="maintenance" className="text-sm font-bold block">Requer Manutenção</Label>
                     <p className="text-[10px] text-[#8A847C]">Ativa lembretes automáticos na agenda.</p>
                   </div>
                 </div>
 
                 {newService.maintenance_required && (
                   <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                     <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                         <Label className="text-[10px] font-black text-[#8A847C] uppercase tracking-widest ml-1">Prazo de Manutenção</Label>
                         <Input 
                           type="number"
                           value={newService.maintenance_days_limit}
                           onChange={(e) => setNewService({...newService, maintenance_days_limit: parseInt(e.target.value) || 0})}
                           className="bg-[#FDFBF7] border-[#E5E0D8] h-12 rounded-xl text-[#2C2825] font-bold" 
                         />
                       </div>
                       <div className="space-y-2">
                         <Label className="text-[10px] font-black text-[#8A847C] uppercase tracking-widest ml-1">Unidade de Tempo</Label>
                         <select 
                           value={newService.maintenance_period_unit}
                           onChange={(e) => setNewService({...newService, maintenance_period_unit: e.target.value})}
                           className="w-full bg-[#FDFBF7] border border-[#E5E0D8] h-12 rounded-xl text-[#2C2825] font-bold px-4"
                         >
                            <option value="days">Dias</option>
                            <option value="months">Meses</option>
                         </select>
                       </div>
                     </div>
                     
                     <div className="space-y-2">
                       <Label className="text-[10px] font-black text-[#8A847C] uppercase tracking-widest ml-1">Duração da Manutenção</Label>
                       <div className="flex gap-2">
                         <div className="relative flex-1">
                           <Input 
                             type="number"
                             min="0"
                             placeholder="0"
                             value={Math.floor(newService.maintenance_duration_minutes / 60).toString()}
                             onChange={(e) => {
                               const h = parseInt(e.target.value) || 0;
                               const m = newService.maintenance_duration_minutes % 60;
                               setNewService({...newService, maintenance_duration_minutes: (h * 60) + m});
                             }}
                             className="bg-[#FDFBF7] border-[#E5E0D8] h-12 rounded-xl text-[#2C2825] font-bold pr-8" 
                           />
                           <span className="absolute right-3 top-3.5 text-xs text-[#8A847C] font-bold">H</span>
                         </div>
                         <div className="relative flex-1">
                           <Input 
                             type="number"
                             min="0"
                             max="59"
                             placeholder="0"
                             value={(newService.maintenance_duration_minutes % 60).toString()}
                             onChange={(e) => {
                               let m = parseInt(e.target.value) || 0;
                               if (m > 59) m = 59;
                               const h = Math.floor(newService.maintenance_duration_minutes / 60);
                               setNewService({...newService, maintenance_duration_minutes: (h * 60) + m});
                             }}
                             className="bg-[#FDFBF7] border-[#E5E0D8] h-12 rounded-xl text-[#2C2825] font-bold pr-10" 
                           />
                           <span className="absolute right-3 top-3.5 text-xs text-[#8A847C] font-bold">MIN</span>
                         </div>
                       </div>
                     </div>
                   </div>
                 )}
               </div>
 
               {/* Anamnese Configuration */}
               <div className="space-y-2 pt-4 border-t border-[#E5E0D8]">
                  <div className="flex items-center gap-3 p-4 bg-[#FDFBF7] rounded-2xl border border-[#E5E0D8]">
                     <input 
                       type="checkbox" 
                       id="anamnese"
                       checked={newService.requires_anamnese}
                       onChange={(e) => setNewService({...newService, requires_anamnese: e.target.checked})}
                       className="w-5 h-5 rounded border-[#E5E0D8] bg-white text-[#D4AF37] focus:ring-[#D4AF37]"
                     />
                     <div className="flex-1">
                       <Label htmlFor="anamnese" className="text-sm font-bold block">Exige Anamnese</Label>
                       <p className="text-[10px] text-[#8A847C]">Obrigatório preenchimento de ficha antes de finalizar.</p>
                     </div>
                  </div>
 
                  {newService.requires_anamnese && (
                     <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                        <Label className="text-[10px] font-black text-[#8A847C] uppercase tracking-widest ml-1">Modelo de Ficha</Label>
                        <select 
                          value={newService.anamnese_template_id}
                          onChange={(e) => setNewService({...newService, anamnese_template_id: e.target.value})}
                          className="w-full bg-[#FDFBF7] border border-[#E5E0D8] h-12 rounded-xl text-[#2C2825] font-bold px-4"
                        >
                           <option value="">Selecione um modelo...</option>
                           {templates.map(t => (
                              <option key={t.id} value={t.id}>{t.name}</option>
                           ))}
                        </select>
                     </div>
                  )}
               </div>
             </div>
 
             <DialogFooter className="p-6 pt-4 border-t border-[#E5E0D8]/40 flex flex-row items-center justify-end gap-3 bg-[#FAF6E9]/30">
               <Button variant="ghost" onClick={() => {
                  setIsAddingProcedure(false);
                  setEditingProcedureId(null);
               }} className="text-[#5C5855] hover:text-[#2C2825] font-bold">Cancelar</Button>
               <Button onClick={handleCreateService} className="bg-[#D4AF37] hover:bg-[#B5952F] text-white font-bold px-8">
                 {editingProcedureId ? 'Salvar Alterações' : 'Cadastrar Serviço'}
               </Button>
             </DialogFooter>
           </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-6">
        <Card className="bg-white border-[#E5E0D8] rounded-3xl overflow-hidden shadow-sm hidden md:block">
           <Table>
              <TableHeader className="bg-[#FAF6E9] border-b border-[#E5E0D8]">
                 <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="text-[#8A847C] font-bold uppercase text-[10px] tracking-widest pl-8 py-4">Serviço</TableHead>
                    <TableHead className="text-[#8A847C] font-bold uppercase text-[10px] tracking-widest">Duração</TableHead>
                    <TableHead className="text-[#8A847C] font-bold uppercase text-[10px] tracking-widest">Valor</TableHead>
                    <TableHead className="text-[#8A847C] font-bold uppercase text-[10px] tracking-widest">Anamnese</TableHead>
                    <TableHead className="text-[#8A847C] font-bold uppercase text-[10px] tracking-widest">Manutenção</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                 </TableRow>
              </TableHeader>
              <TableBody>
                 {loading ? (
                   <TableRow>
                      <TableCell colSpan={6} className="text-center py-20 text-[#5C5855] italic">Carregando serviços...</TableCell>
                   </TableRow>
                 ) : procedures.length === 0 ? (
                   <TableRow>
                      <TableCell colSpan={6} className="text-center py-20 text-[#5C5855] italic">Nenhum serviço cadastrado.</TableCell>
                   </TableRow>
                 ) : (
                   procedures.map((p) => (
                      <TableRow key={p.id} className="border-b border-[#F0EBE0] group hover:bg-[#FAF6E9] transition-colors">
                         <TableCell className="pl-8 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color || '#D4AF37' }}></div>
                              <span className="font-bold text-[#2C2825] text-sm">{p.name}</span>
                            </div>
                         </TableCell>
                         <TableCell>
                            <Badge variant="outline" className="bg-white border-[#E5E0D8] text-[#5C5855] text-[10px] font-bold uppercase">
                               {Math.floor(p.duration_minutes / 60) > 0 ? `${Math.floor(p.duration_minutes / 60)}h ${p.duration_minutes % 60}m` : `${p.duration_minutes}m`}
                            </Badge>
                         </TableCell>
                         <TableCell className="font-mono text-[#2C2825] font-bold">
                            R$ {(p.price || 0).toFixed(2)}
                         </TableCell>
                         <TableCell>
                            {p.requires_anamnese ? (
                               <Badge className="bg-blue-100 text-blue-700 border-none rounded-full w-fit px-2.5">Sim</Badge>
                            ) : (
                               <span className="text-neutral-300 text-xs">-</span>
                            )}
                         </TableCell>
                         <TableCell>
                            {p.maintenance_required ? (
                               <div className="flex flex-col">
                                  <Badge className="bg-emerald-100 text-emerald-700 border-none rounded-full w-fit px-2.5">Sim</Badge>
                                  <span className="text-[10px] text-[#8A847C] mt-1 italic">
                                     {p.maintenance_days_limit} {
                                       p.maintenance_period_unit === 'months' ? (p.maintenance_days_limit === 1 ? 'mês' : 'meses') :
                                       (p.maintenance_days_limit === 1 ? 'dia' : 'dias')
                                     } 
                                     {p.maintenance_duration_minutes > 0 ? ` • ${Math.floor(p.maintenance_duration_minutes / 60) > 0 ? `${Math.floor(p.maintenance_duration_minutes / 60)}h ${p.maintenance_duration_minutes % 60}m` : `${p.maintenance_duration_minutes}m`}` : ''}
                                  </span>
                               </div>
                            ) : (
                               <Badge className="bg-[#F0EBE0] text-[#5C5855] border-none rounded-full w-fit px-2.5">Não</Badge>
                            )}
                         </TableCell>
                         <TableCell className="pr-4 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                               <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-9 w-9 text-[#5C5855] hover:text-[#2C2825] hover:bg-white rounded-xl"
                                  onClick={() => {
                                    setEditingProcedureId(p.id);
                                    setNewService({
                                      name: p.name || '',
                                      duration_minutes: p.duration_minutes || 60,
                                      price: p.price !== undefined && p.price !== null ? p.price.toString() : '',
                                      description: p.description || '',
                                      color: p.color || '#D4AF37',
                                      maintenance_required: p.maintenance_required || false,
                                      maintenance_days_limit: p.maintenance_days_limit || 30,
                                      maintenance_period_unit: p.maintenance_period_unit || 'days',
                                      maintenance_duration_minutes: p.maintenance_duration_minutes || 60,
                                      requires_anamnese: p.requires_anamnese || false,
                                      anamnese_template_id: p.anamnese_template_id || ''
                                    });
                                    setIsAddingProcedure(true);
                                  }}
                               >
                                  <Edit3 className="h-4 w-4" />
                               </Button>
                               <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  onClick={() => handleDeleteService(p.id)}
                                  className="h-9 w-9 text-[#5C5855] hover:text-red-500 hover:bg-red-50 rounded-xl"
                               >
                                  <Trash2 className="h-4 w-4" />
                               </Button>
                            </div>
                         </TableCell>
                      </TableRow>
                   ))
                 )}
              </TableBody>
           </Table>
        </Card>

        {/* Mobile View */}
        <div className="md:hidden flex flex-col gap-4">
          {loading ? (
            <Card className="bg-white border-[#E5E0D8] rounded-3xl p-10 text-center text-[#5C5855] italic shadow-sm">
              Carregando serviços...
            </Card>
          ) : procedures.length === 0 ? (
            <Card className="bg-white border-[#E5E0D8] rounded-3xl p-10 text-center text-[#5C5855] italic shadow-sm">
              Nenhum serviço cadastrado.
            </Card>
          ) : (
            procedures.map((p) => (
              <Card key={p.id} className="bg-white border-[#E5E0D8] rounded-3xl p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: p.color || '#D4AF37' }}></div>
                    <span className="font-extrabold text-[#2C2825] text-base leading-snug">{p.name}</span>
                  </div>
                  <span className="font-mono text-[#D4AF37] font-black text-sm shrink-0">
                    R$ {(p.price || 0).toFixed(2)}
                  </span>
                </div>

                {p.description && (
                  <p className="text-xs text-[#5C5855] leading-relaxed">{p.description}</p>
                )}

                <div className="flex flex-wrap gap-2 pt-1">
                  <Badge variant="outline" className="bg-[#FAF6E9]/40 border-[#E5E0D8] text-[#5C5855] text-[10px] font-bold uppercase py-1">
                     Duração: {Math.floor(p.duration_minutes / 60) > 0 ? `${Math.floor(p.duration_minutes / 60)}h ${p.duration_minutes % 60}m` : `${p.duration_minutes}m`}
                  </Badge>
                  
                  {p.requires_anamnese && (
                    <Badge className="bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-[10px] font-bold py-0.5 px-2">
                      Exige Anamnese
                    </Badge>
                  )}

                  {p.maintenance_required && (
                    <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-[10px] font-bold py-0.5 px-2">
                      Manutenção: {p.maintenance_days_limit} {p.maintenance_period_unit === 'months' ? 'meses' : 'dias'}
                    </Badge>
                  )}
                </div>

                <div className="border-t border-[#F0EBE0] pt-4 flex gap-2">
                  <Button 
                     className="flex-1 h-10 border border-[#E5E0D8] text-[#5C5855] hover:text-[#2C2825] hover:bg-[#FAF6E9] rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all bg-white"
                     onClick={() => {
                       setEditingProcedureId(p.id);
                       setNewService({
                         name: p.name || '',
                         duration_minutes: p.duration_minutes || 60,
                         price: p.price !== undefined && p.price !== null ? p.price.toString() : '',
                         description: p.description || '',
                         color: p.color || '#D4AF37',
                         maintenance_required: p.maintenance_required || false,
                         maintenance_days_limit: p.maintenance_days_limit || 30,
                         maintenance_period_unit: p.maintenance_period_unit || 'days',
                         maintenance_duration_minutes: p.maintenance_duration_minutes || 60,
                         requires_anamnese: p.requires_anamnese || false,
                         anamnese_template_id: p.anamnese_template_id || ''
                       });
                       setIsAddingProcedure(true);
                     }}
                  >
                     <Edit3 className="h-3.5 w-3.5" />
                     Editar
                  </Button>
                  <Button 
                     onClick={() => handleDeleteService(p.id)}
                     className="flex-1 h-10 border border-red-100 text-red-600 hover:bg-red-50 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all bg-white"
                  >
                     <Trash2 className="h-3.5 w-3.5" />
                     Excluir
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>

        <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/10 rounded-2xl p-6 flex gap-4">
           <div className="p-2 h-fit bg-[#D4AF37]/10 rounded-lg">
              <Info className="h-5 w-5 text-[#D4AF37]" />
           </div>
           <div className="space-y-1">
              <h4 className="text-sm font-bold text-[#2C2825] leading-none">Dica de Gestão</h4>
              <p className="text-xs text-[#5C5855] leading-relaxed">Procedimentos com manutenção configurada gerarão lembretes automáticos na agenda quando estiverem próximos ao vencimento do prazo.</p>
           </div>
        </div>
      </div>
    </div>
  );
}
