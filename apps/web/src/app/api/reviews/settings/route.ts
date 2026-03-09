import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Token não fornecido' }, { status: 400 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // 1. Validar Token e obter company_id
    const { data: appointment, error: aptError } = await supabaseAdmin
      .from('appointments')
      .select('company_id')
      .eq('review_token', token)
      .single();

    if (aptError || !appointment) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 404 });
    }

    // 2. Buscar configurações da clínica
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('review_settings')
      .select('*')
      .eq('company_id', appointment.company_id)
      .single();

    // Se não houver configurações, retornamos o padrão
    if (settingsError && settingsError.code !== 'PGRST116') {
      throw settingsError;
    }

    return NextResponse.json(settings || {
      company_id: appointment.company_id,
      enable_google_review: false,
      feedback_type: 'internal'
    });

  } catch (error: any) {
    console.error('Fetch Settings Error:', error);
    return NextResponse.json({ error: 'Erro ao buscar configurações' }, { status: 500 });
  }
}
