import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimit, RATE_LIMITS, createRateLimitHeaders } from '@/lib/rate-limit';

// Inicializar cliente admin para ignorar RLS e verificar duplicidades em toda a base
const getSupabaseAdmin = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Supabase URL e Chave API são necessários para operações do servidor.');
  }
  return createClient(url, key);
};

export async function POST(req: NextRequest) {
  try {
    const rateLimitResult = rateLimit(req, RATE_LIMITS.STANDARD);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Muitas requisições de validação de cadastro. Tente novamente mais tarde.' },
        { 
          status: 429,
          headers: createRateLimitHeaders(rateLimitResult),
        }
      );
    }
    const body = await req.json();
    const { email, cpf, phone, cnpj, deviceFingerprint } = body;

    // Obter IP do cliente
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
               req.headers.get('x-real-ip') || 
               '127.0.0.1';

    if (!email || !cpf || !phone) {
      return NextResponse.json({ error: 'Dados obrigatórios ausentes: email, cpf ou phone.' }, { status: 400 });
    }

    const cleanCpf = cpf.replace(/\D/g, '');
    const cleanPhone = phone.replace(/\D/g, '');
    const cleanCnpj = cnpj ? cnpj.replace(/\D/g, '') : null;

    const supabase = getSupabaseAdmin();
    let score = 0;
    const reasons: string[] = [];

    // 1. Validar CPF
    const { data: cpfProfiles } = await supabase
      .from('profiles')
      .select('id')
      .eq('cpf', cleanCpf)
      .limit(1);

    const { data: cpfAntifraud } = await supabase
      .from('trial_antifraud_records')
      .select('id')
      .eq('cpf', cleanCpf)
      .eq('is_blocked', false)
      .limit(1);

    if ((cpfProfiles && cpfProfiles.length > 0) || (cpfAntifraud && cpfAntifraud.length > 0)) {
      score += 100;
      reasons.push('CPF já utilizou o período de teste');
    }

    // 2. Validar CNPJ (se informado)
    if (cleanCnpj) {
      const { data: cnpjCompanies } = await supabase
        .from('companies')
        .select('id')
        .eq('cnpj', cleanCnpj)
        .limit(1);

      const { data: cnpjAntifraud } = await supabase
        .from('trial_antifraud_records')
        .select('id')
        .eq('cnpj', cleanCnpj)
        .eq('is_blocked', false)
        .limit(1);

      if ((cnpjCompanies && cnpjCompanies.length > 0) || (cnpjAntifraud && cnpjAntifraud.length > 0)) {
        score += 100;
        reasons.push('CNPJ já utilizou o período de teste');
      }
    }

    // 3. Validar E-mail
    const { data: emailProfiles } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .limit(1);

    if (emailProfiles && emailProfiles.length > 0) {
      return NextResponse.json({
        error: 'Este e-mail já possui uma conta cadastrada no Supabase. Faça login com sua senha ou utilize um novo e-mail (ex: teste.novo@gmail.com).'
      }, { status: 400 });
    }

    const { data: emailAntifraud } = await supabase
      .from('trial_antifraud_records')
      .select('id')
      .eq('email', email)
      .eq('is_blocked', false)
      .limit(1);

    if (emailAntifraud && emailAntifraud.length > 0) {
      score += 80;
      reasons.push('E-mail associado a cadastro prévio');
    }

    // 4. Validar Telefone
    const { data: phoneProfiles } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', cleanPhone)
      .limit(1);

    const { data: phoneAntifraud } = await supabase
      .from('trial_antifraud_records')
      .select('id')
      .eq('phone', cleanPhone)
      .eq('is_blocked', false)
      .limit(1);

    if ((phoneProfiles && phoneProfiles.length > 0) || (phoneAntifraud && phoneAntifraud.length > 0)) {
      score += 80;
      reasons.push('Telefone associado a cadastro prévio');
    }

    // 5. Validar Dispositivo (Fingerprint)
    if (deviceFingerprint) {
      const { data: deviceAntifraud } = await supabase
        .from('trial_antifraud_records')
        .select('id')
        .eq('device_fingerprint', deviceFingerprint)
        .eq('is_blocked', false)
        .limit(1);

      if (deviceAntifraud && deviceAntifraud.length > 0) {
        score += 50;
        reasons.push('Dispositivo já utilizado para cadastro de trial');
      }
    }

    // 6. Validar IP
    if (ip && ip !== '127.0.0.1') {
      const { data: ipAntifraud } = await supabase
        .from('trial_antifraud_records')
        .select('id')
        .eq('ip_address', ip)
        .eq('is_blocked', false)
        .limit(1);

      if (ipAntifraud && ipAntifraud.length > 0) {
        score += 30;
        reasons.push('IP associado a cadastro prévio');
      }
    }

    const trialAllowed = score < 100;

    return NextResponse.json({
      success: true,
      trialAllowed,
      score,
      reasons
    });

  } catch (error: any) {
    console.error('[Validate Signup API] Error:', error);
    return NextResponse.json({ error: error.message || 'Erro interno na validação.' }, { status: 500 });
  }
}
