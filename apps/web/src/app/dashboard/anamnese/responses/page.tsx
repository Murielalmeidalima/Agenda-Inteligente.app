'use client';

import { useState, useEffect } from 'react';
import { Button, Card, CardContent, Input, Badge } from '@projeto/ui';
import { Search, Eye, FileText, Calendar, User, Smartphone } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase-browser';
import { useProfile } from '@/providers/profile-provider';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

export default function AnamneseResponsesPage() {
  const { profile } = useProfile();
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (profile?.company_id) fetchResponses();
  }, [profile]);

  async function fetchResponses() {
    try {
      const supabase = createBrowserClient();
      const { data, error } = await supabase
        .from('anamnese_responses')
        .select(`
          *,
          anamnese_templates (name),
          clients (full_name, phone)
        `)
        .eq('company_id', profile?.company_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResponses(data || []);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar respostas');
    } finally {
      setLoading(false);
    }
  }

  const filteredResponses = responses.filter(r => 
    r.clients?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.anamnese_templates?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed_client':
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Respondido pelo Cliente</Badge>;
      case 'completed_internal':
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Preenchido Internamente</Badge>;
      default:
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Pendente</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-3xl font-black text-[#2C2825] tracking-tight">Respostas de Anamnese</h1>
           <p className="text-[#8A847C] text-[10px] uppercase font-black tracking-widest mt-1">Gerencie as fichas preenchidas</p>
        </div>
        <div className="w-full md:w-72 relative">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A847C]" />
           <Input 
             placeholder="Buscar paciente ou ficha..." 
             className="pl-10 bg-[#020617] border-neutral-800 text-[#2C2825] rounded-xl"
             value={searchTerm}
             onChange={e => setSearchTerm(e.target.value)}
           />
        </div>
      </div>

      <div className="grid gap-4">
        {filteredResponses.map(r => (
          <Card key={r.id} className="bg-white border-[#E5E0D8] rounded-2xl hover:bg-[#0f172a]/50 transition-colors group">
            <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
               <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-[#FAF9F6] text-[#8A847C]">
                     <User className="h-6 w-6" />
                  </div>
                  <div>
                     <h3 className="text-[#2C2825] font-bold text-lg">{r.clients?.full_name || 'Cliente Desconhecido'}</h3>
                     <div className="flex items-center gap-2 text-neutral-400 text-sm">
                        <FileText className="h-3 w-3" />
                        <span>{r.anamnese_templates?.name}</span>
                        <span className="text-neutral-600">•</span>
                        <Calendar className="h-3 w-3" />
                        <span>{format(new Date(r.created_at), "dd 'de' MMM, HH:mm", { locale: ptBR })}</span>
                     </div>
                  </div>
               </div>

               <div className="flex items-center gap-4 w-full md:w-auto mt-2 md:mt-0">
                  {getStatusBadge(r.status)}
                  
                  <Link href={`/dashboard/anamnese/responses/${r.id}`} className="ml-auto">
                     <Button variant="outline" size="sm" className="border-[#E5E0D8] text-[#5C5855] hover:text-[#2C2825] hover:bg-[#FAF9F6] rounded-lg">
                        <Eye className="mr-2 h-4 w-4" />
                        Ver Detalhes
                     </Button>
                  </Link>
               </div>
            </CardContent>
          </Card>
        ))}

        {filteredResponses.length === 0 && !loading && (
           <div className="text-center py-20 text-neutral-500 border border-dashed border-neutral-800 rounded-3xl">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Nenhuma resposta encontrada.</p>
           </div>
        )}
      </div>
    </div>
  );
}
