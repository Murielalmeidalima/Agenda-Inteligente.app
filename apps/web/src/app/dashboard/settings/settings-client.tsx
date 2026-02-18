'use client';

import { useState, useEffect, useRef } from 'react';
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
  Settings as SettingsIcon, 
  Building2, 
  Shield, 
  Bell, 
  Trash2, 
  Edit3, 
  Plus,
  ArrowRight,
  Info,
  Mail,
  MessageSquare,
  Smartphone,
  LogOut,
  FileText
} from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase-browser';
import { useRouter } from 'next/navigation';
import { useProfile } from '@/providers/profile-provider';

export default function SettingsClient() {
  const [procedures, setProcedures] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]); // New state for templates
  const [loading, setLoading] = useState(true);
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [activeTab, setActiveTab] = useState<'clinic' | 'security' | 'notifications'>('clinic');
  
  // Security form state
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  // Notification form state
  const [notificationPrefs, setNotificationPrefs] = useState({
    newAppointments: true,
    cancellations: true,
    dailySummary: false,
    emailAlerts: true,
    whatsappAlerts: false,
    browserPush: true
  });

  // New service form state
  const [newService, setNewService] = useState({
    name: '',
    duration_minutes: 60,
    price: 0,
    maintenance_required: false,
    maintenance_days_limit: 30,
    requires_anamnese: false, // New field
    anamnese_template_id: ''  // New field
  });

  const supabase = createBrowserClient();
  const { profile, loading: profileLoading } = useProfile();
  const router = useRouter();
  
  // Use company_id from profile, fallback to empty string if loading
  const companyId = profile?.company_id;

  // File Upload Logic
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("O arquivo é muito grande. Máximo de 2MB.");
      return;
    }

    // 1. Optimistic Preview
    const objectUrl = URL.createObjectURL(file);
    setLogoPreview(objectUrl);
    setUploadingLogo(true);

    try {
      // 2. Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${companyId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('logos') // Making an educated guess on bucket name
        .upload(filePath, file);

      if (uploadError) {
        // Handle missing bucket specifically
        if (uploadError.message.includes('Bucket not found')) {
           alert("Erro: O bucket 'logos' não existe no Supabase. Crie-o no painel do Supabase com acesso público.");
           throw uploadError;
        }
        throw uploadError;
      }

      // 3. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath);

      // 4. Update Company Record
      const { error: dbError } = await supabase
        .from('companies')
        .update({ logo_url: publicUrl })
        .eq('id', companyId);

      if (dbError) throw dbError;

      alert("Logotipo atualizado com sucesso!");

    } catch (error: any) {
      console.error('Error uploading logo:', error);
      alert(`Falha no upload: ${error.message}`);
      // Revert preview on error
      setLogoPreview(null);
    } finally {
      setUploadingLogo(false);
    }
  };

  const fetchProcedures = async () => {
    try {
      setLoading(true);
      // Fetch Company Logo as well
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('logo_url')
        .eq('id', companyId)
        .single();
      
      if (companyError && companyError.code !== 'PGRST116') throw companyError;
      if (companyData?.logo_url) setLogoPreview(companyData.logo_url);

      const { data, error } = await supabase
        .from('procedures')
        .select('*')
        .eq('company_id', companyId)
        .order('name');
      
      if (error) throw error;
      if (data) setProcedures(data);

      // Fetch Templates
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

  useEffect(() => {
    if (companyId) {
      fetchProcedures();
    }
  }, [companyId]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  const handleUpdatePassword = async () => {
    if (!passwordForm.newPassword || passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("As senhas não coincidem ou estão vazias!");
      return;
    }
    
    const { error } = await supabase.auth.updateUser({
      password: passwordForm.newPassword
    });

    if (!error) {
      alert("Senha atualizada com sucesso!");
      setPasswordForm({ newPassword: '', confirmPassword: '' });
    } else {
      alert("Erro ao atualizar senha: " + error.message);
    }
  };

  const handleSaveNotifications = async () => {
    // Simulando persistência (Em cenário real, salvar no perfil do usuário no Supabase)
    alert("Preferências de notificação salvas com sucesso!");
  };

  const handleCreateService = async () => {
    const { error } = await supabase
      .from('procedures')
      .insert([{
        ...newService,
        company_id: companyId
      }]);

    if (!error) {
      setIsAddingProject(false);
      setNewService({
        name: '',
        duration_minutes: 60,
        price: 0,
        maintenance_required: false,
        maintenance_days_limit: 30,
        requires_anamnese: false,
        anamnese_template_id: ''
      });
      fetchProcedures();
    } else {
      console.error('Error creating service:', error);
    }
  };

  const handleDeleteService = async (id: string) => {
    const { error } = await supabase
      .from('procedures')
      .delete()
      .eq('id', id);

    if (!error) {
      fetchProcedures();
    }
  };

  return (
    <div className="space-y-10 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex items-center gap-6">
        <div className="p-3 bg-[#D4AF37]/10 rounded-2xl">
          <SettingsIcon className="h-6 w-6 text-[#D4AF37]" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-[#2C2825] tracking-tight">Configurações Gerais</h1>
          <p className="text-[#8A847C] text-[10px] uppercase font-black tracking-widest mt-1">Personalize seu ambiente de trabalho</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <div className="space-y-2">
            <NavButton 
              active={activeTab === 'clinic'} 
              onClick={() => setActiveTab('clinic')}
              icon={Building2}
            >
              Dados da Clínica
            </NavButton>
            <NavButton 
              active={activeTab === 'security'} 
              onClick={() => setActiveTab('security')}
              icon={Shield}
            >
              Segurança e Acesso
            </NavButton>
            <NavButton 
              active={activeTab === 'notifications'} 
              onClick={() => setActiveTab('notifications')}
              icon={Bell}
            >
              Notificações
            </NavButton>

            <div className="pt-4 mt-4 border-t border-[#E5E0D8]">
               <button 
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-red-500 hover:bg-red-50 transition-all font-bold text-sm group"
               >
                  <div className="p-2 bg-red-50 rounded-xl group-hover:bg-red-100 transition-all">
                     <LogOut className="h-4 w-4" />
                  </div>
                  Sair da Conta
               </button>
            </div>
        </div>

        {/* Main Content Areas */}
        <div className="lg:col-span-3 space-y-10">
          
          {activeTab === 'clinic' ? (
            <>
              {/* Company Section */}
              <Card className="bg-white border-[#E5E0D8] rounded-3xl overflow-hidden shadow-sm">
                <CardHeader className="bg-[#FAF6E9] border-b border-[#E5E0D8] p-8">
                  <div className="flex items-center justify-between">
                     <div>
                        <CardTitle className="text-lg font-bold text-[#2C2825]">Dados da Clínica</CardTitle>
                        <p className="text-xs text-[#5C5855] mt-1">Informações básicas que aparecem nos relatórios.</p>
                     </div>
                      <div className="flex items-center gap-4">
                         {isEditingCompany ? (
                            <Button 
                               onClick={() => setIsEditingCompany(false)}
                               className="bg-[#D4AF37] hover:bg-[#B5952F] text-white font-bold rounded-xl h-10 px-6 active:scale-[0.98] transition-all"
                            >
                               Salvar Alterações
                            </Button>
                         ) : (
                            <Button 
                               variant="outline"
                               onClick={() => setIsEditingCompany(true)}
                               className="border-[#E5E0D8] text-[#5C5855] hover:text-[#2C2825] hover:bg-[#FAF6E9] font-bold rounded-xl h-10 px-6 active:scale-[0.98] transition-all"
                            >
                               <Edit3 className="h-4 w-4 mr-2" />
                               Editar Dados
                            </Button>
                         )}
                      </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#8A847C] uppercase tracking-widest ml-1">Nome Fantasia</label>
                      <Input 
                        defaultValue="Clinica Jamily Premium" 
                        readOnly={!isEditingCompany}
                        className={cn(
                          "bg-[#FDFBF7] border-[#E5E0D8] h-12 rounded-xl text-[#2C2825] font-bold transition-all",
                          !isEditingCompany && "opacity-60 cursor-not-allowed border-transparent bg-transparent"
                        )} 
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#8A847C] uppercase tracking-widest ml-1">Telefone Principal</label>
                      <Input 
                        defaultValue="(11) 98765-4321" 
                        readOnly={!isEditingCompany}
                        className={cn(
                          "bg-[#FDFBF7] border-[#E5E0D8] h-12 rounded-xl text-[#2C2825] font-bold transition-all",
                          !isEditingCompany && "opacity-60 cursor-not-allowed border-transparent bg-transparent"
                        )} 
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#8A847C] uppercase tracking-widest ml-1">CNPJ / CPF Especialista</label>
                      <Input 
                        placeholder="00.000.000/0001-00" 
                        readOnly={!isEditingCompany}
                        className={cn(
                          "bg-[#FDFBF7] border-[#E5E0D8] h-12 rounded-xl text-[#2C2825] font-bold transition-all",
                          !isEditingCompany && "opacity-60 cursor-not-allowed border-transparent bg-transparent"
                        )} 
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#8A847C] uppercase tracking-widest ml-1">Cidade / Estado</label>
                      <Input 
                        defaultValue="São Paulo, SP" 
                        readOnly={!isEditingCompany}
                        className={cn(
                          "bg-[#FDFBF7] border-[#E5E0D8] h-12 rounded-xl text-[#2C2825] font-bold transition-all",
                          !isEditingCompany && "opacity-60 cursor-not-allowed border-transparent bg-transparent"
                        )} 
                      />
                   </div>
                   
                   {/* Branding Area */}
                    <div className="col-span-full space-y-6 pt-8 border-t border-[#E5E0D8]">
                      <div className="flex items-center gap-2 mb-2">
                         <Building2 className="h-4 w-4 text-[#D4AF37]" />
                         <h4 className="text-[10px] font-black text-[#8A847C] uppercase tracking-widest">Branding da Clínica</h4>
                      </div>
                      <div className="p-8 bg-[#FDFBF7] rounded-3xl border border-[#E5E0D8] border-dashed flex flex-col items-center gap-6">
                         <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center border border-[#E5E0D8] overflow-hidden relative group/preview shadow-sm">
                           {logoPreview ? (
                             <>
                               <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-cover" />
                               {uploadingLogo && (
                                 <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#D4AF37]"></div>
                                 </div>
                               )}
                             </>
                           ) : (
                             <Plus className="h-8 w-8 text-[#E5E0D8]" />
                           )}
                         </div>
                         <div className="text-center space-y-1">
                            <p className="text-sm font-bold text-[#2C2825]">Carregar Logotipo</p>
                            <p className="text-xs text-[#8A847C] italic">Formatos suportados: SVG, PNG ou JPG (Máx 2MB)</p>
                         </div>
                         <input
                             type="file"
                             accept="image/*"
                             className="hidden"
                             ref={fileInputRef}
                             onChange={handleLogoUpload}
                         />
                         <Button 
                           variant="outline" 
                           className="border-[#E5E0D8] text-[#5C5855] h-10 px-6 font-bold hover:bg-[#FAF6E9] hover:text-[#2C2825]"
                           onClick={() => fileInputRef.current?.click()}
                         >
                           Selecionar Arquivo
                         </Button>
                      </div>
                   </div>
                </CardContent>
              </Card>

              {/* Procedures Section */}
              <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                   <div>
                      <h3 className="text-sm font-black text-[#8A847C] uppercase tracking-widest">Catálogo de Procedimentos</h3>
                      <p className="text-xs text-[#5C5855] mt-1">Gerencie serviços, preços e tempos de execução.</p>
                   </div>
                   
                   <Dialog open={isAddingProject} onOpenChange={setIsAddingProject}>
                      <DialogTrigger asChild>
                        <Button className="h-11 px-6 bg-[#D4AF37] text-white hover:bg-[#B5952F] font-black rounded-xl active:scale-[0.98] transition-all">
                            <Plus className="h-5 w-5 mr-2" />
                            Novo Serviço
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-white border-[#E5E0D8] text-[#2C2825] rounded-3xl max-w-md">
                        <DialogHeader>
                          <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <Plus className="h-5 w-5 text-[#D4AF37]" />
                            Novo Procedimento
                          </DialogTitle>
                        </DialogHeader>
                        
                        <div className="space-y-6 py-4">
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
                                type="number"
                                step="0.01"
                                value={newService.price}
                                onChange={(e) => setNewService({...newService, price: parseFloat(e.target.value) || 0})}
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
                            <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                              <Label className="text-[10px] font-black text-[#8A847C] uppercase tracking-widest ml-1">Prazo de Manutenção (Dias)</Label>
                              <Input 
                                type="number"
                                value={newService.maintenance_days_limit}
                                onChange={(e) => setNewService({...newService, maintenance_days_limit: parseInt(e.target.value) || 0})}
                                className="bg-[#FDFBF7] border-[#E5E0D8] h-12 rounded-xl text-[#2C2825] font-bold" 
                              />
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

                        <DialogFooter className="gap-3">
                          <Button variant="ghost" onClick={() => setIsAddingProject(false)} className="text-[#5C5855] hover:text-[#2C2825] font-bold">Cancelar</Button>
                          <Button onClick={handleCreateService} className="bg-[#D4AF37] hover:bg-[#B5952F] text-white font-bold px-8">Cadastrar Serviço</Button>
                        </DialogFooter>
                      </DialogContent>
                   </Dialog>
                </div>

                <Card className="bg-white border-[#E5E0D8] rounded-3xl overflow-hidden shadow-sm">
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
                              <TableCell colSpan={5} className="text-center py-20 text-[#5C5855] italic">Carregando serviços...</TableCell>
                           </TableRow>
                         ) : procedures.length === 0 ? (
                           <TableRow>
                              <TableCell colSpan={5} className="text-center py-20 text-[#5C5855] italic">Nenhum serviço cadastrado.</TableCell>
                           </TableRow>
                         ) : (
                           procedures.map((p) => (
                              <TableRow key={p.id} className="border-b border-[#F0EBE0] group hover:bg-[#FAF6E9] transition-colors">
                                 <TableCell className="pl-8 py-5">
                                    <span className="font-bold text-[#2C2825] text-sm">{p.name}</span>
                                 </TableCell>
                                 <TableCell>
                                    <Badge variant="outline" className="bg-white border-[#E5E0D8] text-[#5C5855] text-[10px] font-bold uppercase">
                                       {p.duration_minutes} min
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
                                          <span className="text-[10px] text-[#8A847C] mt-1 italic">{p.maintenance_days_limit} dias</span>
                                       </div>
                                    ) : (
                                       <Badge className="bg-[#F0EBE0] text-[#5C5855] border-none rounded-full w-fit px-2.5">Não</Badge>
                                    )}
                                 </TableCell>
                                 <TableCell className="pr-4 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                       <Button size="icon" variant="ghost" className="h-9 w-9 text-[#5C5855] hover:text-[#2C2825] hover:bg-white rounded-xl">
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
            </>
          ) : activeTab === 'security' ? (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
               <Card className="bg-white border-[#E5E0D8] rounded-3xl overflow-hidden shadow-sm">
                  <CardHeader className="bg-[#FAF6E9] border-b border-[#E5E0D8] p-8">
                     <div className="flex items-center justify-between">
                        <div>
                           <CardTitle className="text-lg font-bold text-[#2C2825]">Segurança da Conta</CardTitle>
                           <p className="text-xs text-[#5C5855] mt-1">Gerencie sua senha e acessos.</p>
                        </div>
                        <Shield className="h-6 w-6 text-[#D4AF37] opacity-50" />
                     </div>
                  </CardHeader>
                  <CardContent className="p-8 space-y-8 max-w-2xl">
                     <div className="space-y-6">
                        <div className="space-y-4">
                           <div className="space-y-2">
                              <Label className="text-[10px] font-black text-[#8A847C] uppercase tracking-widest ml-1">Nova Senha</Label>
                              <Input 
                                 type="password"
                                 placeholder="Digite a nova senha"
                                 value={passwordForm.newPassword}
                                 onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                                 className="bg-[#FDFBF7] border-[#E5E0D8] h-12 rounded-xl text-[#2C2825] font-bold" 
                              />
                           </div>
                           <div className="space-y-2">
                              <Label className="text-[10px] font-black text-[#8A847C] uppercase tracking-widest ml-1">Confirmar Nova Senha</Label>
                              <Input 
                                 type="password"
                                 placeholder="Confirme a nova senha"
                                 value={passwordForm.confirmPassword}
                                 onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                                 className="bg-[#FDFBF7] border-[#E5E0D8] h-12 rounded-xl text-[#2C2825] font-bold" 
                              />
                           </div>
                        </div>
                        
                        <Button 
                           onClick={handleUpdatePassword}
                           className="bg-[#D4AF37] hover:bg-[#B5952F] text-white font-bold rounded-xl h-12 px-8 active:scale-[0.98] transition-all"
                        >
                           Atualizar Senha
                        </Button>
                     </div>

                     <div className="pt-8 border-t border-[#E5E0D8]">
                        <h4 className="text-sm font-bold text-[#2C2825] mb-4">Autenticação em Duas Etapas (2FA)</h4>
                        <div className="flex items-center justify-between p-6 bg-[#FDFBF7] rounded-3xl border border-[#E5E0D8] border-dashed">
                           <div className="space-y-1">
                              <p className="text-sm font-bold text-[#5C5855]">Proteção Extra</p>
                              <p className="text-xs text-[#8A847C]">Camada adicional de segurança.</p>
                           </div>
                           <Badge variant="outline" className="text-[#8A847C] border-[#E5E0D8] px-3 py-1">Em breve</Badge>
                        </div>
                     </div>
                  </CardContent>
               </Card>
            </div>
          ) : (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
               <Card className="bg-white border-[#E5E0D8] rounded-3xl overflow-hidden shadow-sm">
                  <CardHeader className="bg-[#FAF6E9] border-b border-[#E5E0D8] p-8">
                     <div className="flex items-center justify-between">
                        <div>
                           <CardTitle className="text-lg font-bold text-[#2C2825]">Preferências de Notificação</CardTitle>
                           <p className="text-xs text-[#5C5855] mt-1">Controle como e quando você quer ser alertado.</p>
                        </div>
                        <Button 
                           onClick={handleSaveNotifications}
                           className="bg-[#D4AF37] hover:bg-[#B5952F] text-white font-bold rounded-xl h-10 px-6 active:scale-[0.98] transition-all"
                        >
                           Salvar Preferências
                        </Button>
                     </div>
                  </CardHeader>
                  <CardContent className="p-8 space-y-10">
                     {/* Section: Agenda */}
                     <div className="space-y-6">
                        <div className="flex items-center gap-2 mb-2">
                           <Bell className="h-4 w-4 text-[#D4AF37]" />
                           <h4 className="text-[10px] font-black text-[#8A847C] uppercase tracking-widest">Alertas da Agenda</h4>
                        </div>
                        <div className="grid gap-4">
                           <ToggleRow 
                              title="Novos Agendamentos" 
                              description="Receba avisos imediatos quando um cliente marcar um serviço."
                              checked={notificationPrefs.newAppointments}
                              onChange={(val) => setNotificationPrefs({...notificationPrefs, newAppointments: val})}
                           />
                           <ToggleRow 
                              title="Cancelamentos e Reagendamentos" 
                              description="Seja notificado sobre qualquer alteração nos horários."
                              checked={notificationPrefs.cancellations}
                              onChange={(val) => setNotificationPrefs({...notificationPrefs, cancellations: val})}
                           />
                           <ToggleRow 
                              title="Resumo Diário" 
                              description="Um overview matinal com todos os atendimentos do dia."
                              checked={notificationPrefs.dailySummary}
                              onChange={(val) => setNotificationPrefs({...notificationPrefs, dailySummary: val})}
                           />
                        </div>
                     </div>

                     {/* Section: Channels */}
                     <div className="space-y-6 pt-8 border-t border-[#E5E0D8]">
                        <div className="flex items-center gap-2 mb-2">
                           <Shield className="h-4 w-4 text-[#D4AF37]" />
                           <h4 className="text-[10px] font-black text-[#8A847C] uppercase tracking-widest">Canais de Comunicação</h4>
                        </div>
                        <div className="grid gap-4">
                           <ToggleRow 
                              icon={<Mail className="h-4 w-4 text-[#8A847C]" />}
                              title="Notificações por E-mail" 
                              description="Receba cópias das notificações importantes no seu e-mail cadastrado."
                              checked={notificationPrefs.emailAlerts}
                              onChange={(val) => setNotificationPrefs({...notificationPrefs, emailAlerts: val})}
                           />
                           <ToggleRow 
                              icon={<MessageSquare className="h-4 w-4 text-[#8A847C]" />}
                              title="Alertas via WhatsApp" 
                              description="Lembretes automáticos para você e seus clientes (Integração Premium)."
                              checked={notificationPrefs.whatsappAlerts}
                              onChange={(val) => setNotificationPrefs({...notificationPrefs, whatsappAlerts: val})}
                              disabled
                           />
                           <ToggleRow 
                              icon={<Smartphone className="h-4 w-4 text-[#8A847C]" />}
                              title="Push do Navegador" 
                              description="Alertas em tempo real no desktop mesmo com a aba fechada."
                              checked={notificationPrefs.browserPush}
                              onChange={(val) => setNotificationPrefs({...notificationPrefs, browserPush: val})}
                           />
                        </div>
                     </div>

                     <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/10 rounded-2xl p-6 flex gap-4">
                        <div className="p-2 h-fit bg-[#D4AF37]/10 rounded-lg">
                           <Info className="h-5 w-5 text-[#D4AF37]" />
                        </div>
                        <div className="space-y-1">
                           <h4 className="text-sm font-bold text-[#2C2825] leading-none">Dica de Performance</h4>
                           <p className="text-xs text-[#5C5855] leading-relaxed">Mantenha os alertas de navegador ativos para nunca perder uma urgência enquanto estiver atendendo.</p>
                        </div>
                     </div>
                  </CardContent>
               </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const ToggleRow = ({ 
  title, 
  description, 
  checked, 
  onChange, 
  icon,
  disabled = false 
}: { 
  title: string, 
  description: string, 
  checked: boolean, 
  onChange: (val: boolean) => void,
  icon?: React.ReactNode,
  disabled?: boolean
}) => (
  <div className={cn(
    "flex items-center justify-between p-4 bg-[#FDFBF7] rounded-2xl border border-[#E5E0D8] transition-all",
    disabled && "opacity-50 grayscale cursor-not-allowed"
  )}>
    <div className="flex gap-4 items-start">
      {icon && <div className="mt-1">{icon}</div>}
      <div className="space-y-1">
        <Label className="text-sm font-bold block text-[#2C2825]">{title}</Label>
        <p className="text-[10px] text-[#5C5855] leading-relaxed max-w-[300px]">{description}</p>
      </div>
    </div>
    <div 
      onClick={() => !disabled && onChange(!checked)}
      className={cn(
        "w-12 h-6 rounded-full relative cursor-pointer transition-all duration-300",
        checked ? "bg-[#D4AF37]" : "bg-[#E5E0D8]"
      )}
    >
      <div className={cn(
        "absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all duration-300",
        checked ? "translate-x-6" : "translate-x-0"
      )} />
    </div>
  </div>
);

function NavButton({ 
  children, 
  active, 
  onClick, 
  icon: IconComponent 
}: { 
  children: React.ReactNode, 
  active?: boolean, 
  onClick?: () => void,
  icon: any 
}) {
   return (
      <button 
        onClick={onClick}
        className={cn(
         "w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all duration-300 group font-bold text-sm",
         active 
            ? "bg-[#D4AF37]/10 text-[#D4AF37] shadow-sm" 
            : "text-[#5C5855] hover:text-[#2C2825] hover:bg-[#FAF6E9]"
      )}>
         <div className="flex items-center gap-4">
            <div className={cn(
               "p-2 rounded-xl transition-colors",
               active ? "bg-[#D4AF37] text-white" : "bg-[#F0EBE0] text-[#8A847C] group-hover:text-[#2C2825]"
            )}>
               <IconComponent className="h-4 w-4" />
            </div>
            {children}
         </div>
         {active && <ArrowRight className="h-4 w-4" />}
      </button>
   );
}
