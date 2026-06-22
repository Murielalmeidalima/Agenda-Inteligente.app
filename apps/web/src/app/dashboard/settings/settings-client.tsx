'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
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
  FileText,
  Users
} from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase-browser';
import { useRouter } from 'next/navigation';
import { useProfile } from '@/providers/profile-provider';

export default function SettingsClient() {
  const [loading, setLoading] = useState(true);
  const [isEditingCompany, setIsEditingCompany] = useState(false);
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
    smsAlerts: false,
    browserPush: true
  });



  const supabase = createBrowserClient();
  const { profile, loading: profileLoading, refreshProfile } = useProfile();
  const router = useRouter();
  
  // Use company_id from profile, fallback to empty string if loading
  const companyId = profile?.company_id;

  // File Upload Logic
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [newLogoPreview, setNewLogoPreview] = useState<string | null>(null);
  const [newLogoFile, setNewLogoFile] = useState<File | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const getInitials = (name: string | null | undefined): string => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const resizeImage = (file: File, maxWidth = 400, maxHeight = 400): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement('img');
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error("Canvas context could not be created"));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Canvas toBlob failed"));
            }
          }, 'image/jpeg', 0.85);
        };
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  };

  const handleLogoSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Strict validation
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert("Formato não permitido. Selecione uma imagem PNG, JPG, JPEG ou WEBP.");
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("O tamanho da imagem excede o limite permitido de 5MB.");
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Set preview immediately
    const objectUrl = URL.createObjectURL(file);
    setNewLogoPreview(objectUrl);
    setNewLogoFile(file);
  };

  const handleSaveLogo = async () => {
    if (!newLogoFile) return;
    try {
      setUploadingLogo(true);

      // 1. Optimize image client-side via canvas
      const optimizedBlob = await resizeImage(newLogoFile);

      // 2. Upload to Supabase Storage
      const fileExt = 'jpg';
      const fileName = `${companyId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, optimizedBlob, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) {
        if (uploadError.message.includes('Bucket not found')) {
           alert("Erro: O bucket 'logos' não existe no Supabase. Crie o bucket com permissões públicas no painel.");
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

      // Reset selection state
      setNewLogoFile(null);
      setNewLogoPreview(null);
      setLogoPreview(publicUrl);
      
      // Global Profile sync
      await refreshProfile();
      router.refresh();
      alert("Logotipo atualizado com sucesso!");

    } catch (error: any) {
      console.error('Error saving logo:', error);
      alert(`Falha ao salvar logo: ${error.message}`);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!confirm("Tem certeza que deseja remover o logotipo da clínica? O sistema voltará ao padrão de iniciais.")) return;
    try {
      setUploadingLogo(true);

      // Update Company DB setting to null
      const { error: dbError } = await supabase
        .from('companies')
        .update({ logo_url: null })
        .eq('id', companyId);

      if (dbError) throw dbError;

      // Clean states
      setLogoPreview(null);
      setNewLogoPreview(null);
      setNewLogoFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Global sync
      await refreshProfile();
      router.refresh();
      alert("Logotipo removido com sucesso!");

    } catch (error: any) {
      console.error('Error removing logo:', error);
      alert(`Falha ao remover logo: ${error.message}`);
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


    } catch (err: any) {
      if (err.message?.includes('AbortError') || err.name === 'AbortError') return;
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile) {
      // Checagem de RBAC (Segurança)
      if (profile.role !== 'admin' && profile.role !== 'chefe') {
        const hasAccess = profile.permissions?.settings?.view;
        if (!hasAccess) {
          router.push('/dashboard');
          return;
        }
      }

      if (profile.company_id) {
        fetchProcedures();
      }
    }
  }, [profile, router]);

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

            {(profile?.role === 'admin' || profile?.role === 'chefe') && (
              <NavButton 
                active={activeTab === 'employees' as any} 
                onClick={() => router.push('/dashboard/settings/employees')}
                icon={Users}
              >
                Equipe & Permissões
              </NavButton>
            )}

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
                       
                       <div className="p-8 bg-[#FDFBF7] rounded-3xl border border-[#E5E0D8] border-dashed flex flex-col md:flex-row items-center justify-around gap-8">
                          
                          {/* 1. Logo Atual */}
                          <div className="flex flex-col items-center gap-3">
                             <span className="text-[10px] font-black text-[#8A847C] uppercase tracking-widest">Logo Atual</span>
                             <div className="w-28 h-28 bg-white rounded-3xl flex items-center justify-center border border-[#E5E0D8] overflow-hidden relative shadow-sm">
                               {logoPreview ? (
                                 <Image 
                                   src={logoPreview} 
                                   alt="Logo Atual" 
                                   fill
                                   className="object-cover"
                                   unoptimized
                                 />
                               ) : (
                                 <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-[#D4AF37] to-[#B5952F] text-white font-serif font-black text-3xl shadow-inner">
                                   {getInitials(profile?.companies?.name)}
                                 </div>
                               )}
                             </div>
                          </div>

                          {/* 2. Nova Logo Selecionada (se houver) */}
                          {newLogoPreview && (
                            <div className="flex flex-col items-center gap-3 animate-in zoom-in-50 duration-300">
                               <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-1.5">
                                 <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                                 Nova Logo Selecionada
                               </span>
                               <div className="w-28 h-28 bg-white rounded-3xl flex items-center justify-center border-2 border-dashed border-amber-500 overflow-hidden relative shadow-md">
                                 <Image 
                                   src={newLogoPreview} 
                                   alt="Nova Logo Preview" 
                                   fill
                                   className="object-cover"
                                   unoptimized
                                 />
                               </div>
                            </div>
                          )}

                          {/* 3. Ações de Upload */}
                          <div className="flex flex-col items-center md:items-start gap-4">
                             <div className="text-center md:text-left space-y-1">
                                <p className="text-sm font-bold text-[#2C2825]">Carregar Logotipo</p>
                                <p className="text-xs text-[#8A847C] italic">Formatos suportados: PNG, JPG, JPEG, WEBP (Máx 5MB)</p>
                             </div>
                             
                             <input
                                 type="file"
                                 accept="image/png, image/jpeg, image/jpg, image/webp"
                                 className="hidden"
                                 ref={fileInputRef}
                                 onChange={handleLogoSelection}
                             />

                             <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                                <Button 
                                  variant="outline" 
                                  className="border-[#E5E0D8] text-[#5C5855] h-10 px-6 font-bold hover:bg-[#FAF6E9] hover:text-[#2C2825]"
                                  onClick={() => fileInputRef.current?.click()}
                                >
                                  Selecionar Imagem
                                </Button>

                                {newLogoFile && (
                                  <Button 
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 px-6"
                                    onClick={handleSaveLogo}
                                    disabled={uploadingLogo}
                                  >
                                    {uploadingLogo ? "Salvando..." : "Salvar Nova Logo"}
                                  </Button>
                                )}

                                {logoPreview && (
                                  <Button 
                                    variant="ghost"
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 font-bold h-10 px-6"
                                    onClick={handleRemoveLogo}
                                    disabled={uploadingLogo}
                                  >
                                    Remover Logo
                                  </Button>
                                )}
                             </div>
                          </div>
                       </div>
                    </div>
                 </CardContent>
              </Card>

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
                           />
                           <ToggleRow 
                              icon={<MessageSquare className="h-4 w-4 text-[#8A847C]" />}
                              title="Alertas via SMS" 
                              description="Lembretes via SMS para confirmação de consultas."
                              checked={notificationPrefs.smsAlerts}
                              onChange={(val) => setNotificationPrefs({...notificationPrefs, smsAlerts: val})}
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
