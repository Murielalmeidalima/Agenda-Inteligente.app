import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail, emailTemplates } from '@/services/email-service';
import { createNotification } from '@/services/notification-service';

export const dynamic = 'force-dynamic'; // Ensure it runs on every request

export async function GET(request: Request) {
  // Security: valid API key for cron service (e.g. Vercel Cron)
  // const authHeader = request.headers.get('authorization');
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return new Response('Unauthorized', { status: 401 });
  // }
  // Allowing public for now or assume internal/protected by header elsewhere

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
     // 1. Find appointments tomorrow (start_time between 24h from now)
     // Logic: Start time > now + 23h AND < now + 25h? 
     // Or just check all future appointments where reminder_sent = false and start_time < now + 24h
     
     const now = new Date();
     const tomorrow = new Date(now);
     tomorrow.setDate(tomorrow.getDate() + 1);
     tomorrow.setHours(23, 59, 59, 999); // Up to end of tomorrow

     const limitDate = tomorrow.toISOString();

     const { data: appointments, error } = await supabaseAdmin
       .from('appointments')
       .select(`
          id, 
          start_time, 
          company_id,
          reminder_sent,
          clients(full_name, email), 
          procedures(name),
          companies(name)
       `)
       .eq('reminder_sent', false)
       .eq('status', 'confirmed') // Only remind confirmed? Or scheduled too?
       .lte('start_time', limitDate)
       .gte('start_time', now.toISOString());

     if (error) throw error;

     const results = [];

     for (const app of appointments || []) {
        // Safe access to client email and name
        const client = Array.isArray(app.clients) ? app.clients[0] : (app.clients as any);
        const company = Array.isArray(app.companies) ? app.companies[0] : (app.companies as any);
        
        if (!client?.email) continue;

        const dateStr = new Date(app.start_time).toLocaleDateString('pt-BR');
        const timeStr = new Date(app.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const link = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`; 

        const sent = await sendEmail({
           to: client.email,
           subject: `Lembrete: Atendimento Amanhã - ${company?.name}`,
           html: emailTemplates.reminder(client.full_name, dateStr, timeStr, link),
           appointmentId: app.id,
           companyId: app.company_id,
           type: 'reminder'
        });

        if (sent.success) {
           await supabaseAdmin
             .from('appointments')
             .update({ reminder_sent: true })
             .eq('id', app.id);
             
           results.push({ id: app.id, status: 'sent' });
        } else {
           results.push({ id: app.id, status: 'failed', error: sent.error });
        }
     }

     return NextResponse.json({ success: true, processed: results.length, results });

  } catch (error: any) {
    console.error('Cron Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
