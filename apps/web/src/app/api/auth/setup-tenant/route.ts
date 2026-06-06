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

    const { companyName, fullName, email } = await req.json();

    // 1. Criar Cliente no Asaas
    const customer = await AsaasService.createCustomer({
      name: companyName,
      email: email
    });

    // 2. Criar Assinatura Trial no Asaas (opicional se for mock, mas criamos)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7); // 7 Dias de Trial

    // 3. Obter ou criar Plano Inicial no DB local
    const { data: basicPlan } = await supabase
      .from('plans')
      .select('id')
      .eq('name', 'Inicial')
      .single();

    let planId = basicPlan?.id;
    if (!planId) {
      // Fallback
      const { data: newPlan } = await supabase.from('plans').insert({
        name: 'Inicial',
        price: 97.00,
        max_users: 1
      }).select('id').single();
      planId = newPlan?.id;
    }

    // Obter o ID da companhia recém criada (o front-end criou ou criaremos aqui)
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', session.user.id)
      .single();
      
    if (!profile || !profile.company_id) {
      return NextResponse.json({ error: 'Company not found' }, { status: 400 });
    }

    // 4. Salvar Assinatura no Banco de Dados com Status = 'trial'
    await supabase.from('subscriptions').insert({
      company_id: profile.company_id,
      plan_id: planId,
      asaas_customer_id: customer.id,
      status: 'trial',
      trial_start: new Date().toISOString(),
      trial_end: dueDate.toISOString(),
      current_period_end: dueDate.toISOString()
    });

    // 5. Auto-Aprovar o Usuário
    await supabase
      .from('profiles')
      .update({ approved: true })
      .eq('id', session.user.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Setup Tenant] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
