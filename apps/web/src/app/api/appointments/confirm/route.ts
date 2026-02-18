import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createNotification } from '@/services/notification-service';

export async function POST(request: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Token obrigatório' }, { status: 400 });
    }

    // 1. Find Appointment
    const { data: appointment, error: fetchError } = await supabaseAdmin
      .from('appointments')
      .select('id, company_id, client_id, start_time, status, clients(full_name)')
      .eq('confirmation_token', token)
      .single();

    if (fetchError || !appointment) {
      return NextResponse.json({ error: 'Agendamento não encontrado ou token inválido' }, { status: 404 });
    }

    // 2. Update Status
    if (appointment.status === 'scheduled' || appointment.status === 'pending') {
         const { error: updateError } = await supabaseAdmin
           .from('appointments')
           .update({ 
               status: 'confirmed', // Ensure this status exists in enum or use generic
           })
           .eq('id', appointment.id);

         if (updateError) throw updateError;
         
    // 3. Notify Company
         // Safe access to client name
         const clientName = (appointment.clients as any)?.full_name || 'Paciente';
         
         await createNotification({
            companyId: appointment.company_id,
            title: 'Agendamento Confirmado via Email',
            message: `O paciente ${clientName} confirmou presença para ${new Date(appointment.start_time).toLocaleString('pt-BR')}.`,
            type: 'confirmation',
            link: `/dashboard/schedule?date=${appointment.start_time.split('T')[0]}`
         });
    }

    const clientName = (appointment.clients as any)?.full_name || 'Paciente';

    return NextResponse.json({ 
        success: true, 
        appointment: {
            start_time: appointment.start_time,
            client_name: clientName
        }
    });

  } catch (error: any) {
    console.error('Confirm Error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
