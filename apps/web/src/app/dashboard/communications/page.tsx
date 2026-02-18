'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase-browser';
import { useProfile } from '@/providers/profile-provider';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '@projeto/ui'; // Check imports
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Mail, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

export default function CommunicationsPage() {
  const { profile } = useProfile();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.company_id) {
       fetchLogs();
    }
  }, [profile]);

  async function fetchLogs() {
     setLoading(true);
     const supabase = createBrowserClient();
     if (!profile?.company_id) return;

     const { data, error } = await supabase
       .from('email_logs')
       .select('*')
       .eq('company_id', profile.company_id)
       .order('created_at', { ascending: false })
       .limit(50);
     
     if (data) {
        setLogs(data);
     }
     setLoading(false);
  }

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
          <div>
             <h1 className="text-2xl font-bold text-[#2C2825]">Comunicações</h1>
             <p className="text-sm text-[#5C5855]">Histórico de emails enviados pelo sistema.</p>
          </div>
          <Button variant="outline" onClick={fetchLogs} disabled={loading}>
             <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
             Atualizar
          </Button>
       </div>

       <Card className="border-[#E5E0D8] shadow-sm">
          <CardContent className="p-0">
             <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                   <thead className="bg-[#FAF9F6] text-[#8A847C] font-bold uppercase text-xs">
                      <tr>
                         <th className="px-6 py-3">Data</th>
                         <th className="px-6 py-3">Tipo</th>
                         <th className="px-6 py-3">Destinatário</th>
                         <th className="px-6 py-3">Status</th>
                         <th className="px-6 py-3">Detalhes</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-[#E5E0D8]">
                      {logs.length === 0 ? (
                         <tr>
                            <td colSpan={5} className="px-6 py-8 text-center text-neutral-400">
                               Nenhum registro encontrado.
                            </td>
                         </tr>
                      ) : (
                         logs.map(log => (
                            <tr key={log.id} className="hover:bg-[#FAF9F6]/50">
                               <td className="px-6 py-4 whitespace-nowrap text-[#5C5855]">
                                  {format(new Date(log.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                               </td>
                               <td className="px-6 py-4">
                                  <Badge variant="outline" className="capitalize bg-white">
                                     {translateType(log.type)}
                                  </Badge>
                               </td>
                               <td className="px-6 py-4 font-medium text-[#2C2825]">
                                  {log.recipient_email}
                               </td>
                               <td className="px-6 py-4">
                                  {log.status === 'sent' ? (
                                     <div className="flex items-center text-emerald-600 gap-1.5 font-bold text-xs">
                                        <CheckCircle className="h-4 w-4" /> Enviado
                                     </div>
                                  ) : (
                                     <div className="flex items-center text-red-500 gap-1.5 font-bold text-xs" title={log.error_message}>
                                        <XCircle className="h-4 w-4" /> Falha
                                     </div>
                                  )}
                               </td>
                               <td className="px-6 py-4 text-[#8A847C] text-xs max-w-[200px] truncate">
                                  {log.error_message || '-'}
                               </td>
                            </tr>
                         ))
                      )}
                   </tbody>
                </table>
             </div>
          </CardContent>
       </Card>
    </div>
  );
}

function translateType(type: string) {
   switch (type) {
      case 'confirmation': return 'Confirmação';
      case 'reminder': return 'Lembrete';
      case 'review': return 'Avaliação';
      case 'cancellation': return 'Cancelamento';
      default: return type;
   }
}
