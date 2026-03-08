import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const contentType = request.headers.get('content-type') || '';
    let payload: any;
    let provider = 'unknown';

    // Parse according to content-type
    if (contentType.includes('application/json')) {
      payload = await request.json();
      provider = payload.instance ? 'evolution' : 'unknown'; // Naive check for Evolution API
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      payload = Object.fromEntries(formData);
      provider = payload.MessageSid ? 'twilio' : 'unknown'; // Naive check for Twilio
    }

    if (!payload) {
      return NextResponse.json({ error: 'Empty payload' }, { status: 400 });
    }

    // 1. Mark logs as delivered or failed
    let messageId = null;
    let status = 'unknown';
    let OptOutDetected = false;

    if (provider === 'twilio') {
      messageId = payload.MessageSid;
      status = payload.MessageStatus || 'unknown'; // queued, sent, delivered, failed, etc.
      
      const bodyText = (payload.Body || '').toUpperCase().trim();
      OptOutDetected = ['SAIR', 'STOP', 'CANCELAR'].includes(bodyText);
    } else if (provider === 'evolution') {
      messageId = payload.key?.id;
      status = 'delivered'; // Handle evolution specific status webhooks
      
      const text = (payload.message?.conversation || payload.message?.extendedTextMessage?.text || '').toUpperCase().trim();
      OptOutDetected = ['SAIR', 'STOP', 'CANCELAR'].includes(text);
    }

    // Update Logs
    if (messageId) {
      // Note: Ideally, you'd match by the `provider_response->id` saved in communication_logs
      // Since it's JSONB, we can query it:
      const { data: logs } = await supabase
        .from('communication_logs')
        .select('id, client_id')
        .contains('provider_response', { id: messageId })
        .limit(1)
        .single();

      if (logs) {
        await supabase
          .from('communication_logs')
          .update({ status })
          .eq('id', logs.id);

        if (OptOutDetected && logs.client_id) {
          // 2. Perform LGPD Opt-out
          const updateField = provider === 'twilio' ? { accepts_sms: false } : { accepts_whatsapp: false };
          await supabase
            .from('clients')
            .update({ 
              ...updateField,
              unsubscribed_at: new Date().toISOString()
            })
            .eq('id', logs.client_id);
          
          console.log(`[OPT-OUT] Unsubscribed client ${logs.client_id} from ${provider}`);
        }
      }
    }

    return NextResponse.json({ success: true, processed: true });
  } catch (error: any) {
    console.error('[WEBHOOK MESSAGING] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
