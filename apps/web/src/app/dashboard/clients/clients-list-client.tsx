'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Input,
  Card,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@projeto/ui';
import { Plus, Search, Edit, Trash2, Eye, Mail, Phone } from 'lucide-react';
import Link from 'next/link';
import { Client } from '@/types/database';
import { createBrowserClient } from '@/lib/supabase-browser';

interface ClientsListClientProps {
  initialClients: Client[];
  companyId: string;
}

export default function ClientsListClient({ initialClients, companyId }: ClientsListClientProps) {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [futureWarning, setFutureWarning] = useState<{ count: number; message: string } | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/dashboard/clients?search=${encodeURIComponent(searchTerm)}`);
  };

  const handleDelete = async (confirmCancelFuture = false) => {
    if (!clientToDelete) return;
    
    setIsDeleting(true);
    try {
      const res = await fetch('/api/clients/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          clientId: clientToDelete.id,
          confirmCancelFuture 
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao excluir cliente.');

      if (data.requiresConfirmation) {
        setFutureWarning({
          count: data.futureAppointmentsCount,
          message: data.message
        });
        setIsDeleting(false);
        return;
      }

      // Atualizar lista local
      setClients(clients.filter(c => c.id !== clientToDelete.id));
      setDeleteDialogOpen(false);
      setClientToDelete(null);
      setFutureWarning(null);
      router.refresh();
    } catch (error: any) {
      console.error('Error deleting client:', error);
      alert('Erro ao excluir cliente: ' + (error.message || 'Erro de conexão'));
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatPhone = (phone: string | null) => {
    if (!phone) return '-';
    return phone;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-br from-[#FAF8F5] via-[#EFE5D3] to-[#DFD0B8] p-8 rounded-[2rem] shadow-lg border border-[#E5DBC7] shadow-slate-200/50 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/15 rounded-full blur-3xl -mr-32 -mt-32 transition-colors group-hover:bg-[#D4AF37]/25" />
        <div className="relative z-10">
          <h1 className="text-3xl font-black text-[#2C2825] tracking-tight font-serif">Clientes</h1>
          <p className="text-[#6A645C] mt-1 font-semibold text-sm uppercase tracking-widest">
            Gerencie e encante seus pacientes
          </p>
        </div>
        <Link href="/dashboard/clients/new" className="relative z-10 w-full sm:w-auto">
          <Button className="w-full sm:w-auto h-12 px-6 rounded-xl font-bold bg-[#D4AF37] hover:bg-[#b5952f] text-white shadow-lg shadow-[#D4AF37]/20 transition-transform active:scale-95">
            <Plus className="h-5 w-5 mr-2" />
            Novo Cliente
          </Button>
        </Link>
      </div>

      {/* Search */}
      <Card className="rounded-[2rem] border-[#E5E0D8] shadow-sm overflow-hidden bg-white">
        <form onSubmit={handleSearch} className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#8A847C]" />
              <Input
                placeholder="Buscar por nome, email ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 bg-[#FAF9F6] border-[#E5E0D8] rounded-xl focus:border-[#D4AF37] focus:ring-[#D4AF37]/20 transition-all font-medium text-[#2C2825]"
              />
            </div>
            <Button type="submit" variant="outline" className="h-12 px-8 rounded-xl font-bold border-[#E5E0D8] text-[#5C5855] hover:bg-[#FAF9F6]">
              Buscar
            </Button>
          </div>
        </form>
      </Card>

      {/* Table */}
      <Card className="rounded-[2rem] border-[#E5E0D8] shadow-sm bg-white overflow-hidden">
        {clients.length === 0 ? (
          <div className="p-16 text-center bg-[#FAF9F6]">
            <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-sm border border-[#E5E0D8]">
              <Search className="h-10 w-10 text-[#D4AF37]/40" />
            </div>
            <p className="text-[#2C2825] text-xl font-black mb-2">Nenhum cliente encontrado</p>
            <p className="text-[#8A847C] font-medium">
              Comece cadastrando seu primeiro cliente ou tente buscar por outro termo.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto hidden md:block">
          <Table>
            <TableHeader className="bg-[#FAF9F6]">
              <TableRow className="border-[#E5E0D8]">
                <TableHead className="font-black text-[#8A847C] uppercase tracking-widest text-[10px]">Paciente</TableHead>
                <TableHead className="font-black text-[#8A847C] uppercase tracking-widest text-[10px]">Contato</TableHead>
                <TableHead className="font-black text-[#8A847C] uppercase tracking-widest text-[10px]">Nascimento</TableHead>
                <TableHead className="font-black text-[#8A847C] uppercase tracking-widest text-[10px]">Cadastro</TableHead>
                <TableHead className="font-black text-[#8A847C] uppercase tracking-widest text-[10px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id} className="border-[#E5E0D8]/50 hover:bg-[#FAF9F6] transition-colors group">
                  <TableCell className="font-bold text-[#2C2825]">
                    {client.full_name}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1.5">
                      {client.email && (
                        <div className="flex items-center gap-2 text-sm text-[#5C5855] font-medium">
                          <Mail className="h-3.5 w-3.5 text-[#D4AF37]" />
                          {client.email}
                        </div>
                      )}
                      {client.phone && (
                        <div className="flex items-center gap-2 text-sm text-[#5C5855] font-medium">
                          <Phone className="h-3.5 w-3.5 text-[#D4AF37]" />
                          {formatPhone(client.phone)}
                        </div>
                      )}
                      {!client.email && !client.phone && (
                        <span className="text-sm text-[#8A847C] font-medium">Sem contato</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-[#5C5855]">{formatDate(client.birth_date)}</TableCell>
                  <TableCell className="font-medium text-[#5C5855]">{formatDate(client.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2 shrink-0">
                      <Link href={`/dashboard/clients/${client.id}`}>
                        <Button variant="outline" size="sm" className="h-10 px-3.5 rounded-xl border-blue-200 text-blue-600 bg-blue-50/50 hover:bg-blue-600 hover:text-white font-bold transition-all shadow-sm active:scale-95 text-xs flex items-center gap-1.5">
                          <Eye className="h-4 w-4" />
                          <span className="hidden xl:inline">Prontuário</span>
                        </Button>
                      </Link>
                      <Link href={`/dashboard/clients/${client.id}/edit`}>
                        <Button variant="outline" size="sm" className="h-10 px-3.5 rounded-xl border-[#E5E0D8] text-[#5C5855] bg-white hover:bg-[#D4AF37] hover:text-white font-bold transition-all shadow-sm active:scale-95 text-xs flex items-center gap-1.5">
                          <Edit className="h-4 w-4" />
                          <span className="hidden xl:inline">Editar</span>
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-10 px-3.5 rounded-xl border-red-200 text-red-600 bg-red-50/50 hover:bg-red-600 hover:text-white font-bold transition-all shadow-sm active:scale-95 text-xs flex items-center gap-1.5"
                        onClick={(e) => {
                          e.stopPropagation();
                          setClientToDelete(client);
                          setDeleteDialogOpen(true);
                        }}
                        onTouchEnd={(e) => {
                          e.stopPropagation();
                          setClientToDelete(client);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="hidden xl:inline">Excluir</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>

          {/* Mobile View */}
          <div className="md:hidden divide-y divide-[#F0EBE0]">
            {clients.map((client) => (
              <div key={client.id} className="p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-extrabold text-[#2C2825] text-base leading-snug">{client.full_name}</h3>
                    <div className="space-y-1.5 mt-2">
                      {client.email && (
                        <div className="flex items-center gap-2 text-xs text-[#5C5855] font-medium">
                          <Mail className="h-3.5 w-3.5 text-[#D4AF37]" />
                          {client.email}
                        </div>
                      )}
                      {client.phone && (
                        <div className="flex items-center gap-2 text-xs text-[#5C5855] font-medium">
                          <Phone className="h-3.5 w-3.5 text-[#D4AF37]" />
                          {formatPhone(client.phone)}
                        </div>
                      )}
                      {!client.email && !client.phone && (
                        <span className="text-xs text-[#8A847C] font-medium">Sem contato</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="bg-[#FAF9F6] p-2 rounded-xl border border-[#E5E0D8]/40">
                    <span className="text-[#8A847C] block text-[9px] uppercase font-bold tracking-wider">Nascimento</span>
                    <span className="font-bold text-[#5C5855]">{formatDate(client.birth_date)}</span>
                  </div>
                  <div className="bg-[#FAF9F6] p-2 rounded-xl border border-[#E5E0D8]/40">
                    <span className="text-[#8A847C] block text-[9px] uppercase font-bold tracking-wider">Cadastro</span>
                    <span className="font-bold text-[#5C5855]">{formatDate(client.created_at)}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Link href={`/dashboard/clients/${client.id}`} className="flex-1">
                    <Button variant="outline" className="w-full h-10 border-blue-100 text-blue-600 bg-blue-50/30 hover:bg-blue-600 hover:text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all">
                      <Eye className="h-4 w-4" />
                      Prontuário
                    </Button>
                  </Link>
                  <Link href={`/dashboard/clients/${client.id}/edit`} className="flex-1">
                    <Button variant="outline" className="w-full h-10 border-[#E5E0D8] text-[#5C5855] bg-white hover:bg-[#D4AF37] hover:text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all">
                      <Edit className="h-4 w-4" />
                      Editar
                    </Button>
                  </Link>
                  <Button 
                     variant="outline" 
                     className="h-10 border-red-100 text-red-600 bg-red-50/30 hover:bg-red-600 hover:text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all px-3 shrink-0"
                     onClick={() => {
                       setClientToDelete(client);
                       setDeleteDialogOpen(true);
                     }}
                  >
                     <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          </>
        )}
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={(open) => {
        setDeleteDialogOpen(open);
        if (!open) setFutureWarning(null);
      }}>
        <DialogContent className="rounded-3xl border-[#E5E0D8] bg-white max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#2C2825]">
              {futureWarning ? 'Aviso de Agendamentos Futuros' : 'Confirmar Exclusão'}
            </DialogTitle>
            <DialogDescription className="text-[#8A847C] text-sm mt-2">
              {futureWarning ? (
                <span>
                  Este cliente possui <strong>{futureWarning.count} agendamento(s) futuro(s)</strong>. Deseja realmente cancelar os agendamentos e excluir o cliente?
                </span>
              ) : (
                <span>
                  Tem certeza que deseja excluir o cliente <strong>{clientToDelete?.full_name}</strong>? Esta ação removerá o cadastro mantendo o histórico necessário.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex flex-col sm:flex-row gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setDeleteDialogOpen(false);
                setFutureWarning(null);
              }}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleDelete(!!futureWarning)}
              loading={isDeleting}
              disabled={isDeleting}
            >
              {futureWarning ? 'Excluir Cliente e Cancelar Agendamentos' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
