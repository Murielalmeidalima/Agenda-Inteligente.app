import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { AsaasService } from '@/lib/asaas';
import { z } from 'zod';
import crypto from 'crypto';

// Validação dos dados com Zod (Segurança / Parameter Tampering)
const setupSchema = z.object({
  companyName: z.string().min(2, "O nome da clínica deve ter pelo menos 2 caracteres").max(100),
  fullName: z.string().min(2, "Seu nome deve ter pelo menos 2 caracteres").max(100),
  email: z.string().email("Endereço de e-mail inválido"),
  plan: z.enum(['basico', 'profissional', 'empresarial']).default('profissional'),
  cnpj: z.string().optional().nullable(),
  cpf: z.string().min(11, "CPF deve ter pelo menos 11 dígitos"),
  phone: z.string().min(10, "Telefone inválido"),
  deviceFingerprint: z.string().optional().nullable(),
  deviceBrowser: z.string().optional().nullable(),
  deviceOs: z.string().optional().nullable(),
  cardHolderName: z.string().min(2, "Nome do titular inválido"),
  cardNumber: z.string().min(13, "Número do cartão inválido"),
  cardExpiry: z.string().min(5, "Validade inválida (MM/AA)"),
  cardCvv: z.string().min(3, "CVV inválido"),
  cardPostalCode: z.string().min(8, "CEP de cobrança inválido"),
  cardAddressNumber: z.string().min(1, "Número do endereço de cobrança inválido"),
});

// Inicializar cliente admin para ignorar RLS e verificar duplicidades em toda a base
const getSupabaseAdmin = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Supabase URL e Chave API são necessários para operações do servidor.');
  }
  return createClient(url, key);
};

