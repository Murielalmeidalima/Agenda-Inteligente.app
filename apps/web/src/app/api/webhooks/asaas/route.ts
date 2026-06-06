import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    // 1. Validar token de webhook do Asaas (Idealmente usando headers)
    const asaasToken = req.headers.get('asaas-access-token');
    // if (asaasToken !== process.env.ASAAS_WEBHOOK_TOKEN) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await req.json();
    const event = payload.event;
    const payment = payload.payment;

    if (!payment || !payment.subscription) {
      return NextResponse.json({ received: true, ignored: 'No subscription linked' });
    }

    const supabase = createServerClient();

    // Registrar o evento de webhook para auditoria
    await supabase.from('webhook_events').insert({
      event_type: event,
      payload: payload,
      processed: false
    });

    // 2. Atualizar o banco de dados baseado no evento
    const asaasSubscriptionId = payment.subscription;

    let newStatus = '';
    if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
      newStatus = 'active';
    } else if (event === 'PAYMENT_OVERDUE') {
      newStatus = 'past_due';
    } else if (event === 'PAYMENT_DELETED' || event === 'PAYMENT_REFUNDED') {
      newStatus = 'canceled';
    }

    if (newStatus) {
      const { error } = await supabase
        .from('subscriptions')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('asaas_subscription_id', asaasSubscriptionId);

      if (error) {
        console.error('[Webhook Asaas] Erro ao atualizar assinatura:', error);
        return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
      }
    }

    // Marca webhook como processado (apenas o último inserido)
    await supabase
      .from('webhook_events')
      .update({ processed: true })
      .eq('payload->payment->id', payment.id);

    return NextResponse.json({ received: true, status: newStatus });
  } catch (error: any) {
    console.error('[Webhook Asaas] Erro crítico:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
