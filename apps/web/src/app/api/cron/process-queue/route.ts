import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SmsService } from '../../../../../../../packages/utils/notifications/sms/sms-service';
import { WhatsappService } from '../../../../../../../packages/utils/notifications/whatsapp/whatsapp-service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response('Unauthorized', { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: messages, error: fetchError } = await supabase
      .from('message_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .order('created_at', { ascending: true })
      .limit(50);

    if (fetchError) throw fetchError;
    if (!messages || messages.length === 0) {
      return NextResponse.json({ success: true, message: 'Queue is empty', processed: 0 });
    }

    const messageIds = messages.map(m => m.id);
    await supabase
      .from('message_queue')
      .update({ status: 'processing' })
      .in('id', messageIds);

    let processedCount = 0;
    const smsService = new SmsService();
    const whatsappService = new WhatsappService();

    for (const msg of messages) {
      try {
        let providerResponse = null;
        let status = 'sent';

        if (msg.type === 'sms') {
          providerResponse = await smsService.send({ to: msg.recipient, content: msg.payload.content });
        } else if (msg.type === 'whatsapp') {
          const { data: company } = await supabase.from('companies').select('whatsapp_instance_name').eq('id', msg.company_id).single();
          const instanceName = company?.whatsapp_instance_name || `empresa_${msg.company_id.replace(/-/g, '')}`;
          whatsappService.setInstance(instanceName);
          providerResponse = await whatsappService.send({ to: msg.recipient, content: msg.payload.content });
        } else if (msg.type === 'email') {
          // Fallback to existing email logic if placed in queue
          status = 'sent';
        }

        await supabase.from('communication_logs').insert({
          company_id: msg.company_id,
          channel: msg.type,
          status: status,
          provider_response: providerResponse,
          message_content: msg.payload.content
        });

        await supabase
          .from('message_queue')
          .update({ 
            status: 'sent', 
            processed_at: new Date().toISOString() 
          })
          .eq('id', msg.id);

        processedCount++;
      } catch (err: any) {
        const attempts = msg.attempts + 1;
        const newStatus = attempts >= msg.max_attempts ? 'failed' : 'pending';
        
        await supabase
          .from('message_queue')
          .update({ 
            status: newStatus, 
            attempts: attempts,
            processed_at: new Date().toISOString()
          })
          .eq('id', msg.id);

        await supabase.from('communication_logs').insert({
          company_id: msg.company_id,
          channel: msg.type,
          status: 'failed',
          provider_response: { error: err.message },
          message_content: msg.payload.content
        });
      }
    }

    return NextResponse.json({ success: true, processed: processedCount });
  } catch (error: any) {
    console.error('[CRON PROCESS QUEUE] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
