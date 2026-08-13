'use client';

import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  Button,
  Input,
  Label,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Switch,
  Badge,
  cn
} from '@projeto/ui';
import { 
  Shield, 
  User, 
  Mail, 
  Lock, 
  Briefcase, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  ChevronRight,
  Phone,
  FileText
} from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase-browser';
import { showToast } from '@/lib/toast-helpers';
import { Profile, ProfilePermissions, UserRole } from '@/types/database';
import { useProfile } from '@/providers/profile-provider';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Profile | null;
  companyId: string;
  onRefresh: () => void;
}

const SCREENS = [
  { id: 'agenda', label: 'Agenda' },
  { id: 'clients', label: 'Clientes' },
  { id: 'finance', label: 'Financeiro' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'inventory', label: 'Estoque' },
  { id: 'reports', label: 'Relatórios' },
  { id: 'settings', label: 'Configurações' },
  { id: 'anamnese', label: 'Anamnese' },
  { id: 'team', label: 'Equipe' }
];

const DEFAULT_PERMISSIONS: ProfilePermissions = SCREENS.reduce((acc, screen) => {
  acc[screen.id] = { view: true, create: false, edit: false, delete: false };
  return acc;
}, {} as ProfilePermissions);

export function EmployeeModal({ isOpen, onClose, employee, companyId, onRefresh }: EmployeeModalProps) {
  const [loading, setLoading] = useState(false);
  const { profile: currentProfile } = useProfile();
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: 'funcionario' as UserRole,
    cargo: '',
    status: 'active' as 'active' | 'inactive',
    observations: '',
    permissions: DEFAULT_PERMISSIONS
  });

  useEffect(() => {
    if (employee) {
      const employeePerms = employee.permissions || DEFAULT_PERMISSIONS;
      const obs = (employee as any).observations || (employeePerms as any).observations || '';
      
      setFormData({
        full_name: employee.full_name || '',
        email: employee.email || '',
        phone: employee.phone || '',
        role: employee.role,
        cargo: employee.cargo || '',
        status: employee.status || 'active',
        observations: obs,
        permissions: employeePerms
      });
    } else {
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        role: 'funcionario',
        cargo: '',
        status: 'active',
        observations: '',
        permissions: DEFAULT_PERMISSIONS
      });
    }
  }, [employee, isOpen]);

  const handleRoleChange = (newRole: UserRole) => {
    const newPermissions = { ...formData.permissions };
    
    // Reset all
    SCREENS.forEach(screen => {
      newPermissions[screen.id] = { view: false, create: false, edit: false, delete: false };
    });

    if (newRole === 'admin' || newRole === 'chefe') {
      SCREENS.forEach(screen => {
        newPermissions[screen.id] = { view: true, create: true, edit: true, delete: true };
      });
    } else if (newRole === 'recepcao' || newRole === 'receptionist') {
      newPermissions['agenda'] = { view: true, create: true, edit: true, delete: false };
      newPermissions['clients'] = { view: true, create: true, edit: true, delete: false };
      newPermissions['anamnese'] = { view: true, create: true, edit: true, delete: false };
    } else if (newRole === 'professional') {
      newPermissions['agenda'] = { view: true, create: true, edit: true, delete: false };
      newPermissions['clients'] = { view: true, create: true, edit: true, delete: false };
      newPermissions['anamnese'] = { view: true, create: true, edit: true, delete: false };
    } else if (newRole === 'financeiro') {
      newPermissions['finance'] = { view: true, create: true, edit: true, delete: false };
      newPermissions['reports'] = { view: true, create: false, edit: false, delete: false };
    } else {
      newPermissions['agenda'] = { view: true, create: false, edit: false, delete: false };
      newPermissions['clients'] = { view: true, create: false, edit: false, delete: false };
    }

    setFormData({
      ...formData,
      role: newRole,
      permissions: newPermissions
    });
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      if (!formData.full_name || !formData.email) {
        showToast.error('Preencha os campos obrigatórios');
        return;
      }

      const url = employee 
        ? `/api/admin/employees/${employee.id}` 
        : `/api/admin/employees`;

      const response = await fetch(url, {
        method: employee ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          cargo: formData.cargo,
          role: formData.role,
          status: formData.status,
          observations: formData.observations,
          permissions: formData.permissions
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao processar requisição');
      }

      showToast.success(employee ? 'Funcionário atualizado com sucesso' : 'Convite enviado com sucesso');
      onRefresh();
      onClose();
    } catch (err: any) {
      showToast.error('Erro ao salvar', err.message);
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (screenId: string, action: 'view' | 'create' | 'edit' | 'delete') => {
    const newPermissions = { ...formData.permissions };
    if (!newPermissions[screenId]) {
      newPermissions[screenId] = { view: false, create: false, edit: false, delete: false };
    }
    
    newPermissions[screenId][action] = !newPermissions[screenId][action];
    
    // Se desativar 'view', desativa tudo
    if (action === 'view' && !newPermissions[screenId][action]) {
      newPermissions[screenId] = { view: false, create: false, edit: false, delete: false };
    }
    // Se ativar qualquer outro, ativa 'view'
    if (action !== 'view' && newPermissions[screenId][action]) {
      newPermissions[screenId].view = true;
    }

    setFormData({ ...formData, permissions: newPermissions });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden p-0 bg-white border-slate-100 rounded-[32px] shadow-2xl flex flex-col">
        <DialogHeader className="p-8 pb-4 border-b border-slate-50">
          <div className="flex items-center gap-4">
            <div className={cn(
              "p-3 rounded-2xl",
              employee ? "bg-slate-100 text-slate-900" : "bg-slate-900 text-white"
            )}>
              {employee ? <Shield className="h-6 w-6" /> : <User className="h-6 w-6" />}
            </div>
            <div>
              <DialogTitle className="text-xl font-black text-slate-900 tracking-tight">
                {employee ? 'Editar Funcionário' : 'Novo Funcionário'}
              </DialogTitle>
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em] mt-1">Controle de acesso e segurança</p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
          {/* Basic Info Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
               <Badge className="bg-slate-50 text-slate-400 border-slate-100 rounded-full px-3 py-1 font-black text-[9px] uppercase tracking-widest">Informações Básicas</Badge>
               <div className="h-px flex-1 bg-slate-50" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Nome Completo</Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                  <Input 
                    placeholder="Nome do funcionário" 
                    className="pl-11 h-12 rounded-2xl border-slate-100 focus:ring-slate-900/5 transition-all"
                    value={formData.full_name}
                    onChange={e => setFormData({...formData, full_name: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">E-mail Corporativo</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                  <Input 
                    type="email"
                    placeholder="email@clinica.com" 
                    className="pl-11 h-12 rounded-2xl border-slate-100 focus:ring-slate-900/5 transition-all"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    disabled={!!employee}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Telefone</Label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                  <Input 
                    placeholder="(99) 99999-9999" 
                    className="pl-11 h-12 rounded-2xl border-slate-100 focus:ring-slate-900/5 transition-all"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Cargo / Especialidade</Label>
                <div className="relative">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                  <Input 
                    placeholder="Ex: Recepcionista, Gestor..." 
                    className="pl-11 h-12 rounded-2xl border-slate-100 focus:ring-slate-900/5 transition-all"
                    value={formData.cargo}
                    onChange={e => setFormData({...formData, cargo: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Nível de Acesso</Label>
                <Select value={formData.role} onValueChange={(v: any) => handleRoleChange(v)}>
                  <SelectTrigger className="h-12 rounded-2xl border-slate-100 focus:ring-slate-900/5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-100 shadow-xl">
                    <SelectItem value="admin">Administrador (Acesso Total)</SelectItem>
                    <SelectItem value="chefe">Chefe / Sócio (Acesso Total)</SelectItem>
                    <SelectItem value="funcionario">Funcionário Comum</SelectItem>
                    <SelectItem value="recepcao">Recepção / Recepcionista</SelectItem>
                    <SelectItem value="financeiro">Financeiro</SelectItem>
                    <SelectItem value="professional">Profissional de Saúde</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Observações</Label>
                <div className="relative">
                  <FileText className="absolute left-4 top-3.5 h-4 w-4 text-slate-300" />
                  <textarea 
                    placeholder="Notas administrativas adicionais..." 
                    className="pl-11 pt-3 w-full min-h-[80px] rounded-2xl border border-slate-100 focus:ring-2 focus:ring-slate-900/5 transition-all text-sm outline-none resize-y"
                    value={formData.observations}
                    onChange={e => setFormData({...formData, observations: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Permissions Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
               <Badge className="bg-slate-900 text-white border-transparent rounded-full px-3 py-1 font-black text-[9px] uppercase tracking-widest">Controle de Permissões</Badge>
               <div className="h-px flex-1 bg-slate-50" />
            </div>

            <div className="bg-slate-50/50 rounded-[32px] border border-slate-100 overflow-x-auto">
               <table className="w-full text-left">
                  <thead>
                     <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Módulo / Tela</th>
                        <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Ver</th>
                        <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Criar</th>
                        <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Editar</th>
                        <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Excluir</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {SCREENS.map(screen => {
                        const perms = formData.permissions[screen.id] || { view: false, create: false, edit: false, delete: false };
                        return (
                           <tr key={screen.id} className="hover:bg-white transition-colors group">
                              <td className="px-6 py-4">
                                 <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900 transition-colors">{screen.label}</span>
                              </td>
                              <td className="px-4 py-4 text-center">
                                 <Switch 
                                    checked={perms.view} 
                                    onCheckedChange={() => togglePermission(screen.id, 'view')}
                                    className="data-[state=checked]:bg-emerald-500 scale-90"
                                 />
                              </td>
                              <td className="px-4 py-4 text-center">
                                 <Switch 
                                    checked={perms.create} 
                                    onCheckedChange={() => togglePermission(screen.id, 'create')}
                                    className="data-[state=checked]:bg-slate-900 scale-90"
                                    disabled={!perms.view}
                                 />
                              </td>
                              <td className="px-4 py-4 text-center">
                                 <Switch 
                                    checked={perms.edit} 
                                    onCheckedChange={() => togglePermission(screen.id, 'edit')}
                                    className="data-[state=checked]:bg-slate-900 scale-90"
                                    disabled={!perms.view}
                                 />
                              </td>
                              <td className="px-4 py-4 text-center">
                                 <Switch 
                                    checked={perms.delete} 
                                    onCheckedChange={() => togglePermission(screen.id, 'delete')}
                                    className="data-[state=checked]:bg-rose-500 scale-90"
                                    disabled={!perms.view}
                                 />
                              </td>
                           </tr>
                        );
                     })}
                  </tbody>
               </table>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3">
               <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0" />
               <p className="text-xs text-amber-700 font-medium leading-relaxed">
                  Permissões de <strong>Administrador</strong> e <strong>Chefe</strong> ignoram estas configurações e possuem acesso total ao sistema por motivos de segurança.
               </p>
            </div>
          </div>

          {/* Account Status */}
          <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100">
             <div>
                <Label className="text-sm font-black text-slate-900">Status da Conta</Label>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Funcionário ativo ou inativo</p>
             </div>
             <Switch 
                checked={formData.status === 'active'} 
                onCheckedChange={v => setFormData({...formData, status: v ? 'active' : 'inactive'})}
                className="data-[state=checked]:bg-emerald-500"
             />
          </div>
        </div>

        <DialogFooter className="p-8 border-t border-slate-50 bg-slate-50/30">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="rounded-xl border-slate-200 font-bold px-8 h-12"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSave}
            disabled={loading}
            className="bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest text-[10px] px-8 h-12 hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : employee ? 'Salvar Alterações' : 'Criar Funcionário'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
