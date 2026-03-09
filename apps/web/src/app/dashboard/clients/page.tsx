'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase-browser';
import { 
  Button, 
  Input, 
  Card, 
  CardContent, 
  Badge, 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell,
  Avatar,
  AvatarFallback,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  cn,
  toast
} from '@projeto/ui';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  MoreVertical, 
  ChevronRight,
  Phone,
  Mail,
  Instagram,
  Calendar,
  AlertCircle
} from 'lucide-react';

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  async function handleDelete() {
    if (!clientToDelete) return;
    
    setIsDeleting(true);
    try {
      const supabase = createBrowserClient();
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientToDelete.id);

      if (error) throw error;

      setClients(clients.filter(c => c.id !== clientToDelete.id));
      setDeleteDialogOpen(false);
      setClientToDelete(null);
      toast.success('Cliente excluído com sucesso');
    } catch (err: any) {
      console.error('Error deleting client:', err);
      toast.error('Erro ao excluir cliente');
    } finally {
      setIsDeleting(false);
    }
  }

  async function fetchClients() {
    try {
      const supabase = createBrowserClient();

      // Passo 1: buscar o company_id do usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (profileError || !profile?.company_id) throw new Error('Perfil não encontrado');

      // Passo 2: buscar apenas clientes da empresa do usuário
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('company_id', profile.company_id) // ← isolamento por tenant
        .order('full_name', { ascending: true });

      if (error) throw error;
      setClients(data || []);
    } catch (err: any) {
      console.error('Error fetching clients:', err);
      toast.error('Erro ao carregar clientes', {
        description: err.message || 'Verifique sua conexão e tente novamente.'
      });
    } finally {
      setLoading(false);
    }
  }


  const filteredClients = clients.filter(client => 
    client.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone?.includes(searchTerm)
  );

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-950 rounded-2xl shadow-lg border border-amber-900/50">
            <Users className="h-8 w-8 text-amber-500" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-[#2C2825] tracking-tight font-serif">
              Gestão de Clientes
            </h1>
            <p className="text-[#8A847C] mt-1 text-sm font-medium">Gerencie sua base de pacientes e visualize históricos completos.</p>
          </div>
        </div>
        
        <Link href="/dashboard/clients/new">
          <Button className="h-12 px-8 rounded-2xl shadow-xl shadow-amber-500/10 active:scale-[0.98] transition-all text-base bg-slate-900 border-none hover:bg-black text-white">
            <UserPlus className="h-5 w-5 mr-2" />
            Cadastrar Novo Cliente
          </Button>
        </Link>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row gap-4">
         <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#A8A49D] group-focus-within:text-[#D4AF37] transition-colors" />
            <Input 
              placeholder="Buscar por nome, e-mail ou telefone..." 
              className="bg-white border-[#E5E0D8] h-14 pl-12 rounded-2xl text-[#2C2825] placeholder:text-[#A8A49D] transition-all focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/5 shadow-sm hover:border-[#D4AF37]/30"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
         </div>
         <Button variant="outline" className="h-14 bg-white hover:bg-[#FAF9F6] border-[#E5E0D8] text-[#5C5855] hover:text-[#2C2825] rounded-2xl px-6 gap-2 shadow-sm hover:border-[#D4AF37]/30">
            <Filter className="h-5 w-5" />
            Filtros Avançados
         </Button>
      </div>

      {/* Clients Table Card */}
      <Card className="rounded-[24px] overflow-hidden border-[#E5E0D8] shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-[#FAF9F6] border-b border-[#E5E0D8]">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="text-[#8A847C] font-bold uppercase text-[11px] tracking-widest pl-8 py-6">Paciente</TableHead>
                <TableHead className="text-[#8A847C] font-bold uppercase text-[11px] tracking-widest py-6">Contato</TableHead>
                <TableHead className="text-[#8A847C] font-bold uppercase text-[11px] tracking-widest py-6">Status</TableHead>
                <TableHead className="text-[#8A847C] font-bold uppercase text-[11px] tracking-widest py-6">Última Visita</TableHead>
                <TableHead className="w-[80px] py-6"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                   <TableRow key={i} className="border-b border-[#E5E0D8]/50 animate-pulse">
                      <TableCell className="pl-8 py-6"><div className="h-10 w-40 bg-[#F0EBE0] rounded-xl" /></TableCell>
                      <TableCell><div className="h-10 w-32 bg-[#F0EBE0] rounded-xl" /></TableCell>
                      <TableCell><div className="h-6 w-16 bg-[#F0EBE0] rounded-full" /></TableCell>
                      <TableCell><div className="h-10 w-24 bg-[#F0EBE0] rounded-xl" /></TableCell>
                   </TableRow>
                ))
              ) : filteredClients.length === 0 ? (
                <TableRow>
                   <TableCell colSpan={5} className="py-24 text-center">
                      <div className="flex flex-col items-center gap-4 text-[#A8A49D]">
                         <div className="h-16 w-16 bg-[#FAF9F6] rounded-full flex items-center justify-center border border-[#E5E0D8]">
                            <Search className="h-8 w-8 opacity-20 text-[#2C2825]" />
                         </div>
                         <p className="text-lg font-medium text-[#5C5855]">Nenhum cliente encontrado.</p>
                      </div>
                   </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((client) => (
                  <TableRow key={client.id} className="border-b border-[#E5E0D8]/50 group hover:bg-[#FAF9F6] transition-colors">
                    <TableCell className="pl-8 py-5">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                           <AvatarFallback className="bg-[#FAF6E9] text-[#D4AF37] font-bold text-lg">
                              {client.full_name.charAt(0)}
                           </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-[#2C2825] text-base group-hover:text-[#D4AF37] transition-colors">{client.full_name}</p>
                          <p className="text-[11px] text-[#A8A49D] uppercase tracking-wider font-bold mt-1">
                             Criado em {new Date(client.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-sm text-[#5C5855]">
                           <Phone className="h-3.5 w-3.5 text-[#D4AF37]" /> {client.phone || '--'}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[#8A847C]">
                           <Mail className="h-3.5 w-3.5 text-[#D4AF37]" /> {client.email || '--'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide">
                        Ativo
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm text-[#2C2825] font-medium">--</span>
                        <span className="text-[10px] text-[#A8A49D]">Nenhum registro</span>
                      </div>
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                       <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="relative group/menu">
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-10 w-10 text-[#8A847C] hover:text-[#D4AF37] hover:bg-white rounded-xl border border-transparent hover:border-[#E5E0D8] shadow-none hover:shadow-sm"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                            
                            {/* Custom Action Menu */}
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-[#E5E0D8] rounded-2xl shadow-xl shadow-black/5 py-2 z-50 invisible group-focus-within/menu:visible opacity-0 group-focus-within/menu:opacity-100 transition-all transform origin-top-right">
                               <Link href={`/dashboard/clients/${client.id}`} className="flex items-center gap-3 px-4 py-2 text-sm text-[#5C5855] hover:bg-[#FAF9F6] hover:text-[#D4AF37] transition-colors">
                                  <ChevronRight className="h-4 w-4" /> Visualizar Perfil
                               </Link>
                               <Link href={`/dashboard/clients/${client.id}/edit`} className="flex items-center gap-3 px-4 py-2 text-sm text-[#5C5855] hover:bg-[#FAF9F6] hover:text-[#D4AF37] transition-colors">
                                  <Filter className="h-4 w-4" /> Editar Cadastro
                               </Link>
                               <button 
                                  onClick={() => {
                                    setClientToDelete(client);
                                    setDeleteDialogOpen(true);
                                  }}
                                  className="flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors w-full text-left"
                               >
                                  <AlertCircle className="h-4 w-4" /> Excluir Cliente
                               </button>
                            </div>
                          </div>
                       </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="rounded-3xl border-[#E5E0D8] bg-white max-w-md p-8">
          <DialogHeader className="space-y-4">
            <div className="h-14 w-14 bg-red-50 rounded-2xl flex items-center justify-center border border-red-100">
               <AlertCircle className="h-7 w-7 text-red-500" />
            </div>
            <DialogTitle className="text-2xl font-bold text-[#2C2825] font-serif">Confirmar Exclusão</DialogTitle>
            <DialogDescription className="text-[#8A847C] text-base leading-relaxed">
              Tem certeza que deseja excluir o cliente{' '}
              <strong className="text-[#2C2825]">{clientToDelete?.full_name}</strong>? Esta ação removerá todos os dados do paciente permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-8 flex gap-3">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="h-12 flex-1 rounded-xl border-[#E5E0D8] text-[#5C5855] hover:bg-[#FAF9F6] font-bold"
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDelete}
              className="h-12 flex-1 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold shadow-lg shadow-red-500/20 active:scale-[0.98] transition-all"
              loading={isDeleting}
              disabled={isDeleting}
            >
              Excluir Registro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <SummaryItem label="Total de Clientes" value={clients.length} icon={<Users className="text-[#D4AF37]" />} />
         <SummaryItem label="Ativos este mês" value="0" icon={<Calendar className="text-[#D4AF37]" />} />
         <SummaryItem label="Novos hoje" value="0" icon={<UserPlus className="text-emerald-500" />} />
         <SummaryItem label="Com Instagram" value={clients.filter(c => c.instagram).length} icon={<Instagram className="text-purple-500" />} />
      </div>
    </div>
  );
}

function SummaryItem({ label, value, icon }: any) {
   return (
      <Card className="bg-white border-[#E5E0D8] p-5 flex items-center justify-between group hover:border-[#D4AF37]/50 hover:shadow-md transition-all duration-300 rounded-[20px]">
         <div>
            <p className="text-[10px] font-bold text-[#A8A49D] uppercase tracking-widest mb-1.5">{label}</p>
            <h4 className="text-3xl font-black text-[#2C2825] font-serif">{value}</h4>
         </div>
         <div className="h-12 w-12 rounded-2xl bg-[#FAF9F6] border border-[#E5E0D8] flex items-center justify-center group-hover:scale-110 group-hover:border-[#D4AF37]/20 transition-all shadow-sm">
            {icon}
         </div>
      </Card>
   );
}
