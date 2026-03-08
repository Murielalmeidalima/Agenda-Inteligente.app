import { createClient } from '@supabase/supabase-js';

export class QueueService {
  private supabase: any;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  async enqueueMessage(params: {
    companyId: string;
    type: 'email' | 'sms' | 'whatsapp';
    recipient: string;
    content: string;
    scheduledFor?: Date;
  }) {
    // 1. Check LGPD preferences before queuing
    const { data: clientData } = await this.supabase
      .from('clients')
      .select('accepts_email, accepts_sms, accepts_whatsapp')
      .eq('phone', params.recipient) // Assumes recipient is phone/email, robust logic would query by clientId
      .limit(1)
      .single();

    if (clientData) {
      if (params.type === 'email' && clientData.accepts_email === false) return null;
      if (params.type === 'sms' && clientData.accepts_sms === false) return null;
      if (params.type === 'whatsapp' && clientData.accepts_whatsapp === false) return null;
    }

    // 2. Insert into Queue
    const scheduledDate = params.scheduledFor || new Date();
    
    const { data, error } = await this.supabase.from('message_queue').insert({
      company_id: params.companyId,
      type: params.type,
      recipient: params.recipient,
      payload: { content: params.content },
      status: 'pending',
      scheduled_for: scheduledDate.toISOString()
    }).select().single();

    if (error) {
      console.error('[QUEUE SERVICE] Error enqueuing message:', error);
      throw error;
    }

    return data;
  }
}