export async function POST(req: Request) {
  try {
    const userClient = createServerClient();
    
    // Validar se o usuário está autenticado
    const { data: { session }, error: authError } = await userClient.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const body = await req.json();
    const parseResult = setupSchema.safeParse(body);
    
    if (!parseResult.success) {
      return NextResponse.json({ 
        error: 'Dados inválidos.', 
        details: parseResult.error.format() 
      }, { status: 400 });
    }

    const data = parseResult.data;
    const cleanCpf = data.cpf.replace(/\D/g, '');
    const cleanPhone = data.phone.replace(/\D/g, '');
    const cleanCnpj = data.cnpj ? data.cnpj.replace(/\D/g, '') : null;
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
               req.headers.get('x-real-ip') || 
               '127.0.0.1';

    const supabaseAdmin = getSupabaseAdmin();

    // ────────────────────────────────────────────────────────────────────────
    // 1. CÁLCULO DO SCORE ANTIFRAUDE DEFINITIVO (BACKEND)
    // ────────────────────────────────────────────────────────────────────────
    let score = 0;
    const reasons: string[] = [];

    // 1.1. Validar CPF
    const { data: cpfProfiles } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('cpf', cleanCpf)
      .limit(1);

    const { data: cpfAntifraud } = await supabaseAdmin
      .from('trial_antifraud_records')
      .select('id')
      .eq('cpf', cleanCpf)
      .eq('is_blocked', false)
      .limit(1);

    if ((cpfProfiles && cpfProfiles.length > 0) || (cpfAntifraud && cpfAntifraud.length > 0)) {
      score += 100;
      reasons.push('CPF já cadastrado em teste grátis');
    }

    // 1.2. Validar CNPJ (se informado)
    if (cleanCnpj) {
      const { data: cnpjCompanies } = await supabaseAdmin
        .from('companies')
        .select('id')
        .eq('cnpj', cleanCnpj)
        .limit(1);

      const { data: cnpjAntifraud } = await supabaseAdmin
        .from('trial_antifraud_records')
        .select('id')
        .eq('cnpj', cleanCnpj)
        .eq('is_blocked', false)
        .limit(1);

      if ((cnpjCompanies && cnpjCompanies.length > 0) || (cnpjAntifraud && cnpjAntifraud.length > 0)) {
        score += 100;
        reasons.push('CNPJ já cadastrado em teste grátis');
      }
    }

    // 1.3. Validar E-mail
    const { data: emailProfiles } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', data.email)
      .limit(1);

    const { data: emailAntifraud } = await supabaseAdmin
      .from('trial_antifraud_records')
      .select('id')
      .eq('email', data.email)
      .eq('is_blocked', false)
      .limit(1);

    if ((emailProfiles && emailProfiles.length > 0) || (emailAntifraud && emailAntifraud.length > 0)) {
      score += 80;
      reasons.push('E-mail já cadastrado em teste grátis');
    }

    // 1.4. Validar Telefone
    const { data: phoneProfiles } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('phone', cleanPhone)
      .limit(1);

    const { data: phoneAntifraud } = await supabaseAdmin
      .from('trial_antifraud_records')
      .select('id')
      .eq('phone', cleanPhone)
      .eq('is_blocked', false)
      .limit(1);

    if ((phoneProfiles && phoneProfiles.length > 0) || (phoneAntifraud && phoneAntifraud.length > 0)) {
      score += 80;
      reasons.push('Telefone já cadastrado em teste grátis');
    }

    // 1.5. Validar Dispositivo (Fingerprint)
    if (data.deviceFingerprint) {
      const { data: deviceAntifraud } = await supabaseAdmin
        .from('trial_antifraud_records')
        .select('id')
        .eq('device_fingerprint', data.deviceFingerprint)
        .eq('is_blocked', false)
        .limit(1);

      if (deviceAntifraud && deviceAntifraud.length > 0) {
        score += 50;
        reasons.push('Dispositivo já utilizado para teste grátis');
      }
    }

    // 1.6. Validar IP
    if (ip && ip !== '127.0.0.1') {
      const { data: ipAntifraud } = await supabaseAdmin
        .from('trial_antifraud_records')
        .select('id')
        .eq('ip_address', ip)
        .eq('is_blocked', false)
        .limit(1);

      if (ipAntifraud && ipAntifraud.length > 0) {
        score += 30;
        reasons.push('IP já utilizado para teste grátis');
      }
    }

    const trialAllowed = score < 100;

    // ────────────────────────────────────────────────────────────────────────
    // 2. CONFIGURAR PLANOS E VALORES
    // ────────────────────────────────────────────────────────────────────────
    let planValue = 99.90; // default profissional
    let planName = 'Profissional';
    
    if (data.plan === 'basico') { planValue = 49.90; planName = 'Inicial'; }
    if (data.plan === 'empresarial') { planValue = 179.90; planName = 'Empresarial'; }

    // Obter ou criar o plano no banco de dados local
    let { data: planDb } = await supabaseAdmin.from('plans').select('id').eq('name', planName).maybeSingle();
    let planId = planDb?.id;
    if (!planId) {
      const { data: newPlan } = await supabaseAdmin.from('plans').insert({ 
        name: planName, 
        price: planValue, 
        max_users: data.plan === 'basico' ? 1 : data.plan === 'profissional' ? 3 : 10 
      }).select('id').single();
      planId = newPlan?.id;
    }

    // ────────────────────────────────────────────────────────────────────────
    // 3. INTEGRAR COM O GATEWAY DE PAGAMENTOS (ASAAS)
    // ────────────────────────────────────────────────────────────────────────
    const isBypass = data.cardHolderName.trim().toUpperCase() === 'DEV BYPASS';
    let customer: any;
    let subscription: any;
    let dueDate = new Date();
    if (trialAllowed) {
      dueDate.setDate(dueDate.getDate() + 7);
    }
    const formattedDueDate = dueDate.toISOString().split('T')[0];

    if (isBypass) {
      console.log('[DEV BYPASS] Mocking Asaas Customer and Subscription');
      customer = { id: 'cus_dev_bypass_' + Date.now() };
      subscription = { id: 'sub_dev_bypass_' + Date.now() };
    } else {
      // 3.1. Criar ou Obter Cliente no Asaas
      customer = await AsaasService.createCustomer({
        name: data.fullName,
        email: data.email,
        cpfCnpj: cleanCpf,
        phone: cleanPhone,
        mobilePhone: cleanPhone
      });

      // 3.3. Criar a Assinatura vinculada ao Cartão de Crédito
      const [expiryMonth, expiryYear] = data.cardExpiry.split('/');
      const fullExpiryYear = expiryYear.trim().length === 2 ? '20' + expiryYear.trim() : expiryYear.trim();

      subscription = await AsaasService.createSubscription({
        customer: customer.id,
        billingType: 'CREDIT_CARD',
        value: planValue,
        nextDueDate: formattedDueDate,
        cycle: 'MONTHLY',
        description: `Assinatura Agenda Inteligente - Plano ${planName}`,
        creditCard: {
          holderName: data.cardHolderName,
          number: data.cardNumber.replace(/\s+/g, ''),
          expiryMonth: expiryMonth.trim(),
          expiryYear: fullExpiryYear,
          ccv: data.cardCvv.trim()
        },
        creditCardHolderInfo: {
          name: data.fullName,
          email: data.email,
          cpfCnpj: cleanCpf,
          postalCode: data.cardPostalCode.replace(/\D/g, ''),
          addressNumber: data.cardAddressNumber,
          phone: cleanPhone
        }
      });
    }

    // ────────────────────────────────────────────────────────────────────────
    // 4. CRIAR COMPANHIA E PERFIL DO USUÁRIO NO BANCO DE DADOS
    // ────────────────────────────────────────────────────────────────────────
    let companyId;
    const { data: profile } = await supabaseAdmin.from('profiles').select('company_id').eq('id', session.user.id).maybeSingle();
    
    if (profile && profile.company_id) {
      companyId = profile.company_id;
    } else {
      // Criar a empresa
      const { data: newCompany, error: companyError } = await supabaseAdmin
        .from('companies')
        .insert({ name: data.companyName, cnpj: cleanCnpj, phone: cleanPhone, email: data.email })
        .select('id')
        .single();
      
      if (companyError || !newCompany) {
        console.error('Error creating company:', companyError);
        return NextResponse.json({ error: 'Erro ao criar empresa no banco de dados.' }, { status: 500 });
      }
      companyId = newCompany.id;

      // Criar ou atualizar perfil do usuário administrador
      const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
        id: session.user.id,
        company_id: companyId,
        full_name: data.fullName,
        email: data.email,
        cpf: cleanCpf,
        phone: cleanPhone,
        role: 'admin',
        status: 'active'
      }, { onConflict: 'id' });

      if (profileError) {
        console.error('Error creating profile:', profileError);
        return NextResponse.json({ error: 'Erro ao configurar perfil de usuário.' }, { status: 500 });
      }
    }

    // ────────────────────────────────────────────────────────────────────────
    // 5. REGISTRAR DADOS DA ASSINATURA LOCALMENTE
    // ────────────────────────────────────────────────────────────────────────
    await supabaseAdmin.from('subscriptions').insert({
      company_id: companyId,
      plan_id: planId,
      asaas_customer_id: customer.id,
      asaas_subscription_id: subscription.id,
      status: trialAllowed ? 'trial' : 'pending',
      trial_start: new Date().toISOString(),
      trial_end: dueDate.toISOString(),
      current_period_end: dueDate.toISOString()
    });

    // ────────────────────────────────────────────────────────────────────────
    // 6. SALVAR REGISTRO ANTIFRAUDE E HASH DO CARTÃO (PARA AUDITORIA)
    // ────────────────────────────────────────────────────────────────────────
    // Gerar um hash seguro (SHA-256) do identificador do cartão para evitar duplicidade futuramente
    const rawCardToken = (subscription as any).creditCard?.creditCardToken || 'MOCK_TOKEN_' + Date.now();
    const cardHash = crypto.createHash('sha256').update(rawCardToken).digest('hex');

    await supabaseAdmin.from('trial_antifraud_records').insert({
      company_id: companyId,
      email: data.email,
      cpf: cleanCpf,
      phone: cleanPhone,
      cnpj: cleanCnpj,
      card_hash: cardHash,
      ip_address: ip,
      device_fingerprint: data.deviceFingerprint || null,
      device_browser: data.deviceBrowser || null,
      device_os: data.deviceOs || null,
      score: score,
      is_blocked: !trialAllowed
    });

    // ────────────────────────────────────────────────────────────────────────
    // 7. REGISTRAR OS CONSENTIMENTOS DA LGPD
    // ────────────────────────────────────────────────────────────────────────
    await supabaseAdmin.from('consent_logs').insert([
      { user_id: session.user.id, document_type: 'TERMS_OF_USE', version: '1.0', ip_address: ip },
      { user_id: session.user.id, document_type: 'PRIVACY_POLICY', version: '1.0', ip_address: ip },
      { user_id: session.user.id, document_type: 'FRAUD_PREVENTION_AND_BILLING', version: '1.0', ip_address: ip }
    ]);

    // Buscar o Link de Pagamento (InvoiceUrl) da assinatura (caso cobrado imediatamente ou para referência)
    let invoiceUrl = null;
    if (isBypass) {
      invoiceUrl = 'http://localhost:3000/dashboard';
    } else {
      const payments = await AsaasService.getSubscriptionPayments(subscription.id);
      invoiceUrl = payments?.data?.[0]?.invoiceUrl || null;
    }

    return NextResponse.json({ 
      success: true, 
      trialAllowed, 
      invoiceUrl 
    });

  } catch (error: any) {
    console.error('[Setup Tenant API] Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Erro crítico durante a configuração da conta e pagamento.' 
    }, { status: 500 });
  }
}
