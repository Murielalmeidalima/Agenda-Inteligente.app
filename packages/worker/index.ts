import { loadEnvConfig } from '@next/env';
import { createClient } from '@supabase/supabase-js';
import { SmsService, WhatsappService } from '@projeto/utils';

// Load environment variables from the web app's .env files or VPS envs
const projectDir = process.cwd();
loadEnvConfig(projectDir);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('[Worker] Fatal Error: Missing Supabase Environment Variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const smsService = new SmsService();
const whatsappService = new WhatsappService();

let isProcessing = false;

async function processQueue() {
  if (isProcessing) {
    console.log(`[Worker] Skipping cycle, still processing previous batch...`);
    return;
  }
  
  isProcessing = true;
  try {
    console.log(`[Worker] ${new Date().toISOString()} - Checking for pending messages...`);
    
    const { data: messages, error: fetchError } = await supabase
      .from('message_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .order('created_at', { ascending: true })
      .limit(50);

    if (fetchError) throw fetchError;
    if (!messages || messages.length === 0) {
      return;
    }

    console.log(`[Worker] Found ${messages.length} pending messages. Processing...`);

    const messageIds = messages.map(m => m.id);
    await supabase
      .from('message_queue')
      .update({ status: 'processing' })
      .in('id', messageIds);

    let processedCount = 0;

    for (const msg of messages) {
      try {
        let providerResponse = null;
        let status = 'sent';

        if (msg.type === 'sms') {
          providerResponse = await smsService.send({ to: msg.recipient, content: msg.payload.content });
        } else if (msg.type === 'whatsapp') {
          // Evolution API / WhatsApp integration is disabled in MVP
          status = 'failed';
          providerResponse = { error: 'Evolution API is disabled in MVP version' };
          console.log(`[Worker] WhatsApp message skipped (Evolution API integration is inactive in MVP)`);
        } else if (msg.type === 'email') {
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
            status: status, 
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

    console.log(`[Worker] Successfully processed ${processedCount} messages.`);
  } catch (error) {
    console.error('[Worker] Error processing queue:', error);
  } finally {
    isProcessing = false;
  }
}

// Run the function every 5 seconds for near-realtime message dispatching
const INTERVAL = 5 * 1000;
console.log(`[Worker] Starting Standalone Background Worker. Polling Interval: ${INTERVAL}ms`);
setInterval(processQueue, INTERVAL);

// Initial run
processQueue();
