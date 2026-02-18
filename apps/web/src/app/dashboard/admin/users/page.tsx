'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase-browser';
import { Button, Badge, Card, CardContent } from '@projeto/ui';
import { CheckCircle2, XCircle, Search, ShieldAlert, Loader2 } from 'lucide-react';

interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  approved: boolean;
  company_name?: string; // If we join with companies, but for now simple
  created_at: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const supabase = createBrowserClient();

  const fetchUsers = async () => {
    setLoading(true);
    // Fetch all profiles. RLS Policy "Admins can view all profiles" must be active.
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleApproval = async (id: string, currentStatus: boolean) => {
    setActionLoading(id);
    const newStatus = !currentStatus;

    const { error } = await supabase
      .from('profiles')
      .update({ approved: newStatus })
      .eq('id', id);

    if (error) {
      console.error('Error updating profile:', error);
      alert('Erro ao atualizar usuário');
    } else {
      // Optimistic update
      setUsers(prev => prev.map(u => u.id === id ? { ...u, approved: newStatus } : u));
    }
    setActionLoading(null);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-[#2C2825]">Gerenciamento de Usuários</h1>
        <p className="text-[#8A847C]">Aprovação e controle de acesso ao sistema.</p>
      </div>

      <div className="grid gap-6">
        {users.length === 0 ? (
           <Card className="bg-white border-dashed border-2 border-neutral-200">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center text-neutral-500">
                 <ShieldAlert className="h-12 w-12 mb-4 opacity-50" />
                 <p>Nenhum usuário encontrado.</p>
              </CardContent>
           </Card>
        ) : (
           users.map((user) => (
            <Card key={user.id} className="overflow-hidden transition-all hover:shadow-md border-[#E5E0D8]">
              <div className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${user.approved ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {user.full_name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-[#2C2825]">{user.full_name || 'Sem nome'}</h3>
                    <div className="flex items-center gap-2 text-sm text-[#8A847C]">
                      <span>{user.email}</span>
                      <span className="w-1 h-1 bg-neutral-300 rounded-full" />
                      <span className="capitalize">{user.role}</span>
                    </div>
                    <div className="mt-2 text-xs text-neutral-400">
                       Cadastrado em: {new Date(user.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                  <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${user.approved ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                    {user.approved ? 'Aprovado' : 'Pendente'}
                  </div>

                  {/* Don't let admin block themselves ideally, but purely purely logic here */}
                  <Button
                    onClick={() => toggleApproval(user.id, user.approved)}
                    disabled={actionLoading === user.id}
                    className={`min-w-[140px] ${user.approved 
                      ? 'bg-white border border-red-200 text-red-600 hover:bg-red-50' 
                      : 'bg-[#D4AF37] hover:bg-[#B5952F] text-white shadow-md shadow-[#D4AF37]/20'
                    }`}
                  >
                    {actionLoading === user.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : user.approved ? (
                      <>
                        <XCircle className="h-4 w-4 mr-2" />
                        Bloquear Acesso
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Aprovar Acesso
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
