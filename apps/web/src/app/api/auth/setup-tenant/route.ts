import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/auth';
import { AsaasService } from '@/lib/asaas';

export async function POST(req: Request) {
  try {
    const supabase = createServerClient();
    
    // Validar se o usuário está autenticado
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { companyName, fullName, email, plan } = await req.json();

    // 1. Identificar o valor do plano
    let planValue = 97.00; // default profissional
    let planName = 'Profissional';
    
    if (plan === 'basico') { planValue = 49.00; planName = 'Básico'; }
    if (plan === 'empresarial') { planValue = 197.00; planName = 'Empresarial'; }

    // Obter ou criar Plano no DB local
    let { data: planDb } = await supabase.from('plans').select('id').eq('name', planName).maybeSingle();
    let planId = planDb?.id;
    if (!planId) {
      const { data: newPlan } = await supabase.from('plans').insert({ name: planName, price: planValue, max_users: 5 }).select('id').single();
      planId = newPlan?.id;
    }

    const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', session.user.id).single();
    if (!profile || !profile.company_id) {
      return NextResponse.json({ error: 'Company not found' }, { status: 400 });
    }

    // 2. Criar Cliente no Asaas
    const customer = await AsaasService.createCustomer({
      name: companyName,
      email: email
    });

    // 3. Criar Assinatura no Asaas (7 Dias Grátis)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);

    const subscription = await AsaasService.createSubscription({
      customer: customer.id,
      billingType: 'UNDEFINED', // Permite escolher Pix, Cartão ou Boleto no link
      value: planValue,
      nextDueDate: dueDate.toISOString().split('T')[0], // Data de vencimento = hoje + 7
      cycle: 'MONTHLY',
      description: `Assinatura Agenda Inteligente - Plano ${planName}`
    });

    // 4. Salvar Assinatura no Banco de Dados
    await supabase.from('subscriptions').insert({
      company_id: profile.company_id,
      plan_id: planId,
      asaas_customer_id: customer.id,
      asaas_subscription_id: subscription.id,
      status: 'trial', // O webhook mudará para active quando pagar
      trial_start: new Date().toISOString(),
      trial_end: dueDate.toISOString(),
      current_period_end: dueDate.toISOString()
    });

    // 5. Auto-Aprovar o Usuário
    await supabase.from('profiles').update({ approved: true }).eq('id', session.user.id);

    // 6. Buscar o Link de Pagamento (InvoiceUrl) da assinatura
    const payments = await AsaasService.getSubscriptionPayments(subscription.id);
    const invoiceUrl = payments?.data?.[0]?.invoiceUrl;

    return NextResponse.json({ success: true, invoiceUrl });
  } catch (error: any) {
    console.error('[Setup Tenant] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
