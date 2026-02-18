'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, Button } from '@projeto/ui';
import { CheckCircle2, XCircle, Calendar, Clock } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase-browser';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ConfirmAppointmentPage({ params }: { params: { token: string } }) {
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [appointment, setAppointment] = useState<any>(null);

  useEffect(() => {
    confirm();
  }, [params.token]);

  async function confirm() {
    try {
      const res = await fetch('/api/appointments/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: params.token })
      });
      
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Erro ao confirmar');

      setAppointment(data.appointment);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return (
     <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7]">
        <span className="animate-pulse text-[#D4AF37] font-bold">Verificando...</span>
     </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] p-4 font-sans">
       <Card className="w-full max-w-md bg-white border-[#E5E0D8] shadow-2xl rounded-3xl overflow-hidden">
          <CardContent className="p-8 text-center space-y-6">
             {success ? (
                <>
                   <div className="mx-auto w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 animate-scale-in">
                      <CheckCircle2 className="h-10 w-10" />
                   </div>
                   <h1 className="text-2xl font-bold text-[#2C2825]">Presença Confirmada!</h1>
                   <p className="text-[#5C5855]">Obrigado por confirmar seu agendamento.</p>
                   
                   {appointment && (
                      <div className="bg-[#FAF9F6] border border-[#E5E0D8] rounded-2xl p-4 text-left space-y-3">
                         <div className="flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-[#D4AF37]" />
                            <div>
                               <p className="text-xs text-[#8A847C] font-bold uppercase">Data</p>
                               <p className="text-[#2C2825] font-medium capitalize">
                                  {format(new Date(appointment.start_time), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                               </p>
                            </div>
                         </div>
                         <div className="flex items-center gap-3">
                            <Clock className="h-5 w-5 text-[#D4AF37]" />
                            <div>
                               <p className="text-xs text-[#8A847C] font-bold uppercase">Horário</p>
                               <p className="text-[#2C2825] font-medium">
                                  {format(new Date(appointment.start_time), "HH:mm")}
                               </p>
                            </div>
                         </div>
                      </div>
                   )}
                </>
             ) : (
                <>
                   <div className="mx-auto w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-500">
                      <XCircle className="h-10 w-10" />
                   </div>
                   <h1 className="text-2xl font-bold text-[#2C2825]">Erro na Confirmação</h1>
                   <p className="text-neutral-500">{error}</p>
                </>
             )}
          </CardContent>
       </Card>
    </div>
  );
}
