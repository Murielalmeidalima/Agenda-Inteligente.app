'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit2, 
  Trash2, 
  Shield, 
  CheckCircle2, 
  XCircle,
  Loader2,
  Mail,
  Calendar,
  Briefcase,
  ArrowLeft
} from 'lucide-react';
import { 
  Button, 
  Input, 
  Badge,
  cn
} from '@projeto/ui';
import { createBrowserClient } from '@/lib/supabase-browser';
import { showToast } from '@/lib/toast-helpers';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { EmployeeModal } from './EmployeeModal';
import { Profile } from '@/types/database';
import { useRouter } from 'next/navigation';

interface EmployeeManagementClientProps {
  companyId: string;
}

export function EmployeeManagementClient({ companyId }: EmployeeManagementClientProps) {
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Profile | null>(null);
  const router = useRouter();
  
  const supabase = createBrowserClient();

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('company_id', companyId)
        .order('full_name', { ascending: true });

      if (error) throw error;
      setEmployees(data || []);
    } catch (err: any) {
      showToast.error('Erro ao carregar funcionários', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [companyId]);

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este funcionário? O acesso será revogado imediatamente.')) return;

    try {
      // Nota: Em um sistema real, a exclusão de auth.users deve ser feita via Admin API ou Edge Function.
      // Aqui vamos apenas inativar o perfil ou excluir se permitido.
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'inactive' })
        .eq('id', id);

      if (error) throw error;
      
      showToast.success('Funcionário inativado com sucesso');
      fetchEmployees();
    } catch (err: any) {
      showToast.error('Erro ao excluir', err.message);
    }
  };

  const filteredEmployees = employees.filter(emp => 
    emp.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.cargo?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadge = (role: string) => {
    const roles: Record<string, { label: string, color: string }> = {
      admin: { label: 'Administrador', color: 'bg-slate-900 text-white' },
      chefe: { label: 'Chefe', color: 'bg-red-600 text-white' },
      funcionario: { label: 'Funcionário', color: 'bg-blue-100 text-blue-700' },
      recepcao: { label: 'Recepção', color: 'bg-emerald-100 text-emerald-700' },
      financeiro: { label: 'Financeiro', color: 'bg-amber-100 text-amber-700' },
      professional: { label: 'Profissional', color: 'bg-slate-100 text-slate-700' },
      receptionist: { label: 'Recepcionista', color: 'bg-emerald-100 text-emerald-700' }
    };

    const r = roles[role] || { label: role, color: 'bg-slate-100 text-slate-700' };
    return <Badge className={cn("rounded-lg px-2 py-0.5 font-bold uppercase text-[9px] tracking-widest", r.color)}>{r.label}</Badge>;
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button 
            onClick={() => router.push('/dashboard/settings')}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors mb-6 group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Voltar para Configurações</span>
          </button>

          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-slate-900 rounded-xl">
              <Users className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Equipe & Permissões</h1>
          </div>
          <p className="text-sm text-slate-500 font-medium">Gerencie o acesso e as permissões dos seus funcionários</p>
        </div>

        <Button 
          onClick={() => {
            setSelectedEmployee(null);
            setIsModalOpen(true);
          }}
          className="bg-slate-900 text-white rounded-2xl h-12 px-6 font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Novo Funcionário
        </Button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
          <Input 
            placeholder="Buscar por nome, email ou cargo..." 
            className="pl-11 h-12 bg-white border-slate-100 rounded-2xl focus:ring-slate-900/10 transition-all shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" className="h-12 rounded-2xl border-slate-100 px-6 font-bold bg-white shadow-sm">
          <Filter className="h-4 w-4 mr-2 text-slate-400" />
          Filtros
        </Button>
      </div>

      {/* Employees Grid/List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
          <p className="text-sm text-slate-400 font-medium animate-pulse">Carregando equipe...</p>
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-100 rounded-[32px] p-20 text-center flex flex-col items-center gap-4">
          <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center">
            <Users className="h-10 w-10 text-slate-200" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">Nenhum funcionário encontrado</h3>
            <p className="text-sm text-slate-400 font-medium">Comece adicionando seu primeiro membro da equipe</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setIsModalOpen(true)}
            className="rounded-xl mt-2 border-slate-200"
          >
            Adicionar Agora
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
          {filteredEmployees.map((employee) => (
            <div 
              key={employee.id} 
              className="bg-white border border-slate-100 rounded-[32px] p-6 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-100 transition-all duration-500 group relative overflow-hidden"
            >
              {/* Status Indicator */}
              <div className={cn(
                "absolute top-6 right-6 h-2 w-2 rounded-full",
                employee.status === 'active' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-slate-300"
              )} />

              <div className="flex gap-5">
                {/* Avatar Placeholder */}
                <div className="h-16 w-16 rounded-2xl bg-slate-50 flex items-center justify-center text-xl font-black text-slate-300 group-hover:bg-slate-900 group-hover:text-white transition-all duration-500 shadow-inner">
                  {employee.full_name?.charAt(0)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-black text-slate-900 truncate tracking-tight">{employee.full_name}</h3>
                    {getRoleBadge(employee.role)}
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400 mb-4">
                    <Briefcase className="h-3 w-3" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{employee.cargo || 'Cargo não definido'}</span>
                  </div>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Email</p>
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <Mail className="h-3 w-3 text-slate-300" />
                    <span className="text-xs font-bold truncate">{employee.email}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Último Acesso</p>
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <Calendar className="h-3 w-3 text-slate-300" />
                    <span className="text-xs font-bold">
                      {employee.last_access 
                        ? format(new Date(employee.last_access), 'dd/MM HH:mm') 
                        : 'Nunca'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Authorized By Footer */}
              <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                <div>
                   <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Autorizado por</p>
                   <p className="text-[10px] font-bold text-slate-900">{employee.authorized_by_name || 'Sistema'}</p>
                </div>

                <div className="flex gap-2">
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={() => {
                      setSelectedEmployee(employee);
                      setIsModalOpen(true);
                    }}
                    className="h-9 w-9 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-50"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={() => handleDelete(employee.id)}
                    className="h-9 w-9 rounded-xl text-slate-300 hover:text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <EmployeeModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        employee={selectedEmployee}
        companyId={companyId}
        onRefresh={fetchEmployees}
      />
    </div>
  );
}
