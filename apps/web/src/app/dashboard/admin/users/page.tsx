'use client';

import { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@/lib/supabase-browser';
import { Button, Badge, Card, CardContent } from '@projeto/ui';
import { CheckCircle2, XCircle, ShieldAlert, Loader2, Crown, Clock, Users } from 'lucide-react';

interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  approved: boolean;
  created_at: string;
  companies?: { name: string } | null;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const supabase = createBrowserClient();

  const fetchUsers = useCallback(async () => {
    setLoading(true);

    // Obter o ID do usuário logado para proteger o super admin
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);

    // Buscar todos os perfis com o nome da empresa
    const { data, error } = await supabase
      .from('profiles')
      .select('*, companies(name)')
      .order('approved', { ascending: true })  // Pendentes primeiro
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[ADMIN] Erro ao buscar usuários:', error.message);
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const toggleApproval = async (id: string, currentStatus: boolean, targetRole: string) => {
    // Proteger o super_admin de ser bloqueado acidentalmente
    if (targetRole === 'super_admin') {
      alert('O Super Admin não pode ter seu acesso alterado.');
      return;
    }
    // Não pode bloquear a si mesmo
    if (id === currentUserId) {
      alert('Você não pode bloquear o seu próprio acesso.');
      return;
    }

    setActionLoading(id);
    const newStatus = !currentStatus;

    const { error } = await supabase
      .from('profiles')
      .update({ approved: newStatus })
      .eq('id', id);

    if (error) {
      console.error('[ADMIN] Erro ao atualizar perfil:', error.message);
      alert('Erro ao atualizar usuário. Verifique as permissões RLS.');
    } else {
      console.log('[ADMIN] Acesso atualizado. Novo status:', newStatus ? 'aprovado' : 'bloqueado');
      setUsers(prev => prev.map(u => u.id === id ? { ...u, approved: newStatus } : u));
    }
    setActionLoading(null);
  };

  const pending = users.filter(u => !u.approved && u.role !== 'super_admin');
  const approved = users.filter(u => u.approved);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-[#2C2825]">Gerenciamento de Acessos</h1>
        <p className="text-[#8A847C]">Aprove ou bloqueie o acesso das clínicas cadastradas.</p>
      </div>

      {/* Contadores */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-center">
          <Clock className="h-6 w-6 text-amber-500 mx-auto mb-1" />
          <div className="text-2xl font-bold text-amber-700">{pending.length}</div>
          <div className="text-xs text-amber-600 font-medium uppercase tracking-wide">Pendentes</div>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center">
          <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto mb-1" />
          <div className="text-2xl font-bold text-emerald-700">{approved.length}</div>
          <div className="text-xs text-emerald-600 font-medium uppercase tracking-wide">Aprovados</div>
        </div>
        <div className="bg-[#F5F0E8] border border-[#E5E0D8] rounded-2xl p-4 text-center">
          <Users className="h-6 w-6 text-[#8A847C] mx-auto mb-1" />
          <div className="text-2xl font-bold text-[#2C2825]">{users.length}</div>
          <div className="text-xs text-[#8A847C] font-medium uppercase tracking-wide">Total</div>
        </div>
      </div>

      {/* Lista de usuários */}
      <div className="grid gap-4">
        {users.length === 0 ? (
          <Card className="bg-white border-dashed border-2 border-neutral-200">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center text-neutral-500">
              <ShieldAlert className="h-12 w-12 mb-4 opacity-50" />
              <p>Nenhum usuário encontrado.</p>
            </CardContent>
          </Card>
        ) : (
          users.map((user) => (
            <Card
              key={user.id}
              className={`overflow-hidden transition-all hover:shadow-md border-[#E5E0D8] ${
                !user.approved && user.role !== 'super_admin' ? 'border-l-4 border-l-amber-400' : ''
              }`}
            >
              <div className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center text-base font-bold shrink-0 ${
                    user.role === 'admin'
                      ? 'bg-[#D4AF37]/20 text-[#B5952F]'
                      : user.approved
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                  }`}>
                    {user.role === 'super_admin'
                      ? <Crown className="h-5 w-5" />
                      : (user.full_name?.charAt(0).toUpperCase() || '?')
                    }
                  </div>

                  {/* Info */}
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-[#2C2825]">{user.full_name || 'Sem nome'}</h3>
                      {user.role === 'super_admin' && (
                        <span className="text-[10px] bg-[#D4AF37]/15 text-[#B5952F] border border-[#D4AF37]/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                          Super Admin
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-[#8A847C] mt-0.5">{user.email}</div>
                    <div className="text-xs text-neutral-400 mt-1 flex items-center gap-2">
                      {user.companies?.name && (
                        <span className="font-medium text-[#5C5855]">🏥 {user.companies.name}</span>
                      )}
                      <span>·</span>
                      <span>Cadastro: {new Date(user.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                </div>

                {/* Status + Ação */}
                <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
                  <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    user.role === 'admin'
                      ? 'bg-[#D4AF37]/10 text-[#B5952F] border border-[#D4AF37]/20'
                      : user.approved
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                        : 'bg-amber-50 text-amber-600 border border-amber-100'
                  }`}>
                    {user.role === 'super_admin' ? 'Master' : user.approved ? 'Aprovado' : 'Pendente'}
                  </div>

                  {user.role !== 'super_admin' && (
                    <Button
                      onClick={() => toggleApproval(user.id, user.approved, user.role)}
                      disabled={actionLoading === user.id}
                      className={`min-w-[130px] font-bold ${user.approved
                        ? 'bg-white border border-red-200 text-red-600 hover:bg-red-50'
                        : 'bg-[#D4AF37] hover:bg-[#B5952F] text-white shadow-sm shadow-[#D4AF37]/20'
                      }`}
                    >
                      {actionLoading === user.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : user.approved ? (
                        <><XCircle className="h-4 w-4 mr-1.5" />Bloquear</>
                      ) : (
                        <><CheckCircle2 className="h-4 w-4 mr-1.5" />Aprovar</>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
